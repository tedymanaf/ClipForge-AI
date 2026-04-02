"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Clock3, PencilLine, WandSparkles } from "lucide-react";

import { ViralScoreBadge } from "@/components/ViralScoreBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDuration } from "@/lib/utils";
import { useClipForgeStore } from "@/store/useClipForgeStore";
import { ClipCandidate } from "@/types";

export function ClipCard({
  clip,
  projectId
}: {
  clip: ClipCandidate;
  projectId: string;
}) {
  const router = useRouter();
  const regenerateClip = useClipForgeStore((state) => state.regenerateClip);

  function handleRegenerate() {
    const remixed = regenerateClip(projectId, clip.id);
    if (remixed) {
      router.push(`/project/${projectId}/clip/${remixed.id}`);
    }
  }

  const lineClampTwo = {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden"
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden p-0">
      <div
        className="relative aspect-[9/14] w-full overflow-hidden rounded-t-[28px] border-b border-white/10 bg-slate-950 bg-cover bg-center"
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
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="text-base font-semibold text-white/95">{clip.title}</p>
          <p className="mt-2 text-xs leading-5 text-white/70" style={lineClampTwo}>{clip.hookLine}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col space-y-4 p-5">
        <div className="flex flex-wrap gap-2">
          {clip.platforms.map((platform) => (
            <Badge key={platform} className="capitalize">{platform}</Badge>
          ))}
        </div>

        <div className="space-y-2">
          {clip.whyItWorks.slice(0, 2).map((item) => (
            <p key={item} className="text-sm leading-6 text-white/65" style={lineClampTwo}>
              {item}
            </p>
          ))}
        </div>

        <div className="mt-auto flex gap-2">
          <Link href={`/project/${projectId}/clip/${clip.id}`} className="flex-1">
            <Button className="w-full justify-center gap-2">
              <PencilLine className="h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Link href={`/project/${projectId}/export?clipId=${clip.id}`}>
            <Button variant="outline" size="icon" aria-label="Export clip">
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="secondary" size="icon" aria-label="Regenerate" onClick={handleRegenerate}>
            <WandSparkles className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
