# Prompt Refinement Pipeline Guide

Deep-reference companion for the `llm-prompt-refinement-pipeline` skill. Use this when building or extending multi-step LLM generation with model-specific optimization.

---

## Model Guide Authoring

### Guide Structure Template

Every model prompt guide should cover these sections:

```typescript
interface ModelPromptGuide {
    modelName: string;       // Human-readable name
    modelFamily: string;     // "image" | "video" | "audio" | "3d"
    syntaxRules: string;     // Prompt structure and ordering rules
    keywords: string;        // High-impact terms this model responds to
    negativePrompt: string;  // Default negative prompt and guidance
    pitfalls: string;        // Common mistakes that degrade quality
    examples: string;        // Before → After transformations
}
```

### Writing Effective Syntax Rules

Be specific about what the model expects:

```
GOOD: "Start with subject, then action, then environment. Use comma separation.
       Camera movements go at the end. Time-beat syntax: [0s] ... [3s] ..."

BAD:  "Write good prompts for this model."
```

### Writing Keyword Lists

Group by category for the LLM to understand context:

```
Quality: "cinematic, 8K, photorealistic, RAW photo, masterpiece"
Lighting: "golden hour, volumetric lighting, rim lighting, chiaroscuro"
Camera: "dolly zoom, tracking shot, crane shot, dutch angle"
Motion: "slow motion, time-lapse, smooth pan, whip pan"
```

### Writing Pitfall Warnings

Focus on model-specific failure modes:

```
- Do NOT use "4K" with this model — it interprets it as a watermark keyword
- Avoid more than 3 camera movements in one prompt — model gets confused
- This model ignores parenthetical emphasis like (important:1.5)
- Negative prompts longer than 50 tokens are truncated
```

## Temperature Tuning Reference

| Step | Temperature | Rationale |
|------|------------|-----------|
| Creative generation (stories, ideas) | 0.7–0.9 | Maximize variety and surprise |
| Prompt refinement (rewriting) | 0.3–0.5 | Faithful to original intent |
| JSON extraction (structured output) | 0.1–0.3 | Minimize format errors |
| Classification / selection | 0.0–0.2 | Deterministic choice |

### Temperature + num_predict Interaction

```typescript
// Creative step: allow longer, more varied output
{ temperature: 0.9, num_predict: 4096 }

// Refinement step: shorter, focused rewriting
{ temperature: 0.4, num_predict: 4096 }

// Quick classification: minimal output
{ temperature: 0.1, num_predict: 256 }
```

## Batch Optimization Strategy

### Why Batch

| Approach | 10 Prompts | Latency | Token Overhead |
|----------|-----------|---------|----------------|
| Individual calls | 10 × LLM round-trip | ~60s total | 10 × system prompt |
| Single batch call | 1 × LLM round-trip | ~10s total | 1 × system prompt |

### Batch Call Template

```typescript
const systemPrompt = `You will receive ${N} numbered prompts.
Rewrite each one following these rules: ${RULES}
Return a JSON array of exactly ${N} objects: [{ refinedPrompt }]`;

const userPrompt = items.map((p, i) => `${i + 1}. "${p}"`).join('\n');
```

### Batch Size Limits

| Model Size | Safe Batch | Risk Above |
|-----------|-----------|------------|
| 1B–3B | 5–8 prompts | May truncate or skip items |
| 7B–13B | 10–15 prompts | Context window limits |
| 30B+ | 20+ prompts | VRAM constraints |

> [!WARNING]
> If batch refinement returns fewer items than sent, **discard the entire refinement** and fall back to raw prompts. Partial refinement creates inconsistency.

## JSON Extraction Robustness

LLMs often wrap JSON in markdown fences or add preamble text. Always use a multi-strategy extractor:

```typescript
function extractJSONArray(text: string): any[] | null {
    // 1. Direct parse
    try { return JSON.parse(text.trim()); } catch {}

    // 2. Strip markdown fences
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) {
        try { return JSON.parse(fenced[1].trim()); } catch {}
    }

    // 3. Find first [...] block
    const bracket = text.match(/\[[\s\S]*\]/);
    if (bracket) {
        try { return JSON.parse(bracket[0]); } catch {}
    }

    return null;
}
```

### Common JSON Failures from Small Models

| Failure | Symptom | Recovery |
|---------|---------|----------|
| Trailing comma | `[{...}, {...},]` | Strip trailing comma before parse |
| Single quotes | `{'key': 'value'}` | Replace `'` with `"` |
| Unescaped newlines | Literal `\n` in strings | Escape before parse |
| Truncated output | `[{...}, {` | Returns null → fallback to raw |
| Preamble text | `Here are the results: [{...}]` | Regex extraction handles this |

## Multi-Consumer Prompt Schema

When generating for multiple downstream models, use this enriched schema:

```typescript
interface EnrichedShot {
    // Original
    prompt: string;        // Raw creative beat
    shot_label: string;    // Human title

    // Model-specific refinements
    imagePrompt?: string;  // Optimized for image generation model
    videoPrompt?: string;  // Optimized for video generation model

    // Metadata
    negative_prompt?: string;
    tags?: string[];
}
```

### Display vs. Storage Strategy

```
User Reviews        → imagePrompt (visual quality they can judge)
Image Rendering     → imagePrompt
Video Rendering     → videoPrompt (carries motion/timing syntax)
Export/API          → All three (prompt, imagePrompt, videoPrompt)
```

## Graceful Degradation Ladder

```
Level 1: Full refinement succeeded
    → Return enriched shots with refined: true

Level 2: Refinement returned wrong count
    → Discard refinement, return raw shots with refined: false
    → Log warning for debugging

Level 3: Refinement LLM call failed (timeout, error)
    → Return raw shots with refined: false
    → Log error

Level 4: No model guides available for selected models
    → Skip refinement entirely, return raw shots
    → No error needed (this is expected for unknown models)

Level 5: Initial generation failed
    → Return error to client
    → Client falls back to template-based generation
```

## VRAM Management

```typescript
// Always unload after generation to free VRAM for rendering
options: {
    keep_alive: 0,  // Unload model immediately after response
}
```

> [!IMPORTANT]
> If the LLM stays loaded in VRAM, subsequent image/video rendering may OOM. Always set `keep_alive: 0` when the LLM is a preparation step before GPU-heavy rendering.

## Verification Checklist

- [ ] Step 1 (creative generation) produces valid JSON array
- [ ] Step 2 (refinement) produces same-length array as input
- [ ] `imagePrompt` follows image model syntax rules
- [ ] `videoPrompt` follows video model syntax rules (if applicable)
- [ ] Refinement failure → raw prompts returned gracefully
- [ ] Unknown model → refinement skipped, no error
- [ ] `keep_alive: 0` set on all Ollama calls
- [ ] Batch size within model's safe limit
- [ ] TypeScript build passes
