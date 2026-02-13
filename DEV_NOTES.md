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
