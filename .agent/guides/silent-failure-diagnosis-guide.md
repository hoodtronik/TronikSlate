# Silent Failure Diagnosis Guide

Deep-reference companion for the `debug-silent-failures` skill. Use this when tracing a feature that "works but wrong."

---

## Diagnostic Decision Tree

```
Feature produces wrong output
├── Check logs/api/latest → errors present?
│   ├── YES → read the error, fix root cause
│   └── NO → silent failure, continue ↓
├── Is the external service running?
│   ├── NO → start it, re-test
│   └── YES → continue ↓
├── Is the app connecting to the right endpoint?
│   ├── Check: port, hostname, protocol (http vs https)
│   └── Confirm with: curl/fetch the endpoint manually
├── Is the app sending the right request?
│   ├── Add `console.log(JSON.stringify(requestBody))` before the fetch
│   └── Compare against what the service expects
└── Is the app handling the response correctly?
    ├── Log `response.status` and `response.body`
    └── Check: is the response schema what the code expects?
```

## Silent Failure Anti-Patterns Catalog

### 1. The Invisible Fallback

```typescript
// ❌ User never knows AI failed
const aiResult = await generateWithAI(prompt);
const shots = aiResult || generateFromTemplate(prompt);
```

**Fix:** Add a state flag + UI feedback:
```typescript
const aiResult = await generateWithAI(prompt);
if (!aiResult) {
    setFallbackMsg('⚠️ AI didn\'t respond — using template fallback');
}
const shots = aiResult || generateFromTemplate(prompt);
```

### 2. The Swallowed Catch

```typescript
// ❌ Error vanishes into the void
try { await riskyOperation(); } catch { return null; }
```

**Fix:** Log + propagate meaningful info:
```typescript
try {
    await riskyOperation();
} catch (e: any) {
    console.error('[module] Operation failed:', e.message);
    return { error: e.message, fallback: true };
}
```

### 3. The Stale Configuration

```typescript
// ❌ Hardcoded value no longer matches reality
const MODEL = 'llama3.2:3b';  // User has qwen2.5:3b installed
```

**Fix:** Dynamic detection with whitelist (see `auto-detect-provision-dependencies` skill).

### 4. The Assumed Success

```typescript
// ❌ Never checks response status
const resp = await fetch('/api/service');
const data = await resp.json();  // Crashes if resp is 500
```

**Fix:** Always check status:
```typescript
const resp = await fetch('/api/service');
if (!resp.ok) {
    return { error: `Service returned ${resp.status}` };
}
const data = await resp.json();
```

## Error Feedback UI Patterns

### Dismissible Warning Banner

```tsx
{errorMsg && (
    <div className="warning-banner">
        <span>{errorMsg}</span>
        <button onClick={() => setErrorMsg('')}>✕</button>
    </div>
)}
```

**CSS:**
```css
.warning-banner {
    background: rgba(255, 180, 0, 0.15);
    border: 1px solid rgba(255, 180, 0, 0.4);
    border-radius: 8px;
    padding: 8px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.85rem;
    color: #ffb400;
}
```

### Auto-Dismiss After Timeout

```typescript
setErrorMsg('⚠️ Fallback used');
setTimeout(() => setErrorMsg(''), 8000);
```

### Inline Status Indicator

For features where a banner is too heavy, use an inline indicator next to the button:

```tsx
<button onClick={handleAction}>
    Generate {status === 'fallback' && <span className="dot amber" title="Used fallback" />}
</button>
```

## Log Reading Cheatsheet

| Log Location | Contains | When to Read |
|-------------|----------|------|
| `logs/api/latest` | Server route execution, fetch errors | API not returning expected data |
| `logs/shell/latest` | Raw terminal output from services | Service won't start or crashes |
| `logs/dev/latest` | AI coding tool actions | Debugging automation steps |
| Browser DevTools → Network | Request/response payloads | Client → server mismatch |
| Browser DevTools → Console | Client-side errors | React/store errors |

## Verification Checklist

- [ ] Happy path works correctly
- [ ] Service offline → user sees error message
- [ ] Wrong dependency version → user sees warning
- [ ] Error message has dismiss button
- [ ] Error message auto-clears after timeout (if applicable)
- [ ] TypeScript build passes
- [ ] No `console.log` left in production paths (use `console.warn` or `console.error`)
