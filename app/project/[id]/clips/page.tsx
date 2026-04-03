"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Download, PencilLine } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { ClipCard } from "@/components/ClipCard";
import { WorkflowStepper } from "@/components/WorkflowStepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const project = useMemo(() => selectProject(projects, projectId), [projects, projectId]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!hydrated || !projectId) {
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
    }
  }, [hydrated, projectId, project, projects, router]);

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
  const bestClip = clips[0] ?? project.clips[0];

  return (
    <AppShell
      title={`Review Clip ${project.name}`}
      eyebrow="Review Clip"
      actions={
        bestClip ? (
          <>
            <Link href={`/project/${project.id}/clip/${bestClip.id}`}>
              <Button variant="outline" className="gap-2">
                <PencilLine className="h-4 w-4" />
                Edit Clip Terbaik
              </Button>
            </Link>
            <a href={bestClip.downloadUrl || `/api/download/${project.id}/${bestClip.id}`} download>
              <Button className="gap-2" type="button">
                <Download className="h-4 w-4" />
                Download MP4
              </Button>
            </a>
          </>
        ) : null
      }
    >
      <WorkflowStepper current="review" />

      {bestClip ? (
        <Card className="grid gap-5 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="section-eyebrow">Clip Terbaik Saat Ini</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">{bestClip.title}</h2>
            <p className="mt-3 text-sm leading-6 text-white/60">{bestClip.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>Viral Score {bestClip.viralScore}</Badge>
              <Badge>{bestClip.durationSec}s</Badge>
              <Badge className="capitalize">{bestClip.platforms[0] ?? "youtube"}</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 lg:flex-col">
            <Link href={`/project/${project.id}/clip/${bestClip.id}`}>
              <Button variant="outline" className="gap-2">
                Edit Sekarang
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href={bestClip.downloadUrl || `/api/download/${project.id}/${bestClip.id}`} download>
              <Button className="gap-2" type="button">
                Download MP4
                <Download className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </Card>
      ) : null}

      <Card className="grid gap-4 md:grid-cols-[1fr_auto]">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari judul clip atau hook" />
        <div className="flex flex-wrap gap-2">
          <Badge>Urut: Viral Score</Badge>
          <Badge>{project.clips.length} clip</Badge>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
        {clips.map((clip) => (
          <ClipCard key={clip.id} clip={clip} project={project} />
        ))}
      </div>
    </AppShell>
  );
}
