"use client";

import { Sparkles } from "lucide-react";

import { CAPTION_PRESETS } from "@/lib/demo-data";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CaptionCue, CaptionStyleId } from "@/types";

export function CaptionEngine({
  cues,
  selectedStyle,
  onSelectStyle,
  onUpdateCue
}: {
  cues: CaptionCue[];
  selectedStyle: CaptionStyleId;
  onSelectStyle?: (style: CaptionStyleId) => void;
  onUpdateCue?: (cueId: string, text: string) => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-white">Animated Caption Engine</p>
            <p className="text-sm text-white/55">Word-level sync, emoji hints, profanity-safe output, and preset styling.</p>
          </div>
          <Badge className="gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            A/B ready
          </Badge>
        </div>

        <div className="space-y-3">
          {cues.map((cue) => (
            <div key={cue.id} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-white/40">
                {(cue.startMs / 1000).toFixed(1)}s - {(cue.endMs / 1000).toFixed(1)}s
              </p>
              <Textarea
                className="mt-3 min-h-[88px] text-base font-semibold"
                defaultValue={cue.text}
                onBlur={(event) => {
                  const nextValue = event.target.value.trim();
                  if (nextValue && nextValue !== cue.text) {
                    onUpdateCue?.(cue.id, nextValue);
                  }
                }}
              />
              {cue.emojis?.length ? <p className="mt-2 text-sm text-cyan-200">{cue.emojis.join(" ")}</p> : null}
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-3">
        <div>
          <p className="font-medium text-white">Styles</p>
          <p className="text-sm text-white/55">Generate two variants and compare before final render.</p>
        </div>
        {CAPTION_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelectStyle?.(preset.id)}
            className={cn(
              "w-full rounded-[24px] border p-4 text-left transition",
              preset.id === selectedStyle
                ? "border-primary/50 bg-primary/12 shadow-glow"
                : "border-white/10 bg-white/5 hover:bg-white/8"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-white">{preset.name}</p>
              {preset.id === selectedStyle ? <Badge>Selected</Badge> : null}
            </div>
            <p className="mt-2 text-sm text-white/55">{preset.description}</p>
          </button>
        ))}
      </Card>
    </div>
  );
}
