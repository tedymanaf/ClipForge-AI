"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Film, Link2, LoaderCircle, UploadCloud, Youtube } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useClipForgeStore } from "@/store/useClipForgeStore";
import { QueueItem, UploadDescriptor, UploadSource } from "@/types";
import { createId, formatBytes, formatDuration, svgToDataUri } from "@/lib/utils";

const MAX_SIZE_BYTES = 4 * 1024 * 1024 * 1024;
const ACCEPTED_TYPES = [".mp4", ".mov", ".avi", ".mkv", ".webm"];

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
        video.currentTime = Math.min(1, Math.max(0, durationSec / 4));

        thumbnail = await new Promise<string>((thumbnailResolve) => {
          video.onseeked = () => {
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext("2d");
            context?.drawImage(video, 0, 0, width, height);
            thumbnailResolve(canvas.toDataURL("image/jpeg", 0.82));
          };

          setTimeout(() => thumbnailResolve(createFallbackThumbnail(file.name)), 1000);
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

export function UploadEngine() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlValue, setUrlValue] = useState("");
  const [working, setWorking] = useState(false);
  const queue = useClipForgeStore((state) => state.queue);
  const addQueueItem = useClipForgeStore((state) => state.addQueueItem);
  const updateQueueItem = useClipForgeStore((state) => state.updateQueueItem);
  const removeQueueItem = useClipForgeStore((state) => state.removeQueueItem);
  const createProjectFromUpload = useClipForgeStore((state) => state.createProjectFromUpload);
  const seedDemoProjects = useClipForgeStore((state) => state.seedDemoProjects);
  const projects = useClipForgeStore((state) => state.projects);

  const canUploadMore = queue.length < 5;
  const recentProjects = useMemo(() => projects.slice(0, 3), [projects]);

  async function bestEffortPersistUpload(descriptor: UploadDescriptor) {
    if (!descriptor.file) {
      return descriptor;
    }

    try {
      const formData = new FormData();
      formData.append("file", descriptor.file);
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      if (!response.ok) {
        return descriptor;
      }

      const payload = (await response.json()) as { path?: string };
      return {
        ...descriptor,
        path: payload.path ?? descriptor.path
      };
    } catch {
      // Local-first flow should remain usable even if the route is unavailable.
      return descriptor;
    }
  }

  async function processDescriptor(descriptor: UploadDescriptor) {
    const queueItem: QueueItem = {
      id: descriptor.id,
      name: descriptor.name,
      progress: 0,
      status: "uploading",
      sizeBytes: descriptor.sizeBytes
    };

    addQueueItem(queueItem);
    for (const progress of [15, 34, 58, 76, 92]) {
      updateQueueItem(descriptor.id, { progress });
      await new Promise((resolve) => setTimeout(resolve, 140));
    }

    const persistedDescriptor = await bestEffortPersistUpload(descriptor);

    const project = createProjectFromUpload(persistedDescriptor);
    updateQueueItem(descriptor.id, { progress: 100, status: "queued" });
    setTimeout(() => removeQueueItem(descriptor.id), 1000);
    return project;
  }

  async function handleFiles(files: FileList | File[]) {
    setError(null);

    if (!canUploadMore) {
      setError("Maksimum 5 video dalam antrean aktif. Tunggu satu selesai dulu ya.");
      return;
    }

    const selected = Array.from(files).slice(0, 5 - queue.length);
    const invalid = selected.find((file) => !isAcceptedFile(file) || file.size > MAX_SIZE_BYTES);

    if (invalid) {
      setError(
        !isAcceptedFile(invalid)
          ? "Format belum didukung. Gunakan MP4, MOV, AVI, MKV, atau WebM."
          : "Ukuran file melebihi 4GB. Coba kompres video atau bagi jadi batch."
      );
      return;
    }

    setWorking(true);

    try {
      const descriptors = await Promise.all(selected.map((file) => extractVideoMetadata(file)));
      const createdProjects = [];
      for (const descriptor of descriptors) {
        const project = await processDescriptor(descriptor);
        createdProjects.push(project);
      }

      const firstProject = createdProjects[0];
      if (firstProject) {
        router.push(`/project/${firstProject.id}/processing`);
      }
    } finally {
      setWorking(false);
    }
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
      url: urlValue,
      source,
      durationSec: 540,
      width: 1920,
      height: 1080,
      sizeBytes: 1_400_000_000,
      codec: "H.264",
      thumbnail: createFallbackThumbnail(source === "youtube" ? "YouTube Import" : "Drive Import")
    };

    setWorking(true);
    try {
      const project = await processDescriptor(descriptor);
      router.push(`/project/${project.id}/processing`);
    } finally {
      setWorking(false);
    }
  }

  function activateDemoMode() {
    seedDemoProjects();
    const first = useClipForgeStore.getState().projects[0];
    if (first) {
      router.push(`/project/${first.id}/clips`);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="relative overflow-hidden p-0">
        <div className="pointer-events-none hero-orb left-[-120px] top-[-80px] h-72 w-72 bg-primary/25" />
        <div className="pointer-events-none hero-orb bottom-[-120px] right-[-80px] h-72 w-72 bg-cyan-400/20" />
        <div className="relative p-6 md:p-8">
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
                : "border-white/15 bg-black/20 hover:border-cyan-300/40 hover:bg-white/5"
            }`}
          >
            <motion.div
              animate={{ y: [0, -10, 0], scale: [1, 1.04, 1] }}
              transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-primary/80 to-accent/80 shadow-glow"
            >
              <UploadCloud className="h-9 w-9 text-white" />
            </motion.div>
            <h3 className="text-2xl font-semibold text-white">Drop long-form videos here</h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/60">
              MP4, MOV, AVI, MKV, WebM hingga 4GB. Batch sampai 5 video sekaligus, thumbnail preview otomatis, plus metadata dasar seperti durasi, resolusi, dan codec.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button type="button" className="gap-2">
                <Film className="h-4 w-4" />
                Choose Videos
              </Button>
              <Button type="button" variant="outline" onClick={(event) => { event.stopPropagation(); activateDemoMode(); }}>
                Try without upload
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
              multiple
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              onChange={(event) => {
                if (event.target.files?.length) {
                  handleFiles(event.target.files);
                }
              }}
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Youtube className="h-4 w-4 text-red-300" />
                <Link2 className="h-4 w-4 text-cyan-300" />
                <p className="text-sm font-medium text-white">Import dari YouTube atau Google Drive</p>
              </div>
              <Input
                value={urlValue}
                onChange={(event) => setUrlValue(event.target.value)}
                placeholder="Paste YouTube / Google Drive link"
              />
            </div>
            <Button className="h-auto min-h-[56px] px-6" onClick={handleImportUrl} disabled={working}>
              {working ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Import URL"}
            </Button>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {recentProjects.map((project) => (
              <Link
                key={project.id}
                href={`/project/${project.id}/clips`}
                className="rounded-[24px] border border-white/10 bg-black/20 p-4 transition hover:border-cyan-300/25 hover:bg-black/30"
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
          <p className="font-medium text-white">Upload Queue</p>
          <p className="text-sm text-white/55">Realtime progress with local-first persistence and queue badges.</p>
        </div>

        {queue.length === 0 ? (
          <div className="rounded-[28px] border border-white/10 bg-black/20 p-6 text-sm text-white/55">
            Queue masih kosong. Drop video atau coba mode demo buat lihat pipeline lengkap.
          </div>
        ) : (
          queue.map((item) => (
            <div key={item.id} className="rounded-[28px] border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{item.name}</p>
                  <p className="text-sm text-white/45">{formatBytes(item.sizeBytes)}</p>
                </div>
                <Badge>{item.status}</Badge>
              </div>
              <Progress className="mt-4" value={item.progress} />
            </div>
          ))
        )}

        <div className="rounded-[28px] border border-cyan-300/15 bg-cyan-300/8 p-5">
          <p className="font-medium text-white">Processing targets</p>
          <div className="mt-3 space-y-2 text-sm text-white/65">
            <p>Start processing under 3 seconds after upload.</p>
            <p>First clip visible in under 2 minutes for 10-minute source.</p>
            <p>Bahasa Indonesia transcription and metadata ready by default.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
