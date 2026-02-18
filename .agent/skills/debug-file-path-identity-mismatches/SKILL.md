---
name: debug-file-path-identity-mismatches
description: Debug layered file path mismatches between upload APIs, display URLs, and backend processors
---

# Debug File Path Identity Mismatches

Pattern for finding and fixing bugs where a file's identity (path, name, or context key) changes format or scope as it crosses system boundaries — upload API → state → backend processor.

## When to Use

- A backend processor can't find an uploaded file ("file not found" in logs)
- An uploaded file works in the UI thumbnail but breaks downstream processing
- Files are looked up in the wrong project/directory
- `path.extname()` or similar parsing returns unexpected results (e.g., `.png?projectId=abc`)
- A proxy URL (e.g., `/api/render/file?path=...`) is passed where a filesystem path is expected

## The Three-Layer Identity Problem

Files typically have **three identities** that must stay consistent:

| Layer | Example | Owns |
|-------|---------|------|
| **Display URL** | `/api/images/uuid.png?projectId=abc` | Browser rendering |
| **Proxy URL** | `/api/render/file?path=F:\outputs\img.png` | Server-to-browser file serving |
| **State value** | `uuid.png` (bare filename) | Component state / store |
| **Filesystem path** | `data/images/abc/uuid.png` or `F:\outputs\img.png` | Backend zip builder, render job |

The **#1 mistake**: storing the Display URL or Proxy URL in state, then passing it to a backend that expects a bare filename or filesystem path.

## Workflow

### 1. Identify the Handoff Points

Map where the file reference crosses boundaries:

```
Upload API response → React state → Backend POST body → File system lookup
         ↑ format A         ↑ format B?        ↑ format C?
```

### 2. Check What the Upload API Returns

Upload APIs often return multiple formats:

```typescript
// Typical upload response
{
  filename: "uuid.png",           // ← Bare filename (use this for state)
  path: "/data/images/abc/uuid.png",  // ← Filesystem path
  servePath: "/api/images/uuid.png?projectId=abc"  // ← Display URL
}
```

**Rule:** Store the **bare filename** in state. Construct display URLs and filesystem paths on-demand via helpers.

### 3. Check Context Key Consistency

When a file belongs to a project/session, the **context key** (e.g., `projectId`) must be the same everywhere:

```typescript
// ❌ Mismatch: uploaded to project "sb_my-story" but looked up in "smoothbrain"
upload({ projectId: storyData.projectId })  // → "sb_my-story"
render({ projectId: 'smoothbrain' })         // → wrong directory

// ✅ Consistent
upload({ projectId: storyData.projectId })
render({ projectId: storyData.projectId })
```

### 4. Fix Pattern

```typescript
// ✅ Store bare filename
setCharacterImage(data.files[0].filename);  // "uuid.png"

// ✅ Helper to construct display URL
const charImgSrc = (name: string) =>
    `/api/images/${name}?projectId=${storyData.projectId}`;

// ✅ Backend receives bare filename + consistent projectId
// → resolves to: data/images/{projectId}/{filename}
```

### 5. Watch for URL Query String Poisoning

When a URL with query params (e.g., `uuid.png?projectId=abc`) is passed to `path.extname()`:

```typescript
path.extname("uuid.png?projectId=abc")  // → ".png?projectId=abc" ❌
path.extname("uuid.png")                // → ".png" ✅
```

This breaks zip builders, image processors, and any file-type detection.

### 6. Handle Proxy URL Passthrough

When one server endpoint generates proxy URLs (e.g., SSE progress returns `/api/render/file?path=F:\outputs\img.png`), and that URL later gets passed to another backend consumer:

```typescript
// ❌ Proxy URL passed directly to zipBuilder
refImagePath: "/api/render/file?path=F%3A%5Coutputs%5Cimg.png"
// → path.isAbsolute() returns false → constructs nonsense path → silent "file not found"

// ✅ Extract the embedded filesystem path before passing downstream
const resolveRefPath = (ref: string | null): string | null => {
    if (!ref) return null;
    if (ref.startsWith('/api/render/file?')) {
        const u = new URL(ref, 'http://localhost');
        return u.searchParams.get('path') || ref;
    }
    if (ref.startsWith('/api/images/')) {
        const segments = new URL(ref, 'http://localhost').pathname.split('/');
        return segments[segments.length - 1]; // bare filename
    }
    return ref;
};
```

**Key signal:** `fs.existsSync()` silently returns false, no error thrown — the file is just missing from the output.

## Verification

1. Upload a file → check what's stored in component state (should be bare filename)
2. Verify the display URL renders the image correctly
3. Trigger the backend processor → check logs for the exact file path it resolves
4. Confirm the file exists at that resolved path
5. Check `projectId` consistency across upload, state, and backend calls
6. Check for proxy URLs passed to `fs.existsSync()` or `path.join()` — they will fail silently

## Key Learnings

- **Never store URLs in state** when the consumer is a filesystem operation
- **Always construct display URLs from bare filenames** via a helper function
- **Hardcoded context keys** (like `projectId: 'smoothbrain'`) are time bombs — always derive from the data source
- **URL query strings poison `path.extname()`** — strip them before any path parsing
- **Proxy URLs are not filesystem paths** — when a proxy URL like `/api/render/file?path=...` is stored and later sent to a backend, extract the real path with URL parsing before any `fs` operation
- **Silent failures are the worst** — `fs.existsSync()` returns false without logging; always add `console.warn` around file existence checks
