# Shot Dependency Chains (Video Chains)

When shot A's video is ready, its **last frame** automatically becomes shot B's **start reference image** — creating seamless visual flow across sequential scenes.

## Scope & Non-Scope

**In scope:** Video-to-video chaining (output of shot A → start ref of shot B)
**Backburner:** Image-gen-to-video chaining (deferred per user — requires human review loop)

## Proposed Changes

### Types & Data Model

#### [MODIFY] [project.ts](file:///f:/pinokio/api/TronikSlate/app/src/types/project.ts)

Add to `Shot` interface:
```diff
+ dependsOn?: string;        // Shot ID that feeds into this shot's start image
+ chainMode?: 'last_frame';  // How to extract (only 'last_frame' for now)
```

---

### Server — Frame Extraction Endpoint

#### [NEW] [frames.ts](file:///f:/pinokio/api/TronikSlate/app/server/routes/frames.ts)

New Express route: `POST /api/frames/extract-last`
- Input: `{ videoPath: string, projectId: string }`
- Uses **ffmpeg** (already available in the Pinokio conda env) to extract the last frame
- Saves as PNG into the project's `images/` folder
- Returns: `{ filename, path, thumbnailPath }` (same shape as `RefImage`)

> [!NOTE]
> We'll use ffmpeg via `child_process.execFile` — no new npm dependency needed since ffmpeg ships with the Pinokio/conda environment.

#### [MODIFY] [index.ts](file:///f:/pinokio/api/TronikSlate/app/server/index.ts)

Mount the new frames route: `app.use('/api/frames', framesRoutes)`

---

### Store — Chain Logic

#### [MODIFY] [projectStore.ts](file:///f:/pinokio/api/TronikSlate/app/src/stores/projectStore.ts)

Add actions:
- `setShotDependency(shotId, parentShotId | null)` — sets/clears `dependsOn`
- `propagateChain(parentShotId)` — when parent shot gets a new video:
  1. Find all shots where `dependsOn === parentShotId`
  2. Call `/api/frames/extract-last` on parent's selected video
  3. Add extracted frame to child shot's `refImages` and set as `selectedRefImageId`

> [!IMPORTANT]
> Chain propagation is **manual trigger + visual indicator**, not automatic. User sees a "🔗 Chain ready" badge and clicks to pull the frame. This prevents surprises.

---

### UI — ShotEditor Chain Picker

#### [MODIFY] [ShotHeader.tsx](file:///f:/pinokio/api/TronikSlate/app/src/components/ShotEditor/ShotHeader.tsx)

Add a **"Chain From"** dropdown below the shot name:
- Lists all other shots in the project (by name, grouped by section)
- Selected value = `shot.dependsOn`
- "None" option to clear
- Shows 🔗 icon when a chain is active

---

### UI — ShotCard Chain Indicator

#### [MODIFY] [ShotCard.tsx](file:///f:/pinokio/api/TronikSlate/app/src/components/Storyboard/ShotCard.tsx)

- Show a small 🔗 badge when `shot.dependsOn` is set
- Tooltip: "Chained from: {parentShotName}"
- When parent has a completed video + chain hasn't been pulled yet, show **pulsing** 🔗 badge (chain ready)

---

### UI — Chain Pull Button

#### [MODIFY] [RefImagesGrid.tsx](file:///f:/pinokio/api/TronikSlate/app/src/components/ShotEditor/RefImagesGrid.tsx)

When `shot.dependsOn` is set and the parent shot has video:
- Show a **"⬇ Pull Last Frame"** button above the ref images grid
- Clicking it calls the store's `propagateChain()` which:
  1. Extracts last frame from parent's selected video
  2. Adds it to this shot's refImages
  3. Selects it as the start image
- Button shows spinner during extraction

---

### Export — Chain Ordering

#### [MODIFY] [ExportPanel.tsx](file:///f:/pinokio/api/TronikSlate/app/src/components/Export/ExportPanel.tsx)

When building the export queue:
- **Topological sort**: if shot B depends on shot A, A must appear before B in the export list
- Show warning badge if a chained shot is missing its parent's video

---

## Verification Plan

### Manual Testing
1. Create 3 shots: A → B → C chain
2. Set B `dependsOn` A, C `dependsOn` B
3. Import a video for shot A → verify "⬇ Pull Last Frame" appears on shot B
4. Pull the frame → verify it appears as shot B's start ref image
5. Export queue → verify topological ordering (A before B before C)
6. PDF export → verify chain badges appear
