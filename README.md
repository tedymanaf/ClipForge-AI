---
title: ClipForge AI
emoji: 🎬
colorFrom: indigo
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
short_description: AI short-form clipper with Next.js and FastAPI.
---

# ClipForge AI

ClipForge AI sekarang memakai arsitektur dua lapis di satu Hugging Face Space:

- `Next.js` di port publik `7860` untuk UI
- `FastAPI` di port internal `8000` untuk upload, process, status, clips, dan download

Flow utamanya sudah disederhanakan menjadi:

1. Upload video
2. Review 3 clip kandidat
3. Edit cepat
4. Download MP4

## Struktur Folder

```text
.
├── app/
│   ├── api/
│   ├── dashboard/
│   └── project/
├── components/
├── lib/
├── modules/
├── public/
├── store/
├── types/
├── app.py
├── Dockerfile
├── next.config.mjs
├── package.json
└── requirements.txt
```

## Backend FastAPI

File utama backend ada di `app.py` dengan endpoint:

- `POST /api/upload`
- `POST /api/process/{project_id}`
- `GET /api/status/{project_id}`
- `GET /api/clips/{project_id}`
- `GET /api/download/{project_id}/{clip_id}`

Data sementara disimpan di:

- `/tmp/uploads/{project_id}/`

Tidak ada database eksternal. Status, manifest, transcript, dan daftar clip disimpan sebagai file JSON per project.

## Pipeline AI

Pipeline backend berjalan seperti ini:

1. Simpan video upload ke `/tmp/uploads/{project_id}/`
2. Ekstrak audio dengan ffmpeg
3. Transkripsi dengan OpenAI Whisper `whisper-1`
4. Skor segmen terbaik dengan `gpt-4o-mini`
5. Potong 3 clip MP4 dengan ffmpeg

### Exact ffmpeg commands

Ekstrak audio:

```bash
ffmpeg -y -i input.mp4 -vn -acodec mp3 output.mp3
```

Potong clip:

```bash
ffmpeg -y -i input.mp4 -ss {start} -to {end} -c copy clip_{id}.mp4
```

Kalau `-c copy` gagal di timestamp tertentu, backend otomatis fallback ke encode ulang:

```bash
ffmpeg -y -ss {start} -to {end} -i input.mp4 -c:v libx264 -c:a aac clip_{id}.mp4
```

## Frontend Next.js

Frontend sekarang memanggil backend FastAPI lewat rewrite di `next.config.mjs`:

- `/api/upload`
- `/api/process/:projectId`
- `/api/status/:projectId`
- `/api/clips/:projectId`
- `/api/download/:projectId/:clipId`

Upload memakai `XMLHttpRequest` supaya progress bar upload nyata bisa tampil di UI. Setelah upload sukses, frontend otomatis memanggil `/api/process/{project_id}` lalu polling `/api/status/{project_id}` tiap 2 detik sampai clip siap.

## Zustand State

Store utama berada di `store/useClipForgeStore.ts` dan sekarang menyimpan:

- `currentProjectId`
- `processingStage`
- `processingProgress`
- `clips`

State ini di-reset saat upload baru dimulai agar dashboard tidak membawa sisa proses lama.

## Environment Variables

Contoh file `.env.example`:

```bash
OPENAI_API_KEY=sk-xxx
CLIPFORGE_FASTAPI_URL=http://127.0.0.1:8000
```

## Hugging Face Spaces Setup

Di halaman Space, buka:

`Settings -> Variables and secrets`

Tambahkan secret berikut:

- `OPENAI_API_KEY`

Optional:

- `CLIPFORGE_FASTAPI_URL`

Catatan:

- Untuk Docker Space ini, `CLIPFORGE_FASTAPI_URL` sudah default ke `http://127.0.0.1:8000`, jadi biasanya tidak perlu diubah.
- Storage Hugging Face free tier bersifat sementara, jadi file clip akan hilang saat Space restart. Ini normal untuk prototipe tanpa persistent volume.

## Local Development

Install dependency:

```bash
npm install
pip install -r requirements.txt
```

Jalankan FastAPI:

```bash
uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

Jalankan Next.js:

```bash
npm run dev
```

Kalau mau mengikuti konfigurasi production lokal:

- FastAPI di `127.0.0.1:8000`
- Next.js membaca `CLIPFORGE_FASTAPI_URL=http://127.0.0.1:8000`

## Deployment ke Hugging Face Spaces

1. Push repo ke Hugging Face Space yang memakai `sdk: docker`
2. Pastikan `OPENAI_API_KEY` sudah diisi di `Settings -> Variables and secrets`
3. Space akan build `Dockerfile`
4. Container menjalankan:
   - `FastAPI` di `127.0.0.1:8000`
   - `Next.js` di port publik `7860`
5. Buka Space dan tes flow:
   - upload video
   - tunggu status `Transcribing -> Scoring -> Cutting -> Ready`
   - buka review clip
   - download MP4

## File Penting Yang Diubah

- `app.py`
- `requirements.txt`
- `Dockerfile`
- `next.config.mjs`
- `modules/upload/UploadEngine.tsx`
- `store/useClipForgeStore.ts`
- `components/ClipCard.tsx`
- `modules/export/ExportCenter.tsx`
- `app/project/[id]/clips/page.tsx`
- `app/project/[id]/clip/[clipId]/page.tsx`
- `app/project/[id]/export/page.tsx`

## Batasan Saat Ini

- Import URL belum disambungkan ke downloader backend, jadi jalur yang aktif baru upload file lokal
- Clip disimpan di `/tmp`, jadi hasil akan hilang saat Space restart
- Preview dan export bundle lama masih tersedia, tapi jalur utama sekarang adalah download MP4 langsung dari backend FastAPI
