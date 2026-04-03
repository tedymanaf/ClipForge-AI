"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Film, Link2, LoaderCircle, UploadCloud, Youtube } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { analyzeProject } from "@/modules/analysis/AnalysisEngine";
import { getProjectPrimaryRoute } from "@/lib/project-routing";
import { useClipForgeStore } from "@/store/useClipForgeStore";
import { QueueItem, UploadDescriptor, UploadSource } from "@/types";
import { createId, formatBytes, formatDuration, sleep, svgToDataUri } from "@/lib/utils";

const MAX_SIZE_BYTES = 4 * 1024 * 1024 * 1024;
const ACCEPTED_TYPES = [".mp4", ".mov", ".avi", ".mkv", ".webm"];
const SIMPLE_FLOW = [
  { id: "upload", label: "Upload video", description: "File masuk ke server dan project dibuat." },
  { id: "review", label: "Review clip", description: "AI menyusun 3 kandidat terbaik untuk direview." },
  { id: "edit", label: "Edit cepat", description: "Rapikan hook, subtitle, dan frame utama." },
  { id: "download", label: "Download MP4", description: "Ambil hasil akhir dalam format MP4." }
] as const;
type UploadFlowStage = "idle" | "uploading" | "analyzing" | "ready" | "error";

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
        video.currentTime = durationSec > 0 ? Math.min(Math.max(durationSec * 0.25, 0.1), Math.max(durationSec - 0.1, 0.1)) : 0;

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

export function UploadEngine() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlValue, setUrlValue] = useState("");
  const [working, setWorking] = useState(false);
  const [flowStage, setFlowStage] = useState<UploadFlowStage>("idle");
  const [flowMessage, setFlowMessage] = useState("Pilih satu video, lalu aplikasi akan langsung membawamu ke halaman review clip.");
  const [activeUploadName, setActiveUploadName] = useState<string | null>(null);
  const queue = useClipForgeStore((state) => state.queue);
  const addQueueItem = useClipForgeStore((state) => state.addQueueItem);
  const updateQueueItem = useClipForgeStore((state) => state.updateQueueItem);
  const removeQueueItem = useClipForgeStore((state) => state.removeQueueItem);
  const createProjectFromUpload = useClipForgeStore((state) => state.createProjectFromUpload);
  const updateProject = useClipForgeStore((state) => state.updateProject);
  const seedDemoProjects = useClipForgeStore((state) => state.seedDemoProjects);
  const projects = useClipForgeStore((state) => state.projects);

  const canUploadMore = queue.length < 1;
  const recentProjects = useMemo(() => projects.slice(0, 3), [projects]);

  const flowProgress =
    flowStage === "idle"
      ? 0
      : flowStage === "uploading"
        ? 32
        : flowStage === "analyzing"
          ? 74
          : flowStage === "ready"
            ? 100
            : 0;

  async function bestEffortPersistUpload(descriptor: UploadDescriptor) {
    if (!descriptor.file) {
      return descriptor;
    }

    const formData = new FormData();
    formData.append("file", descriptor.file);
    const response = await fetch("/api/upload", { method: "POST", body: formData });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(
        payload.error || "Video gagal diunggah ke server. Preview dan export butuh source video asli, jadi upload harus berhasil dulu."
      );
    }

    const payload = (await response.json()) as { id?: string; path?: string };
    return {
      ...descriptor,
      serverAssetId: payload.id ?? descriptor.serverAssetId,
      path: payload.path ?? descriptor.path
    };
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
    try {
      for (const progress of [15, 34, 58, 76, 92]) {
        updateQueueItem(descriptor.id, { progress });
        await new Promise((resolve) => setTimeout(resolve, 140));
      }

      const persistedDescriptor = await bestEffortPersistUpload(descriptor);
      const project = createProjectFromUpload(persistedDescriptor);
      updateProject(project.id, (item) => ({
        ...item,
        status: "processing",
        progress: 56,
        insight: "Menyusun 3 clip terbaik untuk kamu review.",
        updatedAt: new Date().toISOString()
      }));

      setFlowStage("analyzing");
      setFlowMessage("Upload selesai. AI sedang memilih clip terbaik, menyiapkan subtitle, dan metadata dasar.");
      await sleep(220);
      const sourceProject = useClipForgeStore.getState().projects.find((item) => item.id === project.id) ?? {
        ...project,
        status: "processing" as const,
        progress: 78,
        insight: "Menyusun 3 clip terbaik untuk kamu review."
      };

      const analyzed = await analyzeProject(sourceProject);
      updateProject(project.id, () => analyzed);

      updateQueueItem(descriptor.id, { progress: 100, status: "queued" });
      setTimeout(() => removeQueueItem(descriptor.id), 1000);
      return analyzed;
    } catch (error) {
      updateQueueItem(descriptor.id, { status: "error" });
      setTimeout(() => removeQueueItem(descriptor.id), 1800);
      throw error;
    }
  }

  async function handleFiles(files: FileList | File[]) {
    setError(null);

    if (!canUploadMore) {
      setError("Untuk versi sederhana ini, proses satu video dulu sampai review clip selesai.");
      return;
    }

    const selected = Array.from(files).slice(0, 1);
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
        setActiveUploadName(descriptor.name);
        setFlowStage("uploading");
        setFlowMessage("Video sedang diunggah dan project sedang dibuat.");
        const project = await processDescriptor(descriptor);
        createdProjects.push(project);
      }

      const firstProject = createdProjects[0];
      if (firstProject) {
        setFlowStage("ready");
        setFlowMessage("Selesai. Clip terbaik sudah siap direview.");
        router.push(`/project/${firstProject.id}/clips`);
      }
    } catch (uploadError) {
      setFlowStage("error");
      setFlowMessage("Upload atau analisis gagal. Coba reset workspace lalu upload ulang satu video.");
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Upload video ke server gagal. Project belum dibuat supaya tidak berakhir di preview logo saja."
      );
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
      setActiveUploadName(descriptor.name);
      setFlowStage("uploading");
      setFlowMessage("Link diterima. Project sedang dibuat dari sumber URL.");
      const project = await processDescriptor(descriptor);
      setFlowStage("ready");
      setFlowMessage("Selesai. Clip terbaik sudah siap direview.");
      router.push(`/project/${project.id}/clips`);
    } catch (uploadError) {
      setFlowStage("error");
      setFlowMessage("Import URL gagal. Coba cek link atau pakai upload file langsung.");
      setError(uploadError instanceof Error ? uploadError.message : "Import URL gagal.");
    } finally {
      setWorking(false);
    }
  }

  function activateDemoMode() {
    seedDemoProjects();
    const first = useClipForgeStore.getState().projects[0];
    if (first) {
      router.push(getProjectPrimaryRoute(first));
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="relative overflow-hidden p-0">
        <div className="pointer-events-none hero-orb left-[-120px] top-[-80px] h-72 w-72 bg-primary/20" />
        <div className="pointer-events-none hero-orb bottom-[-120px] right-[-80px] h-72 w-72 bg-cyan-400/15" />
        <div className="relative p-6 md:p-8">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="section-eyebrow">Input Source</p>
              <h3 className="mt-3 text-3xl font-semibold text-white">Upload video lalu langsung masuk ke review clip.</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
                Flow utamanya sekarang dibuat sesingkat mungkin: upload, review clip, edit seperlunya, lalu download MP4.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-white/50">
              <Badge>Max 4GB</Badge>
              <Badge>1 video tiap proses</Badge>
              <Badge>Langsung ke review</Badge>
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
              Format MP4, MOV, AVI, MKV, atau WebM. Setelah file masuk, ClipForge akan upload, menganalisis, lalu membuka halaman review clip secara otomatis.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button type="button" className="gap-2">
                <Film className="h-4 w-4" />
                Pilih Video
              </Button>
              <Button type="button" variant="outline" onClick={(event) => { event.stopPropagation(); activateDemoMode(); }}>
                Coba tanpa upload
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
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Youtube className="h-4 w-4 text-red-300" />
                <Link2 className="h-4 w-4 text-cyan-300" />
                <p className="text-sm font-medium text-white">Atau impor dari YouTube / Google Drive</p>
              </div>
              <Input
                value={urlValue}
                onChange={(event) => setUrlValue(event.target.value)}
                placeholder="Tempel link video di sini"
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
                Project terbaru akan muncul di sini setelah proses upload dan analisis selesai.
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
          <p className="mt-3 text-2xl font-semibold text-white">Indikator proses yang lebih jujur dan ringkas.</p>
          <p className="mt-2 text-sm text-white/55">Kamu cukup lihat satu tempat ini untuk tahu file sedang di tahap mana dan apa langkah berikutnya.</p>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-medium text-white">{activeUploadName ?? "Belum ada video aktif"}</p>
              <p className="mt-2 text-sm leading-6 text-white/60">{flowMessage}</p>
            </div>
            <Badge>
              {flowStage === "idle"
                ? "siap"
                : flowStage === "uploading"
                  ? "upload"
                  : flowStage === "analyzing"
                    ? "reviewing"
                    : flowStage === "ready"
                      ? "siap review"
                      : "error"}
            </Badge>
          </div>
          <Progress className="mt-4" value={flowProgress} />
        </div>

        <div className="grid gap-3">
          {SIMPLE_FLOW.map((step, index) => {
            const activeIndex =
              flowStage === "idle"
                ? -1
                : flowStage === "uploading"
                  ? 0
                  : flowStage === "analyzing"
                    ? 1
                    : flowStage === "ready"
                      ? 3
                      : 0;
            const complete = index < activeIndex || flowStage === "ready";
            const active = index === activeIndex && flowStage !== "ready";

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
          <p className="font-medium text-white">Flow baru yang dituju</p>
          <div className="mt-3 space-y-2 text-sm text-white/65">
            <p>Upload harus langsung terasa jalan, bukan diam di halaman yang sama.</p>
            <p>Review clip harus jadi tujuan pertama sesudah upload berhasil.</p>
            <p>Download MP4 harus lebih utama daripada paket teknis lain.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
