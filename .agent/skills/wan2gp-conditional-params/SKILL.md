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

## Two Sources of Leakage

### Source 1: Model Override Dicts
Setting ref-mode params in global `IMAGE_MODEL_OVERRIDES` causes them to apply everywhere, even when no refs exist.

### Source 2: primary_settings Leakage (Most Insidious)
`validate_task()` at wgp.py ~L7260 does:
```python
inputs = primary_settings.copy()   # ← last main-UI state!
inputs.update(params)              # ← our task params
```
`primary_settings` is loaded from `models/_settings.json` at startup. If the user previously set `video_prompt_type: "I"` in the main UI, it persists and leaks into every plugin task that doesn't explicitly override it.

**IMPORTANT:** `setdefault()` does NOT fix this — model defaults from `get_default_settings()` may already contain non-empty values. You must use **direct assignment** (`base["key"] = value`).

## Fix Checklist

1. **Read the log** — look for `[SKIP] Task N failed validation`
2. **Check your task params** — add debug print to dump `video_prompt_type`, `image_refs`, etc.
3. **Force-zero ALL ref-mode params** in `_build_task` with direct assignment:
   ```python
   base["video_prompt_type"] = ""
   base["image_prompt_type"] = ""
   base["audio_prompt_type"] = ""
   base["image_start"] = None
   base["image_refs"] = None
   base["video_source"] = None
   # ...all guide/mask/audio fields
   ```
4. **Split overrides into two layers:**
   - **Always-safe** (IMAGE_MODEL_OVERRIDES) — speed/lora settings
   - **Conditional** (IMAGE_REF_OVERRIDES) — applied only when refs exist
5. **Apply conditional overrides at the call site** via `extra_params`

## Quick Diagnosis

```
Log says "failed validation" + 0.0s → parameter dependency issue (this skill)
Log says error after loading model → actual generation failure
Log says nothing / hangs → model loading or OOM issue
```
