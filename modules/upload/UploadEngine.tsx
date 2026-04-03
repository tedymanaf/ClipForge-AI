"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Film, Link2, LoaderCircle, UploadCloud, XCircle, Youtube } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getProcessingSnapshot } from "@/modules/analysis/AnalysisEngine";
import { getProjectPrimaryRoute } from "@/lib/project-routing";
import { useClipForgeStore } from "@/store/useClipForgeStore";
import { BackendProcessingStage, GeneratedClip, QueueItem, UploadDescriptor, UploadSource } from "@/types";
import { createId, formatBytes, formatDuration, svgToDataUri } from "@/lib/utils";

const MAX_SIZE_BYTES = 500 * 1024 * 1024;
const ACCEPTED_TYPES = [".mp4", ".mov", ".avi", ".mkv", ".webm"];
const SIMPLE_FLOW = [
  { id: "upload", label: "Upload video", description: "Video dikirim ke backend FastAPI." },
  { id: "review", label: "Review clip", description: "Backend memilih 3 segmen terbaik." },
  { id: "edit", label: "Edit cepat", description: "Kamu bisa rapikan caption dan metadata." },
  { id: "download", label: "Download MP4", description: "Unduh clip final langsung dari server." }
] as const;

type UploadApiResponse = {
  project_id: string;
  filename: string;
  status: string;
  path?: string;
  size_bytes?: number;
};

type StatusApiResponse = {
  stage: BackendProcessingStage;
  progress: number;
  message?: string;
  error?: string;
};

type UploadTelemetry = {
  loadedBytes: number;
  totalBytes: number;
  speedBytesPerSec: number;
  etaSec: number | null;
};

type ClipsApiResponse = {
  project_id: string;
  clips: Array<{
    id: string;
    start_sec: number;
    end_sec: number;
    score: number;
    hook_reason: string;
    caption_suggestion: string;
    filename: string;
    download_url: string;
  }>;
};

function createFallbackThumbnail(label: string) {
  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#0B0B12" offset="0%"/>
          <stop stop-color="#0F172A" offset="100%"/>
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill="url(#g)"/>
      <circle cx="620" cy="120" r="140" fill="#7C3AED" fill-opacity="0.2"/>
      <text x="54" y="340" fill="#FFFFFF" font-size="54" font-family="Arial, sans-serif">${label}</text>
    </svg>
  `);
}

function formatEtaLabel(etaSec: number | null) {
  if (etaSec === null || !Number.isFinite(etaSec)) {
    return "Menghitung...";
  }

  if (etaSec <= 1) {
    return "< 1 dtk";
  }

  if (etaSec < 60) {
    return `${Math.ceil(etaSec)} dtk`;
  }

  const minutes = Math.floor(etaSec / 60);
  const seconds = Math.ceil(etaSec % 60);
  return seconds > 0 ? `${minutes} mnt ${seconds} dtk` : `${minutes} mnt`;
}

function getStageCategory(stage: BackendProcessingStage | "idle") {
  if (stage === "uploading") {
    return "upload jaringan";
  }

  if (stage === "transcribing" || stage === "scoring" || stage === "cutting") {
    return "proses AI";
  }

  if (stage === "ready") {
    return "siap review";
  }

  if (stage === "error") {
    return "perlu perhatian";
  }

  return "siap";
}

function isAcceptedFile(file: File) {
  return ACCEPTED_TYPES.some((extension) => file.name.toLowerCase().endsWith(extension));
}

async function extractVideoMetadata(file: File): Promise<UploadDescriptor> {
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "metadata";
  video.src = objectUrl;
  video.muted = true;
  video.playsInline = true;

  const loaded = new Promise<UploadDescriptor>((resolve) => {
    video.onloadedmetadata = async () => {
      const width = video.videoWidth || 1920;
      const height = video.videoHeight || 1080;
      const durationSec = Number.isFinite(video.duration) ? video.duration : 0;

      let thumbnail = createFallbackThumbnail(file.name);

      try {
        video.currentTime =
          durationSec > 0 ? Math.min(Math.max(durationSec * 0.25, 0.1), Math.max(durationSec - 0.1, 0.1)) : 0;

        thumbnail = await new Promise<string>((thumbnailResolve) => {
          let settled = false;
          const timeoutId = window.setTimeout(() => {
            if (settled) {
              return;
            }

            settled = true;
            thumbnailResolve(createFallbackThumbnail(file.name));
          }, 1000);

          video.onseeked = () => {
            if (settled) {
              return;
            }

            settled = true;
            window.clearTimeout(timeoutId);

            const maxThumbnailWidth = 960;
            const renderWidth = Math.min(width, maxThumbnailWidth);
            const renderHeight = Math.max(1, Math.round((renderWidth / Math.max(width, 1)) * height));
            const canvas = document.createElement("canvas");
            canvas.width = renderWidth;
            canvas.height = renderHeight;
            const context = canvas.getContext("2d");

            if (!context) {
              thumbnailResolve(createFallbackThumbnail(file.name));
              return;
            }

            context.drawImage(video, 0, 0, renderWidth, renderHeight);
            thumbnailResolve(canvas.toDataURL("image/jpeg", 0.76));
          };
        });
      } catch {
        thumbnail = createFallbackThumbnail(file.name);
      }

      resolve({
        id: createId("upload"),
        name: file.name,
        file,
        source: "file",
        durationSec,
        width,
        height,
        sizeBytes: file.size,
        codec: file.type || "video/mp4",
        thumbnail
      });
    };

    video.onerror = () =>
      resolve({
        id: createId("upload"),
        name: file.name,
        file,
        source: "file",
        durationSec: 0,
        width: 1920,
        height: 1080,
        sizeBytes: file.size,
        codec: file.type || "video/mp4",
        thumbnail: createFallbackThumbnail(file.name)
      });
  });

  const descriptor = await loaded;
  URL.revokeObjectURL(objectUrl);
  return descriptor;
}

function uploadFileWithProgress(
  file: File,
  onProgress: (progress: number, loadedBytes: number, totalBytes: number) => void,
  xhrRef: React.MutableRefObject<XMLHttpRequest | null>
) {
  return new Promise<UploadApiResponse>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open("POST", "/api/upload");
    xhr.responseType = "json";

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }

      onProgress(
        Math.max(1, Math.min(100, Math.round((event.loaded / event.total) * 100))),
        event.loaded,
        event.total
      );
    };

    xhr.onload = () => {
      xhrRef.current = null;
      const payload =
        typeof xhr.response === "object" && xhr.response
          ? (xhr.response as UploadApiResponse | { detail?: string })
          : JSON.parse(xhr.responseText || "{}");

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(payload as UploadApiResponse);
        return;
      }

      reject(new Error((payload as { detail?: string }).detail || "Upload gagal."));
    };

    xhr.onerror = () => {
      xhrRef.current = null;
      reject(new Error("Koneksi upload gagal."));
    };

    xhr.onabort = () => {
      xhrRef.current = null;
      reject(new DOMException("Upload dibatalkan.", "AbortError"));
    };

    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });
}

function mapStageMessage(stage: BackendProcessingStage, fallback?: string) {
  if (fallback?.trim()) {
    return fallback;
  }

  switch (stage) {
    case "uploading":
      return "Video sedang diunggah ke server.";
    case "transcribing":
      return "Audio sedang ditranskripsi dengan Whisper.";
    case "scoring":
      return "GPT-4o-mini sedang memilih 3 segmen terbaik.";
    case "cutting":
      return "Backend sedang memotong 3 clip MP4 dengan ffmpeg.";
    case "ready":
      return "Tiga clip kandidat sudah siap direview.";
    case "error":
      return "Proses gagal. Silakan coba lagi.";
    default:
      return "Siap menerima upload baru.";
  }
}

function mapStatusToProjectStatus(stage: BackendProcessingStage) {
  if (stage === "ready") {
    return "ready" as const;
  }

  if (stage === "error") {
    return "error" as const;
  }

  return "processing" as const;
}

function normalizeBackendClips(payload: ClipsApiResponse["clips"]): GeneratedClip[] {
  return payload.map((clip) => ({
    id: clip.id,
    startSec: clip.start_sec,
    endSec: clip.end_sec,
    score: clip.score,
    hookReason: clip.hook_reason,
    captionSuggestion: clip.caption_suggestion,
    filename: clip.filename,
    downloadUrl: clip.download_url
  }));
}

export function UploadEngine() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadXhrRef = useRef<XMLHttpRequest | null>(null);
  const pollAbortRef = useRef<AbortController | null>(null);
  const activeProjectIdRef = useRef<string | null>(null);
  const activeQueueIdRef = useRef<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlValue, setUrlValue] = useState("");
  const [working, setWorking] = useState(false);
  const [flowMessage, setFlowMessage] = useState("Pilih satu video, lalu sistem akan langsung memproses dan membuka hasil review.");
  const [activeUploadName, setActiveUploadName] = useState<string | null>(null);
  const [activeUploadSizeBytes, setActiveUploadSizeBytes] = useState<number | null>(null);
  const [uploadTelemetry, setUploadTelemetry] = useState<UploadTelemetry | null>(null);
  const uploadStartedAtRef = useRef<number | null>(null);

  const projects = useClipForgeStore((state) => state.projects);
  const queue = useClipForgeStore((state) => state.queue);
  const preferences = useClipForgeStore((state) => state.preferences);
  const currentProjectId = useClipForgeStore((state) => state.currentProjectId);
  const processingStage = useClipForgeStore((state) => state.processingStage);
  const processingProgress = useClipForgeStore((state) => state.processingProgress);
  const addQueueItem = useClipForgeStore((state) => state.addQueueItem);
  const updateQueueItem = useClipForgeStore((state) => state.updateQueueItem);
  const removeQueueItem = useClipForgeStore((state) => state.removeQueueItem);
  const createProjectFromUpload = useClipForgeStore((state) => state.createProjectFromUpload);
  const removeProject = useClipForgeStore((state) => state.removeProject);
  const updateProject = useClipForgeStore((state) => state.updateProject);
  const resetProcessingState = useClipForgeStore((state) => state.resetProcessingState);
  const setCurrentProjectId = useClipForgeStore((state) => state.setCurrentProjectId);
  const setProcessingStatus = useClipForgeStore((state) => state.setProcessingStatus);
  const setGeneratedClips = useClipForgeStore((state) => state.setGeneratedClips);

  const canUpload = !working;
  const recentProjects = useMemo(() => projects.slice(0, 3), [projects]);
  const displayStage = working ? processingStage : "idle";
  const displayProgress = working ? Math.max(processingProgress, 4) : 0;
  const stageCategory = getStageCategory(displayStage);

  function resetLocalFlow(message?: string) {
    setWorking(false);
    setError(null);
    setActiveUploadName(null);
    setActiveUploadSizeBytes(null);
    setUploadTelemetry(null);
    setFlowMessage(message ?? "Pilih satu video, lalu sistem akan langsung memproses dan membuka hasil review.");
    activeProjectIdRef.current = null;
    activeQueueIdRef.current = null;
    uploadXhrRef.current = null;
    pollAbortRef.current = null;
    uploadStartedAtRef.current = null;
    resetProcessingState();
  }

  function cancelActiveUpload() {
    uploadXhrRef.current?.abort();
    pollAbortRef.current?.abort();

    if (activeQueueIdRef.current) {
      removeQueueItem(activeQueueIdRef.current);
    }

    if (activeProjectIdRef.current) {
      removeProject(activeProjectIdRef.current);
    }

    resetLocalFlow("Proses dibatalkan. Kamu bisa memilih video lain kapan saja.");
  }

  async function beginBackendProcessing(projectId: string) {
    const response = await fetch(`/api/process/${projectId}`, {
      method: "POST",
      headers: preferences.openAiKey ? { "x-ai-api-key": preferences.openAiKey } : undefined
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { detail?: string };
      throw new Error(payload.detail || "Backend gagal memulai proses AI.");
    }
  }

  async function fetchClips(projectId: string) {
    const response = await fetch(`/api/clips/${projectId}`, { cache: "no-store" });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { detail?: string };
      throw new Error(payload.detail || "Daftar clip belum tersedia.");
    }

    const payload = (await response.json()) as ClipsApiResponse;
    return normalizeBackendClips(payload.clips);
  }

  async function pollProjectStatus(projectId: string) {
    pollAbortRef.current?.abort();
    const controller = new AbortController();
    pollAbortRef.current = controller;

    while (!controller.signal.aborted) {
      const response = await fetch(`/api/status/${projectId}`, {
        cache: "no-store",
        signal: controller.signal
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { detail?: string };
        throw new Error(payload.detail || "Status project tidak bisa dibaca.");
      }

      const status = (await response.json()) as StatusApiResponse;
      setProcessingStatus(status.stage, status.progress);
      setFlowMessage(mapStageMessage(status.stage, status.message));
      updateProject(projectId, (project) => ({
        ...project,
        status: mapStatusToProjectStatus(status.stage),
        progress: status.progress,
        insight: mapStageMessage(status.stage, status.message),
        processingSteps: getProcessingSnapshot(status.progress).steps,
        updatedAt: new Date().toISOString()
      }));

      if (activeQueueIdRef.current) {
        updateQueueItem(activeQueueIdRef.current, {
          status: status.stage === "ready" ? "ready" : status.stage === "error" ? "error" : "processing",
          progress: status.progress
        });
      }

      if (status.stage === "ready") {
        const clips = await fetchClips(projectId);
        setGeneratedClips(projectId, clips);
        if (activeQueueIdRef.current) {
          updateQueueItem(activeQueueIdRef.current, { status: "ready", progress: 100 });
          window.setTimeout(() => {
            if (activeQueueIdRef.current) {
              removeQueueItem(activeQueueIdRef.current);
            }
          }, 900);
        }
        setFlowMessage("Tiga clip kandidat sudah siap direview.");
        setWorking(false);
        pollAbortRef.current = null;
        router.push(`/project/${projectId}/clips`);
        return;
      }

      if (status.stage === "error") {
        throw new Error(status.error || status.message || "Proses AI gagal.");
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  async function handleDescriptor(descriptor: UploadDescriptor) {
    if (!descriptor.file) {
      throw new Error("File upload tidak ditemukan.");
    }

    setWorking(true);
    setError(null);
    setActiveUploadName(descriptor.name);
    setActiveUploadSizeBytes(descriptor.sizeBytes);
    setUploadTelemetry({
      loadedBytes: 0,
      totalBytes: descriptor.sizeBytes,
      speedBytesPerSec: 0,
      etaSec: null
    });
    uploadStartedAtRef.current = Date.now();
    setFlowMessage("Video sedang diunggah ke backend FastAPI.");
    setProcessingStatus("uploading", 0);
    setCurrentProjectId(null);

    const queueItem: QueueItem = {
      id: descriptor.id,
      name: descriptor.name,
      progress: 0,
      status: "uploading",
      sizeBytes: descriptor.sizeBytes
    };

    addQueueItem(queueItem);
    activeQueueIdRef.current = descriptor.id;

    try {
      const uploadPayload = await uploadFileWithProgress(
        descriptor.file,
        (progress, loadedBytes, totalBytes) => {
          const startedAt = uploadStartedAtRef.current ?? Date.now();
          const elapsedSec = Math.max((Date.now() - startedAt) / 1000, 0.001);
          const speedBytesPerSec = loadedBytes / elapsedSec;
          const etaSec =
            loadedBytes < totalBytes && speedBytesPerSec > 0
              ? (totalBytes - loadedBytes) / speedBytesPerSec
              : 0;

          setProcessingStatus("uploading", progress);
          updateQueueItem(descriptor.id, { progress, status: "uploading" });
          setUploadTelemetry({
            loadedBytes,
            totalBytes,
            speedBytesPerSec,
            etaSec
          });
        },
        uploadXhrRef
      );

      setUploadTelemetry((current) =>
        current
          ? {
              ...current,
              loadedBytes: current.totalBytes,
              speedBytesPerSec: current.speedBytesPerSec,
              etaSec: 0
            }
          : current
      );

      const project = createProjectFromUpload({
        ...descriptor,
        projectId: uploadPayload.project_id,
        path: uploadPayload.path,
        serverAssetId: uploadPayload.filename
      });

      activeProjectIdRef.current = project.id;
      setCurrentProjectId(project.id);
      updateProject(project.id, (item) => ({
        ...item,
        status: "processing",
        progress: 8,
        insight: "Upload selesai. Backend sedang memulai transkripsi.",
        processingSteps: getProcessingSnapshot(8).steps,
        updatedAt: new Date().toISOString()
      }));

      await beginBackendProcessing(project.id);
      setFlowMessage("Upload selesai. Backend sedang mentranskripsi audio.");
      await pollProjectStatus(project.id);
    } catch (uploadError) {
      if (uploadError instanceof DOMException && uploadError.name === "AbortError") {
        return;
      }

      if (activeQueueIdRef.current) {
        updateQueueItem(activeQueueIdRef.current, { status: "error" });
        window.setTimeout(() => {
          if (activeQueueIdRef.current) {
            removeQueueItem(activeQueueIdRef.current);
          }
        }, 1200);
      }

      if (activeProjectIdRef.current) {
        updateProject(activeProjectIdRef.current, (project) => ({
          ...project,
          status: "error",
          progress: processingProgress,
          insight: uploadError instanceof Error ? uploadError.message : "Proses backend gagal.",
          updatedAt: new Date().toISOString()
        }));
      }

      setProcessingStatus("error", processingProgress || 100);
      setFlowMessage("Proses gagal. Coba cek Groq atau OpenAI API key lalu upload ulang videonya.");
      setError(uploadError instanceof Error ? uploadError.message : "Upload gagal.");
      setWorking(false);
      pollAbortRef.current = null;
    }
  }

  async function handleFiles(files: FileList | File[]) {
    if (!canUpload) {
      setError("Tunggu proses aktif selesai atau batalkan dulu sebelum upload video baru.");
      return;
    }

    const selected = Array.from(files).slice(0, 1);
    const invalid = selected.find((file) => !isAcceptedFile(file) || file.size > MAX_SIZE_BYTES);

    if (invalid) {
      setError(
        !isAcceptedFile(invalid)
          ? "Format belum didukung. Gunakan MP4, MOV, AVI, MKV, atau WebM."
          : "Ukuran file melebihi 500MB agar tetap aman di Hugging Face free tier."
      );
      return;
    }

    resetProcessingState();
    const [descriptor] = await Promise.all(selected.map((file) => extractVideoMetadata(file)));
    await handleDescriptor(descriptor);
  }

  async function handleImportUrl() {
    if (!urlValue.trim()) {
      setError("Masukkan URL YouTube atau Google Drive dulu.");
      return;
    }

    const source: UploadSource = urlValue.includes("youtube") || urlValue.includes("youtu.be") ? "youtube" : "google-drive";
    const descriptor: UploadDescriptor = {
      id: createId("upload"),
      name: source === "youtube" ? "YouTube Import.mp4" : "Google Drive Import.mp4",
      file: new File([], source === "youtube" ? "youtube_import.mp4" : "drive_import.mp4"),
      url: urlValue,
      source,
      durationSec: 0,
      width: 1920,
      height: 1080,
      sizeBytes: 0,
      codec: "video/mp4",
      thumbnail: createFallbackThumbnail(source === "youtube" ? "YouTube Import" : "Drive Import")
    };

    setError("Import URL belum aktif di backend baru. Untuk saat ini gunakan upload file langsung.");
    void descriptor;
  }

  const activeIndex =
    displayStage === "idle"
      ? -1
      : displayStage === "uploading"
        ? 0
        : displayStage === "transcribing" || displayStage === "scoring" || displayStage === "cutting"
          ? 1
          : displayStage === "ready"
            ? 3
            : 0;

  const stageGuidance =
    displayStage === "uploading"
      ? activeUploadSizeBytes
        ? `Ukuran file ${formatBytes(activeUploadSizeBytes)}. Di Hugging Face Space gratis, upload video sekitar 100MB memang bisa butuh 1-3 menit tergantung koneksi.`
        : "Upload jaringan ke server sedang berjalan. Di Hugging Face Space gratis, file besar memang terasa lebih lambat."
      : displayStage === "transcribing"
        ? "Upload sudah selesai. Sekarang backend sedang mengekstrak audio dan menyiapkan transkripsi."
        : displayStage === "scoring"
          ? "Video sudah masuk server. Model AI sedang memilih potongan terbaik dari transcript."
          : displayStage === "cutting"
            ? "Hampir selesai. ffmpeg sedang memotong clip MP4 final untuk direview."
            : displayStage === "ready"
              ? "Semua langkah utama selesai. Clip kandidat siap dibuka."
              : "Belum ada proses aktif. Pilih satu video untuk memulai.";
  const uploadMetrics =
    displayStage === "uploading" && uploadTelemetry
      ? [
          `Terkirim ${formatBytes(uploadTelemetry.loadedBytes)} / ${formatBytes(uploadTelemetry.totalBytes)}`,
          uploadTelemetry.speedBytesPerSec > 0
            ? `Kecepatan ${formatBytes(uploadTelemetry.speedBytesPerSec)}/s`
            : "Kecepatan mengukur...",
          `Estimasi sisa ${formatEtaLabel(uploadTelemetry.etaSec)}`
        ]
      : null;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="relative overflow-hidden p-0">
        <div className="pointer-events-none hero-orb left-[-120px] top-[-80px] h-72 w-72 bg-primary/20" />
        <div className="pointer-events-none hero-orb bottom-[-120px] right-[-80px] h-72 w-72 bg-cyan-400/15" />
        <div className="relative p-6 md:p-8">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="section-eyebrow">Input Source</p>
              <h3 className="mt-3 text-3xl font-semibold text-white">Upload video lalu backend akan memproses clip sungguhan.</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
                Flow utamanya sekarang nyata: upload ke FastAPI, transkripsi Whisper, scoring GPT-4o-mini, potong 3 clip MP4, lalu review hasilnya.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-white/50">
              <Badge>Max 500MB</Badge>
              <Badge>1 video tiap proses</Badge>
              <Badge>Whisper + GPT-4o-mini</Badge>
            </div>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={async (event) => {
              event.preventDefault();
              setDragging(false);
              await handleFiles(event.dataTransfer.files);
            }}
            className={`group relative rounded-[32px] border-2 border-dashed p-10 text-center transition-all ${
              dragging
                ? "border-primary bg-primary/10 shadow-glow"
                : "border-white/15 bg-black/20 hover:border-cyan-300/30 hover:bg-white/[0.04]"
            }`}
          >
            <motion.div
              animate={{ y: [0, -10, 0], scale: [1, 1.04, 1] }}
              transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] border border-white/10 bg-gradient-to-br from-primary/85 to-accent/75 shadow-glow"
            >
              <UploadCloud className="h-9 w-9 text-white" />
            </motion.div>
            <h3 className="text-2xl font-semibold text-white">Taruh video panjang di sini</h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/60">
              Format MP4, MOV, AVI, MKV, atau WebM. Sesudah upload selesai, backend akan memproses 3 clip kandidat otomatis.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button type="button" className="gap-2" disabled={working}>
                <Film className="h-4 w-4" />
                {working ? "Sedang Memproses..." : "Pilih Video"}
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs text-white/45">
              {ACCEPTED_TYPES.map((type) => (
                <Badge key={type}>{type}</Badge>
              ))}
            </div>
            <input
              ref={inputRef}
              hidden
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              onChange={(event) => {
                if (event.target.files?.length) {
                  void handleFiles(event.target.files);
                }
              }}
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Youtube className="h-4 w-4 text-red-300" />
                <Link2 className="h-4 w-4 text-cyan-300" />
                <p className="text-sm font-medium text-white">Import URL</p>
              </div>
              <Input
                value={urlValue}
                onChange={(event) => setUrlValue(event.target.value)}
                placeholder="Fitur ini belum aktif. Gunakan upload file langsung untuk pipeline real."
              />
            </div>
            <Button className="h-auto min-h-[56px] px-6" onClick={handleImportUrl} disabled={working}>
              {working ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Impor URL"}
            </Button>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {recentProjects.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-white/55 md:col-span-3">
                Project terbaru akan muncul di sini setelah backend selesai memotong clip.
              </div>
            ) : null}
            {recentProjects.map((project) => (
              <Link
                key={project.id}
                href={getProjectPrimaryRoute(project)}
                className="rounded-[24px] border border-white/10 bg-black/20 p-4 transition hover:border-cyan-300/20 hover:bg-black/30"
              >
                <div
                  className="aspect-video rounded-2xl border border-white/10 bg-cover bg-center"
                  style={{ backgroundImage: `url("${project.asset.thumbnail}")` }}
                />
                <p className="mt-3 font-medium text-white">{project.name}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/50">
                  <span>{formatDuration(project.asset.durationSec)}</span>
                  <span>{project.asset.width}x{project.asset.height}</span>
                  <span>{formatBytes(project.asset.sizeBytes)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Card>

      <Card className="space-y-5">
        <div>
          <p className="section-eyebrow">Status</p>
          <p className="mt-3 text-2xl font-semibold text-white">Progress backend yang sedang berjalan.</p>
          <p className="mt-2 text-sm text-white/55">Panel ini membaca status nyata dari FastAPI, bukan simulasi.</p>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-medium text-white">{activeUploadName ?? "Belum ada video aktif"}</p>
              <p className="mt-2 text-sm leading-6 text-white/60">{flowMessage}</p>
              <p className="mt-2 text-sm leading-6 text-white/45">{stageGuidance}</p>
              {currentProjectId ? (
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/40">Project ID: {currentProjectId}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{stageCategory}</Badge>
              <Badge>{displayStage === "idle" ? "siap" : displayStage}</Badge>
              {working ? (
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={cancelActiveUpload}>
                  <XCircle className="h-4 w-4" />
                  Batal Upload
                </Button>
              ) : null}
            </div>
          </div>
          <Progress className="mt-4" value={displayProgress} />
          {uploadMetrics ? (
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/55">
              {uploadMetrics.map((metric) => (
                <span key={metric} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  {metric}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="grid gap-3">
          {SIMPLE_FLOW.map((step, index) => {
            const complete = index < activeIndex || displayStage === "ready";
            const active = index === activeIndex && displayStage !== "ready";

            return (
              <div key={step.id} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {complete ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                    ) : active ? (
                      <LoaderCircle className="h-5 w-5 animate-spin text-cyan-300" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border border-white/15" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{step.label}</p>
                    <p className="mt-1 text-sm leading-6 text-white/60">{step.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-[28px] border border-cyan-300/15 bg-cyan-300/8 p-5">
          <p className="font-medium text-white">Pipeline backend yang aktif</p>
          <div className="mt-3 space-y-2 text-sm text-white/65">
            <p>1. Upload video ke `/api/upload` dengan progress nyata.</p>
            <p>2. Trigger `/api/process/{'{project_id}'}` untuk Whisper dan GPT-4o-mini.</p>
            <p>3. Poll `/api/status/{'{project_id}'}` sampai clip siap direview.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
