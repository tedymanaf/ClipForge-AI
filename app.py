import json
import os
import re
import shutil
import subprocess
import threading
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from openai import OpenAI
from pydantic import BaseModel

MAX_UPLOAD_BYTES = 500 * 1024 * 1024
ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}
UPLOAD_ROOT = Path("/tmp/uploads")
STATUS_FILE = "status.json"
MANIFEST_FILE = "manifest.json"
CLIPS_FILE = "clips.json"
INPUT_FILE = "source"
AUDIO_FILE = "audio.mp3"
TRANSCRIPT_FILE = "transcript.json"

app = FastAPI(title="ClipForge AI Backend", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

status_lock = threading.Lock()
status_cache: Dict[str, Dict[str, Any]] = {}
worker_cache: Dict[str, threading.Thread] = {}


class ProcessResponse(BaseModel):
    project_id: str
    status: str
    clips: List[Dict[str, Any]]


class AiProviderConfig(BaseModel):
    provider: str
    api_key: Optional[str]
    base_url: Optional[str]
    chat_model: str
    transcription_model: str
    label: str


def project_dir(project_id: str) -> Path:
    return UPLOAD_ROOT / project_id


def manifest_path(project_id: str) -> Path:
    return project_dir(project_id) / MANIFEST_FILE


def clips_path(project_id: str) -> Path:
    return project_dir(project_id) / CLIPS_FILE


def status_path(project_id: str) -> Path:
    return project_dir(project_id) / STATUS_FILE


def transcript_path(project_id: str) -> Path:
    return project_dir(project_id) / TRANSCRIPT_FILE


def read_json(file_path: Path, default: Any) -> Any:
    if not file_path.exists():
        return default

    try:
        return json.loads(file_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return default


def write_json(file_path: Path, payload: Any) -> None:
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def load_manifest(project_id: str) -> Dict[str, Any]:
    payload = read_json(manifest_path(project_id), {})
    if not payload:
        raise HTTPException(status_code=404, detail="Project not found.")
    return payload


def save_manifest(project_id: str, payload: Dict[str, Any]) -> None:
    write_json(manifest_path(project_id), payload)


def normalize_stage(stage: str) -> str:
    allowed = {"uploading", "transcribing", "scoring", "cutting", "ready", "error"}
    return stage if stage in allowed else "uploading"


def set_status(project_id: str, stage: str, progress: int, message: str = "", error: Optional[str] = None) -> Dict[str, Any]:
    payload = {
        "project_id": project_id,
        "stage": normalize_stage(stage),
        "progress": max(0, min(progress, 100)),
        "message": message,
    }

    if error:
        payload["error"] = error

    with status_lock:
        status_cache[project_id] = payload

    write_json(status_path(project_id), payload)
    return payload


def get_status(project_id: str) -> Dict[str, Any]:
    with status_lock:
        cached = status_cache.get(project_id)

    if cached:
        return cached

    payload = read_json(status_path(project_id), None)
    if payload:
        with status_lock:
            status_cache[project_id] = payload
        return payload

    raise HTTPException(status_code=404, detail="Project status not found.")


def run_command(command: List[str], error_message: str) -> None:
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        stderr = (result.stderr or "").strip()
        raise RuntimeError(f"{error_message}: {stderr or 'Unknown ffmpeg error'}")


def ffprobe_duration_seconds(video_path: Path) -> float:
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "json",
            str(video_path),
        ],
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        raise RuntimeError((result.stderr or "Unable to read video duration.").strip())

    payload = json.loads(result.stdout or "{}")
    duration_raw = payload.get("format", {}).get("duration", 0)
    return max(0.0, float(duration_raw or 0))


def extract_audio(video_path: Path, output_path: Path) -> None:
    run_command(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(video_path),
            "-vn",
            "-acodec",
            "mp3",
            str(output_path),
        ],
        "Failed to extract audio",
    )


def cut_clip(video_path: Path, output_path: Path, start_sec: float, end_sec: float) -> None:
    try:
        run_command(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(video_path),
                "-ss",
                f"{start_sec:.2f}",
                "-to",
                f"{end_sec:.2f}",
                "-c",
                "copy",
                str(output_path),
            ],
            "Failed to cut clip",
        )
    except RuntimeError:
        run_command(
            [
                "ffmpeg",
                "-y",
                "-ss",
                f"{start_sec:.2f}",
                "-to",
                f"{end_sec:.2f}",
                "-i",
                str(video_path),
                "-c:v",
                "libx264",
                "-c:a",
                "aac",
                str(output_path),
            ],
            "Failed to cut clip with fallback encoder",
        )


def resolve_ai_provider(api_key: Optional[str]) -> AiProviderConfig:
    requested_provider = (os.getenv("AI_PROVIDER") or "auto").strip().lower()
    groq_key = os.getenv("GROQ_API_KEY")
    use_groq = requested_provider == "groq" or (requested_provider == "auto" and bool(groq_key))

    if use_groq:
        return AiProviderConfig(
            provider="groq",
            api_key=api_key or groq_key,
            base_url=os.getenv("GROQ_BASE_URL") or "https://api.groq.com/openai/v1",
            chat_model=os.getenv("GROQ_CHAT_MODEL") or "openai/gpt-oss-20b",
            transcription_model=os.getenv("GROQ_TRANSCRIPTION_MODEL") or "whisper-large-v3-turbo",
            label="Groq",
        )

    return AiProviderConfig(
        provider="openai",
        api_key=api_key or os.getenv("OPENAI_API_KEY"),
        base_url=os.getenv("OPENAI_BASE_URL") or None,
        chat_model=os.getenv("OPENAI_CHAT_MODEL") or "gpt-4o-mini",
        transcription_model=os.getenv("OPENAI_TRANSCRIPTION_MODEL") or "whisper-1",
        label="OpenAI",
    )


def resolve_openai_client(api_key: Optional[str]) -> OpenAI:
    provider = resolve_ai_provider(api_key)
    if not provider.api_key:
        raise RuntimeError(
            "AI API key belum tersedia. Tambahkan GROQ_API_KEY atau OPENAI_API_KEY di HF Spaces, atau isi key dari frontend."
        )

    return OpenAI(api_key=provider.api_key, base_url=provider.base_url)


def has_ai_key(api_key: Optional[str]) -> bool:
    return bool(resolve_ai_provider(api_key).api_key)


def model_dump(payload: Any) -> Dict[str, Any]:
    if hasattr(payload, "model_dump"):
        return payload.model_dump()
    if isinstance(payload, dict):
        return payload
    return json.loads(json.dumps(payload, default=lambda value: getattr(value, "__dict__", str(value))))


def transcribe_audio(audio_path: Path, duration_sec: float, api_key: Optional[str]) -> Dict[str, Any]:
    if not has_ai_key(api_key):
        return {
            "text": "Fallback transcript generated because AI API key is not configured.",
            "segments": build_duration_segments(duration_sec),
        }

    provider = resolve_ai_provider(api_key)
    client = resolve_openai_client(api_key)
    with audio_path.open("rb") as audio_file:
        response = client.audio.transcriptions.create(
            model=provider.transcription_model,
            file=audio_file,
            response_format="verbose_json",
            timestamp_granularities=["segment"],
        )

    payload = model_dump(response)
    segments = payload.get("segments") or []

    if not segments:
        transcript_text = (payload.get("text") or "").strip()
        return {
            "text": transcript_text,
            "segments": build_fallback_segments(transcript_text, duration_sec),
        }

    return {
        "text": payload.get("text", ""),
        "segments": [
            {
                "start": float(segment.get("start", 0)),
                "end": float(segment.get("end", 0)),
                "text": str(segment.get("text", "")).strip(),
            }
            for segment in segments
            if str(segment.get("text", "")).strip()
        ],
    }


def build_fallback_segments(text: str, duration_sec: float) -> List[Dict[str, Any]]:
    cleaned = text.strip()
    if not cleaned:
        return [{"start": 0.0, "end": min(10.0, max(duration_sec, 1.0)), "text": "No transcript available."}]

    sentences = [part.strip() for part in re.split(r"(?<=[.!?])\s+", cleaned) if part.strip()]
    if not sentences:
        sentences = [cleaned]

    segment_duration = max(4.0, min(18.0, duration_sec / max(1, len(sentences))))
    segments: List[Dict[str, Any]] = []
    cursor = 0.0

    for sentence in sentences:
        end = min(duration_sec, cursor + segment_duration)
        if end <= cursor:
            end = min(duration_sec, cursor + 4.0)
        segments.append({"start": cursor, "end": end, "text": sentence})
        cursor = end

    return segments


def build_duration_segments(duration_sec: float) -> List[Dict[str, Any]]:
    safe_duration = max(1.0, duration_sec)
    window = min(60.0, max(1.0, safe_duration / 3))
    segments: List[Dict[str, Any]] = []

    for index in range(3):
        start = round(index * window, 2)
        if start >= safe_duration:
            break

        end = min(safe_duration, start + window)

        if end <= start:
            end = min(safe_duration, start + 0.75)

        segments.append(
            {
                "start": round(start, 2),
                "end": round(end, 2),
                "text": f"Fallback segment {index + 1} generated from video timing because no AI API key is set."
            }
        )

        if end >= safe_duration:
            break

    return segments


def build_transcript_prompt(segments: List[Dict[str, Any]]) -> str:
    lines = []
    for segment in segments:
        lines.append(
            f"[{segment['start']:.2f}-{segment['end']:.2f}] {segment['text']}"
        )

    return "\n".join(lines)


def heuristic_clips_from_segments(segments: List[Dict[str, Any]], duration_sec: float) -> List[Dict[str, Any]]:
    ranked = sorted(
        [segment for segment in segments if segment["end"] > segment["start"]],
        key=lambda item: (len(item["text"]), item["end"] - item["start"]),
        reverse=True,
    )

    clips: List[Dict[str, Any]] = []
    for index, segment in enumerate(ranked[:3]):
        start_sec = max(0.0, segment["start"])
        end_sec = min(duration_sec, max(start_sec + 4.0, min(segment["end"], start_sec + 60.0)))
        if end_sec <= start_sec:
            continue

        clips.append(
            {
                "start_sec": round(start_sec, 2),
                "end_sec": round(end_sec, 2),
                "score": max(70, 92 - index * 6),
                "hook_reason": "Segmen ini punya kalimat yang cukup utuh dan kuat untuk dijadikan short-form hook.",
                "caption_suggestion": segment["text"][:140],
            }
        )

    if not clips:
        fallback_end = min(max(duration_sec, 1.0), 4.0)
        clips.append(
            {
                "start_sec": 0.0,
                "end_sec": round(fallback_end, 2),
                "score": 70,
                "hook_reason": "Fallback clip generated from the available source duration.",
                "caption_suggestion": "Fallback clip generated because the source video is very short."
            }
        )

    return clips


def score_transcript_segments(segments: List[Dict[str, Any]], duration_sec: float, api_key: Optional[str]) -> List[Dict[str, Any]]:
    if not has_ai_key(api_key):
        return heuristic_clips_from_segments(segments, duration_sec)

    provider = resolve_ai_provider(api_key)
    client = resolve_openai_client(api_key)
    transcript_prompt = build_transcript_prompt(segments)
    prompt = (
        "Dari transkrip ini, pilih 3 segmen terbaik sebagai short-form clip berdasarkan hook strength, "
        "energy, dan kelengkapan kalimat. Setiap clip maksimal 60 detik. "
        "Return JSON object dengan format {\"clips\": [{\"start_sec\": number, \"end_sec\": number, "
        "\"score\": number, \"hook_reason\": string, \"caption_suggestion\": string}]}.\n\n"
        f"Transcript:\n{transcript_prompt}"
    )

    response = client.chat.completions.create(
        model=provider.chat_model,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": "You are an editor that identifies the strongest short-form video moments and always returns valid JSON.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )

    content = response.choices[0].message.content or "{\"clips\": []}"
    try:
        payload = json.loads(content)
    except json.JSONDecodeError:
        return heuristic_clips_from_segments(segments, duration_sec)

    raw_clips = payload.get("clips")
    if not isinstance(raw_clips, list) or not raw_clips:
        return heuristic_clips_from_segments(segments, duration_sec)

    clips: List[Dict[str, Any]] = []
    for raw_clip in raw_clips[:3]:
        try:
            start_sec = max(0.0, float(raw_clip.get("start_sec", 0)))
            end_sec = min(duration_sec, float(raw_clip.get("end_sec", start_sec + 1)))
            if end_sec <= start_sec:
                continue
            end_sec = min(duration_sec, start_sec + 60.0, end_sec)
            clips.append(
                {
                    "start_sec": round(start_sec, 2),
                    "end_sec": round(end_sec, 2),
                    "score": int(max(0, min(100, float(raw_clip.get("score", 75))))),
                    "hook_reason": str(raw_clip.get("hook_reason", "")).strip() or "Strong hook candidate.",
                    "caption_suggestion": str(raw_clip.get("caption_suggestion", "")).strip() or "Short-form clip ready.",
                }
            )
        except (TypeError, ValueError):
            continue

    return clips or heuristic_clips_from_segments(segments, duration_sec)


def relative_download_url(project_id: str, clip_id: str) -> str:
    return f"/api/download/{project_id}/{clip_id}"


def build_clip_payloads(project_id: str, selections: List[Dict[str, Any]], input_path: Path) -> List[Dict[str, Any]]:
    clips: List[Dict[str, Any]] = []
    for index, selection in enumerate(selections[:3], start=1):
        clip_id = f"clip_{index}"
        filename = f"{clip_id}.mp4"
        output_path = project_dir(project_id) / filename
        cut_clip(input_path, output_path, float(selection["start_sec"]), float(selection["end_sec"]))
        clips.append(
            {
                "id": clip_id,
                "start_sec": float(selection["start_sec"]),
                "end_sec": float(selection["end_sec"]),
                "score": int(selection["score"]),
                "hook_reason": selection["hook_reason"],
                "caption_suggestion": selection["caption_suggestion"],
                "filename": filename,
                "download_url": relative_download_url(project_id, clip_id),
            }
        )
    return clips


def process_project_worker(project_id: str, api_key: Optional[str]) -> None:
    try:
        manifest = load_manifest(project_id)
        input_path = Path(manifest["path"])
        if not input_path.exists():
            raise RuntimeError("Video source tidak ditemukan di server.")

        duration_sec = ffprobe_duration_seconds(input_path)
        manifest["duration_sec"] = duration_sec
        save_manifest(project_id, manifest)

        set_status(project_id, "transcribing", 20, "Extracting audio and running Whisper transcription.")
        audio_path = project_dir(project_id) / AUDIO_FILE
        extract_audio(input_path, audio_path)

        transcript = transcribe_audio(audio_path, duration_sec, api_key)
        write_json(transcript_path(project_id), transcript)

        set_status(project_id, "scoring", 60, "Scoring transcript with GPT-4o-mini.")
        selections = score_transcript_segments(transcript["segments"], duration_sec, api_key)

        set_status(project_id, "cutting", 82, "Cutting three short-form clips with ffmpeg.")
        clips = build_clip_payloads(project_id, selections, input_path)
        write_json(clips_path(project_id), {"project_id": project_id, "clips": clips})

        manifest["clips"] = clips
        save_manifest(project_id, manifest)
        set_status(project_id, "ready", 100, "Three clips are ready to review and download.")
    except Exception as error:
        set_status(project_id, "error", 100, "Processing failed.", error=str(error))
    finally:
        with status_lock:
            worker_cache.pop(project_id, None)


@app.get("/healthz")
def healthcheck() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/api/upload")
async def upload_video(file: UploadFile = File(...)) -> Dict[str, Any]:
    extension = Path(file.filename or "").suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file format.")

    project_id = uuid.uuid4().hex
    target_dir = project_dir(project_id)
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = target_dir / f"{INPUT_FILE}{extension}"

    total_bytes = 0
    try:
        with target_path.open("wb") as output_file:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                total_bytes += len(chunk)
                if total_bytes > MAX_UPLOAD_BYTES:
                    raise HTTPException(status_code=413, detail="File exceeds 500MB limit for this Space.")
                output_file.write(chunk)
    except Exception:
        shutil.rmtree(target_dir, ignore_errors=True)
        raise
    finally:
        await file.close()

    manifest = {
        "project_id": project_id,
        "filename": file.filename,
        "path": str(target_path),
        "size_bytes": total_bytes,
    }
    save_manifest(project_id, manifest)
    write_json(clips_path(project_id), {"project_id": project_id, "clips": []})
    set_status(project_id, "uploading", 100, "Upload completed.")

    return {
        "project_id": project_id,
        "filename": file.filename,
        "status": "uploaded",
        "path": str(target_path),
        "size_bytes": total_bytes,
    }


@app.post("/api/process/{project_id}", response_model=ProcessResponse)
def process_project(
    project_id: str,
    x_openai_api_key: Optional[str] = Header(default=None),
    x_groq_api_key: Optional[str] = Header(default=None),
    x_ai_api_key: Optional[str] = Header(default=None),
) -> ProcessResponse:
    manifest = load_manifest(project_id)
    current_clips = read_json(clips_path(project_id), {"clips": []}).get("clips", [])
    client_api_key = x_ai_api_key or x_groq_api_key or x_openai_api_key

    with status_lock:
        worker = worker_cache.get(project_id)

    if worker and worker.is_alive():
        status = get_status(project_id)
        return ProcessResponse(project_id=project_id, status=status["stage"], clips=current_clips)

    status = read_json(status_path(project_id), None)
    if status and status.get("stage") == "ready" and current_clips:
        return ProcessResponse(project_id=project_id, status="ready", clips=current_clips)

    if not Path(manifest["path"]).exists():
        raise HTTPException(status_code=404, detail="Uploaded source file not found.")

    set_status(project_id, "transcribing", 10, "Processing started.")
    worker = threading.Thread(target=process_project_worker, args=(project_id, client_api_key), daemon=True)
    with status_lock:
        worker_cache[project_id] = worker
    worker.start()

    return ProcessResponse(project_id=project_id, status="processing", clips=current_clips)


@app.get("/api/clips/{project_id}")
def get_clips(project_id: str) -> Dict[str, Any]:
    payload = read_json(clips_path(project_id), None)
    if payload is None:
        raise HTTPException(status_code=404, detail="Clips not found.")
    return payload


@app.get("/api/download/{project_id}/{clip_id}")
def download_clip(project_id: str, clip_id: str) -> FileResponse:
    payload = read_json(clips_path(project_id), {"clips": []})
    clips = payload.get("clips", [])
    clip = next((item for item in clips if item.get("id") == clip_id), None)
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found.")

    file_path = project_dir(project_id) / clip["filename"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Clip file missing.")

    return FileResponse(path=file_path, media_type="video/mp4", filename=clip["filename"])


@app.get("/api/status/{project_id}")
def get_project_status(project_id: str) -> Dict[str, Any]:
    return get_status(project_id)
