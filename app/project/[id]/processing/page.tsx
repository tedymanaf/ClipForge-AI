"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useParams } from "next/navigation";

import { analyzeProject, getProcessingSnapshot } from "@/modules/analysis/AnalysisEngine";
import { AppShell } from "@/components/AppShell";
import { ClipCard } from "@/components/ClipCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProcessingTimeline } from "@/components/ProcessingTimeline";
import { useClipForgeStore } from "@/store/useClipForgeStore";
import { selectProject } from "@/store/useClipForgeStore";

export default function ProcessingPage() {
  const params = useParams<{ id: string }>();
  const projects = useClipForgeStore((state) => state.projects);
  const updateProject = useClipForgeStore((state) => state.updateProject);
  const project = useMemo(() => selectProject(projects, params.id), [projects, params.id]);

  useEffect(() => {
    if (!project || project.status === "ready" || project.progress >= 100) {
      return;
    }

    let progress = Math.max(project.progress, 8);

    updateProject(project.id, (current) => ({
      ...current,
      status: "processing",
      progress,
      processingSteps: getProcessingSnapshot(progress).steps
    }));

    const interval = window.setInterval(async () => {
      progress = Math.min(progress + 12, 100);
      const snapshot = getProcessingSnapshot(progress);

      updateProject(project.id, (current) => ({
        ...current,
        status: progress >= 100 ? "processing" : "processing",
        progress,
        insight: snapshot.message,
        processingSteps: snapshot.steps
      }));

      if (progress >= 100) {
        window.clearInterval(interval);
        const current = useClipForgeStore.getState().projects.find((item) => item.id === project.id);
        if (current) {
          const analyzed = await analyzeProject(current);
          updateProject(project.id, () => analyzed);
        }
      }
    }, 700);

    return () => window.clearInterval(interval);
  }, [project, updateProject]);

  if (!project) {
    return (
      <AppShell title="Project not found">
        <Card>
          <p className="text-white/70">The requested project could not be found.</p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Processing ${project.name}`}
      eyebrow="Pipeline Status"
      actions={
        project.status === "ready" ? (
          <Link href={`/project/${project.id}/clips`}>
            <Button className="gap-2">
              Review Clips
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
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
            style={{ backgroundImage: `url("${project.asset.thumbnail}")` }}
          />
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/55">Estimated time remaining</p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {project.status === "ready" ? "Done" : `${Math.max(1, Math.ceil((100 - project.progress) / 12))} min`}
            </p>
          </div>
        </Card>

        <ProcessingTimeline steps={project.processingSteps.length ? project.processingSteps : getProcessingSnapshot(8).steps} />
      </div>

      {project.clips.length ? (
        <section className="space-y-4">
          <div>
            <p className="font-medium text-white">Clips arriving live</p>
            <p className="text-sm text-white/55">Top candidates appear as soon as they are ready.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
            {project.clips.slice(0, 3).map((clip) => (
              <ClipCard key={clip.id} clip={clip} projectId={project.id} />
            ))}
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
