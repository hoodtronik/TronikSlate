# Tronik Slate — Development State (Feb 13, 2026)

## What This App Is
AI-powered video storyboard & timeline editor. Built as a Pinokio launcher app with:
- **Frontend:** React + TypeScript + Vite + Tailwind (port 5173)
- **Backend:** Express + tsx (port 3001)
- **State:** Zustand stores (`projectStore`, `uiStore`, `modelStore`)

## Project Structure
```
TronikSlate/
├── app/                    # Main application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/     # Toolbar, RenderDashboard, WelcomeScreen, ErrorBoundary
│   │   │   ├── Storyboard/ # Card-based shot view (ShotCard.tsx)
│   │   │   ├── Timeline/   # Timeline track view (Timeline.tsx)
│   │   │   ├── ShotEditor/ # Right panel shot editing
│   │   │   ├── Export/     # ExportPanel, render queue
│   │   │   ├── ImageManager/
│   │   │   ├── AudioCropper/
│   │   │   └── VideoImport/
│   │   ├── stores/         # Zustand: projectStore, uiStore, modelStore
│   │   ├── utils/          # api.ts, storyboardPdf.ts, templateImport.ts, time.ts
│   │   ├── types/          # project.ts (Shot, Section, Project types)
│   │   └── App.tsx         # Main layout: Toolbar → Sub-bar → Content
│   ├── server/
│   │   ├── index.ts        # Express entry, mounts routes
│   │   └── routes/         # images.ts, audio.ts, rawvideos.ts, project.ts
│   └── public/
│       └── TronikSlateLogo.png
├── install.js / start.js / reset.js / update.js  # Pinokio launchers
├── pinokio.js / pinokio.json                      # Pinokio UI & metadata
└── .brain/                 # Dev notes (this folder)
```

## Key Architecture Decisions

### Layout (App.tsx)
```
┌──────────────────────────────────────────┐
│ Toolbar: File | Undo/Redo | ProjectName  │  ← h-12, fixed
├──────────────────────────────────────────┤
│ Sub-bar: [Storyboard][Timeline]  ...stats│  ← h-8, new
├──────────────────────────────────────────┤
│ Main content (Storyboard or Timeline)    │
│ + ShotEditor panel (right)               │
│ + ImageManager / AudioCropper (modals)   │
└──────────────────────────────────────────┘
```

### Image Handling
- Server renames ALL uploads to UUID (`${uuid()}.png`) via sharp
- Thumbnails generated server-side at `data/projects/{id}/thumbs/`
- Frontend uses `api.getThumbUrl(filename, projectId)` → `/api/images/thumb/{filename}?projectId=...`
- **Critical:** Always use `uploaded.filename` from server response, never the local name

### Video Handling
- Videos served via `/api/videos/external?path=<absolute_path>`
- `shot.videoFiles[].path` stores absolute filesystem paths
- Timeline & Storyboard show video frames via `<video preload="metadata">`

### Template System (.tronikslate files)
- JSON format: `{ version, projectName, modelId, profileName, profileParams, resolution, sections[{shots[]}] }`
- Shots can embed base64 ref images
- Import: `templateImport.ts` → `parseTemplate()` → `buildProjectFromTemplate()`
- Export: Template HTML page served at `/api/project/{id}/template`

## What Was Done Today (Feb 13)

1. **Toolbar overlap fix** — RenderDashboard was absolutely positioned and overlapped tabs
2. **Timeline video fallback** — Shows video frames when no ref image exists
3. **Template image fix** — Was using local filename instead of server UUID
4. **PDF video extraction fix** — Removed crossOrigin taint, fixed URL, fixed seek timing
5. **Timeline zoom defaults** — H:45, V:250 (near max)
6. **Package rename** — bytecut-director → tronik-slate
7. **Logo** — pinokio.json icon → app/public/TronikSlateLogo.png

## Open Items (Priority Order)

### 🔴 HIGH — Timeline Player
The Timeline has no playback. Needs:
- Playhead cursor (vertical line) synced to time
- Transport controls (play/pause/stop)
- Scrubbing (click/drag on ruler)
- Video playback synchronized across visible clips
- **This is a large feature — good candidate for Codex 5.3**

### 🟡 MEDIUM — Verify Fixes
- Template import images — re-test after UUID filename fix
- PDF video thumbnails — re-test after crossOrigin/URL fix

### 🟢 LOW — Polish
- Add description to pinokio.json
- Timeline player keyboard shortcuts (Space=play/pause, J/K/L)

## Dev Commands
```bash
cd f:\pinokio\api\TronikSlate\app
npm run dev          # Starts Vite + Express concurrently
npx tsc --noEmit     # Type-check without build
```

## Important Files for Reference
| File | Purpose |
|------|---------|
| `App.tsx` | Main layout, sub-bar with view toggle + dashboard |
| `Toolbar.tsx` | Top bar: File menu, undo/redo, project name, settings |
| `Timeline.tsx` | Timeline view with zoom sliders, clips, trim handles |
| `ShotCard.tsx` | Storyboard card with video preview, drag-drop |
| `templateImport.ts` | .tronikslate file parsing and project building |
| `storyboardPdf.ts` | PDF export with video frame extraction |
| `server/routes/images.ts` | Image upload (UUID rename), thumbnails, CRUD |
| `stores/projectStore.ts` | Project state, save/load, autosave |
| `stores/uiStore.ts` | UI state: viewMode, selectedShot, panels |
