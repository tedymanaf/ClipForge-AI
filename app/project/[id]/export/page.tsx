"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { ExportCenter } from "@/modules/export/ExportCenter";
import { selectClip } from "@/store/useClipForgeStore";
import { selectProject, useClipForgeStore } from "@/store/useClipForgeStore";

export default function ExportPage() {
  const params = useParams<{ id: string }>();
  const hydrated = useClipForgeStore((state) => state.hydrated);
  const projects = useClipForgeStore((state) => state.projects);
  const project = useMemo(() => selectProject(projects, params.id), [projects, params.id]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const clip = useMemo(
    () => (selectedClipId ? selectClip(project, selectedClipId) : project?.clips[0]),
    [project, selectedClipId]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSelectedClipId(params.get("clipId"));
  }, []);

  if (!hydrated) {
    return (
      <AppShell title="Loading export" eyebrow="Distribution Center">
        <Card>
          <p className="text-white/70">Preparing export data...</p>
        </Card>
      </AppShell>
    );
  }

  if (!project || !clip) {
    return (
      <AppShell title="Nothing to export">
        <Card>
          <p className="text-white/70">Generate or approve a clip first before exporting.</p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell title={`Export ${project.name}`} eyebrow="Distribution Center">
      <ExportCenter clip={clip} metadata={project.metadata[clip.id]} />
    </AppShell>
  );
}
