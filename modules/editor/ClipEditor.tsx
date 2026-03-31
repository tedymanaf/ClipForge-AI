"use client";

import { Music4, ScissorsLineDashed, SlidersHorizontal, Subtitles, Waves } from "lucide-react";

import { CaptionEngine } from "@/modules/captions/CaptionEngine";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ClipCandidate, Project } from "@/types";
import { formatDuration } from "@/lib/utils";

export function ClipEditor({
  project,
  clip
}: {
  project: Project;
  clip: ClipCandidate;
}) {
  const cues = project.captions[clip.id] ?? [];

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.15fr_0.9fr]">
      <Card className="space-y-4">
        <div
          className="aspect-[9/16] rounded-[28px] border border-white/10 bg-cover bg-center"
          style={{ backgroundImage: `url("${clip.previewImage}")` }}
        />
        <div className="grid grid-cols-2 gap-3 text-sm text-white/65">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-white">Duration</p>
            <p className="mt-1 text-2xl font-semibold">{formatDuration(clip.durationSec)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-white">Platforms</p>
            <p className="mt-1 text-2xl font-semibold">{clip.platforms.length}</p>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Timeline</p>
              <p className="text-sm text-white/55">Non-destructive trim, transcript-aligned editing, and waveform overview.</p>
            </div>
            <Button variant="outline" size="sm">Undo / Redo</Button>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
            <div className="mb-4 flex items-center justify-between text-sm text-white/50">
              <span>IN {clip.startSec.toFixed(1)}s</span>
              <span>OUT {clip.endSec.toFixed(1)}s</span>
            </div>
            <div className="relative h-24 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-primary/10 via-cyan-300/10 to-emerald-300/10">
              <div className="absolute inset-0 flex items-end gap-1 px-3 pb-3">
                {Array.from({ length: 48 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex-1 rounded-full bg-white/70"
                    style={{ height: `${18 + ((index * 19) % 60)}%`, opacity: 0.45 + ((index % 5) * 0.08) }}
                  />
                ))}
              </div>
            </div>
            <Progress className="mt-4" value={68} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {[
              { icon: ScissorsLineDashed, label: "Trim handles", desc: "Drag precise in/out points." },
              { icon: Subtitles, label: "Caption editor", desc: "Edit text, timing, and style." },
              { icon: Music4, label: "Music track", desc: "Layer royalty-free background audio." },
              { icon: SlidersHorizontal, label: "Filters", desc: "Brightness, saturation, vignette." },
              { icon: Waves, label: "Volume mixer", desc: "Control voice and music independently." }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-white/8 p-2">
                      <Icon className="h-4 w-4 text-cyan-200" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{item.label}</p>
                      <p className="text-sm text-white/55">{item.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <CaptionEngine cues={cues} selectedStyle={project.settings.captionStyle} />
      </div>

      <Card className="space-y-4">
        <div>
          <p className="font-medium text-white">Metadata Panel</p>
          <p className="text-sm text-white/55">Titles, descriptions, hashtags, and hook rewrite suggestions.</p>
        </div>
        <div className="space-y-3">
          {(project.metadata[clip.id]?.titles.tiktok ?? []).map((title) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
              {title}
            </div>
          ))}
        </div>
        <div className="rounded-[24px] border border-cyan-300/15 bg-cyan-300/8 p-4">
          <p className="text-sm font-medium text-white">Smart Hook Rewriter</p>
          <p className="mt-2 text-sm text-white/60">{project.metadata[clip.id]?.hookRewriteSuggestion}</p>
        </div>
      </Card>
    </div>
  );
}
