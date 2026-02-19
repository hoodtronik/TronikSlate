---
name: gradio-group-visibility
description: Fix Gradio gr.Group visibility — you must store the Group object and update the Group directly, not its children.
---

## Problem

When building dynamic Gradio UIs where you want to show/hide a block of components (e.g. a "shot card" that contains a textbox, image, and label), a common mistake is to only change the visibility of the **children** (`gr.Textbox`, `gr.Image`, etc.) and not the **container Group itself**.

This produces the bug: the group stays visible even when you set `visible=False` on the children, because the `gr.Group` wrapper is still rendered.

The reverse also happens: you call `.change()` to update a textbox inside a group, but the user sees no change because the group container is hidden and the textbox update is lost.

## Root Cause

Gradio `gr.Group` (and `gr.Column`, `gr.Row`) are **independent components** with their own state. Updating a child does **not** update the parent container's visibility, and vice versa.

```python
# ❌ WRONG — saves group as local variable, immediately discarded
for i in range(MAX_SHOTS):
    with gr.Group(visible=False) as grp:   # grp is thrown away after the loop body
        beat_box = gr.Textbox(...)
        self.sb_shot_beats.append(beat_box)

# Wiring only updates the textbox, not the group — cards never appear/disappear
self.sb_shot_count.change(
    fn=self._update_shot_visibility,
    inputs=[self.sb_shot_count],
    outputs=self.sb_shot_beats,           # ❌ only the children, not the containers
)
```

## Fix

Store every `gr.Group` reference in a list on `self`, then wire `.change()` to that list of groups:

```python
# ✅ CORRECT — store each group
self.sb_shot_groups: list[gr.Group] = []
self.sb_shot_beats: list[gr.Textbox] = []

for i in range(MAX_SHOTS):
    with gr.Group(visible=(i < default_count), elem_id=f"shot-card-{i}") as grp:
        beat_box = gr.Textbox(...)
        self.sb_shot_groups.append(grp)   # ✅ keep the reference
        self.sb_shot_beats.append(beat_box)

# Wire to the groups, not the children
self.sb_shot_count.change(
    fn=self._update_shot_visibility,
    inputs=[self.sb_shot_count],
    outputs=self.sb_shot_groups,          # ✅ update the containers
)
```

```python
def _update_shot_visibility(self, shot_count):
    n = int(shot_count)
    return [gr.update(visible=(i < n)) for i in range(MAX_SHOTS)]
```

## Checklist

- [ ] Every `gr.Group` / `gr.Column` / `gr.Row` that needs dynamic visibility is stored in a list on `self`
- [ ] `.change()` / `.click()` outputs list is the **group list**, not the child component list
- [ ] Handler returns `[gr.update(visible=...) for i in range(MAX)]` — one update per group
- [ ] Initial `visible=` value on the Group itself is set correctly at build time

## Applies To

- Any Gradio UI with a dynamic number of visible cards (shot grids, character slots, step panels)
- Any Gradio component that has conditional sections toggled by a radio, slider, or checkbox
- `gr.Group`, `gr.Column`, `gr.Row`, `gr.Tab`, `gr.Accordion`
