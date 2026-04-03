"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { CaptionOverlay } from "@/components/CaptionOverlay";
import { PlatformPreview } from "@/components/PlatformPreview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getProjectPrimaryRoute, isProjectReadyForReview } from "@/lib/project-routing";
import { ClipEditor } from "@/modules/editor/ClipEditor";
import { selectClip, selectProject, useClipForgeStore } from "@/store/useClipForgeStore";

export default function ClipDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string; clipId: string }>();
  const projectId = typeof params.id === "string" ? params.id : "";
  const clipId = typeof params.clipId === "string" ? params.clipId : "";
  const hydrated = useClipForgeStore((state) => state.hydrated);
  const projects = useClipForgeStore((state) => state.projects);
  const project = useMemo(() => selectProject(projects, projectId), [projects, projectId]);
  const clip = useMemo(() => selectClip(project, clipId), [project, clipId]);

  useEffect(() => {
    if (!hydrated || !projectId || !clipId) {
      return;
    }

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

    if (!clip) {
      const fallbackClip = project.clips[0];
      if (fallbackClip) {
        router.replace(`/project/${project.id}/clip/${fallbackClip.id}`);
      }
    }
  }, [clip, clipId, hydrated, projectId, project, projects, router]);

  if (!hydrated || !projectId || !clipId) {
    return (
      <AppShell title="Memuat clip" eyebrow="Editor Manual">
        <Card>
          <p className="text-white/70">Restoring clip data...</p>
        </Card>
      </AppShell>
    );
  }

  if (!project || !clip) {
    return (
      <AppShell title="Memulihkan clip" eyebrow="Editor Manual">
        <Card>
          <p className="text-white/70">Clip tidak ditemukan. Mengarahkan ke clip yang tersedia...</p>
        </Card>
      </AppShell>
    );
  }

  if (!isProjectReadyForReview(project)) {
    return (
      <AppShell title="Menyiapkan clip" eyebrow="Editor Manual">
        <Card>
          <p className="text-white/70">Project ini belum siap diedit. Mengarahkan ke halaman processing...</p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={clip.title}
      eyebrow="Editor Manual"
      actions={
        <Link href={`/project/${project.id}/export?clipId=${clip.id}`}>
          <Button className="gap-2">
            Export Clip
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      }
    >
      <ClipEditor project={project} clip={clip} />
      <PlatformPreview clip={clip} />
      <CaptionOverlay cues={project.captions[clip.id] ?? []} />
    </AppShell>
  );
}
