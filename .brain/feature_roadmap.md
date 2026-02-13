# BytecutDirector V2 — Session Notes & Handoff

> Last updated: 2026-02-13 morning session

---

## Handoff Prompt for New Instance

Copy-paste this to a new conversation to get caught up:

---

> **Project:** BytecutDirector V2 — a music-video storyboarding and AI video generation pipeline.
>
> **Location:** `f:\pinokio\api\BytecutDirectorV2\` (Pinokio launcher root), `f:\pinokio\api\BytecutDirectorV2\app\` (React + Express submodule).
>
> **Read these files first to get full context:**
> 1. `C:\Users\Animation\.gemini\antigravity\brain\c5e1642f-311a-48df-af53-9848826c17b9\feature_roadmap.md` — Full architecture map, data model, feature status, remaining ideas
> 2. `f:\pinokio\api\BytecutDirectorV2\app\src\types\project.ts` — All TypeScript types (Shot, Section, Project, etc.)
> 3. `f:\pinokio\api\BytecutDirectorV2\app\src\stores\projectStore.ts` — Main state store (1273 lines, all CRUD operations)
> 4. `f:\pinokio\api\BytecutDirectorV2\app\src\App.tsx` — Main layout with ErrorBoundary wrappers
>
> **What's been built (20+ features across 6 batches):**
> Headless render, project archives, auto-import watcher, NLE XML export, timeline trims, bake shots, audio source toggle, section duplication, shot duplication, server audio crop, attempts per shot, global hints (31 tooltips), batch parameter sweeps, prompt library categories, storyboard PDF export, render dashboard, 14 keyboard shortcuts, error boundaries, drag-to-reorder, token counter.
>
> **Remaining ideas (pick any):**
> - Shot Dependency Chains — link outputs of one shot as inputs to another
> - Character/Subject Consistency Tracker — track subjects across shots for coherence
> - ShotEditor refactor — split the 441-line monolith into focused sub-components
> - A/B Comparison View — side-by-side render comparison
> - Any new feature the user requests
>
> **Tech stack:** React 18 + Zustand stores + Express backend, runs inside Pinokio. AI video gen via Wan2GP (separate repo at `f:\pinokio\api\wan.git`).
>
> **Git state:** app submodule on `main`, ~28 commits ahead of origin. All work committed.

---

## Architecture

```
app/
├── server/           # Express backend
│   ├── index.ts      # Main entry, mounts all routes
│   └── routes/       # project, images, audio, models, assemble, nle, render, rawvideos, watcher
├── src/
│   ├── App.tsx             # Layout + ErrorBoundary wrappers (9 panels)
│   ├── stores/
│   │   ├── projectStore.ts   # Projects, sections, shots, takes (1273 lines)
│   │   ├── uiStore.ts        # Panels, view mode, hints
│   │   ├── presetStore.ts    # Prompt library presets (categories, localStorage)
│   │   └── modelStore.ts     # Wan2GP model list
│   ├── types/project.ts      # All type defs
│   ├── components/
│   │   ├── Layout/           # Toolbar, ErrorBoundary, WelcomeScreen, RenderDashboard
│   │   ├── Storyboard/       # Storyboard, ShotCard, SortableShotCard (@dnd-kit drag)
│   │   ├── Timeline/         # Timeline (horizontal track view)
│   │   ├── ShotEditor/       # ShotEditor, PromptLibrary, TokenCounter, ParamsEditor, etc.
│   │   ├── Export/           # ExportPanel (queue builder + sweep params)
│   │   ├── ImageManager/     # Bulk image management
│   │   └── ui/               # Hint (tooltip system)
│   ├── hooks/
│   │   ├── useKeyboardShortcuts.ts  # 14 shortcuts
│   │   └── useAutoImport.ts
│   └── utils/                # api, time, storyboardPdf
```

## Key Data Model

```
Project → sections: Section[] → shots: Shot[]
Shot: id, name, type:'solo'|'multi', startTime, endTime, prompt, negativePrompt,
      refImages[], endRefImages[], audioFile?, videoFiles?, controlVideoFile?,
      params?, approved?, baked?, renderStatus?, attempts?, trimIn?, trimOut?
```

## Keyboard Shortcuts (14 total)
| Key | Action |
|-----|--------|
| Ctrl+S | Save |
| Ctrl+Z | Undo |
| Ctrl+Y / Ctrl+Shift+Z | Redo |
| N | New shot after selected |
| D | Duplicate selected shot |
| A | Approve/unapprove |
| Delete | Remove shot |
| ↑/↓ | Navigate shots |
| 1/2 | Storyboard/Timeline view |
| ? | Toggle hints |
| Esc | Close side panels |

## Git Commits (this session)
- `15d8389` — Batch sweeps, categories, PDF, hints, attempts, cleanup (33 files, +4082/-540)
- `fb6ef8d` — Shot duplicate button in ShotCard
- `d5ac7a8` — RenderDashboard + enhanced keyboard shortcuts
- Parent refs: `abe89ab`, `aefb783`, `ea7812a`
