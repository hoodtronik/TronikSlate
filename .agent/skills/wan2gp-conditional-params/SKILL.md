---
name: wan2gp-conditional-params
description: Fix wan2gp task validation failures caused by parameters that implicitly require other parameters to be set
---

# wan2gp Conditional Parameter Dependencies

## When to Use

A render task is **immediately skipped** with `[SKIP] Task N failed validation` and zero GPU time. The log shows `Queue completed: 0/N tasks in 0.0s (N skipped)`.

## Root Cause Pattern

`validate_settings()` in `wgp.py` has **implicit parameter dependencies**:

| If you set… | …it requires… | Validation line |
|---|---|---|
| `video_prompt_type` contains `"I"` | `image_refs` non-empty list | ~L895 |
| `video_prompt_type` contains `"V"` | `video_source` non-null | ~L855 |
| `video_prompt_type` contains `"F"` | `frames_positions` valid | ~L819 |
| `audio_prompt_type` contains `"A"` | `audio_guide` non-null | ~L864 |
| `audio_prompt_type` contains `"K"` | `"V"` in `video_prompt_type` | ~L806 |
| `image_prompt_type` contains `"V"` | `video_source` non-null | ~L854 |
| `self_refiner_setting != 0` | valid `self_refiner_plan` | ~L756 |

## Fix Checklist

1. **Read the log** — look for `[SKIP] Task N failed validation`
2. **Identify the guilty parameter** — check which override is set globally
3. **Split into two layers:**
   - **Always-safe overrides** — speed settings, lora, guidance, steps
   - **Conditional overrides** — ref-mode params, applied only when the required companion data exists
4. **Apply conditional overrides at the call site**, not in global defaults

## Example: The image_refs Trap

```python
# ❌ BAD — fails when no char_ref exists (Step 2 character gen)
IMAGE_MODEL_OVERRIDES = {
    "qwen_image_edit_20B": {
        "num_inference_steps": 4,
        "video_prompt_type": "I",  # ← requires image_refs!
    },
}

# ✅ GOOD — split into unconditional + conditional
IMAGE_MODEL_OVERRIDES = {
    "qwen_image_edit_20B": {
        "num_inference_steps": 4,   # always safe
    },
}
IMAGE_REF_OVERRIDES = {
    "qwen_image": {
        "video_prompt_type": "I",   # only when image_refs provided
        "remove_background_images_ref": 1,
    },
}

# Apply ref overrides ONLY when we have a reference:
if char_ref:
    extra["image_refs"] = [char_ref]
    extra.update(get_image_ref_overrides(model_id))
```

## Example: The `primary_settings` Leakage Trap

Even after removing the guilty param from overrides, it can STILL fail.

`validate_task()` at wgp.py ~L7260 does:
```python
inputs = primary_settings.copy()   # ← last main-UI state!
inputs.update(params)              # ← our task params
```

`primary_settings` is loaded from `models/_settings.json` at startup, containing **whatever the user last used** in the main wan2gp UI. If they set `video_prompt_type: "I"` in the main UI, it persists and leaks into every Smooth Brain task that doesn't explicitly override it.

**Fix:** In `_build_task`, explicitly zero out ALL ref-mode params with `setdefault`:
```python
base.setdefault("video_prompt_type", "")
base.setdefault("image_prompt_type", "")
base.setdefault("audio_prompt_type", "")
base.setdefault("image_start", None)
base.setdefault("image_refs", None)
base.setdefault("video_source", None)
# ... all guide/mask/audio fields too
```

These safe defaults can still be overridden by `extra_params` when refs actually exist.

## Quick Diagnosis

```
Log says "failed validation" + 0.0s → parameter dependency issue
Log says error after loading model → actual generation failure
Log says nothing / hangs → model loading or OOM issue
```
