import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CaptionCue } from "@/types";

export function CaptionOverlay({ cues }: { cues: CaptionCue[] }) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-white">Caption Preview</p>
          <p className="text-sm text-white/55">Word-synced preview with emoji and emphasis markers.</p>
        </div>
        <Badge>97% target accuracy</Badge>
      </div>

      <div className="space-y-3">
        {cues.slice(0, 4).map((cue) => (
          <div key={cue.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm text-white/45">
              {(cue.startMs / 1000).toFixed(1)}s - {(cue.endMs / 1000).toFixed(1)}s
            </p>
            <p className="mt-2 text-lg font-semibold text-white">{cue.text}</p>
            {cue.emojis?.length ? <p className="mt-2 text-sm text-cyan-200">{cue.emojis.join(" ")}</p> : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
