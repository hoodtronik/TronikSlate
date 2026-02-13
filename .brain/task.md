# Tasks

- [x] Rebrand ByteSound → hoodTRONIK, ByteCut Director → Tronik Slate
- [x] Fix server crash (rendered.ts orphaned import)
- [x] Add Reload App button
- [x] Native PDF export (jsPDF + html2canvas)
- [x] Copy brain files to `.brain/` for portability
- [x] Shot Dependency Chains
  - [x] Add `dependsOn` + `chainMode` to Shot type
  - [x] Server: `POST /api/frames/extract-last` (ffmpeg last frame)
  - [x] Server: Mount frames route in index.ts
  - [x] Store: `setShotDependency()` + `pullChainFrame()` actions
  - [x] UI: Chain picker dropdown in ShotEditorHeader
  - [x] UI: Chain badge in ShotCard
  - [x] UI: "Pull Last Frame" button in RefImagesGrid
  - [x] Export: Topological sort in ExportPanel
  - [x] Verify TypeScript compiles clean
