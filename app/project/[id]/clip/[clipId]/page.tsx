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
import { ClipEditor } from "@/modules/editor/ClipEditor";
import { selectClip, selectProject, useClipForgeStore } from "@/store/useClipForgeStore";

export default function ClipDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string; clipId: string }>();
  const hydrated = useClipForgeStore((state) => state.hydrated);
  const projects = useClipForgeStore((state) => state.projects);
  const seedDemoProjects = useClipForgeStore((state) => state.seedDemoProjects);
  const project = useMemo(() => selectProject(projects, params.id), [projects, params.id]);
  const clip = useMemo(() => selectClip(project, params.clipId), [project, params.clipId]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (projects.length === 0) {
      seedDemoProjects();
      const fallbackProject = useClipForgeStore.getState().projects[0];
      const fallbackClip = fallbackProject?.clips[0];
      if (fallbackProject && fallbackClip) {
        router.replace(`/project/${fallbackProject.id}/clip/${fallbackClip.id}`);
      }
      return;
    }

    if (!project) {
      const fallbackProject = projects[0];
      const fallbackClip = fallbackProject?.clips[0];
      if (fallbackProject && fallbackClip) {
        router.replace(`/project/${fallbackProject.id}/clip/${fallbackClip.id}`);
      }
      return;
    }

    if (!clip) {
      const fallbackClip = project.clips[0];
      if (fallbackClip) {
        router.replace(`/project/${project.id}/clip/${fallbackClip.id}`);
      }
    }
  }, [clip, hydrated, project, projects, router, seedDemoProjects]);

  if (!hydrated) {
    return (
      <AppShell title="Loading clip" eyebrow="Manual Fine Tuning">
        <Card>
          <p className="text-white/70">Restoring clip data...</p>
        </Card>
      </AppShell>
    );
  }

  if (!project || !clip) {
    return (
      <AppShell title="Recovering clip" eyebrow="Manual Fine Tuning">
        <Card>
          <p className="text-white/70">Clip tidak ditemukan. Mengarahkan ke clip yang tersedia...</p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={clip.title}
      eyebrow="Manual Fine Tuning"
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
