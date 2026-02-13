# Tronik Slate — Feature Roadmap

## 🔴 High Priority

### Timeline Player
- Playhead cursor (vertical red line) that moves with time
- Transport controls: Play / Pause / Stop / Rewind
- Click-to-scrub on the ruler bar
- Sync video playback in visible clips as playhead passes over them
- Keyboard: Space (play/pause), J/K/L (reverse/pause/forward)
- **Complexity:** Large. Involves managing multiple `<video>` elements, requestAnimationFrame loop, coordinating scroll position
- **Codex candidate:** Yes — provide it with Timeline.tsx, the Shot type, and api.ts

## 🟡 Medium Priority

### Verify Recent Fixes
- [ ] Template import images (UUID filename fix)
- [ ] PDF video thumbnails (crossOrigin + URL fix)

### Render Pipeline Improvements
- Render queue management in ExportPanel
- Progress tracking for individual shots
- Batch rendering with parameter sweeps

## 🟢 Low Priority / Polish

### UI Polish
- Dark/light theme toggle
- Keyboard shortcut overlay (? key)
- Drag-and-drop shot reordering in Timeline

### Template System
- Template gallery / preset library
- Auto-generate template from existing project

### Export Enhancements
- EDL/XML timeline export for NLE software
- Assembly player (preview full sequence)
