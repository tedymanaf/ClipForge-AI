import { FileArchive, FileJson, ImageIcon, Video } from "lucide-react";

import { Card } from "@/components/ui/card";
import { ExportArtifact } from "@/types";

const icons = {
  video: Video,
  thumbnail: ImageIcon,
  metadata: FileJson,
  captions: FileArchive
};

export function ExportPackagePreview({ artifacts }: { artifacts: ExportArtifact[] }) {
  return (
    <Card className="space-y-3">
      <div>
        <p className="font-medium text-white">Paket Export</p>
        <p className="text-sm text-white/55">Semua artefak dikirim sebagai bundle per platform yang siap diposting.</p>
      </div>

      <div className="space-y-2">
        {artifacts.map((artifact) => {
          const Icon = icons[artifact.type];
          return (
            <div
              key={artifact.name}
              className="grid gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="rounded-xl bg-cyan-300/10 p-2">
                  <Icon className="h-4 w-4 text-cyan-300" />
                </div>
                <span className="min-w-0 break-all text-sm text-white">{artifact.name}</span>
              </div>
              <span className="justify-self-start text-xs text-white/50 sm:justify-self-end">{artifact.sizeLabel}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
