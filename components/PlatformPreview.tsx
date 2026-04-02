import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ClipCandidate, Platform } from "@/types";

const labels: Record<Platform, string> = {
  tiktok: "TikTok",
  instagram: "Reels",
  youtube: "Shorts",
  square: "Square"
};

export function PlatformPreview({ clip }: { clip: ClipCandidate }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {clip.platforms.map((platform) => (
        <Card key={platform} className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-medium text-white">{labels[platform]}</p>
            <Badge>{platform === "youtube" ? "60fps" : "30fps"}</Badge>
          </div>
          <div
            className="aspect-[9/16] rounded-[24px] border border-white/10 bg-slate-950 bg-cover bg-center"
            style={clip.previewImage ? { backgroundImage: `url("${clip.previewImage}")` } : undefined}
          />
          <div className="mt-3 flex items-center justify-between text-xs text-white/45">
            <span>Preview {labels[platform]}</span>
            <span>{clip.durationSec}s</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
