"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Film, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { AnalyticsDashboard } from "@/modules/analytics/AnalyticsDashboard";
import { Settings } from "@/modules/settings/Settings";
import { UploadEngine } from "@/modules/upload/UploadEngine";
import { AppShell } from "@/components/AppShell";
import { ClipCard } from "@/components/ClipCard";
import { OnboardingOverlay } from "@/components/OnboardingOverlay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatBytes, formatDuration } from "@/lib/utils";
import { useClipForgeStore } from "@/store/useClipForgeStore";

export default function DashboardPage() {
  const router = useRouter();
  const projects = useClipForgeStore((state) => state.projects);
  const seedDemoProjects = useClipForgeStore((state) => state.seedDemoProjects);
  const project = projects[0];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") !== "1") {
      return;
    }

    seedDemoProjects();
    const firstProject = useClipForgeStore.getState().projects[0];
    if (firstProject) {
      router.replace(`/project/${firstProject.id}/clips`);
    }
  }, [router, seedDemoProjects]);

  return (
    <>
      <OnboardingOverlay />
      <AppShell
        title="Creator Dashboard"
        eyebrow="ClipForge Workspace"
        actions={
          <div className="flex gap-3">
            <Badge className="hidden md:inline-flex">Bahasa Indonesia ready</Badge>
            <Link href="/dashboard#upload">
              <Button className="gap-2">
                Upload Video
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        }
      >
        <section id="upload" className="scroll-mt-6">
          <UploadEngine />
        </section>

        <section id="projects" className="grid scroll-mt-6 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/8 p-3">
                <Film className="h-5 w-5 text-cyan-200" />
              </div>
              <div>
                <p className="font-medium text-white">Recent source videos</p>
                <p className="text-sm text-white/55">
                  Each project stores transcript, clip candidates, captions, thumbnails, and metadata.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {projects.slice(0, 4).map((item) => (
                <Link href={`/project/${item.id}/clips`} key={item.id}>
                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 transition hover:bg-white/8">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-white">{item.name}</p>
                        <p className="text-sm text-white/50">
                          {formatDuration(item.asset.durationSec)} / {item.asset.width}x{item.asset.height} / {formatBytes(item.asset.sizeBytes)}
                        </p>
                      </div>
                      <Badge>{item.status}</Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <p className="font-medium text-white">Workflow highlights</p>
              <p className="text-sm text-white/55">
                The app is structured around a one-pass automated pipeline with optional fine tuning.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                "Whisper transcription with word timestamps",
                "GPT-powered hook scoring and hook rewrite suggestions",
                "Caption A/B variants and platform previews",
                "No-watermark export bundles",
                "Offline-friendly processing path",
                "Series planning and virality explainers"
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                  {item}
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section id="library" className="scroll-mt-6 space-y-6">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-cyan-200" />
            <div>
              <p className="font-medium text-white">Clip Library</p>
              <p className="text-sm text-white/55">Review the highest-ranked clips and jump straight into the editor.</p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
            {project?.clips.map((clip) => <ClipCard key={clip.id} clip={clip} projectId={project.id} />)}
          </div>
        </section>

        {project ? (
          <section id="analytics" className="scroll-mt-6 space-y-6">
            <AnalyticsDashboard project={project} />
          </section>
        ) : null}

        <section id="settings" className="scroll-mt-6 space-y-6">
          <Settings />
        </section>
      </AppShell>
    </>
  );
}
