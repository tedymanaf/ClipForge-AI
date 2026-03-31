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
        <p className="font-medium text-white">Export Package</p>
        <p className="text-sm text-white/55">Everything ships as a ready-to-post platform bundle.</p>
      </div>

      <div className="space-y-2">
        {artifacts.map((artifact) => {
          const Icon = icons[artifact.type];
          return (
            <div
              key={artifact.name}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-cyan-300" />
                <span className="text-sm text-white">{artifact.name}</span>
              </div>
              <span className="text-xs text-white/50">{artifact.sizeLabel}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
