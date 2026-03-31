"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { AnalyticsDashboard } from "@/modules/analytics/AnalyticsDashboard";
import { AppShell } from "@/components/AppShell";
import { ClipCard } from "@/components/ClipCard";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { selectProject, useClipForgeStore } from "@/store/useClipForgeStore";

export default function ClipsPage() {
  const params = useParams<{ id: string }>();
  const hydrated = useClipForgeStore((state) => state.hydrated);
  const projects = useClipForgeStore((state) => state.projects);
  const project = useMemo(() => selectProject(projects, params.id), [projects, params.id]);
  const [query, setQuery] = useState("");

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
      <AppShell title="Project not found">
        <Card>
          <p className="text-white/70">The requested project could not be found.</p>
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
          <ClipCard key={clip.id} clip={clip} projectId={project.id} />
        ))}
      </div>

      <AnalyticsDashboard project={project} />
    </AppShell>
  );
}
