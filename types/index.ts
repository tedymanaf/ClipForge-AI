export type UploadSource = "file" | "youtube" | "google-drive" | "demo";
export type JobStatus = "idle" | "uploading" | "queued" | "processing" | "ready" | "error";
export type BackendProcessingStage = "idle" | "uploading" | "transcribing" | "scoring" | "cutting" | "ready" | "error";
export type Platform = "tiktok" | "instagram" | "youtube" | "square";
export type CaptionStyleId =
  | "bold-fire"
  | "neon-pop"
  | "minimal-clean"
  | "tiktok-native"
  | "cinematic"
  | "creator-pro";

export interface VideoAsset {
  id: string;
  name: string;
  source: UploadSource;
  path?: string;
  url?: string;
  durationSec: number;
  width: number;
  height: number;
  sizeBytes: number;
  codec: string;
  thumbnail: string;
}

export interface TranscriptWord {
  startMs: number;
  endMs: number;
  word: string;
  confidence: number;
  speaker?: string;
  flagged?: boolean;
}

export interface TranscriptSegment {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
  confidence: number;
  words: TranscriptWord[];
}

export interface ViralScoreBreakdown {
  hook: number;
  emotion: number;
  value: number;
  narrative: number;
  quotability: number;
  platformFit: number;
  trendAlignment: number;
  engagementPrediction: number;
}

export interface ClipCandidate {
  id: string;
  projectId: string;
  title: string;
  description: string;
  startSec: number;
  endSec: number;
  durationSec: number;
  viralScore: number;
  breakdown: ViralScoreBreakdown;
  whyItWorks: string[];
  hookLine: string;
  transcript: TranscriptSegment[];
  platforms: Platform[];
  contentType: "podcast" | "tutorial" | "vlog" | "education" | "entertainment" | "motivation";
  sentiment: "positive" | "neutral" | "controversial";
  status: "suggested" | "approved" | "rendered";
  previewImage: string;
  downloadUrl?: string;
}

export interface CaptionCue {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
  activeWordIndex?: number;
  emojis?: string[];
}

export interface CaptionPreset {
  id: CaptionStyleId;
  name: string;
  description: string;
}

export interface ThumbnailVariant {
  id: string;
  kind: "face-close-up" | "action-frame" | "text-forward";
  label: string;
  image: string;
  size: "1280x720" | "1080x1080" | "1080x1920";
}

export interface MetadataBundle {
  clipId: string;
  titles: Record<Platform, string[]>;
  descriptions: Record<Platform, string>;
  hashtags: Record<Platform, string[]>;
  tags: string[];
  category: string;
  sentiment: ClipCandidate["sentiment"];
  clipSeriesSuggestion: string;
  hookRewriteSuggestion: string;
}

export interface ProcessingStep {
  id:
    | "uploaded"
    | "transcribing"
    | "analyzing"
    | "clipping"
    | "captions"
    | "thumbnails"
    | "metadata"
    | "ready";
  label: string;
  description: string;
  state: "complete" | "active" | "pending";
  progress: number;
}

export interface ProjectSettings {
  defaultPlatforms: Platform[];
  captionStyle: CaptionStyleId;
  language: string;
  uiLanguage: string;
  qualityPreset: "draft" | "standard" | "premium";
  removeSilence: boolean;
  autoPublish: boolean;
}

export interface Project {
  id: string;
  name: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  asset: VideoAsset;
  clips: ClipCandidate[];
  transcript: TranscriptSegment[];
  captions: Record<string, CaptionCue[]>;
  thumbnails: Record<string, ThumbnailVariant[]>;
  metadata: Record<string, MetadataBundle>;
  processingSteps: ProcessingStep[];
  progress: number;
  insight: string;
  settings: ProjectSettings;
}

export interface GeneratedClip {
  id: string;
  startSec: number;
  endSec: number;
  score: number;
  hookReason: string;
  captionSuggestion: string;
  filename: string;
  downloadUrl: string;
}

export interface QueueItem {
  id: string;
  name: string;
  progress: number;
  status: JobStatus;
  sizeBytes: number;
}

export interface UploadDescriptor {
  id: string;
  projectId?: string;
  serverAssetId?: string;
  name: string;
  file?: File;
  path?: string;
  url?: string;
  source: UploadSource;
  durationSec: number;
  width: number;
  height: number;
  sizeBytes: number;
  codec: string;
  thumbnail: string;
}

export interface ProcessingEventPayload {
  projectId: string;
  step: ProcessingStep["id"];
  progress: number;
  message: string;
}

export interface ExportArtifact {
  name: string;
  type: "video" | "thumbnail" | "metadata" | "captions";
  sizeLabel: string;
}

export interface AppPreferences {
  openAiKey?: string;
  youtubeKey?: string;
  tiktokKey?: string;
  instagramKey?: string;
  brandName: string;
  brandColors: string[];
  fontFamily: string;
  notifications: boolean;
  demoMode: boolean;
}

export interface ProjectHistory {
  past: Project[];
  future: Project[];
}
