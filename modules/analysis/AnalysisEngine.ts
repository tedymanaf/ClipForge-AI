import { generateMetadataBundle } from "@/modules/metadata/MetadataEngine";
import { generateThumbnailVariants } from "@/modules/thumbnail/ThumbnailEngine";
import { transcribeWithWhisperMock } from "@/lib/whisper";
import { calculateViralScore } from "@/lib/scoring";
import { createId } from "@/lib/utils";
import {
  CaptionCue,
  ClipCandidate,
  ProcessingStep,
  Project,
  TranscriptSegment,
  ViralScoreBreakdown
} from "@/types";

const loadingMessages = [
  "Mencari momen paling viral dari videomu...",
  "Menyesuaikan AI dengan gaya kontenmu...",
  "Menilai tensi narasi dan tingkat quotability...",
  "Memilih clip yang paling cocok untuk TikTok, Reels, dan Shorts..."
];

function buildProcessingSteps(progress: number): ProcessingStep[] {
  return [
    {
      id: "uploaded",
      label: "Video diunggah",
      description: "File tervalidasi dan siap diproses menjadi clip.",
      state: "complete",
      progress: 100
    },
    {
      id: "transcribing",
      label: "Mentranskripsi audio...",
      description: "Timeline audio sedang diurai sampai level kata.",
      state: progress >= 20 ? "complete" : "active",
      progress: Math.min(progress * 5, 100)
    },
    {
      id: "analyzing",
      label: "AI menganalisis hook dan momen...",
      description: "Menilai jendela 15-90 detik yang paling kuat.",
      state: progress >= 40 ? "complete" : progress >= 21 ? "active" : "pending",
      progress: Math.max(0, Math.min((progress - 20) * 5, 100))
    },
    {
      id: "clipping",
      label: "Membuat clip...",
      description: "Menentukan titik masuk dan keluar yang paling efektif.",
      state: progress >= 60 ? "complete" : progress >= 41 ? "active" : "pending",
      progress: Math.max(0, Math.min((progress - 40) * 5, 100))
    },
    {
      id: "captions",
      label: "Menerapkan caption...",
      description: "Gaya subtitle animatif sedang disusun.",
      state: progress >= 75 ? "complete" : progress >= 61 ? "active" : "pending",
      progress: Math.max(0, Math.min((progress - 60) * 7, 100))
    },
    {
      id: "thumbnails",
      label: "Membuat thumbnail...",
      description: "Menilai frame terbaik dan menyiapkan overlay judul.",
      state: progress >= 88 ? "complete" : progress >= 76 ? "active" : "pending",
      progress: Math.max(0, Math.min((progress - 75) * 8, 100))
    },
    {
      id: "metadata",
      label: "Membuat judul dan hashtag...",
      description: "Copywriting disesuaikan per platform.",
      state: progress >= 97 ? "complete" : progress >= 89 ? "active" : "pending",
      progress: Math.max(0, Math.min((progress - 88) * 10, 100))
    },
    {
      id: "ready",
      label: "Siap!",
      description: "Clip sudah siap untuk direview dan diexport.",
      state: progress === 100 ? "complete" : "pending",
      progress: progress === 100 ? 100 : 0
    }
  ];
}

function createBreakdown(seed: number): ViralScoreBreakdown {
  return {
    hook: 78 + seed,
    emotion: 70 + seed,
    value: 80 + seed,
    narrative: 72 + seed,
    quotability: 74 + seed,
    platformFit: 82 + seed,
    trendAlignment: 68 + seed,
    engagementPrediction: 76 + seed
  };
}

function makeCaptionCues(transcript: TranscriptSegment[]): CaptionCue[] {
  return transcript.map((segment) => ({
    id: createId("cue"),
    startMs: segment.startMs,
    endMs: segment.endMs,
    text: segment.text,
    activeWordIndex: 1,
    emojis: ["HOOK", "CUT"]
  }));
}

function createFallbackPreview(index: number) {
  return index === 1
    ? "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1080' height='1920'%3E%3Crect width='1080' height='1920' fill='%230b1020'/%3E%3Ccircle cx='780' cy='240' r='220' fill='%2306B6D4' fill-opacity='0.22'/%3E%3Ctext x='90' y='1540' fill='white' font-size='86' font-family='Arial'%3ERetention%3C/text%3E%3C/svg%3E"
    : "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1080' height='1920'%3E%3Crect width='1080' height='1920' fill='%230b0914'/%3E%3Ccircle cx='240' cy='320' r='220' fill='%237C3AED' fill-opacity='0.22'/%3E%3Ctext x='90' y='1540' fill='white' font-size='86' font-family='Arial'%3EHook%3C/text%3E%3C/svg%3E";
}

function createClipCandidates(project: Project, transcript: TranscriptSegment[]): ClipCandidate[] {
  const windows = [
    { startSec: 2, endSec: 28, title: "Kalimat Pembuka yang Bikin Orang Berhenti Scroll" },
    { startSec: 18, endSec: 54, title: "Retention Drop Terjadi Sebelum Value Masuk" },
    { startSec: 44, endSec: 80, title: "Satu Potongan Ini Punya Hook, Value, dan Quote" }
  ];
  const sourcePreview = project.asset.thumbnail?.trim();

  return windows.map((window, index) => {
    const breakdown = createBreakdown(index * 3);

    return {
      id: createId("clip"),
      projectId: project.id,
      title: window.title,
      description: "Clip pilihan AI dengan hook kuat dan kecocokan platform yang tinggi.",
      startSec: window.startSec,
      endSec: window.endSec,
      durationSec: window.endSec - window.startSec,
      viralScore: calculateViralScore(breakdown),
      breakdown,
      whyItWorks: [
        "Membuka dengan klaim kuat di detik pertama.",
        "Memiliki kalimat yang cukup quotable untuk dipakai ulang di cover text.",
        "Menjaga penyampaian value tanpa jeda kosong yang panjang."
      ],
      hookLine: transcript[index]?.text ?? window.title,
      transcript: transcript.slice(index, index + 2),
      platforms: ["tiktok", "instagram", "youtube"],
      contentType: index === 1 ? "tutorial" : "education",
      sentiment: index === 2 ? "controversial" : "positive",
      status: "approved",
      previewImage: sourcePreview || createFallbackPreview(index)
    };
  });
}

export async function analyzeProject(project: Project, options?: { transcript?: TranscriptSegment[] }): Promise<Project> {
  const transcript = options?.transcript?.length ? options.transcript : await transcribeWithWhisperMock(project.asset.name);
  const clips = createClipCandidates(project, transcript).sort((a, b) => b.viralScore - a.viralScore);

  return {
    ...project,
    status: "ready",
    progress: 100,
    transcript,
    clips,
    captions: Object.fromEntries(clips.map((clip) => [clip.id, makeCaptionCues(clip.transcript)])),
    thumbnails: Object.fromEntries(clips.map((clip) => [clip.id, generateThumbnailVariants(clip)])),
    metadata: Object.fromEntries(clips.map((clip) => [clip.id, generateMetadataBundle(clip)])),
    processingSteps: buildProcessingSteps(100),
    insight: "Clip terkuat memadukan rasa urgensi dengan takeaway praktis untuk creator dalam 5 detik pertama.",
    updatedAt: new Date().toISOString()
  };
}

export function getProcessingSnapshot(progress: number) {
  return {
    steps: buildProcessingSteps(progress),
    message: loadingMessages[Math.min(Math.floor(progress / 25), loadingMessages.length - 1)]
  };
}
