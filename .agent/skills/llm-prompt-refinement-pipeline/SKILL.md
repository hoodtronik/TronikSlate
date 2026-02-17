---
name: llm-prompt-refinement-pipeline
description: Add multi-step LLM generation with model-specific prompt optimization
---

# LLM Prompt Refinement Pipeline

Pattern for implementing a multi-step LLM pipeline where raw output is generated first, then refined using model-specific guides — producing optimized prompts for different downstream consumers (e.g., image model vs. video model).

## When to Use

- An LLM generates creative content (prompts, text, code) that will be consumed by multiple downstream models
- Each downstream model has different syntax/style preferences
- You want to optimize output for each consumer without running separate generation passes

## Architecture

```
User Input
    ↓
Step 1: Creative Generation (high temperature)
    → Raw story beats / prompts
    ↓
Step 2: Batch Refinement (low temperature)
    → Model A optimized prompts (e.g., image model)
    → Model B optimized prompts (e.g., video model)
    ↓
Client receives enriched objects with per-model variants
```

## Workflow

### 1. Define Model-Specific Guides

Create a guide system that maps model IDs to prompting rules:

```typescript
interface ModelPromptGuide {
    modelName: string;
    syntaxRules: string;     // How this model expects prompts structured
    keywords: string;        // High-impact terms for this model
    negativePrompt: string;  // What to avoid
    pitfalls: string;        // Common mistakes
    examples: string;        // Before→after transformations
}

// Map model IDs to guides
const GUIDES: Record<string, ModelPromptGuide> = {
    'flux2_dev': FLUX_2_GUIDE,
    'wan_2_2': WAN_2_2_GUIDE,
    // ...
};

function formatGuideForSystemPrompt(modelType?: string): string {
    const guide = GUIDES[modelType || ''];
    if (!guide) return '';
    return `=== MODEL GUIDE (${guide.modelName}) ===\n${guide.syntaxRules}\n...`;
}
```

### 2. Step 1 — Creative Generation

Generate raw content with high temperature for creativity:

```typescript
const rawResult = await llm.generate({
    system: "You are a storyboard assistant. Generate shot prompts...",
    prompt: userInput,
    temperature: 0.9,       // High for creativity
    num_predict: 4096,
});
```

### 3. Step 2 — Batch Refinement

Refine ALL outputs in a **single LLM call** (not per-item) for efficiency:

```typescript
async function refinePromptsForModels(
    shots: Shot[],
    imageModel: string,
    videoModel: string,
): Promise<Shot[]> {
    const imageGuide = formatGuideForSystemPrompt(imageModel);
    const videoGuide = formatGuideForSystemPrompt(videoModel);

    // Build numbered list of all prompts
    const promptList = shots.map((s, i) => `${i + 1}. "${s.prompt}"`).join('\n');

    const refined = await llm.generate({
        system: `Rewrite each prompt for both models:
            IMAGE MODEL: ${imageGuide}
            VIDEO MODEL: ${videoGuide}
            Return JSON array: [{ imagePrompt, videoPrompt }]`,
        prompt: `Refine these prompts:\n${promptList}`,
        temperature: 0.4,   // Low for faithful rewriting
    });

    // Merge back
    return shots.map((shot, i) => ({
        ...shot,
        imagePrompt: refined[i]?.imagePrompt || shot.prompt,
        videoPrompt: refined[i]?.videoPrompt || shot.prompt,
    }));
}
```

> [!IMPORTANT]
> Use a **single batch call** for refinement, not N separate calls. A 3B model refining 10 prompts in one call takes ~10s. Ten separate calls would take ~60s.

### 4. Wire Into the API Route

```typescript
router.post('/generate', async (req, res) => {
    const { input, imageModel, videoModel } = req.body;

    // Step 1: Generate
    const raw = await generateRaw(input);

    // Step 2: Refine (only if guides exist)
    const imageGuide = formatGuideForSystemPrompt(imageModel);
    const videoGuide = formatGuideForSystemPrompt(videoModel);

    if (imageGuide || videoGuide) {
        try {
            const refined = await refinePromptsForModels(raw, imageModel, videoModel);
            return res.json({ ok: true, shots: refined, refined: true });
        } catch (err) {
            console.warn('Refinement failed, returning raw:', err.message);
        }
    }

    // Fallback: raw prompts
    return res.json({ ok: true, shots: raw, refined: false });
});
```

### 5. Client-Side: Display and Store

```typescript
// UI shows image-optimized prompts (what the user reviews)
const displayPrompts = result.map(s => s.imagePrompt || s.prompt);

// Video prompts stored quietly for downstream use
const videoPrompts = result.map(s => s.videoPrompt || s.prompt);
```

### 6. Graceful Degradation

- If the LLM refinement fails → return raw prompts (still usable)
- If no model guide exists for the selected model → skip refinement
- If refined array has wrong length → discard and use raw
- Always return a `refined: boolean` flag so the client knows what happened

## Key Learnings

- **Temperature matters**: creativity step = 0.7–0.9, refinement step = 0.3–0.5
- **Batch over individual**: one LLM call with 10 prompts >> 10 separate calls
- **Guides are the secret sauce**: model-specific syntax rules dramatically improve output quality
- **Separate display from storage**: show image-optimized prompts to user, carry video-optimized prompts silently
- **Always have a fallback**: refinement is enhancement, not a requirement — raw prompts should still work
- **Use `keep_alive: 0`**: unload the model after response to free VRAM for downstream rendering
