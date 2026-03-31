import { Platform } from "@/types";

export interface RenderPreset {
  label: string;
  width: number;
  height: number;
  fps: number;
  codec: string;
  audioCodec: string;
  maxDurationSec: number;
}

export const PLATFORM_PRESETS: Record<Platform, RenderPreset> = {
  tiktok: {
    label: "TikTok",
    width: 1080,
    height: 1920,
    fps: 30,
    codec: "H.264",
    audioCodec: "AAC",
    maxDurationSec: 60
  },
  instagram: {
    label: "Instagram Reels",
    width: 1080,
    height: 1920,
    fps: 30,
    codec: "H.264",
    audioCodec: "AAC",
    maxDurationSec: 90
  },
  youtube: {
    label: "YouTube Shorts",
    width: 1080,
    height: 1920,
    fps: 60,
    codec: "H.264",
    audioCodec: "AAC",
    maxDurationSec: 60
  },
  square: {
    label: "Square",
    width: 1080,
    height: 1080,
    fps: 30,
    codec: "H.264",
    audioCodec: "AAC",
    maxDurationSec: 90
  }
};

export function getFfmpegCommandPreview(platform: Platform, startSec: number, durationSec: number) {
  const preset = PLATFORM_PRESETS[platform];

  return [
    "ffmpeg",
    `-ss ${startSec.toFixed(2)}`,
    "-i input.mp4",
    `-t ${durationSec.toFixed(2)}`,
    `-vf scale=${preset.width}:${preset.height}:force_original_aspect_ratio=increase,crop=${preset.width}:${preset.height}`,
    "-af loudnorm",
    `-r ${preset.fps}`,
    "-c:v libx264",
    "-c:a aac",
    "output.mp4"
  ].join(" ");
}
