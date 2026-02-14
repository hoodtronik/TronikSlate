# 🧠 Smooth Brain Mode — Walkthrough

## What Was Built

Smooth Brain Mode Phase 1: a simplified wizard UI that replaces the entire TronikSlate interface with a step-by-step video creation flow. Type a concept, pick models, roll the dice, get a story.

## Files Created

| File | Purpose |
|---|---|
| [SmoothBrainWizard.tsx](file:///d:/pinokio/api/TronikSlate/app/src/components/SmoothBrain/SmoothBrainWizard.tsx) | Main Phase 1 wizard — concept input, dual model pickers, shot config, genre sliders, vibe cards, 🎲 Roll the Dice, story preview with re-roll/edit/go |
| [StageTransition.tsx](file:///d:/pinokio/api/TronikSlate/app/src/components/SmoothBrain/StageTransition.tsx) | Full-screen retro arcade "STAGE 1" splash with scanlines, glitch animation, SFX hook — flashes before each phase UI |
| [GenreSliders.tsx](file:///d:/pinokio/api/TronikSlate/app/src/components/SmoothBrain/GenreSliders.tsx) | 7 genre range sliders (Horror→Drama) with live % normalization |

## Files Modified

| File | Changes |
|---|---|
| [uiStore.ts](file:///d:/pinokio/api/TronikSlate/app/src/stores/uiStore.ts) | Added `smoothBrainMode`, `smoothBrainPhase` state + toggle/set actions |
| [App.tsx](file:///d:/pinokio/api/TronikSlate/app/src/App.tsx) | Conditional rendering: Smooth Brain wizard replaces main content area when active |
| [Toolbar.tsx](file:///d:/pinokio/api/TronikSlate/app/src/components/Layout/Toolbar.tsx) | 🧠 toggle button with purple glow, shows "🧠 Exit" when active |
| [models.ts](file:///d:/pinokio/api/TronikSlate/app/server/routes/models.ts) | `GET /api/models/image` (scan for Flux/Qwen image models), `POST /api/models/download` (auto-download from HuggingFace) |
| [index.ts](file:///d:/pinokio/api/TronikSlate/app/src/data/story-templates/index.ts) | Fixed `replaceAll` TS compat → `split/join` |
| [DEV_NOTES.md](file:///d:/pinokio/api/TronikSlate/DEV_NOTES.md) | Added Trash Bin feature idea, Smooth Brain ↔ Normal Mode transfer note |

## Story Templates (pre-existing from earlier session)
- 350 templates across 7 genres in `app/src/data/story-templates/*.json`
- `index.ts` barrel with `getWeightedTemplates()` + `fillTemplate()`

## Key Design Decisions

1. **Full UI swap**: Smooth Brain replaces the entire content area (no sub-bar, no storyboard, no shot editor). Only the Toolbar stays.
2. **Two model pickers**: Video model (I2V, from existing `/api/models`) + Image model (Flux/Qwen, from new `/api/models/image`)
3. **Auto-download fallback**: If no image models installed, shows "⬇️ Download Flux2 Klein 4B" button that streams the quantized safetensor from HuggingFace
4. **Stage transitions**: Retro arcade splash ("STAGE 1 — Story Setup") plays before each phase UI, with hooks for GIF + SFX assets in `app/public/smoothbrain/`
5. **No project transfer**: Smooth Brain projects don't transfer to Normal Mode (noted for later)

## Noted for Later
- Auto-pick fastest accelerator profile (LightX2/FusioniX) per model
- Retro arcade GIFs + 90s voice SFX assets (user will source)
- Phase 2: Image storyboard with 👍/👎, video storyboard with 👍/👎
- Phase 3: Final video concat + export
- Smooth Brain ↔ Normal Mode project transfer

## Verification
- TypeScript build: **zero errors** (`npx tsc --noEmit`)
- Dev server starts clean on `http://localhost:5173/`
