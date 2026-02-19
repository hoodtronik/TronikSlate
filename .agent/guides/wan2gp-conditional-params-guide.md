# wan2gp Conditional Parameter Dependencies — Deep Reference

## Architecture

wan2gp processes render tasks through a validation pipeline before any GPU work begins:

```
_build_task() → process_tasks_cli() → validate_task() → validate_settings() → generate_video()
```

`validate_task()` (wgp.py ~L7252) merges `primary_settings` with task params, then calls `validate_settings()` which performs ~40 checks. If any check fails, it returns `None` and the task is silently skipped.

## The validate_settings Contract

Located at `wgp.py:642`. Key validation blocks and their dependencies:

### Reference Images (L895-900)
```python
if "I" in video_prompt_type:
    if image_refs == None or len(image_refs) == 0:
        gr.Info("You must provide at least one Reference Image")
        return ret()  # ← Task skipped
    image_refs = clean_image_list(image_refs)
```

This is the most common trap: setting `video_prompt_type: "I"` globally makes **every** render require `image_refs`, even character generation (Step 2) where no reference exists yet.

### Lora Validation (L772-776)
```python
if len(activated_loras) > 0:
    error = check_loras_exist(model_type, activated_loras)
    if len(error) > 0:
        return ret()  # ← Task skipped if lora file/URL is invalid
```

Lora URLs must be valid HuggingFace paths. Wrong lora for a model variant (e.g., v1.0 lora on a 2511 model) can also fail here because the lora architecture doesn't match.

### Model-Specific Validation (L684-689)
```python
if hasattr(model_handler, "validate_generative_prompt"):
    error = model_handler.validate_generative_prompt(model_type, model_def, inputs, one_prompt)
    if error is not None:
        return ret()
```

Some model handlers have their own prompt validation. Check the handler's source if lora and ref checks pass.

## Where Settings Come From

The merge order in `validate_task()`:
```python
inputs = primary_settings.copy()   # 1. Main UI state (all keys present)
inputs.update(params)              # 2. Task params (our overrides)
inputs['prompt'] = task.get('prompt', '')
```

This means our task params override primary_settings. If we set `video_prompt_type: "I"` in params, it replaces whatever the UI had.

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

# In plugin.py _build_task
base.update(get_image_model_overrides(model_type))  # always applied

# In plugin.py _queue_image_renders
if char_ref:
    extra["image_refs"] = [char_ref]
    extra.update(get_image_ref_overrides(image_model))  # conditional
```

## Lora Path Convention by Model Family

| Model Family | Profile Path | Lora URL Pattern |
|---|---|---|
| `qwen_image_edit_20B` | `qwen\Lightning Qwen Edit v1.0 - 4 Steps.json` | `Qwen-Image-Edit-Lightning-4steps-V1.0-bf16.safetensors` |
| `qwen_image_20B` | `qwen\Lightning Qwen v1.0 - 4 Steps.json` | Same as edit |
| `qwen_image_2512_20B` | `qwen\Lightning Qwen Edit 2511 - 4 Steps.json` | `Qwen-Image-Edit-2511-Lightning-4steps-V1.0-bf16.safetensors` |
| `qwen_image_edit_plus_20B` | `qwen\Lightning Qwen Edit 2511 - 4 Steps.json` | Same as 2512 |
| `pi_flux2` | *(none)* | *(none — naturally 4-step)* |
| `flux2_klein_9b` | *(none)* | *(none — naturally low-step)* |

Profile files live in `app/profiles/`. Lora files in `app/loras/` (or auto-downloaded from HuggingFace URLs).

## Debugging Checklist

1. **Check logs** — `logs/api/start.js/latest`
2. **Look for** `[SKIP] Task N failed validation` + `0.0s`
3. **If found** → parameter dependency issue (this guide)
4. **If not found** → actual generation error (check terminal output)
5. **Reproduce** — check what `_build_task` returns by adding `print(json.dumps(task, indent=2, default=str))`
6. **Cross-reference** — compare task params against `validate_settings` checks
