"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { DEFAULT_PREFERENCES, DEMO_PROJECTS, DEFAULT_PROJECT_SETTINGS } from "@/lib/demo-data";
import { getProcessingSnapshot } from "@/modules/analysis/AnalysisEngine";
import {
  CaptionCue,
  ClipCandidate,
  Project,
  QueueItem,
  ThumbnailVariant,
  MetadataBundle,
  TranscriptSegment,
  TranscriptWord,
  ViralScoreBreakdown,
  UploadDescriptor,
  AppPreferences,
  CaptionStyleId,
  ProjectHistory,
  ProcessingStep,
  Platform,
  JobStatus
} from "@/types";
import { createId, svgToDataUri } from "@/lib/utils";

interface ClipForgeState {
  hydrated: boolean;
  projects: Project[];
  queue: QueueItem[];
  preferences: AppPreferences;
  onboardingSeen: boolean;
  editorHistory: Record<string, ProjectHistory>;
  setHydrated: () => void;
  seedDemoProjects: () => void;
  addQueueItem: (item: QueueItem) => void;
  updateQueueItem: (id: string, partial: Partial<QueueItem>) => void;
  removeQueueItem: (id: string) => void;
  createProjectFromUpload: (upload: UploadDescriptor) => Project;
  upsertProject: (project: Project) => void;
  updateProject: (projectId: string, updater: (project: Project) => Project) => void;
  approveClip: (projectId: string, clipId: string) => void;
  updateCaptionCue: (projectId: string, clipId: string, cueId: string, text: string) => void;
  setProjectCaptionStyle: (projectId: string, style: CaptionStyleId) => void;
  regenerateClip: (projectId: string, clipId: string) => ClipCandidate | undefined;
  undoProjectEdit: (projectId: string) => void;
  redoProjectEdit: (projectId: string) => void;
  canUndoProjectEdit: (projectId: string) => boolean;
  canRedoProjectEdit: (projectId: string) => boolean;
  setPreferences: (preferences: Partial<AppPreferences>) => void;
  markOnboardingSeen: () => void;
}

const storage = createJSONStorage(() => localStorage);

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function asOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createFallbackThumbnail(label: string) {
  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#0B0B12" offset="0%"/>
          <stop stop-color="#17122E" offset="100%"/>
        </linearGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#g)"/>
      <circle cx="1020" cy="180" r="180" fill="#06B6D4" fill-opacity="0.18"/>
      <circle cx="220" cy="580" r="220" fill="#7C3AED" fill-opacity="0.18"/>
      <text x="84" y="560" fill="#FFFFFF" font-size="58" font-family="Arial, sans-serif">${label}</text>
    </svg>
  `);
}

function normalizeTranscriptWord(value: unknown, index: number, baseStartMs: number): TranscriptWord {
  const raw = asRecord(value);
  const startMs = asNumber(raw.startMs, baseStartMs + index * 320);
  const endMs = Math.max(startMs + 180, asNumber(raw.endMs, startMs + 260));

  return {
    startMs,
    endMs,
    word: asString(raw.word, `word-${index + 1}`),
    confidence: clamp(asNumber(raw.confidence, 0.95), 0, 1),
    speaker: asOptionalString(raw.speaker),
    flagged: typeof raw.flagged === "boolean" ? raw.flagged : undefined
  };
}

function normalizeTranscriptSegment(value: unknown, index: number): TranscriptSegment {
  const raw = asRecord(value);
  const startMs = asNumber(raw.startMs, index * 4000);
  const endMs = Math.max(startMs + 1200, asNumber(raw.endMs, startMs + 3200));
  const text = asString(raw.text, `Recovered transcript segment ${index + 1}`);
  const wordsSource = Array.isArray(raw.words) ? raw.words : text.split(" ").map((word) => ({ word }));

  return {
    id: asString(raw.id, createId("segment")),
    startMs,
    endMs,
    text,
    confidence: clamp(asNumber(raw.confidence, 0.96), 0, 1),
    words: wordsSource.map((word, wordIndex) => normalizeTranscriptWord(word, wordIndex, startMs))
  };
}

function normalizeBreakdown(value: unknown): ViralScoreBreakdown {
  const raw = asRecord(value);

  return {
    hook: clamp(asNumber(raw.hook, 78), 0, 100),
    emotion: clamp(asNumber(raw.emotion, 72), 0, 100),
    value: clamp(asNumber(raw.value, 80), 0, 100),
    narrative: clamp(asNumber(raw.narrative, 74), 0, 100),
    quotability: clamp(asNumber(raw.quotability, 76), 0, 100),
    platformFit: clamp(asNumber(raw.platformFit, 82), 0, 100),
    trendAlignment: clamp(asNumber(raw.trendAlignment, 70), 0, 100),
    engagementPrediction: clamp(asNumber(raw.engagementPrediction, 77), 0, 100)
  };
}

function normalizePlatforms(value: unknown): Platform[] {
  const allowed: Platform[] = ["tiktok", "instagram", "youtube", "square"];
  const platforms = Array.isArray(value)
    ? value.filter((platform): platform is Platform => typeof platform === "string" && allowed.includes(platform as Platform))
    : [];

  return platforms.length ? platforms : ["tiktok", "instagram", "youtube"];
}

function normalizeClip(
  value: unknown,
  index: number,
  projectId: string,
  projectName: string,
  fallbackImage: string,
  preferredPreviewImage?: string
): ClipCandidate {
  const raw = asRecord(value);
  const transcript = Array.isArray(raw.transcript)
    ? raw.transcript.map((segment, segmentIndex) => normalizeTranscriptSegment(segment, segmentIndex))
    : [];
  const startSec = asNumber(raw.startSec, index * 15);
  const endSec = Math.max(startSec + 5, asNumber(raw.endSec, startSec + 30));
  const breakdown = normalizeBreakdown(raw.breakdown);

  return {
    id: asString(raw.id, createId("clip")),
    projectId,
    title: asString(raw.title, `${projectName} Clip ${index + 1}`),
    description: asString(raw.description, "Recovered clip candidate."),
    startSec,
    endSec,
    durationSec: Math.max(1, asNumber(raw.durationSec, endSec - startSec)),
    viralScore: clamp(asNumber(raw.viralScore, Math.round((breakdown.hook + breakdown.value + breakdown.platformFit) / 3)), 0, 100),
    breakdown,
    whyItWorks: Array.isArray(raw.whyItWorks) && raw.whyItWorks.length
      ? raw.whyItWorks.map((item, reasonIndex) => asString(item, `Recovered reason ${reasonIndex + 1}`))
      : ["Recovered clip candidate with enough data to keep editing safely."],
    hookLine: asString(raw.hookLine, transcript[0]?.text ?? "Recovered hook line"),
    transcript,
    platforms: normalizePlatforms(raw.platforms),
    contentType:
      raw.contentType === "podcast" ||
      raw.contentType === "tutorial" ||
      raw.contentType === "vlog" ||
      raw.contentType === "education" ||
      raw.contentType === "entertainment" ||
      raw.contentType === "motivation"
        ? raw.contentType
        : "education",
    sentiment: raw.sentiment === "positive" || raw.sentiment === "neutral" || raw.sentiment === "controversial"
      ? raw.sentiment
      : "neutral",
    status: raw.status === "suggested" || raw.status === "approved" || raw.status === "rendered"
      ? raw.status
      : "approved",
    previewImage: preferredPreviewImage ?? asString(raw.previewImage, fallbackImage)
  };
}

function normalizeCaptionCue(value: unknown, index: number, fallbackText: string): CaptionCue {
  const raw = asRecord(value);
  const startMs = asNumber(raw.startMs, index * 1200);
  const endMs = Math.max(startMs + 400, asNumber(raw.endMs, startMs + 1000));

  return {
    id: asString(raw.id, createId("cue")),
    startMs,
    endMs,
    text: asString(raw.text, fallbackText),
    activeWordIndex: typeof raw.activeWordIndex === "number" ? raw.activeWordIndex : undefined,
    emojis: Array.isArray(raw.emojis) ? raw.emojis.filter((emoji): emoji is string => typeof emoji === "string") : undefined
  };
}

function normalizeThumbnailVariant(value: unknown, index: number, fallbackImage: string, preferredImage?: string): ThumbnailVariant {
  const raw = asRecord(value);

  return {
    id: asString(raw.id, createId("thumb")),
    kind:
      raw.kind === "face-close-up" || raw.kind === "action-frame" || raw.kind === "text-forward"
        ? raw.kind
        : index === 0
          ? "face-close-up"
          : index === 1
            ? "action-frame"
            : "text-forward",
    label: asString(raw.label, `Recovered thumbnail ${index + 1}`),
    image: preferredImage ?? asString(raw.image, fallbackImage),
    size: raw.size === "1280x720" || raw.size === "1080x1080" || raw.size === "1080x1920" ? raw.size : "1080x1920"
  };
}

function normalizeMetadataBundle(value: unknown, clip: ClipCandidate): MetadataBundle {
  const raw = asRecord(value);
  const safeTitle = clip.title;

  return {
    clipId: asString(raw.clipId, clip.id),
    titles: {
      tiktok: Array.isArray(asRecord(raw.titles).tiktok) ? (asRecord(raw.titles).tiktok as unknown[]).map((item) => asString(item, safeTitle)) : [safeTitle],
      instagram: Array.isArray(asRecord(raw.titles).instagram) ? (asRecord(raw.titles).instagram as unknown[]).map((item) => asString(item, safeTitle)) : [safeTitle],
      youtube: Array.isArray(asRecord(raw.titles).youtube) ? (asRecord(raw.titles).youtube as unknown[]).map((item) => asString(item, safeTitle)) : [safeTitle],
      square: Array.isArray(asRecord(raw.titles).square) ? (asRecord(raw.titles).square as unknown[]).map((item) => asString(item, safeTitle)) : [safeTitle]
    },
    descriptions: {
      tiktok: asString(asRecord(raw.descriptions).tiktok, safeTitle),
      instagram: asString(asRecord(raw.descriptions).instagram, safeTitle),
      youtube: asString(asRecord(raw.descriptions).youtube, safeTitle),
      square: asString(asRecord(raw.descriptions).square, safeTitle)
    },
    hashtags: {
      tiktok: Array.isArray(asRecord(raw.hashtags).tiktok) ? (asRecord(raw.hashtags).tiktok as unknown[]).map((item) => asString(item, "#clipforgeai")) : ["#clipforgeai"],
      instagram: Array.isArray(asRecord(raw.hashtags).instagram) ? (asRecord(raw.hashtags).instagram as unknown[]).map((item) => asString(item, "#clipforgeai")) : ["#clipforgeai"],
      youtube: Array.isArray(asRecord(raw.hashtags).youtube) ? (asRecord(raw.hashtags).youtube as unknown[]).map((item) => asString(item, "#clipforgeai")) : ["#clipforgeai"],
      square: Array.isArray(asRecord(raw.hashtags).square) ? (asRecord(raw.hashtags).square as unknown[]).map((item) => asString(item, "#clipforgeai")) : ["#clipforgeai"]
    },
    tags: Array.isArray(raw.tags) ? raw.tags.map((item) => asString(item, "clipforge-ai")) : ["clipforge-ai"],
    category: asString(raw.category, "education"),
    sentiment: clip.sentiment,
    clipSeriesSuggestion: asString(raw.clipSeriesSuggestion, "Use this clip as the first post in a short-form series."),
    hookRewriteSuggestion: asString(raw.hookRewriteSuggestion, clip.hookLine)
  };
}

function normalizeProcessingStep(value: unknown, index: number): ProcessingStep {
  const raw = asRecord(value);
  const fallback = getProcessingSnapshot(Math.min(100, Math.max(8, (index + 1) * 12))).steps[index] ?? getProcessingSnapshot(8).steps[0];

  return {
    id:
      raw.id === "uploaded" ||
      raw.id === "transcribing" ||
      raw.id === "analyzing" ||
      raw.id === "clipping" ||
      raw.id === "captions" ||
      raw.id === "thumbnails" ||
      raw.id === "metadata" ||
      raw.id === "ready"
        ? raw.id
        : fallback.id,
    label: asString(raw.label, fallback.label),
    description: asString(raw.description, fallback.description),
    state: raw.state === "complete" || raw.state === "active" || raw.state === "pending" ? raw.state : fallback.state,
    progress: clamp(asNumber(raw.progress, fallback.progress), 0, 100)
  };
}

function normalizeProject(value: unknown): Project {
  const raw = asRecord(value);
  const projectId = asString(raw.id, createId("project"));
  const projectName = asString(raw.name, "Recovered Project");
  const createdAt = asString(raw.createdAt, new Date().toISOString());
  const updatedAt = asString(raw.updatedAt, createdAt);
  const rawAsset = asRecord(raw.asset);
  const fallbackThumbnail = createFallbackThumbnail(projectName);
  const assetSource =
    rawAsset.source === "file" || rawAsset.source === "youtube" || rawAsset.source === "google-drive" || rawAsset.source === "demo"
      ? rawAsset.source
      : "file";
  const assetThumbnail = asString(rawAsset.thumbnail, fallbackThumbnail);
  const preferredPreviewImage = assetSource === "demo" ? undefined : assetThumbnail;
  const clips = Array.isArray(raw.clips)
    ? raw.clips.map((clip, clipIndex) =>
        normalizeClip(clip, clipIndex, projectId, projectName, fallbackThumbnail, preferredPreviewImage)
      )
    : [];
  const progress = clamp(asNumber(raw.progress, clips.length ? 100 : 0), 0, 100);
  const statusFallback: JobStatus = clips.length ? "ready" : "queued";
  const status: JobStatus =
    raw.status === "idle" ||
    raw.status === "uploading" ||
    raw.status === "queued" ||
    raw.status === "processing" ||
    raw.status === "ready" ||
    raw.status === "error"
      ? raw.status
      : statusFallback;
  const transcript = Array.isArray(raw.transcript)
    ? raw.transcript.map((segment, segmentIndex) => normalizeTranscriptSegment(segment, segmentIndex))
    : [];

  const captionsSource = asRecord(raw.captions);
  const thumbnailsSource = asRecord(raw.thumbnails);
  const metadataSource = asRecord(raw.metadata);

  return {
    id: projectId,
    name: projectName,
    status,
    createdAt,
    updatedAt,
    asset: {
      id: asString(rawAsset.id, createId("asset")),
      name: asString(rawAsset.name, `${projectName}.mp4`),
      source: assetSource,
      path: asOptionalString(rawAsset.path),
      url: asOptionalString(rawAsset.url),
      durationSec: Math.max(0, asNumber(rawAsset.durationSec, clips[0]?.endSec ?? 0)),
      width: Math.max(1, asNumber(rawAsset.width, 1920)),
      height: Math.max(1, asNumber(rawAsset.height, 1080)),
      sizeBytes: Math.max(0, asNumber(rawAsset.sizeBytes, 0)),
      codec: asString(rawAsset.codec, "Unknown"),
      thumbnail: assetThumbnail
    },
    clips,
    transcript,
    captions: Object.fromEntries(
      clips.map((clip) => {
        const cueSource = captionsSource[clip.id];
        const normalizedCues = Array.isArray(cueSource)
          ? cueSource.map((cue, cueIndex) => normalizeCaptionCue(cue, cueIndex, clip.hookLine))
          : clip.transcript.map((segment, cueIndex) => normalizeCaptionCue(segment, cueIndex, segment.text));

        return [clip.id, normalizedCues];
      })
    ),
    thumbnails: Object.fromEntries(
      clips.map((clip) => {
        const thumbSource = thumbnailsSource[clip.id];
        const preferredThumbnailImage = assetSource === "demo" ? undefined : clip.previewImage;
        const normalizedThumbs = Array.isArray(thumbSource)
          ? thumbSource.map((thumb, thumbIndex) =>
              normalizeThumbnailVariant(thumb, thumbIndex, clip.previewImage, preferredThumbnailImage)
            )
          : [normalizeThumbnailVariant({}, 0, clip.previewImage, preferredThumbnailImage)];

        return [clip.id, normalizedThumbs];
      })
    ),
    metadata: Object.fromEntries(
      clips.map((clip) => [clip.id, normalizeMetadataBundle(metadataSource[clip.id], clip)])
    ),
    processingSteps:
      Array.isArray(raw.processingSteps) && raw.processingSteps.length
        ? raw.processingSteps.map((step, stepIndex) => normalizeProcessingStep(step, stepIndex))
        : getProcessingSnapshot(status === "ready" ? 100 : Math.max(progress, 8)).steps,
    progress: status === "ready" ? 100 : progress,
    insight: asString(
      raw.insight,
      status === "ready"
        ? "Recovered project is ready to review."
        : "ClipForge is warming up the analysis engine."
    ),
    settings: {
      ...DEFAULT_PROJECT_SETTINGS,
      ...asRecord(raw.settings)
    } as Project["settings"]
  };
}

function cloneProject(project: Project): Project {
  return JSON.parse(JSON.stringify(project)) as Project;
}

function buildRemixedClip(project: Project, source: ClipCandidate): ClipCandidate {
  const startSec = Math.max(0, source.startSec + 1.5);
  const endSec = Math.min(project.asset.durationSec, source.endSec + 1.5);
  const durationSec = Math.max(15, Math.round((endSec - startSec) * 10) / 10);

  return {
    ...cloneProject(project).clips.find((clip) => clip.id === source.id)!,
    id: createId("clip"),
    title: `${source.title} Remix`,
    description: "Alternate cut generated from the same source window with a refreshed hook angle.",
    startSec,
    endSec: startSec + durationSec,
    durationSec,
    viralScore: Math.min(99, source.viralScore + 2),
    hookLine: `Remix: ${source.hookLine}`,
    whyItWorks: [
      "Re-cut opening creates a fresher first-second pattern interrupt.",
      ...source.whyItWorks.slice(0, 2)
    ],
    status: "approved"
  };
}

function withHistory(
  state: ClipForgeState,
  projectId: string,
  updater: (project: Project) => Project
) {
  const current = state.projects.find((project) => project.id === projectId);

  if (!current) {
    return { projects: state.projects, editorHistory: state.editorHistory };
  }

  const updatedProject = updater(cloneProject(current));
  const existingHistory = state.editorHistory[projectId] ?? { past: [], future: [] };

  return {
    projects: state.projects.map((project) => (project.id === projectId ? normalizeProject(updatedProject) : project)),
    editorHistory: {
      ...state.editorHistory,
      [projectId]: {
        past: [...existingHistory.past, cloneProject(current)].slice(-20),
        future: []
      }
    }
  };
}

export const useClipForgeStore = create<ClipForgeState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      projects: [],
      queue: [],
      preferences: DEFAULT_PREFERENCES,
      onboardingSeen: false,
      editorHistory: {},
      setHydrated: () => set({ hydrated: true }),
      seedDemoProjects: () => {
        if (get().projects.length > 0) {
          return;
        }

        set({ projects: DEMO_PROJECTS.map((project) => normalizeProject(project)) });
      },
      addQueueItem: (item) => set((state) => ({ queue: [item, ...state.queue].slice(0, 5) })),
      updateQueueItem: (id, partial) =>
        set((state) => ({
          queue: state.queue.map((item) => (item.id === id ? { ...item, ...partial } : item))
        })),
      removeQueueItem: (id) => set((state) => ({ queue: state.queue.filter((item) => item.id !== id) })),
      createProjectFromUpload: (upload) => {
        const project: Project = {
          id: createId("project"),
          name: upload.name.replace(/\.[a-z0-9]+$/i, ""),
          status: "queued",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          asset: {
            id: createId("asset"),
            name: upload.name,
            source: upload.source,
            path: upload.path,
            url: upload.url,
            durationSec: upload.durationSec,
            width: upload.width,
            height: upload.height,
            sizeBytes: upload.sizeBytes,
            codec: upload.codec || "Unknown",
            thumbnail: upload.thumbnail
          },
          clips: [],
          transcript: [],
          captions: {},
          thumbnails: {},
          metadata: {},
          processingSteps: [],
          progress: 0,
          insight: "ClipForge is warming up the analysis engine.",
          settings: DEFAULT_PROJECT_SETTINGS
        };

        const normalizedProject = normalizeProject(project);

        set((state) => ({ projects: [normalizedProject, ...state.projects] }));
        return normalizedProject;
      },
      upsertProject: (project) =>
        set((state) => ({
          projects: state.projects.some((item) => item.id === project.id)
            ? state.projects.map((item) => (item.id === project.id ? normalizeProject(project) : item))
            : [normalizeProject(project), ...state.projects]
        })),
      updateProject: (projectId, updater) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId ? normalizeProject(updater(project)) : project
          )
        })),
      approveClip: (projectId, clipId) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id !== projectId
              ? project
              : {
                  ...project,
                  clips: project.clips.map((clip) =>
                    clip.id === clipId ? { ...clip, status: "approved" } : clip
                  )
                }
          )
        })),
      updateCaptionCue: (projectId, clipId, cueId, text) =>
        set((state) =>
          withHistory(state, projectId, (project) => ({
            ...project,
            updatedAt: new Date().toISOString(),
            captions: {
              ...project.captions,
              [clipId]: (project.captions[clipId] ?? []).map((cue: CaptionCue) =>
                cue.id === cueId ? { ...cue, text } : cue
              )
            }
          }))
        ),
      setProjectCaptionStyle: (projectId, style) =>
        set((state) =>
          withHistory(state, projectId, (project) => ({
            ...project,
            updatedAt: new Date().toISOString(),
            settings: {
              ...project.settings,
              captionStyle: style
            }
          }))
        ),
      regenerateClip: (projectId, clipId) => {
        const state = get();
        const project = state.projects.find((item) => item.id === projectId);
        const clip = project?.clips.find((item) => item.id === clipId);

        if (!project || !clip) {
          return undefined;
        }

        const remixed = buildRemixedClip(project, clip);

        set((current) =>
          withHistory(current, projectId, (item) => ({
            ...item,
            updatedAt: new Date().toISOString(),
            clips: [remixed, ...item.clips],
            captions: {
              ...item.captions,
              [remixed.id]: (item.captions[clipId] ?? []).map((cue) => ({
                ...cue,
                id: createId("cue"),
                text: cue.text.replace(/^Remix:\s*/i, "").trim()
              }))
            },
            thumbnails: {
              ...item.thumbnails,
              [remixed.id]: item.thumbnails[clipId] ?? []
            },
            metadata: {
              ...item.metadata,
              [remixed.id]: item.metadata[clipId]
                ? {
                    ...item.metadata[clipId],
                    clipId: remixed.id,
                    hookRewriteSuggestion: `Remix opener: "${remixed.hookLine}"`
                  }
                : item.metadata[clipId]
            }
          }))
        );

        return remixed;
      },
      undoProjectEdit: (projectId) =>
        set((state) => {
          const history = state.editorHistory[projectId];
          const current = state.projects.find((project) => project.id === projectId);

          if (!history || history.past.length === 0 || !current) {
            return state;
          }

          const previous = history.past[history.past.length - 1];
          return {
            ...state,
            projects: state.projects.map((project) => (project.id === projectId ? previous : project)),
            editorHistory: {
              ...state.editorHistory,
              [projectId]: {
                past: history.past.slice(0, -1),
                future: [cloneProject(current), ...history.future].slice(0, 20)
              }
            }
          };
        }),
      redoProjectEdit: (projectId) =>
        set((state) => {
          const history = state.editorHistory[projectId];
          const current = state.projects.find((project) => project.id === projectId);

          if (!history || history.future.length === 0 || !current) {
            return state;
          }

          const [next, ...restFuture] = history.future;
          return {
            ...state,
            projects: state.projects.map((project) => (project.id === projectId ? next : project)),
            editorHistory: {
              ...state.editorHistory,
              [projectId]: {
                past: [...history.past, cloneProject(current)].slice(-20),
                future: restFuture
              }
            }
          };
        }),
      canUndoProjectEdit: (projectId) => (get().editorHistory[projectId]?.past.length ?? 0) > 0,
      canRedoProjectEdit: (projectId) => (get().editorHistory[projectId]?.future.length ?? 0) > 0,
      setPreferences: (preferences) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            ...preferences
          }
        })),
      markOnboardingSeen: () => set({ onboardingSeen: true })
    }),
    {
      name: "clipforge-ai-store",
      storage,
      partialize: (state) => ({
        projects: state.projects,
        preferences: state.preferences,
        onboardingSeen: state.onboardingSeen
      }),
      merge: (persistedState, currentState) => {
        const persisted = asRecord(persistedState);
        const preferences = asRecord(persisted.preferences);

        return {
          ...currentState,
          ...persisted,
          projects: Array.isArray(persisted.projects)
            ? persisted.projects.map((project) => normalizeProject(project))
            : currentState.projects,
          preferences: {
            ...DEFAULT_PREFERENCES,
            ...preferences
          },
          onboardingSeen:
            typeof persisted.onboardingSeen === "boolean"
              ? persisted.onboardingSeen
              : currentState.onboardingSeen,
          hydrated: currentState.hydrated,
          queue: currentState.queue,
          editorHistory: currentState.editorHistory
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      }
    }
  )
);

export function selectProject(projects: Project[], projectId: string) {
  return projects.find((project) => project.id === projectId);
}

export function selectClip(project: Project | undefined, clipId: string): ClipCandidate | undefined {
  return project?.clips.find((clip) => clip.id === clipId);
}
