"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { analyzeProject, getProcessingSnapshot } from "@/modules/analysis/AnalysisEngine";
import { AppShell } from "@/components/AppShell";
import { ClipCard } from "@/components/ClipCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProcessingTimeline } from "@/components/ProcessingTimeline";
import { getProjectPrimaryRoute, isProjectReadyForReview } from "@/lib/project-routing";
import { useClipForgeStore } from "@/store/useClipForgeStore";
import { selectProject } from "@/store/useClipForgeStore";

export default function ProcessingPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const projectId = typeof params.id === "string" ? params.id : "";
  const hydrated = useClipForgeStore((state) => state.hydrated);
  const projects = useClipForgeStore((state) => state.projects);
  const updateProject = useClipForgeStore((state) => state.updateProject);
  const seedDemoProjects = useClipForgeStore((state) => state.seedDemoProjects);
  const project = useMemo(() => selectProject(projects, projectId), [projects, projectId]);
  const initializedProjectRef = useRef<string | null>(null);
  const timelineSteps = project?.processingSteps?.length ? project.processingSteps : getProcessingSnapshot(8).steps;
  const heroThumbnail = project?.asset?.thumbnail ?? "";
  const liveClips = project?.clips ?? [];

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
    }
  }, [hydrated, projectId, project, projects, router, seedDemoProjects]);

  useEffect(() => {
    if (!hydrated || !projectId) {
      return;
    }

    let analyzing = false;

    const ensureInitialized = () => {
      const current = useClipForgeStore.getState().projects.find((item) => item.id === projectId);
      if (!current || isProjectReadyForReview(current)) {
        return false;
      }

      if (initializedProjectRef.current === projectId) {
        return true;
      }

      const progress = Math.max(current.progress, 8);
      const snapshot = getProcessingSnapshot(progress);
      initializedProjectRef.current = projectId;

      updateProject(projectId, (item) => ({
        ...item,
        status: "processing",
        progress,
        insight: snapshot.message,
        processingSteps: snapshot.steps
      }));

      return true;
    };

    const interval = window.setInterval(async () => {
      const current = useClipForgeStore.getState().projects.find((item) => item.id === projectId);

      if (!current) {
        window.clearInterval(interval);
        initializedProjectRef.current = null;
        return;
      }

      if (isProjectReadyForReview(current)) {
        window.clearInterval(interval);
        initializedProjectRef.current = null;
        return;
      }

      const progress = Math.min(Math.max(current.progress, 8) + 12, 100);
      const snapshot = getProcessingSnapshot(progress);

      updateProject(projectId, (item) => ({
        ...item,
        status: "processing",
        progress,
        insight: snapshot.message,
        processingSteps: snapshot.steps
      }));

      if (progress >= 100 && !analyzing) {
        analyzing = true;
        window.clearInterval(interval);
        const fresh = useClipForgeStore.getState().projects.find((item) => item.id === projectId);
        if (fresh) {
          try {
            const analyzed = await analyzeProject(fresh);
            updateProject(projectId, () => analyzed);
          } catch (error) {
            console.error("Failed to analyze project", error);
            updateProject(projectId, (item) => ({
              ...item,
              status: "error",
              insight: "Analisis sempat gagal. Kamu tetap bisa kembali ke dashboard atau coba upload lagi."
            }));
          }
        }
        initializedProjectRef.current = null;
      }
    }, 700);

    ensureInitialized();

    return () => window.clearInterval(interval);
  }, [hydrated, projectId, updateProject]);

  if (!hydrated || !projectId) {
    return (
      <AppShell title="Memuat project" eyebrow="Status Pipeline">
        <Card>
          <p className="text-white/70">Restoring project data...</p>
        </Card>
      </AppShell>
    );
  }

  if (!project) {
    return (
      <AppShell title="Memulihkan project" eyebrow="Status Pipeline">
        <Card>
          <p className="text-white/70">Project lama tidak ditemukan. Mengarahkan ke project yang tersedia...</p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Memproses ${project.name}`}
      eyebrow="Status Pipeline"
      actions={
        project.status === "ready" ? (
          <Link href={`/project/${project.id}/clips`}>
            <Button className="gap-2">
              Review Clip
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : project.status === "error" ? (
          <div className="inline-flex items-center gap-2 rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
            {project.insight}
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-2xl border border-cyan-300/15 bg-cyan-300/8 px-4 py-3 text-sm text-cyan-100">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            {project.insight}
          </div>
        )
      }
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-4">
          <div
            className="aspect-[16/10] rounded-[28px] border border-white/10 bg-cover bg-center"
            style={heroThumbnail ? { backgroundImage: `url("${heroThumbnail}")` } : undefined}
          />
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/55">Perkiraan sisa waktu</p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {project.status === "ready" ? "Selesai" : project.status === "error" ? "Perlu dicek" : `${Math.max(1, Math.ceil((100 - project.progress) / 12))} min`}
            </p>
          </div>
        </Card>

        <ProcessingTimeline steps={timelineSteps} />
      </div>

      {liveClips.length ? (
        <section className="space-y-4">
          <div>
            <p className="font-medium text-white">Clip yang mulai tersedia</p>
            <p className="text-sm text-white/55">Kandidat terbaik akan muncul segera begitu siap direview.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
            {liveClips.slice(0, 3).map((clip) => (
              <ClipCard key={clip.id} clip={clip} project={project} />
            ))}
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
