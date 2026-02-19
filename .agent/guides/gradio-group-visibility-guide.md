---
description: Gradio gr.Group visibility — must store and update the Group, not its children
---

## Background

Discovered while fixing the Smooth Brain plugin's shot count radio. Changing the shot count should show/hide shot cards, but cards stayed visible regardless because the `gr.Group` containers were created as local variables and discarded.

## The Rule

> **In Gradio, updating a child component does NOT affect the parent container's visibility. You must store every `gr.Group` (or `gr.Column`/`gr.Row`) that needs dynamic show/hide, and wire your events to update the container directly.**

## Pattern: Dynamic Card Grid

```python
# Build phase — store groups
self.card_groups: list[gr.Group] = []
for i in range(MAX):
    with gr.Group(visible=(i < default_n)) as grp:
        gr.Textbox(...)
        self.card_groups.append(grp)    # ← critical

# Wire phase — update groups, not children
count_radio.change(
    fn=lambda n: [gr.update(visible=(i < int(n))) for i in range(MAX)],
    inputs=[count_radio],
    outputs=self.card_groups,           # ← update the containers
)
```

## Common Mistakes

| Mistake | Symptom |
|---|---|
| Only store child components (textboxes) | Cards stay visible / never hide |
| Wire `.change()` to child outputs | Count changes but cards don't appear |
| `gr.Group` created inside loop body without storing | AttributeError or stale state on second render |
| Setting `visible` on children instead of group | Group border visible but contents hidden weirdly |

## Gradio Components This Applies To

`gr.Group`, `gr.Column`, `gr.Row`, `gr.Tab`, `gr.Accordion`, `gr.Box`

## Reference

- Source: `smooth_brain/plugin.py` — `_build_step1()` + `_update_shot_visibility()`
- Skill: `.agent/skills/gradio-group-visibility/SKILL.md`
