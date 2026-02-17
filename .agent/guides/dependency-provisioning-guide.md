# Dependency Provisioning Guide

Deep-reference companion for the `auto-detect-provision-dependencies` skill. Use this when wiring auto-detection and auto-download for any external dependency.

---

## Dependency Type Decision Matrix

| Dependency Type | Detection Method | Download Method | Cache Strategy |
|----------------|-----------------|----------------|----------------|
| Ollama models | `GET /api/tags` | `POST /api/pull` (SSE stream) | In-memory variable, clear on pull |
| Python packages | `pip list --format=json` | `uv pip install` / `pip install` | Skip — pip caches internally |
| npm packages | `npm ls --json` | `npm install` | Skip — node_modules is the cache |
| System binaries | `which <cmd>` / Pinokio `{{which('cmd')}}` | `conda install` / system pkg manager | N/A |
| HuggingFace models | `ls ~/.cache/huggingface/` | `hf.download` API / `huggingface-cli` | Filesystem-based |
| Git repos | `fs.existsSync('app/.git')` | `git clone` | Check `exists('app')` |

## Whitelist Strategy

### Why Whitelist (Not Blacklist)

Users experiment. They download 70B models, quantized variants, fine-tunes with weird names. If your app picks "whatever is available," it might:
- Try to load a model that doesn't fit in VRAM → hang/crash
- Use a model that doesn't follow instruction format → garbage output
- Select a model optimized for a different task → wrong behavior

### Building a Safe Whitelist

```typescript
// Tier 1: Preferred (small, fast, instruction-following)
const TIER_1 = ['qwen2.5:3b', 'gemma2:2b', 'phi3:3.8b'];

// Tier 2: Acceptable (larger but still reasonable)
const TIER_2 = ['llama3.2:3b', 'mistral:7b', 'qwen2.5:7b'];

// Tier 3: Fallback default (auto-downloaded if nothing found)
const DEFAULT = 'qwen2.5:3b';

// Selection: try tier 1 first, then tier 2, then auto-download default
const PREFERRED = [...TIER_1, ...TIER_2];
```

### Matching Logic

Match by family name prefix, not exact version:

```typescript
function matchModel(installed: string[], whitelist: string[]): string | null {
    for (const safe of whitelist) {
        const family = safe.split(':')[0]; // e.g., 'qwen2.5'
        const match = installed.find(m => m.startsWith(family));
        if (match) return match;
    }
    return null;
}
```

## Download UX Patterns

### SSE Progress Stream (Ollama-style)

```typescript
// Server: proxy the download stream
router.post('/pull', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.flushHeaders();

    const stream = await fetch(`${SERVICE}/api/pull`, {
        method: 'POST',
        body: JSON.stringify({ name: DEFAULT_MODEL, stream: true }),
    });

    const reader = stream.body.getReader();
    // ... pipe chunks to res.write()
});
```

```typescript
// Client: parse SSE and show progress
const eventSource = new EventSource('/api/service/pull');
eventSource.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.completed && data.total) {
        const pct = Math.round((data.completed / data.total) * 100);
        setProgress(`Downloading... ${pct}%`);
    }
    if (data.status === 'success') {
        setStatus('ready');
        clearModelCache();
    }
};
```

### Silent Background Download

For non-critical dependencies where blocking is unacceptable:

```typescript
checkStatus: async () => {
    const { online, dependencyReady } = await fetchStatus();
    if (online && !dependencyReady) {
        // Fire-and-forget — don't await
        get().pullDependency();
        set({ status: 'downloading' });
    }
}
```

## Status Endpoint Contract

Every dependency-managed feature should expose a standard status shape:

```typescript
interface DependencyStatus {
    online: boolean;           // Is the service reachable?
    dependencyReady: boolean;  // Is at least one usable dependency available?
    activeDependency: string;  // Which one the app will use
    available: string[];       // Full list of installed options
    error?: string;            // Human-readable error if offline
}
```

## Edge Cases & Recovery

| Edge Case | Behavior |
|-----------|----------|
| Service starts after app boot | `checkStatus` on interval or user-triggered re-check |
| Download interrupted midway | Re-trigger pull — most services resume/restart cleanly |
| User deletes model after detection | Cache returns stale result → API call fails → clear cache, re-detect |
| Multiple tabs downloading simultaneously | Use a server-side lock or accept idempotent duplicate downloads |
| Disk full during download | Surface the service error message to the user |

## Cache Invalidation Rules

| Event | Action |
|-------|--------|
| Successful download | `clearCache()` immediately |
| API call fails with "model not found" | `clearCache()`, re-detect |
| App restart | Cache starts empty (in-memory only) |
| User switches model in UI | No cache action needed (cache is for auto-detection only) |

## Verification Checklist

- [ ] Service running + dependency present → detected and used correctly
- [ ] Service running + no dependency → auto-download triggers
- [ ] Service running + only large/unsafe dependencies → ignored, default downloaded
- [ ] Service not running → graceful offline status, no crashes
- [ ] Download shows progress to user
- [ ] Download completes → status flips to "ready"
- [ ] After download, next API call uses the new dependency (cache cleared)
- [ ] TypeScript build passes
