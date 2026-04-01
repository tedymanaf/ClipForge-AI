import {
  AppPreferences,
  CaptionCue,
  CaptionPreset,
  ClipCandidate,
  MetadataBundle,
  ProcessingStep,
  Project,
  ProjectSettings,
  ThumbnailVariant,
  TranscriptSegment,
  ViralScoreBreakdown
} from "@/types";
import { calculateViralScore } from "@/lib/scoring";
import { createId, svgToDataUri } from "@/lib/utils";

function toStableToken(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createStableId(prefix: string, value: string) {
  return `${prefix}_${toStableToken(value)}`;
}

export const CAPTION_PRESETS: CaptionPreset[] = [
  { id: "bold-fire", name: "Bold Fire", description: "Big caption blocks with active word highlight." },
  { id: "neon-pop", name: "Neon Pop", description: "Glowy cyan karaoke captions for high-energy hooks." },
  { id: "minimal-clean", name: "Minimal Clean", description: "Soft pill captions with subtle fades." },
  { id: "tiktok-native", name: "TikTok Native", description: "Platform-familiar typography and spacing." },
  { id: "cinematic", name: "Cinematic", description: "Centered lower-case lines for elegant storytelling." },
  { id: "creator-pro", name: "Creator Pro", description: "Gradient emphasis, emoji moments, and creator polish." }
];

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  defaultPlatforms: ["tiktok", "instagram", "youtube"],
  captionStyle: "creator-pro",
  language: "id-ID",
  uiLanguage: "id",
  qualityPreset: "standard",
  removeSilence: true,
  autoPublish: false
};

export const DEFAULT_PREFERENCES: AppPreferences = {
  brandName: "ClipForge AI",
  brandColors: ["#7C3AED", "#06B6D4", "#10B981"],
  fontFamily: "Inter",
  notifications: true,
  demoMode: true
};

function createPoster(title: string, subtitle: string, tone: "violet" | "cyan" | "emerald") {
  const themes = {
    violet: ["#7C3AED", "#0B0A13"],
    cyan: ["#06B6D4", "#07151A"],
    emerald: ["#10B981", "#06140f"]
  };
  const [accent, bg] = themes[tone];

  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop stop-color="${bg}" offset="0%"/>
          <stop stop-color="#111827" offset="100%"/>
        </linearGradient>
      </defs>
      <rect width="1080" height="1920" fill="url(#g)"/>
      <circle cx="860" cy="260" r="260" fill="${accent}" fill-opacity="0.22"/>
      <circle cx="260" cy="1520" r="220" fill="${accent}" fill-opacity="0.18"/>
      <rect x="88" y="108" width="904" height="1704" rx="42" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.16)"/>
      <text x="124" y="240" fill="#9CA3AF" font-size="40" font-family="Arial, sans-serif">ClipForge AI Demo</text>
      <text x="124" y="340" fill="#F8F8FF" font-size="96" font-weight="700" font-family="Arial, sans-serif">${title}</text>
      <text x="124" y="420" fill="#D1D5DB" font-size="44" font-family="Arial, sans-serif">${subtitle}</text>
      <rect x="124" y="1460" width="832" height="160" rx="28" fill="${accent}" fill-opacity="0.15" stroke="${accent}" stroke-opacity="0.45"/>
      <text x="164" y="1546" fill="#F8F8FF" font-size="44" font-family="Arial, sans-serif">Upload Once. Go Viral Everywhere.</text>
    </svg>
  `);
}

function createBreakdown(seed: number): ViralScoreBreakdown {
  return {
    hook: 82 + seed,
    emotion: 74 + seed,
    value: 80 + seed,
    narrative: 72 + seed,
    quotability: 75 + seed,
    platformFit: 84 + seed,
    trendAlignment: 70 + seed,
    engagementPrediction: 78 + seed
  };
}

function createTranscript(projectName: string): TranscriptSegment[] {
  const lines = [
    "Semua creator mikir masalahnya ada di editing, padahal seringnya masalahnya ada di hook.",
    "Kalau tiga detik pertama lemah, retention langsung turun sebelum value sempat masuk.",
    "Makanya kita cari satu kalimat yang paling bikin orang berhenti scroll.",
    "Dari sana AI potong, kasih caption, thumbnail, dan metadata otomatis."
  ];

  return lines.map((line, segmentIndex) => ({
    id: createId("segment"),
    startMs: segmentIndex * 8000,
    endMs: segmentIndex * 8000 + 7200,
    text: `${line} [${projectName}]`,
    confidence: 0.97,
    words: line.split(" ").map((word, wordIndex) => ({
      startMs: segmentIndex * 8000 + wordIndex * 350,
      endMs: segmentIndex * 8000 + wordIndex * 350 + 280,
      word,
      confidence: 0.95 + ((wordIndex % 4) * 0.01),
      speaker: segmentIndex % 2 === 0 ? "Host" : "Guest",
      flagged: wordIndex % 11 === 0
    }))
  }));
}

function createCaptions(segments: TranscriptSegment[]): CaptionCue[] {
  return segments.map((segment) => ({
    id: createId("cue"),
    startMs: segment.startMs,
    endMs: segment.endMs,
    text: segment.text,
    activeWordIndex: 1,
    emojis: ["HOOK", "WOW"]
  }));
}

function createMetadata(clipId: string, title: string, sentiment: "positive" | "neutral" | "controversial"): MetadataBundle {
  return {
    clipId,
    titles: {
      tiktok: [`${title} - must watch`, `${title} tapi versi singkat`, "alasan clip ini bisa meledak"],
      instagram: [`${title} #creatorgrowth`, `${title} dan kenapa retention itu penting`, `${title} untuk reels`],
      youtube: [title, `${title} | Short Creator Strategy`, `${title} That Changes Retention`],
      square: [title, `${title} - Social Cut`, `${title} Quick Clip`]
    },
    descriptions: {
      tiktok: "Hook dulu, edit belakangan. Simpan ide ini buat video berikutnya.",
      instagram: "Kalimat pertama bisa bikin semua bedanya. Save buat referensi reels kamu berikutnya.",
      youtube: "Short-form growth starts from a sharper opening. This clip shows the exact moment that flips retention.",
      square: "Repurposed social cut from ClipForge AI."
    },
    hashtags: {
      tiktok: ["#contentcreator", "#viralclip", "#tiktoktips", "#hook", "#creatorai"],
      instagram: ["#reelsgrowth", "#contentstrategy", "#videoediting", "#socialmediatips", "#clipforgeai"],
      youtube: ["#shorts", "#creatorgrowth", "#hook"],
      square: ["#socialvideo", "#creator"]
    },
    tags: ["creator economy", "video hooks", "content repurposing", "viral clips", "short form growth"],
    category: "education",
    sentiment,
    clipSeriesSuggestion: "Post this with part 2 on Wednesday and the tutorial breakdown on Friday for stronger series retention.",
    hookRewriteSuggestion: "Mulai dengan: 'Kalau tiga detik pertama lemah, videomu hampir pasti kalah.'"
  };
}

function createThumbnails(title: string, image: string): ThumbnailVariant[] {
  return [
    { id: createId("thumb"), kind: "face-close-up", label: `${title} Close-Up`, image, size: "1280x720" },
    { id: createId("thumb"), kind: "action-frame", label: `${title} Action`, image, size: "1080x1080" },
    { id: createId("thumb"), kind: "text-forward", label: `${title} Text`, image, size: "1080x1920" }
  ];
}

function createProcessingSteps(progress = 100): ProcessingStep[] {
  const steps: ProcessingStep[] = [
    { id: "uploaded", label: "Video uploaded", description: "Source ingested and validated.", state: "complete", progress: 100 },
    { id: "transcribing", label: "Transcribing audio", description: "Whisper word-level transcript.", state: progress >= 20 ? "complete" : "active", progress: Math.min(progress, 20) * 5 },
    { id: "analyzing", label: "AI analyzing hooks", description: "Scoring segments across 8 viral dimensions.", state: progress >= 35 ? "complete" : progress >= 21 ? "active" : "pending", progress: Math.max(0, Math.min(progress - 20, 15)) * 7 },
    { id: "clipping", label: "Generating clips", description: "Optimal in and out points locked.", state: progress >= 55 ? "complete" : progress >= 36 ? "active" : "pending", progress: Math.max(0, Math.min(progress - 35, 20)) * 5 },
    { id: "captions", label: "Applying captions", description: "Animated caption styles rendered.", state: progress >= 70 ? "complete" : progress >= 56 ? "active" : "pending", progress: Math.max(0, Math.min(progress - 55, 15)) * 6 },
    { id: "thumbnails", label: "Creating thumbnails", description: "Best frame extraction and overlays.", state: progress >= 85 ? "complete" : progress >= 71 ? "active" : "pending", progress: Math.max(0, Math.min(progress - 70, 15)) * 6 },
    { id: "metadata", label: "Generating metadata", description: "Titles, captions, hashtags, tags.", state: progress >= 95 ? "complete" : progress >= 86 ? "active" : "pending", progress: Math.max(0, Math.min(progress - 85, 10)) * 10 },
    { id: "ready", label: "Ready to review", description: "Clips are available in the review grid.", state: progress >= 100 ? "complete" : "pending", progress: progress >= 100 ? 100 : 0 }
  ];

  return steps;
}

function createClip(projectId: string, index: number, tone: "violet" | "cyan" | "emerald", projectName: string): ClipCandidate {
  const breakdown = createBreakdown(index * 2);
  const title = [
    "The First 3 Seconds Decide Everything",
    "Why Most Short-Form Videos Never Take Off",
    "One Sentence Can Save Your Entire Video"
  ][index];
  const transcript = createTranscript(projectName).slice(0, 3);
  const poster = createPoster(title, "AI-selected viral moment", tone);
  const clipId = createStableId("clip", `${projectName}-${index + 1}`);

  return {
    id: clipId,
    projectId,
    title,
    description: "AI-picked moment with strong hook density, quotability, and creator value.",
    startSec: index * 18 + 4,
    endSec: index * 18 + 34,
    durationSec: 30,
    viralScore: calculateViralScore(breakdown),
    breakdown,
    whyItWorks: [
      "Opens with a surprising claim in under two seconds.",
      "Builds tension before landing a practical insight.",
      "Contains a quotable sentence that works across TikTok, Reels, and Shorts."
    ],
    hookLine: title,
    transcript,
    platforms: ["tiktok", "instagram", "youtube"],
    contentType: index === 1 ? "tutorial" : "education",
    sentiment: index === 2 ? "controversial" : "positive",
    status: "approved",
    previewImage: poster
  };
}

export function createDemoProject(projectName: string, tone: "violet" | "cyan" | "emerald" = "violet"): Project {
  const projectId = createStableId("project", projectName);
  const poster = createPoster(projectName, "Podcast to viral shorts pipeline", tone);
  const transcript = createTranscript(projectName);
  const clips = [
    createClip(projectId, 0, tone, projectName),
    createClip(projectId, 1, "cyan", projectName),
    createClip(projectId, 2, "emerald", projectName)
  ];

  return {
    id: projectId,
    name: projectName,
    status: "ready",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    asset: {
      id: createStableId("asset", projectName),
      name: `${projectName}.mp4`,
      source: "demo",
      durationSec: 634,
      width: 1920,
      height: 1080,
      sizeBytes: 1_860_000_000,
      codec: "H.264",
      thumbnail: poster
    },
    clips,
    transcript,
    captions: Object.fromEntries(clips.map((clip) => [clip.id, createCaptions(clip.transcript)])),
    thumbnails: Object.fromEntries(clips.map((clip) => [clip.id, createThumbnails(clip.title, clip.previewImage)])),
    metadata: Object.fromEntries(clips.map((clip) => [clip.id, createMetadata(clip.id, clip.title, clip.sentiment)])),
    processingSteps: createProcessingSteps(),
    progress: 100,
    insight: "Your strongest hooks are educational claims with urgency in the first three seconds.",
    settings: DEFAULT_PROJECT_SETTINGS
  };
}

export const DEMO_PROJECTS: Project[] = [
  createDemoProject("Podcast Momentum Machine", "violet"),
  createDemoProject("Creator Growth Sprint", "cyan"),
  createDemoProject("Vlog Energy Booster", "emerald")
];
