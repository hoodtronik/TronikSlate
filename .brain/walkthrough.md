# Prompt Assistant — UX Refactor Walkthrough

## What Changed

### 1. ShotEditor: Simple On/Off Toggle
- Removed the universal toolbar popover (Off/Silent/Review mode selector)
- Added a clean toggle switch **above the prompt textarea** in ShotEditor
- When ON: ✨ Enhance Prompt button appears below prompts
- Clicking Enhance shows a before/after diff for review (accept/reject)
- Per-shot `useOptimizedPrompt` checkbox controls which prompt goes to render

### 2. Smooth Brain: 🎲✨ AI Roll the Dice
- New amber-gradient button alongside the existing template-based 🎲 Roll
- Sends concept, shot count (3/6/10), and genre weights to Ollama
- AI invents a random story and expands it into the requested number of shots
- Falls back to template roll if Ollama is offline or returns bad data
- Story Preview shows "✨ AI Generated" label for AI-sourced stories
- Re-roll remembers source — uses same mode (template vs AI) on re-roll

### 3. Server: Flexible `/pack` Endpoint
- Now accepts `shotCount` (2-20), `concept`, and `genres[]`
- If no concept/logline provided, AI invents a random story from scratch
- JSON schema simplified to just `prompt` + `shot_label` per shot

## Files Modified

| File | Change |
|------|--------|
| [ShotEditor.tsx](file:///d:/pinokio/api/TronikSlate/app/src/components/ShotEditor/ShotEditor.tsx) | On/off toggle + enhance button |
| [SmoothBrainWizard.tsx](file:///d:/pinokio/api/TronikSlate/app/src/components/SmoothBrain/SmoothBrainWizard.tsx) | AI Roll button + generateStory |
| [Toolbar.tsx](file:///d:/pinokio/api/TronikSlate/app/src/components/Layout/Toolbar.tsx) | Removed PromptAssistantButton |
| [ollama.ts](file:///d:/pinokio/api/TronikSlate/app/server/routes/ollama.ts) | Flexible /pack endpoint |
| [promptStore.ts](file:///d:/pinokio/api/TronikSlate/app/src/stores/promptStore.ts) | Added generateStory() |
| [DEV_NOTES.md](file:///d:/pinokio/api/TronikSlate/DEV_NOTES.md) | Session notes |

## Validation
- **TypeScript**: `npx tsc --noEmit` → EXIT 0 ✅
- **Model**: llama3.2:3b already downloaded ✅
