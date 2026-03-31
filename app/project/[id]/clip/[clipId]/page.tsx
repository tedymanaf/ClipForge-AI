"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useParams } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { CaptionOverlay } from "@/components/CaptionOverlay";
import { PlatformPreview } from "@/components/PlatformPreview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ClipEditor } from "@/modules/editor/ClipEditor";
import { selectClip, selectProject, useClipForgeStore } from "@/store/useClipForgeStore";

export default function ClipDetailPage() {
  const params = useParams<{ id: string; clipId: string }>();
  const projects = useClipForgeStore((state) => state.projects);
  const project = useMemo(() => selectProject(projects, params.id), [projects, params.id]);
  const clip = useMemo(() => selectClip(project, params.clipId), [project, params.clipId]);

  if (!project || !clip) {
    return (
      <AppShell title="Clip not found">
        <Card>
          <p className="text-white/70">The requested clip could not be found.</p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={clip.title}
      eyebrow="Manual Fine Tuning"
      actions={
        <Link href={`/project/${project.id}/export`}>
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
