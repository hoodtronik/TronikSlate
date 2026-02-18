# File Path Identity Mismatch Diagnosis Guide

Deep-reference companion for the `debug-file-path-identity-mismatches` skill. Use when files are "found" in the UI but "missing" downstream.

---

## Diagnostic Decision Tree

```
Backend says "file not found" or produces wrong output
├── Check what value is stored in React state / store
│   ├── It's a URL (contains /api/, ?, http://) → DISPLAY URL LEAK
│   │   └── Fix: store bare filename, add display URL helper
│   ├── It's a proxy URL (/api/render/file?path=...) → PROXY URL PASSTHROUGH
│   │   └── Fix: extract embedded path via URL parsing before fs operations
│   └── It's a bare filename → continue ↓
├── Check the projectId / context key at each boundary
│   ├── Upload: projectId = X
│   ├── State: projectId = Y?
│   └── Backend call: projectId = Z?
│       └── If any differ → CONTEXT KEY MISMATCH
│           └── Fix: use the same source (e.g., storyData.projectId) everywhere
├── Check if path.extname() or similar is poisoned
│   └── Log the input to extname() — does it contain "?" or "&"?
│       └── YES → URL QUERY POISONING
│           └── Fix: strip query string before parsing
└── Check the filesystem path the backend constructs
    └── ls / dir the resolved path — does the file actually exist there?
```

## Real-World Case Study: Smooth Brain Storyboard

### Symptoms
- Character images rendered as `<img>` thumbnails in the UI ✅
- Backend `zipBuilder` failed to include the character image in the render zip ❌
- All render tasks were skipped silently

### Root Causes (Three Bugs, One Pattern)

**Bug 1 — Display URL stored in state:**
```typescript
// ❌ Before: stored serve URL
setCharacterImage(data.files[0].servePath);
// = "/api/images/uuid.png?projectId=sb_my-story"

// ✅ After: store bare filename
setCharacterImage(data.files[0].filename);
// = "uuid.png"
```

**Bug 2 — Context key mismatch:**
```typescript
// ❌ Before: hardcoded projectId in render call
fetch('/api/render/start', {
    body: JSON.stringify({ projectId: 'smoothbrain' })
});
// → zipBuilder looks in: data/images/smoothbrain/uuid.png (wrong!)

// ✅ After: dynamic projectId from data source
fetch('/api/render/start', {
    body: JSON.stringify({ projectId: storyData.projectId })
});
// → zipBuilder looks in: data/images/sb_my-story/uuid.png (correct!)
```

**Bug 3 — URL query poisoning `path.extname()`:**
```typescript
// ❌ zipBuilder received: "uuid.png?projectId=sb_my-story"
path.extname("uuid.png?projectId=sb_my-story")
// → ".png?projectId=sb_my-story" — copy failed

// ✅ Fixed by storing bare filename upstream
path.extname("uuid.png")
// → ".png"
```

### Resolution Pattern

```typescript
// 1. Store bare filename in state
const [characterImage, setCharacterImage] = useState<string | null>(null);
setCharacterImage(data.files[0].filename);  // "uuid.png"

// 2. Helper for display URLs
const charImgSrc = (name: string) =>
    `/api/images/${name}?projectId=${storyData.projectId}`;

// 3. Use in JSX
<img src={charImgSrc(characterImage)} />

// 4. Pass bare filename to backend — it constructs the filesystem path
```

## Real-World Case Study: LTX 2 Video Export (Proxy URL Passthrough)

### Symptoms
- Storyboard images rendered correctly as thumbnails in the UI ✅
- Reference image appeared in SSE progress events ✅
- LTX 2 video tasks generated without reference images ❌
- No error messages — `zipBuilder` silently skipped the image

### Root Cause — Proxy URL Passthrough

VideoExport stored the SSE-returned proxy URL as the `refImagePath`:

```typescript
// ❌ Stored proxy URL from SSE progress
refImagePath: "/api/render/file?path=F%3A%5Coutputs%5Cimage.png"

// zipBuilder tried:
path.isAbsolute("/api/render/file?path=...")  // → false
// Fell through to:
path.join(dataDir, 'images', projectId, "/api/render/file?path=...")  // → nonsense
fs.existsSync(nonsensePath)  // → false — silently skipped
```

### Fix — Server-Side `resolveRefPath()`

```typescript
// ✅ Extract real filesystem path before passing to zipBuilder
const resolveRefPath = (ref: string | null): string | null => {
    if (!ref) return null;
    if (ref.startsWith('/api/render/file?')) {
        const u = new URL(ref, 'http://localhost');
        return u.searchParams.get('path') || ref;
    }
    if (ref.startsWith('/api/images/')) {
        const segments = new URL(ref, 'http://localhost').pathname.split('/');
        return segments[segments.length - 1];
    }
    return ref;
};

// Applied in render.ts before building export shots:
refImagePath: resolveRefPath(shot.refImagePath) || undefined,
```

### Why This Was Tricky
- **No error thrown** — `fs.existsSync()` returned false silently
- **Correct at every other layer** — UI displayed the image, SSE carried the URL, queue JSON had the filename
- **The image never made it into the zip** — only discoverable by inspecting the zip contents or adding logging to the zipBuilder

## Common Variants

| Variant | Symptom | Cause |
|---------|---------|-------|
| **URL in state** | Backend "file not found" | `servePath` stored instead of `filename` |
| **ProjectId mismatch** | File exists but in wrong folder | Hardcoded vs dynamic context key |
| **Query string poisoning** | `path.extname()` returns garbage | URL query params attached to filename |
| **Proxy URL passthrough** | File silently missing from zip/output | `/api/render/file?path=...` passed to `fs` operations |
| **Protocol mismatch** | `http://` in state | Full URL stored, backend expects relative path |
| **Double encoding** | `%2F` in path | URL-encoded string passed to filesystem API |

## Prevention Checklist

- [ ] Upload handler stores **bare filename only** in state
- [ ] Display URL constructed via **helper function**, never stored
- [ ] **Context key** (projectId, sessionId, etc.) sourced from **one canonical location**
- [ ] No hardcoded context keys in API calls
- [ ] Backend path utilities receive **clean filenames** (no query strings, no protocol)
- [ ] Proxy URLs from SSE/progress events are **resolved to filesystem paths** before downstream use
- [ ] `fs.existsSync()` failures are logged with `console.warn` (not silent)
- [ ] Unit test: `path.extname(storedValue)` returns expected extension

## Verification Steps

1. Upload a file and `console.log` the stored state value → should be bare filename
2. Verify `<img src={helper(filename)}>` renders correctly
3. Trigger backend processing → read logs for resolved filesystem path
4. `ls` / `dir` the resolved path — confirm the file is there
5. Check all API calls that reference the file use the same context key
