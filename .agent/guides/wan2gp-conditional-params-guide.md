# wan2gp Conditional Parameter Dependencies — Deep Reference

## Architecture

wan2gp processes render tasks through a validation pipeline before any GPU work begins:

```
_build_task() → process_tasks_cli() → validate_task() → validate_settings() → generate_video()
```

`validate_task()` (wgp.py ~L7252) merges `primary_settings` with task params before validation. If any check fails, it returns `None` and the task is silently skipped.

## The validate_settings Contract

Located at `wgp.py:642`. Key validation blocks and their dependencies:

### Reference Images (L895-900)
```python
if "I" in video_prompt_type:
    if image_refs == None or len(image_refs) == 0:
        gr.Info("You must provide at least one Reference Image")
        return ret()  # ← Task skipped
```

This is the most common trap: setting `video_prompt_type: "I"` globally makes **every** render require `image_refs`, even character generation (Step 2) where no reference exists yet.

### Lora Validation (L772-776)
```python
if len(activated_loras) > 0:
    error = check_loras_exist(model_type, activated_loras)
    if len(error) > 0:
        return ret()
```

Lora URLs must be valid HuggingFace paths. Wrong lora for a model variant can also fail here.

## The primary_settings Leakage Problem

### How validate_task Works
```python
def validate_task(task, state):
    inputs = primary_settings.copy()   # 1. Main UI state (ALL keys present)
    inputs.update(params)              # 2. Our task params (sparse)
```

`primary_settings` is loaded from `models/_settings.json` at startup — it contains **whatever the user last used** in the main wan2gp UI. This means:
- If they used `video_prompt_type: "I"` → it persists
- If they used `audio_prompt_type: "A"` → it persists
- Any field we don't explicitly set inherits from the last UI session

### Why setdefault Doesn't Work
```python
# ❌ BAD — setdefault only sets if key is MISSING
base.setdefault("video_prompt_type", "")  # Doesn't override existing "I"

# ✅ GOOD — direct assignment always clears
base["video_prompt_type"] = ""
```

Model defaults from `get_default_settings()` often already contain these keys with non-empty values, so `setdefault` is a no-op.

### The Complete Safe Default List
```python
# Force-zero ALL ref-mode params in _build_task
base["video_prompt_type"] = ""
base["image_prompt_type"] = ""
base["audio_prompt_type"] = ""
base["image_start"] = None
base["image_end"] = None
base["image_refs"] = None
base["video_source"] = None
base["video_guide"] = None
base["image_guide"] = None
base["audio_guide"] = None
base["audio_guide2"] = None
base["audio_source"] = None
base["custom_guide"] = None
base["video_mask"] = None
base["image_mask"] = None
```

These are applied BEFORE `sb_overrides` and `extra_params`, so when refs actually exist (Step 3), `extra_params` can re-set them.

## Correct Two-Layer Architecture

### Layer 1: IMAGE_MODEL_OVERRIDES (Always Safe)
Settings that don't create dependencies on other inputs:
- `num_inference_steps`, `guidance_scale`, `flow_shift`
- `sample_solver`, `image_mode`
- `activated_loras`, `loras_multipliers`, `lset_name`
- `embedded_guidance_scale`

### Layer 2: IMAGE_REF_OVERRIDES (Conditional)
Settings that **require** companion data to exist:
- `video_prompt_type` — requires `image_refs` or `video_source`
- `image_prompt_type` — can require `video_source`
- `remove_background_images_ref` — meaningless without refs
- `image_refs_relative_size` — meaningless without refs

### Application Pattern
```python
# In model_scanner.py
def get_image_model_overrides(model_id):   # Layer 1 — always
def get_image_ref_overrides(model_id):     # Layer 2 — with refs only

# In plugin.py _build_task — force-zero first
base["video_prompt_type"] = ""
base.update(get_image_model_overrides(model_type))  # always applied

# In plugin.py _queue_image_renders — conditional
if char_ref:
    extra["image_refs"] = [char_ref]
    extra.update(get_image_ref_overrides(image_model))  # only with refs
```

## Lora Path Convention by Model Family

| Model Family | Profile Path | Lora URL Pattern |
|---|---|---|
| `qwen_image_edit_20B` | `qwen\Lightning Qwen Edit v1.0 - 4 Steps.json` | `Qwen-Image-Edit-Lightning-4steps-V1.0-bf16.safetensors` |
| `qwen_image_20B` | `qwen\Lightning Qwen v1.0 - 4 Steps.json` | Same as edit |
| `qwen_image_2512_20B` | `qwen\Lightning Qwen Edit 2511 - 4 Steps.json` | `Qwen-Image-Edit-2511-Lightning-4steps-V1.0-bf16.safetensors` |
| `qwen_image_edit_plus_20B` | `qwen\Lightning Qwen Edit v1.0 - 4 Steps.json` | Same as base edit (v1.0) |
| `pi_flux2` | *(none)* | *(none — naturally 4-step)* |

## Debugging Checklist

1. **Check logs** — `logs/api/start.js/latest`
2. **Look for** `[SKIP] Task N failed validation` + `0.0s`
3. **Check `[_build_task]` debug line** — shows exact vpt/ipt/apt/refs/istart values
4. **If vpt/ipt/apt are non-empty when they shouldn't be** → leakage issue
5. **Cross-reference** — compare task params against `validate_settings` dependency table
