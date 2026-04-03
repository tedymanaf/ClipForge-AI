import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CaptionCue } from "@/types";

export function CaptionOverlay({ cues }: { cues: CaptionCue[] }) {
  const previewCues = cues.slice(0, 4);

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-white">Preview Caption</p>
          <p className="text-sm text-white/55">Contoh hasil caption yang bisa diedit sebelum ikut masuk ke paket export.</p>
        </div>
        <Badge>Akurasi target 97%</Badge>
      </div>

      <div className="space-y-3">
        {previewCues.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-white/50">
            Caption cues belum tersedia untuk clip ini.
          </div>
        ) : null}
        {previewCues.map((cue) => (
          <div key={cue.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/45">
              {(cue.startMs / 1000).toFixed(1)}s - {(cue.endMs / 1000).toFixed(1)}s
            </p>
            <p className="mt-2 text-lg font-semibold leading-8 text-white">{cue.text}</p>
            {cue.emojis?.length ? <p className="mt-2 text-sm text-cyan-200">{cue.emojis.join(" ")}</p> : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
