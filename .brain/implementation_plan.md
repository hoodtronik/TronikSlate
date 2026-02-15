# Prompt Assistant (Ollama Integration)

Local LLM prompt enhancement using `llama3.2:3b` for rewriting shot prompts and optional 10-shot pack generation.

## Proposed Changes

### Server — Ollama Proxy Route

#### [NEW] [ollama.ts](file:///d:/pinokio/api/TronikSlate/app/server/routes/ollama.ts)

Express router with 4 endpoints:

| Endpoint | Purpose |
|----------|---------|
| `GET /api/ollama/status` | Check if Ollama is running + model available (pings `http://localhost:11434/api/tags`) |
| `POST /api/ollama/pull` | Triggers `ollama pull llama3.2:3b`, streams progress back via SSE |
| `POST /api/ollama/enhance` | Sends prompt + moduleId + style constraints → returns strict JSON `{prompt, negative_prompt, shot_label, tags}` |
| `POST /api/ollama/pack` | Takes logline → returns 10-shot prompt pack as JSON array |

Key implementation details:
- Uses `http://localhost:11434/api/generate` (not chat)
- Always sends `keep_alive: 0` (unload after response)
- System prompt per moduleId enforces JSON output format + constraints
- AbortController on all requests — exposed so render start can cancel in-flight LLM calls
- Response timeout: 30s for enhance, 120s for pack

#### [MODIFY] [index.ts](file:///d:/pinokio/api/TronikSlate/app/server/index.ts)

Add `import ollamaRoutes` + `app.use('/api/ollama', ollamaRoutes)`

---

### Frontend Store

#### [NEW] [promptStore.ts](file:///d:/pinokio/api/TronikSlate/app/src/stores/promptStore.ts)

Zustand store managing:
- `assistantMode`: `'off' | 'silent' | 'review'` (persisted to localStorage)
- `ollamaStatus`: `'unknown' | 'checking' | 'online' | 'offline' | 'pulling' | 'ready'`
- `pullProgress`: `string` (status text during model pull)
- `enhanceShot(sectionId, shotId)`: calls `/api/ollama/enhance`, stores result
- `generatePack(logline)`: calls `/api/ollama/pack`, returns array
- `cancelInFlight()`: aborts any active request

---

### Frontend UI Components

#### [NEW] [PromptAssistantSettings.tsx](file:///d:/pinokio/api/TronikSlate/app/src/components/PromptAssistant/PromptAssistantSettings.tsx)

Settings panel (accessible from Toolbar gear or a dedicated settings area):
- Three-way toggle: Off / On (Silent) / On (Review)
- Ollama status indicator (green dot / red dot / spinner)
- "Pull Model" button with progress text if model missing
- Link to install Ollama if not detected

#### [NEW] [PromptDiff.tsx](file:///d:/pinokio/api/TronikSlate/app/src/components/PromptAssistant/PromptDiff.tsx)

Review mode UI shown in ShotEditor when `assistantMode === 'review'`:
- Side-by-side "Before / After" display
- "Use Optimized" / "Use Original" buttons
- Shows `shot_label` and `tags` from LLM response

#### [MODIFY] [ShotEditor.tsx](file:///d:/pinokio/api/TronikSlate/app/src/components/ShotEditor/ShotEditor.tsx)

- Add ✨ "Enhance Prompt" button next to prompt textarea
- In Silent mode: auto-enhances on blur, stores optimized quietly
- In Review mode: shows `PromptDiff` inline after enhancement
- Badge shows "AI Enhanced" if shot has `optimizedPrompt`

#### [MODIFY] [Toolbar.tsx](file:///d:/pinokio/api/TronikSlate/app/src/components/Layout/Toolbar.tsx)

- Add ✨ Prompt Assistant indicator/settings button in toolbar

---

### Shot Metadata

#### [MODIFY] [project.ts](file:///d:/pinokio/api/TronikSlate/app/src/types/project.ts)

Add to `Shot` interface:
```typescript
rawPrompt?: string;           // Original user-written prompt
optimizedPrompt?: string;     // LLM-enhanced prompt  
useOptimizedPrompt?: boolean; // Toggle per shot (Advanced Mode)
promptOptimizer?: string;     // Model name used (e.g. "llama3.2:3b")
promptOptimizedAt?: string;   // ISO timestamp
```

#### [MODIFY] [projectStore.ts](file:///d:/pinokio/api/TronikSlate/app/src/stores/projectStore.ts)

- When building queue.zip export data, use `optimizedPrompt` if `useOptimizedPrompt` is true, otherwise use `prompt`

---

### System Prompts (per module)

#### [NEW] [promptTemplates.ts](file:///d:/pinokio/api/TronikSlate/app/src/data/promptTemplates.ts)

System instruction templates per moduleId:
- `default` — generic video prompt enhancement
- `motion_control` — emphasize motion, poses, camera movement
- `lip_sync` — emphasize facial expressions, lip movement, emotion
- `vace_replace` — emphasize character consistency, scene continuity

Each template enforces: no text, no watermark, no extra characters (unless requested), strict JSON output format.

---

### Resource Safety

#### [MODIFY] [render.ts](file:///d:/pinokio/api/TronikSlate/app/server/routes/render.ts)

In POST `/start`: call a cancel function exported from `ollama.ts` to abort any in-flight LLM request before spawning render process.

## Verification Plan

### Automated Tests
- `npx tsc --noEmit` — type check
- Manual test: start app, check Ollama status indicator
- Test with Ollama running + model available
- Test with Ollama not running (shows install message)
- Test enhance on a shot, verify JSON output stored in metadata
- Test render start cancels in-flight LLM request
