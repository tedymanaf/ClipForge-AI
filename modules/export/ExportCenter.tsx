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
  const [downloadState, setDownloadState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [publishState, setPublishState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [publishSummary, setPublishSummary] = useState<string>("Ready to prepare TikTok, Reels, and Shorts publishing payloads.");
  const [downloadMessage, setDownloadMessage] = useState<string>("ZIP export will include platform MP4s, thumbnails, metadata, and editable captions.");

  async function handleDownload() {
    try {
      setDownloadState("working");
      setDownloadMessage("Preparing export bundle...");
      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ clip, metadata, asset, thumbnails, cues, captionStyle })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Export request failed.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${clip.title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      setDownloadState("done");
      setDownloadMessage("ZIP export ready. Check your Downloads folder.");
    } catch (error) {
      setDownloadState("error");
      setDownloadMessage(error instanceof Error ? error.message : "Export failed. Please retry.");
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
      setPublishSummary("Publishing connectors could not be reached. Check API configuration and try again.");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="space-y-4">
        <div>
          <p className="font-medium text-white">Export Controls</p>
          <p className="text-sm text-white/55">Pick platforms, quality, captions, and delivery mode.</p>
        </div>

        <div className="grid gap-3">
          {[
            "Quality: Standard 1080p",
            "Formats: MP4 H.264",
            "Captions: Burned-in MP4 + SRT + VTT",
            "Thumbnail: JPG platform covers included",
            "Delivery: Download ZIP or publish direct"
          ].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
              {item}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button className="gap-2" onClick={handleDownload} disabled={downloadState === "working"}>
            <Download className="h-4 w-4" />
            {downloadState === "working" ? "Preparing ZIP..." : "Download ZIP"}
          </Button>
          <Button variant="outline" className="gap-2" onClick={handlePublishQueue} disabled={publishState === "working"}>
            <Send className="h-4 w-4" />
            {publishState === "working" ? "Queuing..." : "Publish Queue"}
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

        <Card className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-300/10 p-2">
              <PackageCheck className="h-4 w-4 text-emerald-200" />
            </div>
            <div>
              <p className="font-medium text-white">Distribution-ready bundle</p>
              <p className="text-sm text-white/55">ZIP sekarang berisi MP4 dengan caption nempel, plus JPG, metadata JSON, dan subtitle editable.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
