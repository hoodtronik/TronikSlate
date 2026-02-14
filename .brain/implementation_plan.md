# Smooth Brain Mode — Phase 1 Implementation

Build the Phase 1 wizard UI: concept input → model pickers → genre sliders → shot config → roll the dice → story preview.

> [!IMPORTANT]
> **No project transfer** between Smooth Brain ↔ Normal Mode (noted for later). Smooth Brain mode replaces the entire main content area. A "Normal Mode" button switches back.

## Proposed Changes

### Store Layer

#### [MODIFY] [uiStore.ts](file:///d:/pinokio/api/TronikSlate/app/src/stores/uiStore.ts)
- Add `smoothBrainMode: boolean` state (default `false`)
- Add `setSmoothBrainMode(on: boolean)` and `toggleSmoothBrainMode()` actions
- Add `smoothBrainPhase: 'setup' | 'storyboard' | 'export'` for Phase 1/2/3 tracking

---

### Wizard Component

#### [NEW] [SmoothBrainWizard.tsx](file:///d:/pinokio/api/TronikSlate/app/src/components/SmoothBrain/SmoothBrainWizard.tsx)
Top-level Phase 1 component. Contains:
- Concept text input
- Image model dropdown + Video model dropdown (from `modelStore`)
- Shot count radio (3/6/10)
- Shot duration slider (5–10s)
- `<GenreSliders>` subcomponent
- Vibe preset cards
- 🎲 Roll the Dice button → calls `getWeightedTemplates()` + `fillTemplate()` from `data/story-templates/index.ts`
- Story preview (editable beats list)
- 🔄 Re-roll / ✏️ Edit / 🚀 Go! buttons
- **Normal Mode →** button in header (calls `setSmoothBrainMode(false)`)

#### [NEW] [GenreSliders.tsx](file:///d:/pinokio/api/TronikSlate/app/src/components/SmoothBrain/GenreSliders.tsx)
- 7 range sliders (Horror→Drama), each 0–100
- Auto-normalize to 100% total
- Emoji labels from `genreLabels`
- Controlled component: `value: Record<Genre, number>`, `onChange` callback

---

### App Integration

#### [MODIFY] [App.tsx](file:///d:/pinokio/api/TronikSlate/app/src/App.tsx)
- Import `SmoothBrainWizard`
- Read `smoothBrainMode` from `uiStore`
- When `smoothBrainMode === true`: render `<SmoothBrainWizard />` instead of the sub-bar + Storyboard/Timeline + ShotEditor
- Toolbar still renders in both modes (for the toggle button)

#### [MODIFY] [Toolbar.tsx](file:///d:/pinokio/api/TronikSlate/app/src/components/Layout/Toolbar.tsx)
- Add 🧠 toggle button using `smoothbrain.jpg` image
- Calls `toggleSmoothBrainMode()`
- Visual indicator when active (glow/highlight)
- Shows "Normal Mode →" label when in Smooth Brain

---

## Build Order

1. `uiStore.ts` — add state + actions
2. `GenreSliders.tsx` — standalone slider component
3. `SmoothBrainWizard.tsx` — main wizard with all Phase 1 controls
4. `App.tsx` — conditional rendering
5. `Toolbar.tsx` — toggle button

## Verification Plan

### Manual Verification
1. `npm run dev` from `d:\pinokio\api\TronikSlate\app`
2. Click 🧠 button → entire UI swaps to Smooth Brain wizard
3. Click "Normal Mode →" → back to Storyboard/Timeline
4. Type concept, adjust sliders, click 🎲 → story beats appear
5. Re-roll produces different beats, Edit lets you modify inline
6. Model dropdowns show installed I2V + image models (or "none found" message)
