"use client";

import { useState } from "react";
import { Download, PackageCheck, Send } from "lucide-react";

import { ExportPackagePreview } from "@/components/ExportPackagePreview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buildExportArtifacts } from "@/modules/clipper/ClipGenerator";
import { CaptionCue, CaptionStyleId, ClipCandidate, MetadataBundle, ThumbnailVariant, VideoAsset } from "@/types";

export function ExportCenter({
  clip,
  metadata,
  asset,
  thumbnails,
  cues,
  captionStyle
}: {
  clip: ClipCandidate;
  metadata?: MetadataBundle;
  asset: VideoAsset;
  thumbnails: ThumbnailVariant[];
  cues: CaptionCue[];
  captionStyle: CaptionStyleId;
}) {
  const artifacts = buildExportArtifacts(clip);
  const artifactCount = artifacts.length;
  const [downloadState, setDownloadState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [publishState, setPublishState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [publishSummary, setPublishSummary] = useState<string>("Siap menyiapkan payload publish untuk TikTok, Reels, dan Shorts.");
  const [downloadMessage, setDownloadMessage] = useState<string>("ZIP export akan berisi MP4 per platform, thumbnail, metadata, dan caption yang bisa diedit.");

  async function handleDownload() {
    try {
      setDownloadState("working");
      setDownloadMessage("Menyiapkan bundle export...");
      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ clip, metadata, asset, thumbnails, cues, captionStyle })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Permintaan export gagal.");
      }

      const blob = await response.blob();
      const exportNotice = response.headers.get("X-ClipForge-Export-Notice");
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${clip.title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      setDownloadState("done");
      setDownloadMessage(
        exportNotice === "Export completed."
          ? "ZIP export siap. Cek folder Downloads kamu."
          : exportNotice || "ZIP export siap. Cek folder Downloads kamu."
      );
    } catch (error) {
      setDownloadState("error");
      setDownloadMessage(error instanceof Error ? error.message : "Export gagal. Silakan coba lagi.");
    }
  }

  async function handlePublishQueue() {
    try {
      setPublishState("working");
      const endpoints = ["/api/publish/tiktok", "/api/publish/instagram", "/api/publish/youtube"];
      const results = await Promise.all(
        endpoints.map((endpoint) =>
          fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ clipId: clip.id, title: clip.title })
          }).then(async (response) => {
            const payload = (await response.json()) as { provider?: string; message?: string; ok?: boolean };
            return `${payload.provider}: ${payload.message}`;
          })
        )
      );

      setPublishSummary(results.join(" "));
      setPublishState("done");
    } catch {
      setPublishState("error");
      setPublishSummary("Konektor publishing tidak bisa dijangkau. Cek konfigurasi API lalu coba lagi.");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="space-y-4">
        <div>
          <p className="section-eyebrow">Export</p>
          <p className="mt-3 text-2xl font-semibold text-white">Tentukan paket akhir yang ingin kamu kirim.</p>
          <p className="mt-2 text-sm text-white/55">Halaman export diringkas supaya fokus ke apa yang akan dikirim, bukan detail teknis yang berlebihan.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.24em] text-white/40">Clip</p>
            <p className="mt-2 text-sm font-medium text-white">{clip.durationSec}s</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.24em] text-white/40">Platforms</p>
            <p className="mt-2 text-sm font-medium capitalize text-white">{clip.platforms.join(", ")}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.24em] text-white/40">Bundle</p>
            <p className="mt-2 text-sm font-medium text-white">{artifactCount} files</p>
          </div>
        </div>

        <div className="grid gap-3">
          {[
            "Kualitas default: Standard 1080p",
            "Format video: MP4 H.264",
            "Caption: burn-in MP4 + file SRT + VTT",
            "Thumbnail: JPG per platform ikut disiapkan",
            "Distribusi: unduh ZIP atau kirim ke antrean publish"
          ].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
              {item}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button className="gap-2" onClick={handleDownload} disabled={downloadState === "working"}>
            <Download className="h-4 w-4" />
            {downloadState === "working" ? "Menyiapkan ZIP..." : "Unduh ZIP"}
          </Button>
          <Button variant="outline" className="gap-2" onClick={handlePublishQueue} disabled={publishState === "working"}>
            <Send className="h-4 w-4" />
            {publishState === "working" ? "Memasukkan antrean..." : "Antrean Publish"}
          </Button>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
          {downloadState === "error"
            ? downloadMessage
            : downloadState === "done"
              ? downloadMessage
              : downloadState === "working"
                ? downloadMessage
            : publishState === "error"
              ? publishSummary
              : downloadMessage}
        </div>
      </Card>

      <div className="space-y-6">
        <ExportPackagePreview artifacts={artifacts} />

        <Card className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-300/10 p-2">
              <PackageCheck className="h-4 w-4 text-emerald-200" />
            </div>
            <div>
              <p className="font-medium text-white">Bundle siap distribusi</p>
              <p className="text-sm text-white/55">ZIP berisi video, thumbnail, metadata, dan subtitle yang siap dibawa ke tahap publikasi.</p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
            <div
              className="aspect-[9/16] rounded-[24px] border border-white/10 bg-slate-950 bg-cover bg-center"
              style={clip.previewImage ? { backgroundImage: `url("${clip.previewImage}")` } : undefined}
            />
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/40">Selected clip</p>
                <p className="mt-2 text-lg font-semibold text-white">{clip.title}</p>
                <p className="mt-2 text-sm leading-6 text-white/60">{clip.description}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/65">
                <p>Source asset: {asset.name}</p>
                <p className="mt-2">Caption style: {captionStyle}</p>
                <p className="mt-2">Bundle metadata: {metadata ? "Siap" : "Akan dibuat otomatis"}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
