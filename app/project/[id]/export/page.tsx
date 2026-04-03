"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { getProjectPrimaryRoute, isProjectReadyForReview } from "@/lib/project-routing";
import { ExportCenter } from "@/modules/export/ExportCenter";
import { selectClip } from "@/store/useClipForgeStore";
import { selectProject, useClipForgeStore } from "@/store/useClipForgeStore";

export default function ExportPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const projectId = typeof params.id === "string" ? params.id : "";
  const hydrated = useClipForgeStore((state) => state.hydrated);
  const projects = useClipForgeStore((state) => state.projects);
  const seedDemoProjects = useClipForgeStore((state) => state.seedDemoProjects);
  const project = useMemo(() => selectProject(projects, projectId), [projects, projectId]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const clip = useMemo(
    () => (selectedClipId ? selectClip(project, selectedClipId) : project?.clips[0]),
    [project, selectedClipId]
  );

  useEffect(() => {
    if (!hydrated || !projectId) {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const nextClipId = searchParams.get("clipId");
    setSelectedClipId(nextClipId);

    if (projects.length === 0) {
      seedDemoProjects();
      const fallbackProject = useClipForgeStore.getState().projects[0];
      const fallbackClip = fallbackProject?.clips[0];
      if (fallbackProject && fallbackClip) {
        router.replace(`/project/${fallbackProject.id}/export?clipId=${fallbackClip.id}`);
      } else if (fallbackProject) {
        router.replace(getProjectPrimaryRoute(fallbackProject));
      }
      return;
    }

    if (!project) {
      const fallbackProject = projects[0];
      const fallbackClip = fallbackProject?.clips[0];
      if (fallbackProject && fallbackClip) {
        router.replace(`/project/${fallbackProject.id}/export?clipId=${fallbackClip.id}`);
      } else if (fallbackProject) {
        router.replace(getProjectPrimaryRoute(fallbackProject));
      }
      return;
    }

    if (!isProjectReadyForReview(project)) {
      router.replace(getProjectPrimaryRoute(project));
      return;
    }

    if (nextClipId && !selectClip(project, nextClipId)) {
      const fallbackClip = project.clips[0];
      if (fallbackClip) {
        router.replace(`/project/${project.id}/export?clipId=${fallbackClip.id}`);
      }
    }
  }, [hydrated, projectId, project, projects, router, seedDemoProjects]);

  if (!hydrated || !projectId) {
    return (
      <AppShell title="Memuat export" eyebrow="Pusat Distribusi">
        <Card>
          <p className="text-white/70">Preparing export data...</p>
        </Card>
      </AppShell>
    );
  }

  if (!project || !clip) {
    return (
      <AppShell title="Memulihkan export" eyebrow="Pusat Distribusi">
        <Card>
          <p className="text-white/70">Target export tidak ditemukan. Mengarahkan ke clip yang tersedia...</p>
        </Card>
      </AppShell>
    );
  }

  if (!isProjectReadyForReview(project)) {
    return (
      <AppShell title="Menyiapkan export" eyebrow="Pusat Distribusi">
        <Card>
          <p className="text-white/70">Project ini belum siap diexport. Mengarahkan ke halaman processing...</p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell title={`Export ${project.name}`} eyebrow="Pusat Distribusi">
      <ExportCenter
        clip={clip}
        metadata={project.metadata[clip.id]}
        asset={project.asset}
        thumbnails={project.thumbnails[clip.id] ?? []}
        cues={project.captions[clip.id] ?? []}
        captionStyle={project.settings.captionStyle}
      />
    </AppShell>
  );
}
