"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clapperboard,
  Film,
  FolderKanban,
  Sparkles,
  TimerReset,
  WandSparkles
} from "lucide-react";
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
import { getProjectPrimaryRoute } from "@/lib/project-routing";
import { formatBytes, formatDuration } from "@/lib/utils";
import { useClipForgeStore } from "@/store/useClipForgeStore";

const workflowHighlights = [
  {
    icon: FolderKanban,
    title: "Workspace terhubung",
    description: "Projects, clips, metadata, caption, thumbnail, dan export bundle tinggal satu alur."
  },
  {
    icon: WandSparkles,
    title: "Review yang dipandu AI",
    description: "Hook explanation dan ranking langsung terlihat tanpa harus buka banyak panel."
  },
  {
    icon: TimerReset,
    title: "Putaran kerja lebih cepat",
    description: "Fallback export dan project routing menjaga workflow tetap jalan meski source bermasalah."
  }
];

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
      router.replace(getProjectPrimaryRoute(firstProject));
    }
  }, [router, seedDemoProjects]);

  const overview = useMemo(() => {
    const totalProjects = projects.length;
    const readyProjects = projects.filter((item) => item.status === "ready").length;
    const totalClips = projects.reduce((sum, item) => sum + item.clips.length, 0);
    const totalDurationSec = projects.reduce((sum, item) => sum + item.asset.durationSec, 0);

    return {
      totalProjects,
      readyProjects,
      totalClips,
      totalDurationSec
    };
  }, [projects]);

  return (
    <>
      <OnboardingOverlay />
      <AppShell
        title="Dashboard Kreator"
        eyebrow="Workspace ClipForge"
        actions={
          <>
            <Badge className="hidden md:inline-flex">Bahasa Indonesia ready</Badge>
            <Link href="/dashboard#upload">
              <Button className="gap-2">
                Upload Video
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </>
        }
      >
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="relative overflow-hidden">
            <div className="absolute left-[-80px] top-[-70px] h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute bottom-[-80px] right-[-50px] h-48 w-48 rounded-full bg-cyan-400/15 blur-3xl" />
            <div className="relative space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Ringkasan Workspace</p>
                  <h2 className="mt-3 text-3xl font-semibold text-white">Semua hal penting dari pipeline sekarang ada di satu control center.</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
                    Upload baru, project aktif, clip siap review, dan insight performa disusun supaya kamu cepat tahu langkah berikutnya.
                  </p>
                </div>
                <Badge className="w-fit border-emerald-300/20 bg-emerald-300/10 text-emerald-100">
                  {overview.readyProjects} project siap
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-[24px] border border-white/10 bg-black/20 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/40">Projects</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{overview.totalProjects}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-black/20 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/40">Siap</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{overview.readyProjects}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-black/20 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/40">Clips</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{overview.totalClips}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-black/20 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/40">Source time</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{formatDuration(overview.totalDurationSec)}</p>
                </div>
              </div>

              {project ? (
                <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                  <div
                    className="aspect-[16/10] rounded-[28px] border border-white/10 bg-slate-950 bg-cover bg-center"
                    style={project.asset.thumbnail ? { backgroundImage: `url("${project.asset.thumbnail}")` } : undefined}
                  />
                  <div className="space-y-3">
                    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-white/40">Project utama</p>
                      <p className="mt-2 text-xl font-semibold text-white">{project.name}</p>
                      <p className="mt-2 text-sm leading-6 text-white/60">
                        {project.insight}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-white/60">
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-2">
                        {project.clips.length} clips
                      </span>
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-2">
                        {formatDuration(project.asset.durationSec)}
                      </span>
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-2">
                        {project.asset.width}x{project.asset.height}
                      </span>
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-2">
                        {formatBytes(project.asset.sizeBytes)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-[28px] border border-dashed border-white/10 bg-black/20 p-6 text-sm leading-6 text-white/55">
                  Belum ada project aktif. Upload video baru atau buka demo mode untuk melihat seluruh pipeline.
                </div>
              )}
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Langkah Berikutnya</p>
              <p className="mt-3 text-2xl font-semibold text-white">Langkah tercepat untuk lanjut kerja.</p>
            </div>

            <div className="space-y-3">
              <Link href="/dashboard#upload" className="block rounded-[24px] border border-white/10 bg-white/5 p-4 transition hover:bg-white/8">
                <p className="font-medium text-white">Upload source baru</p>
                <p className="mt-2 text-sm leading-6 text-white/60">Masukkan video panjang dan mulai pipeline dari awal.</p>
              </Link>
              {project ? (
                <Link
                  href={getProjectPrimaryRoute(project)}
                  className="block rounded-[24px] border border-white/10 bg-white/5 p-4 transition hover:bg-white/8"
                >
                  <p className="font-medium text-white">Lanjutkan project teratas</p>
                  <p className="mt-2 text-sm leading-6 text-white/60">Masuk kembali ke alur utama project yang paling baru.</p>
                </Link>
              ) : null}
              <Link href="/dashboard#library" className="block rounded-[24px] border border-white/10 bg-white/5 p-4 transition hover:bg-white/8">
                <p className="font-medium text-white">Review clip library</p>
                <p className="mt-2 text-sm leading-6 text-white/60">Lihat candidate terbaik dan langsung lompat ke editor.</p>
              </Link>
            </div>

            <div className="rounded-[28px] border border-cyan-300/15 bg-cyan-300/8 p-5">
              <p className="font-medium text-white">Target pemrosesan</p>
              <div className="mt-3 space-y-2 text-sm text-white/65">
                <p>Pemrosesan dimulai kurang dari 3 detik setelah upload.</p>
                <p>Clip pertama muncul kurang dari 2 menit untuk sumber 10 menit.</p>
                <p>Transkripsi dan metadata Bahasa Indonesia aktif secara default.</p>
              </div>
            </div>
          </Card>
        </section>

        <section id="upload" className="scroll-mt-6">
          <UploadEngine />
        </section>

        <section id="projects" className="grid scroll-mt-6 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/8 p-3">
                <Film className="h-5 w-5 text-cyan-200" />
              </div>
              <div>
                <p className="font-medium text-white">Video sumber terbaru</p>
                <p className="text-sm text-white/55">
                  Setiap project menyimpan transcript, clip candidates, captions, thumbnails, dan metadata.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {projects.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-white/55">
                  Belum ada source video. Mulai dari upload atau aktifkan demo mode.
                </div>
              ) : null}
              {projects.slice(0, 4).map((item) => (
                <Link href={getProjectPrimaryRoute(item)} key={item.id}>
                  <div className="grid gap-4 rounded-[24px] border border-white/10 bg-white/5 p-4 transition hover:bg-white/8 md:grid-cols-[112px_1fr]">
                    <div
                      className="aspect-video rounded-[20px] border border-white/10 bg-slate-950 bg-cover bg-center"
                      style={item.asset.thumbnail ? { backgroundImage: `url("${item.asset.thumbnail}")` } : undefined}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">{item.name}</p>
                          <p className="mt-2 text-sm text-white/50">
                            {formatDuration(item.asset.durationSec)} / {item.asset.width}x{item.asset.height} / {formatBytes(item.asset.sizeBytes)}
                          </p>
                        </div>
                        <Badge className="w-fit capitalize">{item.status}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/55">
                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">{item.clips.length} clips</span>
                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">{item.progress}% progress</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="space-y-5">
            <div>
              <p className="font-medium text-white">Sorotan workflow</p>
              <p className="text-sm text-white/55">
                Landing, dashboard, dan halaman project sekarang memakai ritme visual yang sama supaya orientasi lebih cepat.
              </p>
            </div>

            <div className="grid gap-4">
              {workflowHighlights.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.title} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8">
                        <Icon className="h-5 w-5 text-cyan-200" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{item.title}</p>
                        <p className="mt-2 text-sm leading-6 text-white/60">{item.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
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
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                  {item}
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section id="library" className="scroll-mt-6 space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-cyan-200" />
              <div>
                <p className="font-medium text-white">Perpustakaan Clip</p>
                <p className="text-sm text-white/55">Tinjau clip dengan skor tertinggi lalu lompat langsung ke editor.</p>
              </div>
            </div>
            {project ? <Badge className="w-fit">{project.name}</Badge> : null}
          </div>

          {project ? (
            <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
              {project.clips.map((clip) => <ClipCard key={clip.id} clip={clip} project={project} />)}
            </div>
          ) : (
            <Card>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/8">
                  <Clapperboard className="h-5 w-5 text-cyan-200" />
                </div>
                <div>
                  <p className="font-medium text-white">Clip library masih kosong</p>
                  <p className="mt-2 text-sm leading-6 text-white/60">
                    Upload video atau aktifkan demo mode untuk mengisi library dengan clip candidate.
                  </p>
                </div>
              </div>
            </Card>
          )}
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
