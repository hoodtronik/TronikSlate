# ByteCut Director — User Guide

ByteCut Director is an AI video pre-production tool that lets you plan, organize, and export video generation jobs for **Wan2GP**. Think of it as a storyboard and shot-list manager that outputs a ready-to-render queue.

---

## Getting Started

### Creating a Project

When you launch ByteCut Director you'll see the **Welcome Screen**:

- **Create New Project** — Click, type a name, and hit Enter. A blank project opens with one default section.
- **Load Existing Project** — Click to reveal saved projects. Click any project to open it, or delete ones you no longer need.

---

## The Toolbar

The toolbar runs along the top of the screen. From left to right:

| Button | What It Does |
|---|---|
| **←** | Return to the Welcome Screen (project selector) |
| **Project Name** | Displays your project name and shot/image counts |
| **Storyboard / Timeline** | Toggle between the two main views (see below) |
| **Images** | Opens the Image & Audio Manager side panel |
| **Track** | Opens the Audio Cropper for trimming audio clips |
| **Params** | Opens the Global Generation Params panel (model selector, resolution, etc.) |
| **Save** | Saves your project. Shows "Saving...", "Saved", or "Save Failed" |
| **Import Videos** | Opens the Video Import modal to bring generated videos back in |
| **Export ZIP** | Opens the Export panel to build a `queue.zip` for Wan2GP |

---

## Main Views

### Storyboard View

The **Storyboard** is your primary workspace. It shows your project as a grid of shot cards organized by **sections**.

#### Sections
- Each section is a logical grouping of shots (e.g. "Intro", "Chorus", "Bridge")
- **Double-click** a section name to rename it
- Use **↑ / ↓ arrows** to reorder sections
- Click **Delete** to remove a section (with confirmation)
- Click **+ Add Shot** to add a new shot to that section
- Click **+ Add Section** at the bottom to create a new section

#### Shot Cards
Each shot is displayed as a card showing:
- **Thumbnail** — the selected reference image (if assigned)
- **Shot name** and timing info
- **Type badge** — `SOLO` (single shot) or `MULTI` (multi-take shot)
- **Status dots** — small colored indicators in the top-right corner:
  - 🟢 **Image** — At least one reference image is assigned
  - 🟢 **Prompt** — A video generation prompt has been written
  - 🟠 **Audio** — An audio clip is attached

Click any shot card to open it in the **Shot Editor** panel on the right.

---

### Timeline View

The **Timeline** shows all sections and shots laid out on a horizontal time ruler, similar to a video editing timeline.

- Each section gets its own **horizontal lane** (color-coded)
- Shots appear as blocks positioned by their start/end times
- **Solo** shots are blue, **Multi** shots are amber
- Click any shot block to select it and open the Shot Editor

#### Zoom & Pan Controls
- **H slider** (horizontal zoom) — stretches/compresses the time axis
- **V slider** (vertical zoom) — makes the shot blocks taller/shorter
- **Ctrl + Scroll** — horizontal zoom
- **Shift + Scroll** — vertical zoom
- **Space + Drag** or **Middle-click drag** — pan around the timeline

When the vertical zoom is high enough, shot blocks will show:
- Reference image as background
- Shot name and timing labels
- Lyric text (if present)

---

## Shot Editor (Right Panel)

Click any shot (in either Storyboard or Timeline) to open the **Shot Editor**. It has two tabs: **Details** and **Params**.

### Details Tab

This is where you define what the shot looks like:

#### Name & Timing
- **Name** — Give the shot a descriptive name
- **Type** — `SOLO` (single output) or `MULTI` (multiple takes/variations)
- **Start / End** — Start and end times in seconds (used for timeline positioning)

#### Concept
If the shot was imported from a markdown script, the original concept text is shown here (read-only).

#### Lyric
An editable text field for the lyric or dialogue that plays during this shot.

#### Video Prompt
The main **generation prompt** — this is what gets sent to Wan2GP as the text prompt for video generation. Be descriptive about the scene, camera movement, lighting, and style you want.

#### Ref Image Prompt
A separate prompt field intended for generating the reference image itself (e.g., using Flux or SDXL). This is not sent to the video generator — it's a workspace for planning your ref images.

#### Reference Images
- The dashed box is a **drop zone** — drag images here from the Image Manager
- Click an image to **select** it (a red "SELECTED" badge appears) — the selected image is the one that gets used in export
- Click the **x** button on any image to remove it
- You can assign multiple images and switch between them

#### End Reference Images
Collapsible section for assigning an **end-frame** reference image. Some models (like image-to-video with Wan2GP) support specifying both a start and end frame. Same drag-and-drop workflow as regular reference images.

#### Audio
- Click **Upload Audio** to attach a `.wav`, `.mp3`, `.ogg`, or `.flac` file
- Or **drag** an audio file from the Image Manager's Audio tab
- Once attached, a waveform preview appears with playback controls
- Click **Remove** to detach the audio

#### Generated Video
If you've imported videos back (via Import Videos), they'll appear here:
- Video player with playback controls
- **Version navigation** (← v1/3 →) if the shot has multiple generated versions
- Click **Remove** to remove a specific version

#### Takes (Multi-shots only)
When a shot is set to `MULTI` type, a **Takes** section appears:
- Click **+ Add Take** to create variations
- Each take can have its own reference images, end images, and approval status
- Takes are exported as separate queue items

### Shot Actions
At the top of the Shot Editor:
- **+ Insert After** — inserts a new shot after this one
- **Duplicate** — clones the shot with all its data
- **Approve** — marks the shot as approved (amber highlight). Useful for filtering during export
- **Delete** — removes the shot (with confirmation)

---

### Params Tab (Per-Shot Overrides)

Switch to the **Params** tab to override generation parameters for this specific shot. Any parameter you change here will override the global default *only for this shot*.

- Overridden parameters appear in **red** text
- Click **reset** next to any parameter to revert it to the global default
- Common overrides: `video_length`, `guidance_scale`, `num_inference_steps`

---

## Image & Audio Manager (Side Panel)

Click **Images** in the toolbar to toggle this panel. It has two tabs:

### Images Tab
- **Upload** — Click to upload image files from your computer
- **Browse** — Navigate folders on your system to find images
- **Thumbnails** — All uploaded/browsed images appear as a grid of thumbnails
- **Drag to assign** — Drag any image onto a shot's reference image drop zone in the Shot Editor
- **Click to preview** — Click an image for a larger preview (lightbox)
- From the lightbox you can click **Assign to selected shot** to quickly assign it

### Audio Tab
- **Upload** — Upload audio files (`.wav`, `.mp3`, `.ogg`, `.flac`)
- **Library** — Shows all uploaded audio files
- **Drag to assign** — Drag any audio file onto the Shot Editor to attach it to the selected shot

---

## Audio Cropper (Track Panel)

Click **Track** in the toolbar to open the Audio Cropper. This lets you trim audio clips before assigning them to shots.

- **Upload or select** an audio file
- A **waveform visualization** appears
- Drag the **crop handles** on the waveform to set in/out points
- Use the **playback controls** to preview your selection
- Click **Crop & Save** to create a trimmed version that gets saved to your project's audio library

---

## Global Generation Params

Click **Params** in the toolbar to open the Global Params panel. These are the **default parameters** applied to every shot unless overridden per-shot.

### Model Selector (NEW)
At the top of the panel, the **Model** section lets you choose which video model to use:

1. **Family** — Pick a model family (Wan 2.2, LTX-2, HunyuanVideo 1.5, etc.)
2. **Model** — Pick a specific model variant within that family. Finetunes are marked with ⚡
3. **Model info** — Shows the architecture name and description

Changing models automatically updates the default parameters (steps, guidance scale, flow shift, etc.) to match that model's recommended settings.

> **Wan2GP Location** — At the bottom of the model section, click this to expand the path configuration. Point it to your Wan2GP `app/` folder if it's not auto-detected. A green dot means the path is valid.

### Quick Settings
- **Resolution** — Choose from preset resolutions grouped by aspect ratio
- **Video Length** — Number of frames to generate
- **Force FPS** — Frame rate for the output video
- **Duration preview** — Shows the calculated duration (frames / fps)

### Advanced Parameter Groups
Expandable sections for fine-tuning generation:
- **Core Generation** — `guidance_scale`, `num_inference_steps`, `flow_shift`, `seed`
- **Advanced** — `denoise_strength`, `enable_RIFLEx`, `stg_*` parameters, etc.
- **Other** — Any model-specific parameters

Parameters you've customized appear in **red**. Click **reset** to restore the default.

---

## Export ZIP

Click **Export ZIP** in the toolbar to build a queue for Wan2GP.

### Filtering
- **Content filter**: All / With Images / Ready (has both image + prompt)
- **Approval filter**: Any / Approved Only / Not Approved

### Selecting Shots
- Use checkboxes to select which shots to include
- **Select All / Deselect All** buttons for quick selection
- Each row shows status icons (📷 image, 📝 prompt, 🔊 audio, ✅ approved)

### Exporting
Click **Export Selected** to download a `queue.zip` file containing:
- `queue.json` — Array of generation tasks with all parameters, prompts, and model settings
- Referenced images and audio files bundled alongside

**This zip is what you upload to Wan2GP** to queue the generation jobs.

---

## Import Videos

Click **Import Videos** in the toolbar after Wan2GP has finished generating your videos.

### Browse Phase
- Navigate your file system to find the folder where Wan2GP saved the output videos
- The bottom bar shows how many `.mp4` / `.webm` files are in the current folder
- Click **Select This Folder** when you've found the right one

### Preview Phase
- ByteCut Director **automatically matches** video filenames to your shots
- Green dots = matched, gray dots = no match found
- Yellow section = unmatched video files that couldn't be assigned to any shot
- Click **Import** to bring the matched videos into your project

### After Import
- Imported videos appear in each shot's **Generated Video** section
- Multiple imports to the same shot create **versions** you can flip through
- Use **Clear All** in the header to remove all imported videos and start fresh

---

## Typical Workflow

1. **Create a project** and add sections + shots
2. **Upload reference images** via the Image Manager
3. **Drag images** onto each shot's reference image area
4. **Write prompts** for each shot in the Details tab
5. **Set global params** — choose your model and tweak settings
6. **Override per-shot** if certain shots need different settings
7. **Approve** shots you're happy with
8. **Export ZIP** — filter to approved/ready shots, export the queue
9. **Load the zip into Wan2GP** and generate
10. **Import Videos** back into ByteCut Director to review results
11. Iterate — adjust prompts, re-export, re-generate
