"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { AnalyticsDashboard } from "@/modules/analytics/AnalyticsDashboard";
import { AppShell } from "@/components/AppShell";
import { ClipCard } from "@/components/ClipCard";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getProjectPrimaryRoute, isProjectReadyForReview } from "@/lib/project-routing";
import { selectProject, useClipForgeStore } from "@/store/useClipForgeStore";

export default function ClipsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const projectId = typeof params.id === "string" ? params.id : "";
  const hydrated = useClipForgeStore((state) => state.hydrated);
  const projects = useClipForgeStore((state) => state.projects);
  const seedDemoProjects = useClipForgeStore((state) => state.seedDemoProjects);
  const project = useMemo(() => selectProject(projects, projectId), [projects, projectId]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!hydrated || !projectId) {
      return;
    }

    if (projects.length === 0) {
      seedDemoProjects();
      const fallback = useClipForgeStore.getState().projects[0];
      if (fallback) {
        router.replace(getProjectPrimaryRoute(fallback));
      }
      return;
    }

    if (!project) {
      router.replace(getProjectPrimaryRoute(projects[0]));
      return;
    }

    if (!isProjectReadyForReview(project)) {
      router.replace(getProjectPrimaryRoute(project));
    }
  }, [hydrated, projectId, project, projects, router, seedDemoProjects]);

  if (!hydrated || !projectId) {
    return (
      <AppShell title="Memuat project" eyebrow="Review Clip">
        <Card>
          <p className="text-white/70">Restoring project data...</p>
        </Card>
      </AppShell>
    );
  }

  if (!project) {
    return (
      <AppShell title="Memulihkan project" eyebrow="Review Clip">
        <Card>
          <p className="text-white/70">Project lama tidak ditemukan. Mengarahkan ke project yang tersedia...</p>
        </Card>
      </AppShell>
    );
  }

  if (!isProjectReadyForReview(project)) {
    return (
      <AppShell title="Menyiapkan clip" eyebrow="Review Clip">
        <Card>
          <p className="text-white/70">Project ini belum siap direview. Mengarahkan ke halaman processing...</p>
        </Card>
      </AppShell>
    );
  }

  const clips = project.clips
    .filter((clip) => clip.title.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => b.viralScore - a.viralScore);

  return (
    <AppShell title={`Review Clip ${project.name}`} eyebrow="Review Clip">
      <Card className="grid gap-4 md:grid-cols-[1fr_auto]">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari judul clip atau hook" />
        <div className="flex flex-wrap gap-2">
          <Badge>Urut: Viral Score</Badge>
          <Badge>Filter: Semua platform</Badge>
          <Badge>{project.clips.length} clip</Badge>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
        {clips.map((clip) => (
          <ClipCard key={clip.id} clip={clip} project={project} />
        ))}
      </div>

      <AnalyticsDashboard project={project} />
    </AppShell>
  );
}
