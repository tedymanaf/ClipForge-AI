"use client";

import { useState } from "react";
import { Download, PackageCheck } from "lucide-react";

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
  const [downloadMode, setDownloadMode] = useState<"mp4" | "zip">("mp4");
  const [downloadMessage, setDownloadMessage] = useState<string>("MP4 adalah jalur utama. ZIP lengkap tetap tersedia kalau kamu butuh thumbnail, subtitle, dan metadata.");

  async function handleDownloadMp4() {
    try {
      setDownloadState("working");
      setDownloadMode("mp4");
      setDownloadMessage("Menyiapkan MP4 final...");
      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          clip,
          metadata,
          asset,
          thumbnails,
          cues,
          captionStyle,
          format: "mp4",
          platform: clip.platforms.includes("youtube") ? "youtube" : clip.platforms[0] ?? "tiktok"
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Permintaan download MP4 gagal.");
      }

      const blob = await response.blob();
      const exportNotice = response.headers.get("X-ClipForge-Export-Notice");
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${clip.title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.mp4`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      setDownloadState("done");
      setDownloadMessage(
        exportNotice === "MP4 completed."
          ? "MP4 siap. Cek folder Downloads kamu."
          : exportNotice || "MP4 siap. Cek folder Downloads kamu."
      );
    } catch (error) {
      setDownloadState("error");
      setDownloadMessage(error instanceof Error ? error.message : "Download MP4 gagal. Silakan coba lagi.");
    }
  }

  async function handleDownloadZip() {
    try {
      setDownloadState("working");
      setDownloadMode("zip");
      setDownloadMessage("Menyiapkan ZIP lengkap...");
      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ clip, metadata, asset, thumbnails, cues, captionStyle, format: "zip" })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Permintaan ZIP export gagal.");
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
          ? "ZIP lengkap siap. Cek folder Downloads kamu."
          : exportNotice || "ZIP lengkap siap. Cek folder Downloads kamu."
      );
    } catch (error) {
      setDownloadState("error");
      setDownloadMessage(error instanceof Error ? error.message : "Download ZIP gagal. Silakan coba lagi.");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="space-y-4">
        <div>
          <p className="section-eyebrow">Export</p>
          <p className="mt-3 text-2xl font-semibold text-white">Download hasil akhir tanpa ribet.</p>
          <p className="mt-2 text-sm text-white/55">Fokus utamanya sekarang MP4 final. ZIP lengkap tetap ada kalau kamu butuh aset pendukung.</p>
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
            "Caption: burn-in subtitle kalau tersedia",
            "Jalur utama: download satu MP4 siap pakai",
            "Opsi kedua: ZIP lengkap berisi aset pendukung"
          ].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
              {item}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button className="gap-2" onClick={handleDownloadMp4} disabled={downloadState === "working"}>
            <Download className="h-4 w-4" />
            {downloadState === "working" && downloadMode === "mp4" ? "Menyiapkan MP4..." : "Download MP4"}
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleDownloadZip} disabled={downloadState === "working"}>
            <PackageCheck className="h-4 w-4" />
            {downloadState === "working" && downloadMode === "zip" ? "Menyiapkan ZIP..." : "ZIP Lengkap"}
          </Button>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
          {downloadMessage}
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
