# TronikSlate Session Changes — Complete Implementation Guide

> All changes from this session, designed to be re-implemented by another Antigravity instance on the user's PC.

## Summary of Changes

| Change | Files |
|--------|-------|
| **Prebaked Shot Type** — new shot type for externally-generated videos | 9 files |
| **Wan2GP Renders rename** — "Imported" tab → "Wan2GP Renders" | 1 file |
| **Black thumbnail bug fix** — broken URL route in rendered tab | 1 file |

---

## Feature: Prebaked Shot Type

A **prebaked shot** holds externally-generated video. It auto-sets `baked: true` (excluded from render queue, included in assembly), uses the existing `shot.videoFiles[]` structure, and has a **teal** color theme throughout.

---

### 1. `app/src/types/project.ts` — Data Model

Find the `Shot` interface's `type` field:
```diff
-  type: 'solo' | 'multi';
+  /** Shot type: 'solo' = single generation, 'multi' = multiple takes, 'prebaked' = externally-generated video */
+  type: 'solo' | 'multi' | 'prebaked';
```

---

### 2. `app/src/index.css` — Badge Style

Add after existing badge classes (`.badge-solo`, `.badge-multi`):
```css
.badge-prebaked {
  @apply bg-teal-900/60 text-cyan-300 border border-teal-700/50;
}
```

---

### 3. `app/server/routes/videos.ts` — Server Import Endpoint

Add before `export default router`:
```typescript
router.post('/import', (req, res) => {
  const { projectId, externalPath } = req.body;
  if (!projectId || !externalPath) {
    return res.status(400).json({ error: 'projectId and externalPath required' });
  }
  const resolved = path.resolve(externalPath);
  if (!fs.existsSync(resolved)) {
    return res.status(404).json({ error: 'Source file not found' });
  }
  const dataDir = path.resolve(__dirname, '..', '..', 'data', 'projects', projectId);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const ext = path.extname(resolved);
  const baseName = path.basename(resolved, ext);
  const destName = `${baseName}_${Date.now()}${ext}`;
  const destPath = path.join(dataDir, destName);
  try {
    fs.copyFileSync(resolved, destPath);
    const relativePath = path.relative(path.resolve(__dirname, '..', '..'), destPath);
    res.json({ localPath: destPath, relativePath, filename: destName });
  } catch (err: any) {
    res.status(500).json({ error: `Copy failed: ${err.message}` });
  }
});
```

---

### 4. `app/src/stores/projectStore.ts` — Store Methods

**Interface** — add after `addShot`:
```typescript
addPrebakedShot: (sectionId: string, afterShotId?: string) => void;
importVideoToProject: (sectionId: string, shotId: string, externalPath: string) => Promise<void>;
```

**Implementation** — add after `addShot` closing `}),`, before `addSkillShot`:
```typescript
addPrebakedShot: (sectionId, afterShotId) => set((state) => {
  if (!state.project) return state;
  const newShot: Shot = {
    id: uuid(),
    name: 'Prebaked Shot',
    type: 'prebaked',
    startTime: 0, endTime: 0,
    lyric: '', concept: '', prompt: '', refImagePrompt: '',
    refImages: [], endRefImages: [],
    baked: true,
  };
  return {
    project: {
      ...state.project,
      sections: state.project.sections.map((s) => {
        if (s.id !== sectionId) return s;
        const shots = [...s.shots];
        if (afterShotId) {
          const idx = shots.findIndex((sh) => sh.id === afterShotId);
          if (idx !== -1) {
            const prev = shots[idx];
            newShot.startTime = prev.endTime;
            newShot.endTime = prev.endTime + 2;
            shots.splice(idx + 1, 0, newShot);
          } else { shots.push(newShot); }
        } else { shots.push(newShot); }
        return { ...s, shots };
      }),
    },
  };
}),

importVideoToProject: async (sectionId, shotId, externalPath) => {
  const projectId = get().project?.id;
  if (!projectId) return;
  try {
    const res = await fetch('/api/videos/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, externalPath }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Import failed');
    }
    const { localPath } = await res.json();
    get().addShotVideo(sectionId, shotId, localPath);
  } catch (e: any) {
    console.error('[importVideoToProject]', e.message);
  }
},
```

---

### 5. `app/src/components/ImageManager/ImageManager.tsx` — External Tab + Rename + Bug Fix

**This file has 3 distinct changes:**

#### 5a. Add naming comment block (near top of file)
```typescript
/**
 * Media tab naming conventions:
 * - 'images'     = Reference images (start/end frames for generation)
 * - 'audio'      = Audio files (master audio splits, custom uploads)
 * - 'rawvideo'   = Control videos uploaded by user (VACE/V2V input — UI: "Raw Video")
 * - 'rendered'   = Wan2GP render outputs matched to shots via videoFiles[] (UI: "Wan2GP Renders")
 * - 'external'   = Externally-generated videos for prebaked shots (UI: "External")
 * - 'assemblies' = Rough-cut assemblies stitched from shot videos (UI: "Assemblies")
 */
```

#### 5b. Extend MediaTab type
```diff
-type MediaTab = 'images' | 'audio' | 'rawvideo' | 'rendered' | 'assemblies';
+type MediaTab = 'images' | 'audio' | 'rawvideo' | 'rendered' | 'external' | 'assemblies';
```

#### 5c. Tab rename: "Imported" → "Wan2GP Renders"
Find the rendered tab button text and change:
```diff
-            Imported ({importedVideos.length})
+            Wan2GP Renders ({importedVideos.length})
```
Also update the inline comment for the `importedVideos` variable:
```diff
-  // Rendered videos: Wan2GP outputs imported/matched to shots via shot.videoFiles[] (read-only, UI: "Imported")
+  // Rendered videos: Wan2GP render outputs imported/matched to shots via shot.videoFiles[] (read-only, UI: "Wan2GP Renders")
```

#### 5d. Bug Fix: Black thumbnails in rendered tab
The rendered tab uses a **non-existent** route. Fix both occurrences:
```diff
-  src: `/api/videos/serve?file=${encodeURIComponent(video.path)}`,
+  src: `/api/videos/external?path=${encodeURIComponent(video.path)}`,

-  src={`/api/videos/serve?file=${encodeURIComponent(video.path)}#t=0.5`}
+  src={`/api/videos/external?path=${encodeURIComponent(video.path)}#t=0.5`}
```

#### 5e. External tab — state + handlers
Add state:
```typescript
const [externalVideos, setExternalVideos] = useState<{ filename: string; path: string }[]>([]);
const [uploadingExternal, setUploadingExternal] = useState(false);
```

Add handlers:
```typescript
const loadExternalVideos = async () => {
  if (!projectId) return;
  try {
    const projectDir = `data/projects/${projectId}`;
    const res = await fetch(`/api/videos/browse?dir=${encodeURIComponent(projectDir)}`);
    const data = await res.json();
    setExternalVideos(data.files || []);
  } catch { setExternalVideos([]); }
};

const handleExternalVideoDragStart = (e: React.DragEvent, video: { filename: string; path: string }) => {
  e.dataTransfer.setData('media-type', 'external-video');
  e.dataTransfer.setData('application/json',
    JSON.stringify({ externalVideoPath: video.path, filename: video.filename })
  );
};
```

Call `loadExternalVideos()` in the existing `useEffect` that calls `loadImages()`.

#### 5f. External tab button (add after Wan2GP Renders button)
```tsx
<button
  className={`px-3 py-1 rounded text-[11px] font-medium ${tab === 'external' ? 'bg-teal-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}
  onClick={() => { setTab('external'); loadExternalVideos(); }}
>
  📼 External ({externalVideos.length})
</button>
```

#### 5g. External tab content (add as new branch before assemblies)
```tsx
tab === 'external' ? (
  <div className="flex flex-wrap gap-2">
    {externalVideos.map((video) => (
      <div key={video.path}
        className="w-32 rounded overflow-hidden border border-surface-400 hover:border-teal-500 cursor-pointer transition-colors shrink-0"
        draggable
        onDragStart={(e) => handleExternalVideoDragStart(e, video)}
        onClick={() => setPreviewVideo({
          src: `/api/videos/external?path=${encodeURIComponent(video.path)}`,
          filename: video.filename,
        })}
        title={video.filename}
      >
        <video
          src={`/api/videos/external?path=${encodeURIComponent(video.path)}#t=0.5`}
          className="w-full h-20 object-cover bg-black" muted preload="metadata"
          onMouseEnter={(e) => { const v = e.target as HTMLVideoElement; v.currentTime = 0; v.play(); }}
          onMouseLeave={(e) => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
        />
        <div className="px-1.5 py-1 bg-surface-200">
          <div className="text-[9px] text-teal-400 truncate">{video.filename}</div>
        </div>
      </div>
    ))}
    {externalVideos.length === 0 && (
      <p className="text-xs text-gray-600 py-4 px-2">No external videos yet.</p>
    )}
  </div>
)
```

#### 5h. Update tooltip for rawvideo/external tabs
```tsx
{tab === 'external'
  ? 'Drag external video onto storyboard to create prebaked shot'
  : 'Drag raw video to use as control video in generation'}
```

---

### 6. `app/src/components/Storyboard/ShotCard.tsx` — PRE Badge + Drop

Add `prebaked` to `TYPE_BADGES`:
```typescript
const TYPE_BADGES = {
  solo: { label: 'SOLO', className: 'badge-solo' },
  multi: { label: 'MULTI', className: 'badge-multi' },
  prebaked: { label: 'PRE', className: 'badge-prebaked' },
} as const;
```

In `handleDrop`, add before the default `else` branch:
```typescript
} else if (mediaType === 'external-video' && parsed.externalVideoPath) {
  useProjectStore.getState().importVideoToProject(sectionId, shot.id, parsed.externalVideoPath);
}
```

Update empty thumbnail text:
```tsx
{shot.type === 'prebaked' ? 'Drop video file' : shot.type === 'solo' ? 'Drop image or audio' : `${shot.takes?.length || 0} takes`}
```

---

### 7. `app/src/components/Storyboard/Storyboard.tsx` — Button + Drag-to-Create

Add store imports:
```typescript
const addPrebakedShot = useProjectStore((s) => s.addPrebakedShot);
const importVideoToProject = useProjectStore((s) => s.importVideoToProject);
```

Add state:
```typescript
const [dropTargetSection, setDropTargetSection] = useState<string | null>(null);
```

Add 3 handlers (`handleSectionDragOver`, `handleSectionDragLeave`, `handleSectionDrop`) — these handle OS file drops onto sections to auto-create prebaked shots. See the previous detailed guide for full code.

Update section div to include drop attributes + teal ring:
```tsx
className={`... ${dropTargetSection === section.id ? 'ring-2 ring-teal-500 ring-opacity-60' : ''}`}
onDragOver={(e) => handleSectionDragOver(e, section.id)}
onDragLeave={handleSectionDragLeave}
onDrop={(e) => handleSectionDrop(e, section.id)}
```

Add button after "+ Add Shot":
```tsx
<button
  className="btn btn-ghost text-[11px] border border-dashed border-teal-700 hover:border-teal-400 text-teal-500 hover:text-teal-300"
  onClick={() => addPrebakedShot(section.id)}
  title="Add a prebaked shot for externally-generated video"
>
  📼 + Prebaked
</button>
```

---

### 8. `app/src/components/ShotEditor/ShotEditor.tsx` — Streamlined View

Add before the existing `return (`:
```tsx
if (shot.type === 'prebaked') {
  return (
    <div className="h-full flex flex-col bg-surface-100">
      <ShotEditorHeader shot={shot} sectionId={selectedSectionId} shotId={selectedShotId} />
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-teal-900/30 border border-teal-700/50 rounded-lg">
            <span className="text-teal-400 text-sm">📼</span>
            <span className="text-[11px] text-teal-300 font-medium">Prebaked Shot</span>
            <span className="text-[10px] text-teal-500">— externally generated, skips render queue</span>
          </div>
          <ShotMetadataFields shot={shot} sectionId={selectedSectionId} shotId={selectedShotId} />
          <VideoPreviewSection sectionId={selectedSectionId} shotId={selectedShotId} shot={shot} />
          <AudioSection sectionId={selectedSectionId} shotId={selectedShotId} shot={shot} />
        </div>
      </div>
    </div>
  );
}
```

---

### 9. `app/src/components/Timeline/Timeline.tsx` — Clip Color

```typescript
const SHOT_TYPE_COLORS: Record<string, string> = {
  solo: 'bg-blue-800/60 border-blue-600/60 hover:bg-blue-700/60',
  multi: 'bg-amber-800/60 border-amber-600/60 hover:bg-amber-700/60',
  prebaked: 'bg-teal-800/60 border-teal-600/60 hover:bg-teal-700/60',
};
```

---

## Verification

`npx tsc --noEmit` → **0 errors** ✅

## Future Ideas (from this session)

**LoRA Scanner → Skills Generator**: Build an app/tool that scans the user's wan2gp LoRAs, extracts metadata, and auto-generates TronikSlate skill cards using CivitAI thumbnails. Wan2GP already has a plugin that scans/adds metadata/thumbnails to LoRAs — this would be derivative code.
