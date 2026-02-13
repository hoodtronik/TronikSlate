# Walkthrough: Shot Dependency Chains

## What was built

Video-to-video shot chaining — when shot A's output video is ready, you can pull its **last frame** into shot B as the start reference image, creating seamless visual flow.

## Changes Made

### Data Model
- **`project.ts`** — Added `dependsOn?: string` and `chainMode?: 'last_frame'` to `Shot` interface

### Server
- **`frames.ts`** (new) — `POST /api/frames/extract-last` endpoint. Uses ffprobe for duration, then ffmpeg to extract the last frame as PNG. Saves to project images dir.
- **`index.ts`** — Mounted `/api/frames` route

### Store
- **`projectStore.ts`** — Two new actions:
  - `setShotDependency(shotId, parentId)` — links/unlinks shots
  - `pullChainFrame(sectionId, shotId)` — calls server to extract last frame, adds as ref image and auto-selects it

### UI
- **`ShotEditorHeader.tsx`** — "Chain From" dropdown listing all other shots grouped by section
- **`ShotCard.tsx`** — 🔗 badge (pulses cyan when parent has video ready)
- **`RefImagesGrid.tsx`** — "⬇ Pull Last Frame" button with loading spinner, or "waiting for video" indicator

### Export
- **`ExportPanel.tsx`** — Topological sort ensures dependencies render before dependents in the queue

## Validation
- TypeScript compiles clean (`npx tsc --noEmit` — 0 errors)
- All changes are backward-compatible (new fields are optional)
