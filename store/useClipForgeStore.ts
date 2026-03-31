"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { DEFAULT_PREFERENCES, DEMO_PROJECTS, DEFAULT_PROJECT_SETTINGS } from "@/lib/demo-data";
import { CaptionCue, ClipCandidate, Project, QueueItem, UploadDescriptor, AppPreferences } from "@/types";
import { createId } from "@/lib/utils";

interface ClipForgeState {
  hydrated: boolean;
  projects: Project[];
  queue: QueueItem[];
  preferences: AppPreferences;
  onboardingSeen: boolean;
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
  setPreferences: (preferences: Partial<AppPreferences>) => void;
  markOnboardingSeen: () => void;
}

const storage = createJSONStorage(() => localStorage);

export const useClipForgeStore = create<ClipForgeState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      projects: [],
      queue: [],
      preferences: DEFAULT_PREFERENCES,
      onboardingSeen: false,
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
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id !== projectId
              ? project
              : {
                  ...project,
                  captions: {
                    ...project.captions,
                    [clipId]: (project.captions[clipId] ?? []).map((cue: CaptionCue) =>
                      cue.id === cueId ? { ...cue, text } : cue
                    )
                  }
                }
          )
        })),
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
