import { ClipCandidate, ExportArtifact, Platform } from "@/types";
import { PLATFORM_PRESETS, getFfmpegCommandPreview } from "@/lib/ffmpeg";
import { formatDuration } from "@/lib/utils";

export interface ClipRenderPlan {
  clipId: string;
  platform: Platform;
  presetLabel: string;
  commandPreview: string;
}

export function createRenderPlan(clip: ClipCandidate, platform: Platform): ClipRenderPlan {
  const preset = PLATFORM_PRESETS[platform];

  return {
    clipId: clip.id,
    platform,
    presetLabel: `${preset.label} ${preset.width}x${preset.height} ${preset.fps}fps`,
    commandPreview: getFfmpegCommandPreview(platform, clip.startSec, clip.durationSec)
  };
}

export function buildExportArtifacts(clip: ClipCandidate): ExportArtifact[] {
  const base = clip.title.toLowerCase().replace(/[^a-z0-9]+/g, "_");

  return [
    ...clip.platforms.map((platform) => ({
      name: `${base}_${platform}.mp4`,
      type: "video" as const,
      sizeLabel: `${formatDuration(clip.durationSec)} / ${PLATFORM_PRESETS[platform].width}p`
    })),
    { name: `${base}_thumbnail_yt.jpg`, type: "thumbnail" as const, sizeLabel: "1280x720" },
    { name: `${base}_thumbnail_ig.jpg`, type: "thumbnail" as const, sizeLabel: "1080x1080" },
    { name: `${base}_metadata.json`, type: "metadata" as const, sizeLabel: "JSON bundle" },
    { name: `${base}_captions.srt`, type: "captions" as const, sizeLabel: "SRT" },
    { name: `${base}_captions.vtt`, type: "captions" as const, sizeLabel: "VTT" }
  ];
}
