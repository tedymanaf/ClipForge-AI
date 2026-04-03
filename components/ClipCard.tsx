"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Clock3, Download, Loader2, PencilLine, Play, WandSparkles, X } from "lucide-react";

import { createDownloadFileName } from "@/lib/media";
import { ViralScoreBadge } from "@/components/ViralScoreBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDuration } from "@/lib/utils";
import { useClipForgeStore } from "@/store/useClipForgeStore";
import { ClipCandidate, Platform, Project } from "@/types";

const platformLabels: Record<Platform, string> = {
  tiktok: "TikTok 9:16",
  instagram: "Reels 9:16",
  youtube: "Shorts 9:16",
  square: "Square 1:1"
};

export function ClipCard({
  clip,
  project
}: {
  clip: ClipCandidate;
  project: Project;
}) {
  const router = useRouter();
  const regenerateClip = useClipForgeStore((state) => state.regenerateClip);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const projectId = project.id;
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewState, setPreviewState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"source" | "poster" | "solid" | null>(null);
  const [previewMessage, setPreviewMessage] = useState("Preview short sedang disiapkan.");
  const [downloadState, setDownloadState] = useState<"idle" | "working" | "done" | "error">("idle");
  const defaultPreviewPlatform = useMemo<Platform>(
    () => (clip.platforms.includes("youtube") ? "youtube" : clip.platforms[0] ?? "tiktok"),
    [clip.platforms]
  );
  const [selectedPreviewPlatform, setSelectedPreviewPlatform] = useState<Platform>(defaultPreviewPlatform);
  const [actionMessage, setActionMessage] = useState("Play akan membuka preview vertikal 9:16, dan Download akan mengunduh bundle clip.");
  const [messageTone, setMessageTone] = useState<"neutral" | "success" | "error">("neutral");

  useEffect(() => {
    if (!previewUrl) {
      return;
    }

    return () => {
      window.URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    setSelectedPreviewPlatform(defaultPreviewPlatform);
  }, [defaultPreviewPlatform]);

  function handleRegenerate() {
    const remixed = regenerateClip(projectId, clip.id);
    if (remixed) {
      router.push(`/project/${projectId}/clip/${remixed.id}`);
    }
  }

  function handlePlayPreview() {
    setMessageTone("neutral");
    setActionMessage(`Preview akan dibuka sebagai ${platformLabels[selectedPreviewPlatform]}.`);
    setIsPreviewOpen(true);
  }

  useEffect(() => {
    if (!isPreviewOpen) {
      return;
    }

    let cancelled = false;

    const runPreviewLoad = async () => {
      try {
        setPreviewState("loading");
        setPreviewMessage(`Menyiapkan preview ${platformLabels[selectedPreviewPlatform]}...`);

        const response = await fetch("/api/preview", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            clip,
            asset: project.asset,
            platform: selectedPreviewPlatform
          })
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error || "Preview clip gagal disiapkan.");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const modeHeader = response.headers.get("X-ClipForge-Preview-Mode");
        const nextPreviewMode =
          modeHeader === "source" || modeHeader === "poster" || modeHeader === "solid"
            ? modeHeader
            : null;

        if (cancelled) {
          window.URL.revokeObjectURL(url);
          return;
        }

        setPreviewUrl((currentUrl) => {
          if (currentUrl) {
            window.URL.revokeObjectURL(currentUrl);
          }
          return url;
        });
        setPreviewMode(nextPreviewMode);
        setPreviewState("ready");
        setActionMessage(
          nextPreviewMode === "source"
            ? `Preview ${platformLabels[selectedPreviewPlatform]} memakai footage asli.`
            : nextPreviewMode === "poster"
              ? `Preview ${platformLabels[selectedPreviewPlatform]} memakai poster animasi karena footage asli belum tersedia di server.`
              : `Preview ${platformLabels[selectedPreviewPlatform]} memakai fallback canvas karena footage asli belum tersedia di server.`
        );
        setPreviewMessage(
          nextPreviewMode === "source"
            ? `Preview ${platformLabels[selectedPreviewPlatform]} siap diputar dari footage asli.`
            : nextPreviewMode === "poster"
              ? `Preview ${platformLabels[selectedPreviewPlatform]} memakai poster animasi karena footage asli tidak tersedia di server.`
              : `Preview ${platformLabels[selectedPreviewPlatform]} memakai fallback canvas karena footage asli tidak tersedia di server.`
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        setPreviewMode(null);
        setPreviewState("error");
        setPreviewMessage(error instanceof Error ? error.message : "Preview clip gagal disiapkan.");
      }
    };

    void runPreviewLoad();

    return () => {
      cancelled = true;
    };
  }, [clip, isPreviewOpen, project.asset, selectedPreviewPlatform]);

  useEffect(() => {
    if (!isPreviewOpen || previewState !== "ready" || !previewUrl) {
      return;
    }

    const video = videoRef.current;
    if (!video) {
      return;
    }

    const handleLoadedData = () => {
      void video.play().catch(() => {
        // Ignore autoplay rejection and let the user press play manually.
      });
    };

    if (video.readyState >= 2) {
      handleLoadedData();
    }

    video.addEventListener("loadeddata", handleLoadedData);
    return () => {
      video.pause();
      video.removeEventListener("loadeddata", handleLoadedData);
    };
  }, [isPreviewOpen, previewState, previewUrl]);

  function handleClosePreview() {
    setIsPreviewOpen(false);
    setPreviewState("idle");
    setPreviewMode(null);
    setPreviewMessage("Preview short sedang disiapkan.");
  }

  async function handleDownload() {
    try {
      setDownloadState("working");
      setMessageTone("neutral");
      setActionMessage("Menyiapkan bundle export clip...");

      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          clip,
          metadata: project.metadata[clip.id],
          asset: project.asset,
          thumbnails: project.thumbnails[clip.id] ?? [],
          cues: project.captions[clip.id] ?? [],
          captionStyle: project.settings.captionStyle
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Permintaan download clip gagal.");
      }

      const blob = await response.blob();
      const exportNotice = response.headers.get("X-ClipForge-Export-Notice");
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = createDownloadFileName(clip.title, "zip");
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);

      setDownloadState("done");
      setMessageTone("success");
      setActionMessage(
        exportNotice === "Export completed."
          ? "Bundle clip berhasil diunduh ke folder Downloads."
          : exportNotice || "Bundle clip berhasil diunduh ke folder Downloads."
      );
    } catch (error) {
      setDownloadState("error");
      setMessageTone("error");
      setActionMessage(error instanceof Error ? error.message : "Download clip gagal. Silakan coba lagi.");
    }
  }

  const lineClampTwo = {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden"
  };

  return (
    <>
      <Card className="flex h-full flex-col overflow-hidden p-0">
        <div
          className="relative aspect-[9/16] w-full overflow-hidden rounded-t-[28px] border-b border-white/10 bg-slate-950 bg-cover bg-center"
          style={clip.previewImage ? { backgroundImage: `url("${clip.previewImage}")` } : undefined}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
            <ViralScoreBadge score={clip.viralScore} />
            <Badge className="gap-2 bg-black/35 text-white/80">
              <Clock3 className="h-3.5 w-3.5" />
              {formatDuration(clip.durationSec)}
            </Badge>
          </div>
          <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center px-4">
            <button
              type="button"
              onClick={handlePlayPreview}
              className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white shadow-[0_10px_45px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:scale-[1.03] hover:bg-black/60 disabled:cursor-not-allowed disabled:opacity-45"
              aria-label="Putar preview clip"
            >
              <Play className="ml-1 h-5 w-5" />
            </button>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="text-base font-semibold text-white/95">{clip.title}</p>
            <p className="mt-2 text-xs leading-5 text-white/70" style={lineClampTwo}>{clip.hookLine}</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            {clip.platforms.map((platform) => (
              <Badge key={platform} className="capitalize">{platform}</Badge>
            ))}
            <span className="text-xs text-white/40">{clip.contentType}</span>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-white/38">Kenapa clip ini menarik</p>
            <div className="mt-3 space-y-2">
              {clip.whyItWorks.slice(0, 2).map((item) => (
                <p key={item} className="text-sm leading-6 text-white/65" style={lineClampTwo}>
                  {item}
                </p>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-white/40">Mulai</p>
              <p className="mt-1 font-semibold text-white">{clip.startSec.toFixed(1)}s</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-white/40">Durasi</p>
              <p className="mt-1 font-semibold text-white">{formatDuration(clip.durationSec)}</p>
            </div>
          </div>

          <div className="mt-auto space-y-3">
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                messageTone === "error"
                  ? "border-rose-300/20 bg-rose-400/10 text-rose-100"
                  : messageTone === "success"
                    ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-50"
                    : "border-white/10 bg-white/5 text-white/65"
              }`}
            >
              {downloadState === "working" ? "Sedang menyiapkan download..." : actionMessage}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" className="w-full justify-center gap-2" onClick={handlePlayPreview}>
                <Play className="h-4 w-4" />
                Preview
              </Button>
              <Link href={`/project/${projectId}/clip/${clip.id}`} className="flex-1">
                <Button className="w-full justify-center gap-2">
                  <PencilLine className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center gap-2"
                onClick={handleDownload}
                disabled={downloadState === "working"}
              >
                {downloadState === "working" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {downloadState === "working" ? "Proses" : "Unduh"}
              </Button>
              <Link href={`/project/${projectId}/export?clipId=${clip.id}`}>
                <Button variant="outline" size="sm" className="w-full justify-center gap-2" aria-label="Buka halaman export clip">
                  <ArrowUpRight className="h-4 w-4" />
                  Export
                </Button>
              </Link>
              <Button variant="secondary" size="sm" className="w-full justify-center gap-2" aria-label="Remix clip" onClick={handleRegenerate}>
                <WandSparkles className="h-4 w-4" />
                Remix
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {isPreviewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/78 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-[32px] border border-white/10 bg-[#0b1017] shadow-[0_32px_120px_rgba(0,0,0,0.6)]">
            <button
              type="button"
              onClick={handleClosePreview}
              className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/70 transition hover:bg-black/60 hover:text-white"
              aria-label="Tutup preview clip"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="bg-black">
                {previewState === "ready" && previewUrl ? (
                  <video
                    ref={videoRef}
                    src={previewUrl}
                    poster={clip.previewImage}
                    controls
                    loop
                    playsInline
                    preload="auto"
                    className="aspect-[9/16] w-full bg-black object-contain"
                  />
                ) : previewState === "loading" ? (
                  <div className="flex aspect-[9/16] items-center justify-center p-6 text-center text-sm text-white/70">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin text-cyan-200" />
                      <p>{previewMessage}</p>
                    </div>
                  </div>
                ) : previewState === "error" ? (
                  <div className="flex aspect-[9/16] items-center justify-center p-6 text-center text-sm text-rose-100">
                    {previewMessage}
                  </div>
                ) : (
                  <div className="flex aspect-[9/16] items-center justify-center p-6 text-center text-sm text-white/60">
                    Preview sedang disiapkan.
                  </div>
                )}
              </div>

              <div className="space-y-4 p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/70">Clip Preview</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">{clip.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">{clip.description}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {clip.platforms.map((platform) => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => setSelectedPreviewPlatform(platform)}
                      className={`rounded-full border px-3 py-2 text-sm transition ${
                        selectedPreviewPlatform === platform
                          ? "border-cyan-300/30 bg-cyan-300/12 text-cyan-100"
                          : "border-white/10 bg-white/5 text-white/65 hover:bg-white/10"
                      }`}
                    >
                      {platformLabels[platform]}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/40">Masuk</p>
                    <p className="mt-2 text-lg font-semibold text-white">{clip.startSec.toFixed(1)}s</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/40">Durasi</p>
                    <p className="mt-2 text-lg font-semibold text-white">{formatDuration(clip.durationSec)}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/65">
                  {clip.hookLine}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/65">
                  {previewState === "error"
                    ? previewMessage
                    : previewMode === "source"
                      ? `Mode preview aktif: ${platformLabels[selectedPreviewPlatform]} dari footage asli.`
                      : previewMode === "poster"
                        ? `Mode preview aktif: ${platformLabels[selectedPreviewPlatform]} dengan poster animasi.`
                        : previewMode === "solid"
                          ? `Mode preview aktif: ${platformLabels[selectedPreviewPlatform]} dengan fallback canvas.`
                          : `Mode preview aktif: ${platformLabels[selectedPreviewPlatform]}.`}
                </div>

                <div className="flex flex-wrap gap-2">
                  {clip.platforms.map((platform) => (
                    <Badge key={platform} className="capitalize">
                      {platform}
                    </Badge>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button className="gap-2" onClick={handleDownload} disabled={downloadState === "working"}>
                    {downloadState === "working" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    {downloadState === "working" ? "Menyiapkan..." : "Download Clip"}
                  </Button>
                  <Link href={`/project/${projectId}/clip/${clip.id}`}>
                    <Button variant="outline" className="gap-2">
                      <PencilLine className="h-4 w-4" />
                      Edit Clip
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
