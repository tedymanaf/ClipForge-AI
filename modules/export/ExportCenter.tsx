"use client";

import { Download, PackageCheck, Send } from "lucide-react";

import { ExportPackagePreview } from "@/components/ExportPackagePreview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buildExportArtifacts } from "@/modules/clipper/ClipGenerator";
import { ClipCandidate } from "@/types";

export function ExportCenter({ clip }: { clip: ClipCandidate }) {
  const artifacts = buildExportArtifacts(clip);

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
            "Formats: MP4 H.264, WebM",
            "Captions: Burned-in + SRT/VTT",
            "Thumbnail: Include platform covers",
            "Delivery: Download ZIP or publish direct"
          ].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
              {item}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Download ZIP
          </Button>
          <Button variant="outline" className="gap-2">
            <Send className="h-4 w-4" />
            Publish Queue
          </Button>
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
              <p className="text-sm text-white/55">Direct connectors are stubbed for TikTok, Instagram, and YouTube API handoff.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
