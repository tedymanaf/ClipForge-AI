"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { WorkflowStepper } from "@/components/WorkflowStepper";
import { Button } from "@/components/ui/button";
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
      router.replace("/dashboard");
      return;
    }

    if (!project) {
      router.replace("/dashboard");
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
  }, [hydrated, projectId, project, projects, router]);

  if (!hydrated || !projectId) {
    return (
      <AppShell title="Menyiapkan download" eyebrow="Download">
        <Card>
          <p className="text-white/70">Data export sedang disiapkan. Tunggu sebentar...</p>
        </Card>
      </AppShell>
    );
  }

  if (!project || !clip) {
    return (
      <AppShell title="Menemukan clip export" eyebrow="Download">
        <Card>
          <p className="text-white/70">Clip target tidak ditemukan. Kamu sedang diarahkan ke clip yang masih tersedia...</p>
        </Card>
      </AppShell>
    );
  }

  if (!isProjectReadyForReview(project)) {
    return (
      <AppShell title="Menunggu clip siap" eyebrow="Download">
        <Card>
          <p className="text-white/70">Project ini belum siap diunduh. Kamu sedang diarahkan ke status proses terbaru...</p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Download MP4 ${project.name}`}
      eyebrow="Download"
      actions={
        <Link href={`/project/${project.id}/clip/${clip.id}`}>
          <Button variant="outline">Kembali ke Edit</Button>
        </Link>
      }
    >
      <WorkflowStepper current="download" />
      <ExportCenter
        projectId={project.id}
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
