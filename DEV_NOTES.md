# TronikSlate Development Notes

## Last Session: Feb 13, 2025

### What Was Implemented

#### Timeline Player (Timeline.tsx)
- **Transport controls**: Play/Pause/Stop/Rewind in toolbar, Enter key shortcut
- **Red playhead line** + ruler marker with click-to-scrub
- **Preview Monitor** below timeline (flex-height, fills remaining space)
  - Video: uses native `video.play()` during playback (no per-frame seeking)
  - Image: shows ref image when no video available
  - Audio: `shot.audioFile` plays via hidden `<audio>` element
  - Info overlay: shot/section name, timestamp
- **Performance**: DOM-driven playhead at 60fps via refs, React state at 30fps

#### Minor Fixes
- Toolbar button renamed "Images" → "Assets" (Toolbar.tsx)

### Architecture Notes

**Playhead Animation (3-tier strategy)**:
1. `playheadTimeRef` — high-frequency position (updated every rAF frame)
2. DOM refs (`playheadLineRef`, `playheadMarkerRef`, `timeDisplayRef`) — updated via `translateX` at 60fps
3. React state `playheadTime` — throttled to 33ms for clip detection & video/audio seeking

**Video/Audio Sync Strategy**:
- During playback: seek once to clip start → `media.play()` → let browser decode sequentially
- During scrub/pause: traditional `currentTime` seeking
- When clip changes: pause old media, seek new media, play

### Known Issues / Backlog
- [ ] ~33ms lag between visual playhead and preview clip detection (fix: move activeClip into rAF loop)
- [ ] NLE Export button does nothing — needs implementation
- [ ] J/K/L keyboard navigation for playback speed control
- [ ] Drag-scrub on ruler (currently click-jump only)
- [ ] Frame caching/pre-render for offline preview (user suggested)
- [ ] Synchronized video thumbnails in timeline clips during playback

### Feature Ideas

#### 🧠 Smooth Brain Mode (spec: `smooth_brain_spec.md`)
- Script-to-video wizard: Paste Story → Pick Vibe → Hit Go
- Hides all expert params behind presets, auto-splits text into shots
- One "Make My Video" button runs full pipeline (export → render → assemble)

#### 📊 Live Render Progress Tracking
- **Storyboard integration**: Loading bar overlaid on each ShotCard that fills from empty to full as that shot renders. Shots go through states: queued → rendering (animated bar) → done (green check).
- **In-project view**: While the exported project is open, shots show real-time progress from the headless render SSE stream. Each shot's bar fills based on the step/frame progress from Wan2GP stdout.
- **Floating popup window**: If user closes the project or switches to another project, a small floating/draggable UI window persists showing:
  - Overall progress (e.g., "Shot 3 of 8 — 47%")
  - Per-shot mini progress bars
  - Elapsed time / ETA
  - **Cancel/Shutdown button** — kills the headless render process cleanly
- **Emergency kill script**: A `kill_render.bat` file in the project root that force-kills the Wan2GP python process. Safety net for users who don't know CLI.
- **Shutdown from app**: Both the in-project render section AND the floating popup must have a clearly visible red "⬜ Stop Render" button that calls `/api/render/cancel`.

#### 📁 Video Import Portability Fix
- **Problem**: Auto-imported videos (from Wan2GP output watcher) are referenced by external path. If the project folder is moved to a new PC, those videos are missing because they still live in Wan2GP's output folder on the old machine.
- **Fix**: When any video file is auto-imported (or manually imported), it should be **copied into the project folder** (e.g., `projects/<project>/videos/`) and the project's reference should point to the local copy, not the external source.
- **Benefit**: Project folders become fully self-contained and portable — can be moved between PCs, backed up, or shared.

#### 🧠 Smooth Brain Mode
- Spec: `smooth_brain_spec.md`
- Button image asset: `app/public/smoothbrain.jpg`

#### 🗑️ Trash Bin / Soft Delete (Expert Mode)
- **Concept**: Bring the 👍/👎 pattern from Smooth Brain into Expert Mode. When a user 👎's (or deletes) a rendered image or video, it moves to a "Trash" tab inside the media grids instead of being permanently removed.
- **UI**: New tab alongside the existing Images/Videos grid tabs — "🗑️ Trash" — showing soft-deleted assets with timestamp of deletion.
- **Recovery**: User can drag an item back into the project, or click a "Restore" button to un-trash it and put it back on its original shot.
- **Permanent delete**: "Empty Trash" button clears disk space. Until then, files remain in a `projects/<project>/trash/` subfolder.
- **Benefit**: Safety net for accidental deletes, encourages experimentation since nothing is permanently lost until explicitly emptied.

#### 🔄 Smooth Brain ↔ Normal Mode Project Transfer
- **Status**: Not implemented yet — planned for later
- **Concept**: Allow users to transfer a Smooth Brain project into Normal Mode (with full sections, shots, params). Currently, each mode is self-contained with no crossover.

### Key Files
- `app/src/components/Timeline/Timeline.tsx` — Timeline + Player + Preview Monitor (~927 lines)
- `app/src/components/Layout/Toolbar.tsx` — Top toolbar with nav buttons
- `app/src/types/project.ts` — Shot/Section data types
- `app/src/utils/api.ts` — API calls (`getVideoUrl`, `getAudioUrl`, etc.)

### Git Log (today's commits)
```
b722874 fix: tighten playhead-to-preview sync (100ms -> 33ms throttle)
6836d69 fix: rename toolbar button from 'Images' to 'Assets'
3677a1b feat: audio playback in Timeline Player
37f94d9 perf: native video.play() during playback, seek only on scrub
17a4ba7 perf: DOM-driven playhead animation at 60fps, flex preview monitor
e11888b feat: Timeline Player MVP - transport controls, playhead, click-to-scrub
```
