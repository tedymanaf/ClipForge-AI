---
title: ClipForge AI
emoji: 🎬
colorFrom: indigo
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
short_description: Next.js clipper with captions, exports, and FFmpeg.
---

# ClipForge AI

ClipForge AI is a modular Next.js 14 application for turning long-form videos into viral-ready short clips.

Core flow:

1. Upload a video or import from URL
2. Review AI-ranked clip candidates
3. Export a ready-to-post package

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- Zustand
- Recharts

## Included Modules

- `modules/upload/UploadEngine.tsx`
- `modules/analysis/AnalysisEngine.ts`
- `modules/clipper/ClipGenerator.ts`
- `modules/captions/CaptionEngine.tsx`
- `modules/thumbnail/ThumbnailEngine.ts`
- `modules/metadata/MetadataEngine.ts`
- `modules/editor/ClipEditor.tsx`
- `modules/export/ExportCenter.tsx`
- `modules/analytics/AnalyticsDashboard.tsx`
- `modules/settings/Settings.tsx`

## API Routes

- `POST /api/upload`
- `POST /api/transcribe`
- `POST /api/analyze`
- `POST /api/clip`
- `POST /api/caption`
- `POST /api/thumbnail`
- `POST /api/metadata`
- `GET /api/progress/[id]`
- `POST /api/export`
- `POST /api/publish/tiktok`
- `POST /api/publish/youtube`
- `POST /api/publish/instagram`

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Notes

- Demo projects are seeded automatically on first launch.
- The current build includes production-oriented structure with mock-friendly AI and media pipelines.
- Upload storage writes to `storage/uploads/`.
- Export ZIP now renders valid MP4/JPG outputs locally with FFmpeg when available, plus JSON/SRT/VTT metadata files.
- Publish routes currently return stubbed success payloads and are not connected to real TikTok, Instagram, or YouTube APIs yet.
