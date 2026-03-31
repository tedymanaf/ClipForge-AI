"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { DEFAULT_PREFERENCES, DEMO_PROJECTS, DEFAULT_PROJECT_SETTINGS } from "@/lib/demo-data";
import {
  CaptionCue,
  ClipCandidate,
  Project,
  QueueItem,
  UploadDescriptor,
  AppPreferences,
  CaptionStyleId,
  ProjectHistory
} from "@/types";
import { createId } from "@/lib/utils";

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
    projects: state.projects.map((project) => (project.id === projectId ? updatedProject : project)),
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

        set({ projects: DEMO_PROJECTS });
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

        set((state) => ({ projects: [project, ...state.projects] }));
        return project;
      },
      upsertProject: (project) =>
        set((state) => ({
          projects: state.projects.some((item) => item.id === project.id)
            ? state.projects.map((item) => (item.id === project.id ? project : item))
            : [project, ...state.projects]
        })),
      updateProject: (projectId, updater) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId ? updater(project) : project
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
