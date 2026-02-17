---
name: debug-silent-failures
description: Debug features that silently fail and fall back without user feedback
---

# Debug Silent Failures

Pattern for finding and fixing features that silently swallow errors and fall back to degraded behavior without telling the user.

## When to Use

- A feature appears to work but produces unexpected/wrong results
- A fallback path is being triggered without the user knowing
- The user reports "it's not doing what I expect" but there are no visible errors

## Workflow

### 1. Check Logs First

Always start by reading the logs folder before touching code:

```
logs/
├── api/      # Launcher script logs
├── dev/      # AI coding tool logs
└── shell/    # Direct user interaction logs
```

Read the `latest` file in the relevant subfolder.

### 2. Trace the Call Chain

Map the full execution path from UI button → client function → API route → external service:

1. **Find the UI trigger** — Which button/action starts the flow?
2. **Find the client function** — What store action or component callback does it call?
3. **Find the API route** — What server endpoint does the client hit?
4. **Find the external call** — What service/model/tool does the server call?

### 3. Identify the Silent Failure Point

Look for these anti-patterns:

```typescript
// ❌ Silent fallback — user never knows
const result = await riskyOperation();
if (!result) {
    fallbackBehavior();  // User sees this but thinks it's the real result
}

// ❌ Swallowed error
try {
    await externalService();
} catch {
    return null;  // Caller has no idea what went wrong
}
```

### 4. Fix Pattern

```typescript
// ✅ Visible fallback with user feedback
const result = await riskyOperation();
if (!result) {
    setErrorFeedback('⚠️ Service didn\'t respond — using fallback. Is [dependency] running?');
    fallbackBehavior();
}
```

### 5. Common Root Causes

| Symptom | Common Cause |
|---------|-------------|
| Wrong model/version used | Hardcoded model name doesn't match what's installed |
| Service not responding | Service not running, wrong port, wrong endpoint |
| Auth failure | Missing API key, expired token |
| Data format mismatch | API changed, response schema different than expected |

### 6. Verification

1. Trigger the feature with the fix applied
2. Verify the happy path produces correct results
3. Deliberately break the dependency (wrong model, stop service) and verify the error message appears
4. Confirm TypeScript build passes

## Key Learnings

- **Always add visible feedback** when falling back — even a small amber banner is better than silence
- **Check what's actually installed/available** before assuming — `ollama list`, `pip list`, etc.
- **Hardcoded identifiers** (model names, ports, paths) are the #1 cause of silent failures after migration
- **Add a dismiss button** to error banners so they don't permanently clutter the UI
