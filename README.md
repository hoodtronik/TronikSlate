# Tronik Slate

**AI Video Pre-Production Studio** — Plan, organize, generate, and review AI-generated video from script to final cut.

Tronik Slate is a full-featured storyboard and shot management tool built for AI video workflows. It connects to **Wan2GP** (and other generation backends) to export render queues, auto-import generated videos, compare takes side-by-side, and iterate until every shot is locked.

---

## Features

### 🎬 Storyboard & Timeline
- **Storyboard View** — Grid of shot cards organized by sections (Intro, Chorus, Bridge, etc.)
- **Timeline View** — Horizontal time ruler with color-coded section lanes, zoom, pan, and scrub
- **Timeline Player** — Transport controls (Play/Pause/Stop/Rewind), red playhead, preview monitor with synchronized video + audio playback
- **Drag & drop** reference images onto shots, reorder sections, click-to-scrub on the ruler

### 🎯 Shot Editor
- **Solo / Multi / Prebaked** shot types — single generation, multiple takes, or externally-generated video
- **Per-shot parameters** — override any global generation parameter for individual shots (highlighted in red)
- **Video Prompt + Ref Image Prompt** — separate prompt fields for video generation and image generation planning
- **Reference Images** — drag from the Asset Manager, select which image to export, support for start + end frame images
- **Audio attachment** — upload or drag `.wav`/`.mp3`/`.ogg`/`.flac` with waveform preview
- **Approval workflow** — mark shots as approved, filter by approval status during export
- **Bake lock** — lock finished shots to exclude from render queue
- **Shot dependencies** — chain shots so one's output feeds the next as a start image
- **Token counter** — live prompt token count display

### 🔄 Takes & Video Pool
- **Multi-take shots** — create variations with separate prompts and reference images per take
- **Compare Takes** — full-screen A/B viewer with synced playback, drag-and-drop, and side-by-side comparison of **all** videos: takes, active video, and pool entries
- **Video Pool** — archive of all generated videos per shot with source labels, promote any pool video to active
- **Split to Solo** — split selected takes into independent shots
- **Auto-import watcher** — set a watch folder and new videos are automatically matched and imported on a polling interval

### 📤 Export System
- **Queue ZIP export** — generates `queue.json` with all parameters, prompts, model settings, and bundled images/audio for Wan2GP
- **Export validation** — pre-flight checks for missing images, prompts, audio, and parameter issues
- **Content & approval filters** — export all, only ready shots, or only approved shots
- **Batch parameter sweeps** — generate multiple copies of selected shots with randomized seed, guidance scale, shift, and steps
- **Per-shot attempt count** — control how many videos Wan2GP generates per prompt

### 📥 Video Import
- **File browser** — navigate your filesystem to find Wan2GP output folders
- **Auto-matching** — filenames are automatically matched to shots/takes using two-phase matching (exact + relaxed)
- **Watch folder** — configure once, videos are auto-imported as they appear (persists across sessions)
- **Portability** — imported videos are copied into the project folder so projects are self-contained

### 🤖 AI Integration (Ollama)
- **Prompt enhancement** — ✨ Enhance Prompt button uses Ollama (llama3.2:3b) to optimize video prompts with before/after diff review
- **AI Roll the Dice** — 🎲✨ generates random story ideas and expands them into structured shot sequences
- **Ollama status** — live connection indicator, one-click model pull with SSE progress
- **VRAM safety** — automatic model unloading (`keep_alive: 0`) to free GPU memory before renders

### 🎨 Smooth Brain Mode
- **Script-to-video wizard** — paste a story concept, pick genre vibes, hit Go
- **Genre sliders** — weight multiple genres (Cyberpunk, Horror, Romantic, etc.) to influence the AI's creative direction
- **Auto-splits** text into shots with appropriate pacing
- **One-click pipeline** — export → render → assemble (planned)

### 🧰 Asset Management
- **Image Manager** — upload, browse, drag-to-assign, lightbox preview
- **Audio tab** — upload and manage audio files, drag onto shots
- **Audio Cropper** — waveform editor for trimming audio clips before assignment
- **Prompt Library** — save/load prompt presets organized by category

### ⚙️ Generation Parameters
- **Model selector** — choose model family (Wan 2.2, LTX-2, HunyuanVideo 1.5, etc.) and variant, with auto-applied defaults
- **Resolution presets** — grouped by aspect ratio
- **Video length, FPS, duration preview**
- **Core + Advanced parameter groups** — guidance scale, inference steps, flow shift, seed, denoise strength, RIFLEx, STG parameters
- **LoRA support** — browse and apply LoRA models with per-shot weight control
- **Skills panel** — model-specific prompt guides and cinematography reference

### 📊 Render Progress (Planned)
- Live progress bars on shot cards during rendering
- Floating popup window for monitoring renders across projects
- Emergency kill button for stopping Wan2GP processes

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| State | Zustand (projectStore, uiStore, promptStore, modelStore, loraStore, presetStore, renderProgressStore) |
| Backend | Express.js (Node 18+) |
| AI | Ollama (llama3.2:3b) |
| Styling | Vanilla CSS + custom design tokens |
| Video | Native HTML5 `<video>` with Range request streaming |

---

## Project Structure

```
TronikSlate/
├── app/                          # Main application
│   ├── src/
│   │   ├── components/
│   │   │   ├── AudioCropper/     # Waveform trim editor
│   │   │   ├── Export/           # Export panel + validation
│   │   │   ├── ImageManager/     # Asset browser + drag-drop
│   │   │   ├── Layout/           # Toolbar, Welcome, global layout
│   │   │   ├── PromptAssistant/  # Ollama prompt enhancement
│   │   │   ├── ShotEditor/       # Shot details, params, takes, video pool, compare
│   │   │   ├── Skills/           # Model prompt guides
│   │   │   ├── SmoothBrain/      # Wizard mode
│   │   │   ├── Storyboard/       # Shot card grid
│   │   │   ├── Timeline/         # Timeline ruler + player
│   │   │   └── VideoImport/      # Import modal + file browser
│   │   ├── stores/               # Zustand state management
│   │   ├── types/                # TypeScript interfaces
│   │   ├── utils/                # API client, filename matching, video helpers
│   │   └── data/                 # Templates, model configs, prompt guides
│   ├── server/
│   │   └── routes/               # Express API routes (projects, videos, audio, ollama, render)
│   └── public/                   # Static assets
├── install.js                    # Pinokio install script
├── start.js                      # Pinokio launch script
├── reset.js                      # Pinokio reset script
├── update.js                     # Pinokio update script
├── pinokio.js                    # Pinokio UI generator
└── pinokio.json                  # Pinokio metadata
```

---

## Getting Started

### Via Pinokio (Recommended)
1. Install [Pinokio](https://pinokio.computer)
2. Search for **Tronik Slate** or clone this repo into your Pinokio API folder
3. Click **Install** → **Start**

### Manual
```bash
cd app
npm install
npm run dev
```

The dev server starts with both the Vite frontend and Express backend.

---

## Workflow

1. **Create a project** — add sections and shots
2. **Upload reference images** via the Asset Manager → drag onto shots
3. **Write prompts** — video generation prompts + optional ref image prompts
4. **Configure params** — choose model, resolution, and generation settings
5. **Override per-shot** — customize parameters for specific shots
6. **Approve** — mark shots you're happy with
7. **Export ZIP** — filter and export a `queue.zip` for Wan2GP
8. **Generate** — load the zip into Wan2GP and render
9. **Import videos** — browse to output folder or set a watch folder for auto-import
10. **Compare & iterate** — use Compare Takes to A/B test, promote the best, re-export if needed
11. **Lock** — bake finished shots to exclude from future renders

---

## GitHub

Repository: [github.com/hoodtronik/TronikSlate](https://github.com/hoodtronik/TronikSlate)

---

## License

MIT
