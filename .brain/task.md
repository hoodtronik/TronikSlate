# Smooth Brain Mode

## Template Generation (350/350 ✅)
- [x] 7 genres × 50 templates → JSON files + `index.ts` barrel export

## Spec ✅
- [x] 3-phase pipeline (setup → storyboard → export)
- [x] Model pickers, shot duration, retro arcade transitions, auto-accelerator

## Phase 1 Implementation ✅
- [x] `uiStore.ts` — `smoothBrainMode`, `smoothBrainPhase` + actions
- [x] `GenreSliders.tsx` — 7-slider component with % display
- [x] `StageTransition.tsx` — retro arcade splash (scanlines, glitch, SFX hook)
- [x] `SmoothBrainWizard.tsx` — full wizard (concept, model pickers, shots, genres, vibe, roll-the-dice, story preview)
- [x] `App.tsx` — conditional rendering (Smooth Brain replaces main content)
- [x] `Toolbar.tsx` — 🧠 toggle with purple glow
- [x] Build verification — zero TS errors

## Later
- [ ] Phase 2 UI: Storyboard, ShotCard, CharacterSetup
- [ ] Phase 2 backend: headless image gen + video gen pipelines
- [ ] Phase 3: video concat + final export
- [ ] Auto-pick fastest accelerator profile per model
- [ ] Smooth Brain ↔ Normal Mode project transfer
