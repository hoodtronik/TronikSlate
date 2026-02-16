# Smooth Brain — Phase 2 Implementation

## Completed ✅

- [x] **Phase 2A: Character Setup** — `CharacterSetup.tsx` with Upload/Generate tabs
- [x] **Phase 2B: Image Storyboard** — `Storyboard.tsx`, `ShotCard.tsx` with gorilla GIF placeholder
- [x] **Stage Transitions** — Round 1 → Round 2 → Round 3 → Final Round nomenclature
- [x] **Manual/Automatic toggle** — "Set it and forget it" auto-approve mode in Round 3
- [x] **Global Wan2GP Render Indicator** — Blinking toolbar indicator + 🛑 emergency kill with confirm()
  - `GET /api/render/wgp-status` (fixed WMIC query escaping)
  - `POST /api/render/wgp-kill/:pid`
  - `WgpRenderIndicator.tsx` in Toolbar
- [x] **Autosave/Resume** — `useSmoothBrainAutosave.ts` hook
  - Debounced localStorage save (2s) + beforeunload emergency save
  - Resume prompt on mount (24hr expiry, only if past setup)
  - Persists: concept, models, genres, beats, phase, resolution, vibe
- [x] **Image Gen Speed Fix** — Was generating 81-frame videos instead of single images!
  - `image_mode: 1`, `video_length: 1`, `num_inference_steps: min(default, 8)`
  - Resolution derived from vibe (Cinematic=16:9, Vertical=9:16, Square=1:1) × tier (480p/540p/720p)
- [x] **Image Thumbnails Fix** — Output images now visible in ShotCards
  - `GET /api/render/file?path=...` proxy endpoint (security-scoped to wan2gp outputs/)
  - Server scans wan2gp `outputs/` for newest file on `task_done` SSE event
  - Storyboard converts filesystem paths to proxy URLs
  - Fixed SSE field mismatch (`taskNo` not `taskId`)
- [x] **Visible Error Banner** — Red dismissible error banner in Storyboard for render failures

## Needs Testing 🧪

- [ ] **Image generation with image_mode: 1** — Restart app and test; should be ~1 min per image with Flux2 Klein
- [ ] **Thumbnails showing** — After restart, verify images appear in ShotCards via `/api/render/file` proxy
- [ ] **Resolution mapping** — Verify Cinematic/Vertical/Square produce correct aspect ratio images

## Known Bugs 🐛

- [ ] **Flux2 Klein not receiving character reference image** — The character image from Round 2 isn't being passed through to the image generation. Need to debug how `storyData.characterImage` flows into the queue.zip `image_start` param and verify the image file is correctly bundled into the zip. Check `Storyboard.tsx` lines where `image_start` and `image_prompt_type: 'S'` are set, and `zipBuilder.ts` `refImagePath` handling.
- [ ] **Auto mode in Round 3 sends user back to Round 1** — When all shots auto-approve in Automatic mode, `setSmoothBrainPhase('export')` fires but the wizard doesn't handle `'export'` phase yet, so it falls through to setup (Round 1). Fix: either add an export phase view in `SmoothBrainWizard.tsx`, or keep user on storyboard with a "proceed to video" prompt until video gen is implemented.

## Next Up 📝

- [x] **Skills Page + Module System** — Higgsfield-style grid, Motion Control (SCAIL/LTX2/Steadydancer) + Lip Sync (InfiniteTalk) modules, skill selector in ShotEditor, Simple/Advanced toggle per shot
- [x] **Queue grouping by model** — Shots sorted by `model_type` in `render.ts` before building queue.zip. `taskIndexMap` on manifest translates sorted→original indices. SSE events include `originalIndex`.
- [x] **Prompt Assistant (Ollama)** — Simple on/off toggle in ShotEditor (not universal). ✨ Enhance button below prompts with review diff. 🎲✨ AI Roll in Smooth Brain wizard generates random stories via Ollama. Server: 4 endpoints (status/pull/enhance/pack with variable shotCount/concept/genres). VRAM safety: keep_alive=0, cancel on render start. Deterministic fallback.
- [ ] **Audio Suite Page** — Full audio page leveraging wan2gp's built-in TTS models and music generation models. Scan wan2gp's TTS options to map available voices/models. UI for text-to-speech generation (narration, dialogue) and music/soundscape generation. Output audio files assignable to shots as `audioFile` for audio-guided video generation.
- [ ] **LoRA Skill Modules** — Two tiers: (A) **Curated defaults** — pre-configured LoRA skills with auto-download from CivitAI, user-provided JSON archive for defaults. (B) **Local LoRA scanner** — scans wan2gp's `loras/` folder, reads `.json` sidecar metadata (trigger words), fetches CivitAI thumbnail GIF as card preview. **"Learn More" / "Details" button** on every skill card — for LoRA skills, pulls description + examples from CivitAI API; for built-in skills, shows curated explanation. **Simple/Advanced toggle is non-destructive** — toggling back to Simple hides controls but preserves custom params. **"↩ Reset to Defaults" button** in Advanced panel. Multi-LoRA stacking in Advanced mode. Review wan2gp's lora_manager and civitai_browser plugin code for reference.
- [ ] **Video Generation (Phase 2, Stage B)** — Video pipeline with approval/rejection
- [ ] **Final Export (Phase 3)** — Video concatenation and export
- [ ] **Smooth Brain ↔ Normal Mode** — Project transfer between modes

## Key Files Modified This Session

| File | What Changed |
|------|-------------|
| `src/data/skills/types.ts` | Created — SkillDefinition, ModelRoute, SkillInput, AdvancedParam types |
| `src/data/skills/motion-control.ts` | Created — Motion Control skill (SCAIL/LTX2/Steadydancer router) |
| `src/data/skills/lip-sync.ts` | Created — Lip Sync skill (InfiniteTalk backend) |
| `src/data/skills/index.ts` | Created — Skills registry + lookup helpers |
| `src/utils/skillEngine.ts` | Created — buildShotFromSkill() with param merge + lock enforcement |
| `src/components/Skills/SkillsPage.tsx` | Created — Higgsfield-style card grid with category filters |
| `src/components/Skills/SkillPanel.tsx` | Created — Skill input panel with Simple/Advanced toggle |
| `src/components/ShotEditor/ShotEditor.tsx` | Added skill selector dropdown, **Prompt Assistant on/off toggle** + enhance button |
| `src/stores/projectStore.ts` | Added addSkillShot() method |
| `src/stores/uiStore.ts` | Added skillsPageOpen state |
| `src/stores/promptStore.ts` | Created — Ollama status, enhance, generateStory, model pull |
| `src/components/Layout/Toolbar.tsx` | Added 🧩 Skills nav button |
| `src/components/PromptAssistant/PromptDiff.tsx` | Created — before/after prompt review |
| `src/components/PromptAssistant/PromptAssistantSettings.tsx` | Created — mode toggle + Ollama status |
| `src/components/PromptAssistant/PromptAssistantButton.tsx` | Created — toolbar popover (removed from toolbar, kept as component) |
| `src/data/promptTemplates.ts` | Created — per-module system prompts |
| `server/routes/ollama.ts` | Created — 4 endpoints (status/pull/enhance/pack) |
| `src/App.tsx` | Added SkillsPage route |
| `src/components/SmoothBrain/SmoothBrainWizard.tsx` | **Added 🎲✨ AI Roll button** + generateStory integration |
| `src/components/SmoothBrain/Storyboard.tsx` | image_mode fix, resolution mapping, error banner, SSE field fix, proxy URL |
| `server/routes/render.ts` | WMIC fix, output path scan, file proxy endpoint, **cancelOllamaRequests()** |

## Important Context

- **Vibe = Aspect Ratio**: Cinematic (16:9), Vertical/Social Media (9:16), Square (1:1)
- **Resolution = Quality Tier**: 480p, 540p, 720p — combined with vibe to produce pixel dimensions
- **wgp.py supports `image_mode: 1`** in queue.zip params — no custom script needed
- **Flux2 Klein** uses 4 inference steps for images (capped at 8 in code)
- **Two wgp.py processes were competing for GPU** — both killed, GPU is free
