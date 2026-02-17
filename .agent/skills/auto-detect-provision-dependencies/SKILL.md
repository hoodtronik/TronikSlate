---
name: auto-detect-provision-dependencies
description: Make apps auto-detect installed dependencies and auto-download missing ones with zero user effort
---

# Auto-Detect & Provision Dependencies

Pattern for making an app scan for required dependencies (models, binaries, packages), use whatever is available, and auto-download a safe default if nothing is found — so the user never needs to run manual commands.

## When to Use

- App depends on an external resource (LLM model, binary, package) that may not be installed
- Moving/cloning the app to a new machine should "just work"
- Users shouldn't need to know technical setup commands

## Workflow

### 1. Identify the Dependency

Determine what the app needs and how it's currently configured:

- Is it hardcoded? (e.g., `const MODEL = 'llama3:7b'`)
- Where is it expected to live? (system-wide, app-local, cloud)
- What API can scan for availability? (e.g., `ollama list`, `pip list`, `which <binary>`)

### 2. Build the Detection Layer

Create a detection function that:

1. Queries available instances of the dependency
2. Filters to a **safe whitelist** (don't use random huge models or untested versions)
3. Picks the best match from what's available
4. Returns `null` if nothing safe is found

```typescript
// Safe whitelist — only small, known-good models
const SAFE_MODELS = [
    'qwen2.5:3b', 'qwen2.5:7b', 'llama3.2:3b',
    'gemma2:2b', 'phi3:3.8b', 'mistral:7b',
];

async function detectModel(): Promise<string | null> {
    const installed = await listInstalledModels();
    for (const safe of SAFE_MODELS) {
        const match = installed.find(m => m.startsWith(safe.split(':')[0]));
        if (match) return match;
    }
    // Don't fall back to random models — they might be too large to run
    return null;
}
```

> [!CAUTION]
> Never fall back to "whatever is installed" without a whitelist. Users experiment with large models they can't run. The app would hang trying to load a 70B model.

### 3. Add Caching

Cache the detection result to avoid re-scanning on every request:

```typescript
let _cached: string | null = null;

async function getModelName(): Promise<string> {
    if (_cached) return _cached;
    const detected = await detectModel();
    if (detected) {
        _cached = detected;
        console.log(`[service] Detected: ${detected}`);
        return detected;
    }
    return DEFAULT_MODEL; // Will trigger auto-download
}

function clearCache(): void { _cached = null; }
```

### 4. Wire Auto-Download

When the status check finds the service running but no dependency available, auto-trigger the download:

```typescript
// Client-side: auto-pull when service is online but dependency missing
checkStatus: async () => {
    const data = await fetch('/api/service/status').then(r => r.json());
    if (data.online && !data.dependencyReady) {
        console.log('[service] No dependency found — auto-downloading...');
        get().pullDependency(); // Fire and forget — runs in background
    }
}
```

### 5. Status Endpoint Pattern

The server status endpoint should report:

```typescript
return res.json({
    online: true,                    // Service is running
    dependencyReady: models.length > 0,  // Has a usable dependency
    activeDependency: detected,      // Which one we're using
    available: models,               // Full list of what's installed
});
```

### 6. Verification

1. Test with the dependency installed → detects and uses it
2. Test with no dependency → auto-downloads the default
3. Test with only large/unsafe dependencies → ignores them, downloads default
4. Test with service not running → graceful offline status

## Key Learnings

- **Whitelist over blacklist** — only allow known-safe small dependencies
- **Cache aggressively** — detection is slow, cache the result
- **Clear cache after downloads** — so the next request picks up the new dependency
- **Background downloads** — don't block the UI while downloading, show progress
- **Use the service's own API** — e.g., Ollama's `/api/tags` for listing models, not filesystem scanning
