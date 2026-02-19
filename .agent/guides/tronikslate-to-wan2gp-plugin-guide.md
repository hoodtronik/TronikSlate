# TronikSlate → Wan2GP Plugin Guide

Deep-reference companion for the `tronikslate-to-wan2gp-plugin` skill. Use when porting TronikSlate features or debugging plugin integration issues.

---

## Wan2GP Plugin System Architecture

```
app/
└── plugins/
    └── <your-plugin>/
        ├── plugin.py          ← Must define one class inheriting WAN2GPPlugin
        └── ...

wan2gp startup:
  1. Scans app/plugins/*/plugin.py
  2. Imports each, finds WAN2GPPlugin subclass
  3. Calls plugin.setup_ui() during Gradio build phase
  4. Injects requested globals + components into plugin instance
```

### Key Timing Constraint

> [!WARNING]
> `setup_ui()` runs at **Gradio build time**, before any user interaction. Do NOT call globals (like `generate_dropdown_model_list`) inside `setup_ui()`. Call them only inside event handler functions that run after the UI is loaded.

---

## Global Injection Deep Dive

When you call `self.request_global("foo")`, Wan2GP binds `self.foo` to the actual function or object from its own namespace. This happens after `setup_ui()` returns.

```python
# After setup_ui, self.get_default_settings is callable:
defaults = self.get_default_settings("ltx2_distilled")
# Returns a dict like: {"video_length": 97, "resolution": "832x480", ...}

# self.server_config is a dict, not a function:
save_path = self.server_config.get("save_path", "outputs")
```

### Globals That Are Dicts (not functions)

| Global | Access pattern |
|---|---|
| `server_config` | `self.server_config["save_path"]` |
| `args` | `self.args.output_dir` |

### Globals That Are Functions

All others — call with `self.foo(...)`.

---

## set_model_settings Deep Dive

This is the core render-queue integration point.

```python
# Signature (approximate):
set_model_settings(state: dict, settings: dict) -> None
```

The `settings` dict you pass **merges into** the current model settings. Keys not in the dict are left unchanged. So:

```python
# SAFE: only override what you need
params = {
    **self.get_default_settings(model_id),   # Start from clean defaults
    "prompt": "your prompt",
    "video_length": 97,
}
self.set_model_settings(wan2gp_state, params)
```

After calling `set_model_settings`, you must pulse `refresh_form_trigger` to tell the Gradio form to reload and queue:

```python
# Return time.time() to refresh_form_trigger output
return time.time()
```

### Required Fields

Always include:
- `"model_type"` — matches the model's ID string
- `"base_model_type"` — same as model_type for most cases
- `"prompt"` — the video generation prompt

### Optional But Useful

```python
{
    "video_length": 97,          # Frame count (int)
    "resolution": "832x480",     # WxH string
    "seed": -1,                  # -1 = random
    "image_start": "/path.jpg",  # Reference image path (str)
    "guidance_scale": 5.0,
    "sample_steps": 30,
}
```

---

## Tab Navigation

To switch back to the main video tab after queuing a render:

```python
return gr.Tabs(selected="video_gen")  # output to self.main_tabs
```

Other tab IDs:
- `"video_gen"` — main generation form
- `"gallery_tab"` — gallery plugin (if installed)
- Your plugin's ID — whatever you passed to `add_tab(tab_id=...)`

---

## on_tab_select / on_tab_deselect Hooks

Your plugin can react to tab switches:

```python
def on_tab_select(self, state: dict) -> any:
    """Called when user clicks your tab. Return value goes to on_tab_outputs."""
    settings = self.get_current_model_settings(state)
    return settings["prompt"]   # populates a textbox

def on_tab_deselect(self, state: dict) -> None:
    """Called when user leaves your tab."""
    pass
```

Wire outputs:
```python
self.on_tab_outputs = [my_textbox]  # must be set inside create_ui()
```

---

## GPU Lock Pattern

If your plugin does its own GPU-intensive work (not using Wan2GP's queue), use the process lock pattern from `wan2gp-sample`:

```python
from shared.utils.process_locks import acquire_GPU_ressources, release_GPU_ressources, any_GPU_process_running

PLUGIN_ID = "MyPlugin"

def my_gpu_task(self, state):
    if any_GPU_process_running(state, PLUGIN_ID):
        gr.Error("Another plugin is using the GPU")
        return
    acquire_GPU_ressources(state, PLUGIN_ID, "My Plugin", gr=gr)
    try:
        # ... do GPU work ...
        pass
    finally:
        release_GPU_ressources(state, PLUGIN_ID)
```

> [!IMPORTANT]
> Only use GPU lock if your plugin directly loads models or runs inference outside of Wan2GP's queue. If you're using `set_model_settings` + `refresh_form_trigger`, Wan2GP handles GPU locking internally.

---

## Gradio State vs. Session State

| Approach | When to use |
|---|---|
| `gr.State` dict | Per-user session data within a single server run |
| JSON file autosave | Persist data across server restarts |
| `self.server_config["save_path"]` | For save paths — always use Wan2GP's configured value |

### JSON Autosave Pattern

```python
import json, os, time

SAVE_PATH = os.path.join(os.path.dirname(__file__), ".session.json")

def save(data: dict):
    with open(SAVE_PATH, "w") as f:
        json.dump(data, f)

def load() -> dict:
    if not os.path.exists(SAVE_PATH):
        return {}
    with open(SAVE_PATH) as f:
        return json.load(f)
```

---

## Common Porting Mistakes

| Mistake | Fix |
|---|---|
| Calling globals in `setup_ui()` | Move to event handlers only |
| Importing from TronikSlate | Port all needed logic into plugin files |
| Using absolute paths in `shell.run` | Not applicable — this is Python, use `os.path.join` |
| Assuming Gradio updates fire synchronously | They don't — use `gr.update()` returns properly |
| Forgetting `return blocks` at end of `create_ui()` | Always return the `gr.Blocks()` context |
| Using `gr.Tabs(selected=...)` without `main_tabs` component | Must `request_component("main_tabs")` first |
| Forgetting `__init__.py` | Plugin won't be importable as a package |

---

## LTX-2 Specifics

### Frame Snapping

LTX-2 requires `video_length = 8n+1` (17, 25, 33, ..., 241). Failing to snap causes truncated video or generation errors.

```python
def snap_to_8n1(frames: int) -> int:
    if frames <= 17: return 17
    return max(17, round((frames - 1) / 8) * 8 + 1)
```

### Audio Prompt Injection

LTX-2 generates audio from the text prompt. Always append `"Audio: ..."` to video prompts:

```
"A woman walks through a rainy street. Audio: rain on pavement, distant traffic, ambient piano."
```

If using Ollama for prompt generation, inject this instruction into the refinement system prompt via `prompt_guides.py`.

---

## Verification Checklist

Before declaring a plugin done:

- [ ] `grep -r "TronikSlate\|tronikslate" .` in plugin folder returns nothing
- [ ] `grep -r "import" plugin.py` — all imports are stdlib, gradio, httpx, or local `.module`
- [ ] `requirements.txt` accurate
- [ ] `plugin_info.json` valid JSON
- [ ] `__init__.py` exists
- [ ] `README.md` has: what it does, install steps, API usage
- [ ] Plugin folder is its own git repo with at least one commit
- [ ] Tested: tab appears in Wan2GP after enabling plugin
- [ ] Tested: render queue integration (set_model_settings + refresh_form_trigger) produces a queued job
