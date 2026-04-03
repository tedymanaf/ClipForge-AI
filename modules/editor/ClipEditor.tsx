"use client";

import { Music4, ScissorsLineDashed, SlidersHorizontal, Subtitles, Waves } from "lucide-react";

import { CaptionEngine } from "@/modules/captions/CaptionEngine";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useClipForgeStore } from "@/store/useClipForgeStore";
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
  const setProjectCaptionStyle = useClipForgeStore((state) => state.setProjectCaptionStyle);
  const updateCaptionCue = useClipForgeStore((state) => state.updateCaptionCue);
  const undoProjectEdit = useClipForgeStore((state) => state.undoProjectEdit);
  const redoProjectEdit = useClipForgeStore((state) => state.redoProjectEdit);
  const canUndoProjectEdit = useClipForgeStore((state) => state.canUndoProjectEdit);
  const canRedoProjectEdit = useClipForgeStore((state) => state.canRedoProjectEdit);

  const canUndo = canUndoProjectEdit(project.id);
  const canRedo = canRedoProjectEdit(project.id);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.15fr_0.9fr]">
      <Card className="space-y-4">
        <div
          className="aspect-[9/16] rounded-[28px] border border-white/10 bg-cover bg-center"
          style={{ backgroundImage: `url("${clip.previewImage}")` }}
        />
        <div className="grid grid-cols-2 gap-3 text-sm text-white/65">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-white">Durasi</p>
            <p className="mt-1 text-2xl font-semibold">{formatDuration(clip.durationSec)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-white">Platform</p>
            <p className="mt-1 text-2xl font-semibold">{clip.platforms.length}</p>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Timeline</p>
              <p className="text-sm text-white/55">Area ini difokuskan untuk trim, membaca ritme, dan mengedit tanpa merusak source asli.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => undoProjectEdit(project.id)} disabled={!canUndo}>
                Undo
              </Button>
              <Button variant="outline" size="sm" onClick={() => redoProjectEdit(project.id)} disabled={!canRedo}>
                Redo
              </Button>
            </div>
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
              { icon: ScissorsLineDashed, label: "Trim handles", desc: "Atur titik masuk dan keluar dengan presisi." },
              { icon: Subtitles, label: "Caption editor", desc: "Ubah teks, timing, dan gaya caption." },
              { icon: Music4, label: "Music track", desc: "Tambahkan musik latar untuk versi akhir." },
              { icon: SlidersHorizontal, label: "Filters", desc: "Atur brightness, saturation, dan nuansa visual." },
              { icon: Waves, label: "Volume mixer", desc: "Kontrol level suara voice dan musik." }
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

        <CaptionEngine
          cues={cues}
          selectedStyle={project.settings.captionStyle}
          onSelectStyle={(style) => setProjectCaptionStyle(project.id, style)}
          onUpdateCue={(cueId, text) => updateCaptionCue(project.id, clip.id, cueId, text)}
        />
      </div>

      <Card className="space-y-4">
        <div>
          <p className="font-medium text-white">Panel Metadata</p>
          <p className="text-sm text-white/55">Judul, deskripsi, hashtag, dan saran hook ditampilkan lebih ringkas.</p>
        </div>
        <div className="space-y-3">
          {(project.metadata[clip.id]?.titles.tiktok ?? []).map((title) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
              {title}
            </div>
          ))}
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          Caption editor aktif di panel tengah, dan hasil edit akan ikut masuk ke subtitle serta burned caption saat export.
        </div>
        <div className="rounded-[24px] border border-cyan-300/15 bg-cyan-300/8 p-4">
          <p className="text-sm font-medium text-white">Smart Hook Rewriter</p>
          <p className="mt-2 text-sm text-white/60">{project.metadata[clip.id]?.hookRewriteSuggestion}</p>
        </div>
      </Card>
    </div>
  );
}
