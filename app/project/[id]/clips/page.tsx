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
  const hydrated = useClipForgeStore((state) => state.hydrated);
  const projects = useClipForgeStore((state) => state.projects);
  const seedDemoProjects = useClipForgeStore((state) => state.seedDemoProjects);
  const project = useMemo(() => selectProject(projects, params.id), [projects, params.id]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!hydrated) {
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
  }, [hydrated, project, projects, router, seedDemoProjects]);

  if (!hydrated) {
    return (
      <AppShell title="Loading project" eyebrow="Review & Approve">
        <Card>
          <p className="text-white/70">Restoring project data...</p>
        </Card>
      </AppShell>
    );
  }

  if (!project) {
    return (
      <AppShell title="Recovering project" eyebrow="Review & Approve">
        <Card>
          <p className="text-white/70">Project lama tidak ditemukan. Mengarahkan ke project yang tersedia...</p>
        </Card>
      </AppShell>
    );
  }

  if (!isProjectReadyForReview(project)) {
    return (
      <AppShell title="Preparing clips" eyebrow="Review & Approve">
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
    <AppShell title={`${project.name} Clips`} eyebrow="Review & Approve">
      <Card className="grid gap-4 md:grid-cols-[1fr_auto]">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search clips, hooks, or content type" />
        <div className="flex flex-wrap gap-2">
          <Badge>Sort: Viral Score</Badge>
          <Badge>Filter: All platforms</Badge>
          <Badge>{project.clips.length} clips</Badge>
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
