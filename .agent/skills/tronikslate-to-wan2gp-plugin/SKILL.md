---
name: tronikslate-to-wan2gp-plugin
description: Port a TronikSlate feature (React/Express/TypeScript) into a self-contained Wan2GP Python/Gradio plugin
---

# TronikSlate → Wan2GP Plugin

Systematic workflow for converting any TronikSlate feature into a standalone Wan2GP plugin that drops into `app/plugins/<name>/` and has its own git repo.

## When to Use

- A TronikSlate feature (React UI + Express route) should be portable to Wan2GP standalone
- You want the feature to work without TronikSlate being running
- The feature needs to interact with Wan2GP's own render queue, model selection, or gallery

## Pre-flight Checklist

Before writing a single line, tick all of these:

- [ ] Read `F:\pinokio\api\wan.git\app\plugins\wan2gp-sample\plugin.py` for the full plugin API
- [ ] Identify which Wan2GP **globals** the feature needs (see reference below)
- [ ] Identify which Wan2GP **components** the feature needs
- [ ] List all TypeScript source files to port and their Python equivalents
- [ ] Confirm the plugin will have **zero imports from TronikSlate**

## File Structure (Every Plugin)

```
<plugin-name>/           ← standalone git repo
├── __init__.py          ← empty, required
├── plugin.py            ← WAN2GPPlugin subclass, all Gradio UI
├── plugin_info.json     ← Wan2GP metadata
├── requirements.txt     ← pip deps (usually just httpx)
├── README.md            ← installation + API docs
└── <support>.py         ← ported logic files (one per TS source)
```

> [!IMPORTANT]
> The plugin folder is a **standalone git repo**, not a subfolder of wan.git or TronikSlate. Initialize with `git init` in the plugin folder.

## TypeScript → Python Porting Map

| TronikSlate pattern | Python equivalent |
|---|---|
| `express Router` + route handlers | Functions called from Gradio event handlers |
| `interface` / `type` | `@dataclass` in Python |
| `localStorage` / Zustand store | `gr.State` dict + optional JSON file autosave |
| `fetch('/api/...')` | `httpx.Client` or `requests` |
| `async/await` in routes | Sync Python functions (Gradio handles async) |
| `React component` | `gr.Column`, `gr.Row`, `gr.Group` blocks |
| `useState` / `useRef` | `gr.State` + component references stored as `self.*` |
| Named ES6 exports | Module-level functions |
| `JSON.parse` + try/catch | `json.loads` + `try/except` |
| `res.json(...)` | `return value` from Gradio handler |

## Step-by-Step

### 1. Identify Feature Boundaries

List every TS file involved. For each one, answer:
- Is it **UI** (React)? → Port to `plugin.py` Gradio blocks
- Is it **business logic** (route handler, util)? → Port to a separate `.py` file
- Is it **data/config** (interfaces, constants)? → Port to a dataclass or plain dict

### 2. Set Up Plugin Boilerplate

```python
from shared.utils.plugins import WAN2GPPlugin
import gradio as gr

class MyPlugin(WAN2GPPlugin):
    def setup_ui(self):
        # 1. Request globals you need
        self.request_global("set_model_settings")
        self.request_global("get_default_settings")
        self.request_global("server_config")
        # 2. Request components you need
        self.request_component("state")
        self.request_component("main_tabs")
        self.request_component("refresh_form_trigger")
        # 3. Register tab
        self.add_tab(tab_id="my_plugin", label="My Plugin",
                     component_constructor=self.create_ui)

    def create_ui(self):
        with gr.Blocks() as blocks:
            # your Gradio UI here
            pass
        return blocks
```

### 3. Available Globals Reference

Request these with `self.request_global("name")`, then call as `self.name(...)`:

| Global | What it does |
|---|---|
| `get_current_model_settings` | Read current model's active settings dict |
| `set_model_settings` | Push a params dict to the render queue |
| `get_default_settings` | Get clean defaults for a model ID |
| `get_model_def` | Get model metadata (architecture, URLs, etc.) |
| `server_config` | Dict with `save_path`, `image_save_path`, etc. |
| `generate_dropdown_model_list` | Returns list of installed model names |
| `add_to_sequence` | Add a video to the sequence editor |
| `get_video_info` | `(fps, width, height, frames)` for a video file |
| `get_video_frame` | Extract a PIL Image from a video at a frame number |
| `has_video_file_extension` | Check if filename is a video |
| `has_image_file_extension` | Check if filename is an image |

### 4. Available Components Reference

Request with `self.request_component("name")`, then use as `self.name`:

| Component | Type | Use for |
|---|---|---|
| `state` | `gr.State` | Wan2GP's main session state |
| `main_tabs` | `gr.Tabs` | Navigate to main tabs (e.g., `gr.Tabs(selected="video_gen")`) |
| `refresh_form_trigger` | `gr.Number` | Pulse `time.time()` to trigger a re-render |
| `image_start` | `gr.Image` | Set start reference image for generation |
| `image_end` | `gr.Image` | Set end reference image |
| `image_prompt_type_radio` | `gr.Radio` | Set prompt type ("S", "E", "SE") |
| `model_family` | `gr.Dropdown` | Current model family selector |
| `model_choice` | `gr.Dropdown` | Current model choice selector |
| `plugin_data` | `gr.State` | Shared dict across plugins |

### 5. Queuing a Render

To trigger a video render from your plugin:

```python
import time

def queue_render(self, wan2gp_state, prompt, model_id, frames, resolution):
    defaults = self.get_default_settings(model_id)
    params = {
        **defaults,
        "model_type": model_id,
        "base_model_type": model_id,
        "prompt": prompt,
        "video_length": frames,
        "resolution": resolution,
        "seed": -1,
    }
    self.set_model_settings(wan2gp_state, params)
    # Return time.time() to the refresh_form_trigger output
    return time.time()
```

```python
# Wire it:
my_button.click(
    fn=self.queue_render,
    inputs=[self.state, prompt_box, ...],
    outputs=[self.refresh_form_trigger],
)
```

### 6. LTX-2 Frame Snapping

Always snap frames to `8n+1` for LTX-2:

```python
def snap_to_8n1(frames: int) -> int:
    if frames <= 17:
        return 17
    n = round((frames - 1) / 8)
    return max(17, n * 8 + 1)

def duration_to_frames(seconds: float, fps=24, is_ltx=False) -> int:
    raw = max(1, round(seconds * fps))
    return snap_to_8n1(raw) if is_ltx else raw
```

### 7. plugin_info.json

```json
{
  "name": "My Plugin",
  "author": "yourhandle",
  "version": "1.0.0",
  "description": "Short description",
  "date": "YYYY-MM-DD",
  "wan2gp_version": "2.52+"
}
```

### 8. Standalone Repo Init

```powershell
# Copy finished plugin folder to its own location first
git -C <plugin-folder> init
git -C <plugin-folder> add .
git -C <plugin-folder> commit -m "feat: initial <name> plugin"
# Then push to GitHub
gh repo create hoodtronik/<name>-wan2gp --private --source=<plugin-folder> --push
```

## Self-Containment Checklist (Exit Gate)

Before calling the plugin done:

- [ ] `grep -r "TronikSlate" .` returns nothing
- [ ] All imports are from stdlib, pip packages, or `shared.utils.plugins`
- [ ] `requirements.txt` lists every non-stdlib dep
- [ ] `plugin_info.json` present
- [ ] `README.md` has install instructions and API examples
- [ ] `__init__.py` present (even if empty)
- [ ] Standalone git repo initialized with initial commit
