"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clapperboard,
  Film,
  Sparkles,
  WandSparkles
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Settings } from "@/modules/settings/Settings";
import { UploadEngine } from "@/modules/upload/UploadEngine";
import { AppShell } from "@/components/AppShell";
import { ClipCard } from "@/components/ClipCard";
import { OnboardingOverlay } from "@/components/OnboardingOverlay";
import { ResetWorkspaceButton } from "@/components/ResetWorkspaceButton";
import { WorkflowStepper } from "@/components/WorkflowStepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getProjectPrimaryRoute } from "@/lib/project-routing";
import { formatBytes, formatDuration } from "@/lib/utils";
import { useClipForgeStore } from "@/store/useClipForgeStore";

export default function DashboardPage() {
  const router = useRouter();
  const projects = useClipForgeStore((state) => state.projects);
  const currentProjectId = useClipForgeStore((state) => state.currentProjectId);
  const processingStage = useClipForgeStore((state) => state.processingStage);
  const processingProgress = useClipForgeStore((state) => state.processingProgress);
  const seedDemoProjects = useClipForgeStore((state) => state.seedDemoProjects);
  const project = projects[0];
  const activeProject = useMemo(
    () => projects.find((item) => item.id === currentProjectId) ?? null,
    [projects, currentProjectId]
  );
  const hasActiveProcessing =
    processingStage === "uploading" ||
    processingStage === "transcribing" ||
    processingStage === "scoring" ||
    processingStage === "cutting";

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
            <Badge className="hidden md:inline-flex border-white/10 bg-white/[0.06] text-white/80">Bahasa Indonesia aktif</Badge>
            <Link href="/dashboard#upload">
              <Button className="gap-2">
                Upload Video
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </>
        }
      >
        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="relative overflow-hidden">
            <div className="absolute left-[-5rem] top-[-4rem] h-44 w-44 rounded-full bg-primary/16 blur-3xl" />
            <div className="absolute bottom-[-5rem] right-[-3rem] h-44 w-44 rounded-full bg-cyan-400/14 blur-3xl" />
            <div className="relative space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="section-eyebrow">Control Center</p>
                  <h2 className="mt-3 text-3xl font-semibold text-white">
                    Fokus utamanya sekarang cuma empat langkah inti.
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
                    Upload video, review clip yang dipilih AI, edit seperlunya, lalu download MP4. Sisanya dibuat jadi pendukung, bukan pengalih perhatian.
                  </p>
                </div>
                <Badge className="w-fit border-emerald-300/20 bg-emerald-300/10 text-emerald-100">
                  {overview.readyProjects} project siap review
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  { label: "Project", value: overview.totalProjects.toString() },
                  { label: "Siap Review", value: overview.readyProjects.toString() },
                  { label: "Clip", value: overview.totalClips.toString() },
                  { label: "Durasi", value: formatDuration(overview.totalDurationSec) }
                ].map((item) => (
                  <div key={item.label} className="surface-muted px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/38">{item.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>

              {project ? (
                <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                  <div
                    className="aspect-[16/10] rounded-[28px] border border-white/10 bg-slate-950 bg-cover bg-center"
                    style={project.asset.thumbnail ? { backgroundImage: `url("${project.asset.thumbnail}")` } : undefined}
                  />
                  <div className="space-y-3">
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-white/40">Project Utama</p>
                      <p className="mt-2 text-xl font-semibold text-white">{project.name}</p>
                      <p className="mt-2 text-sm leading-6 text-white/60">{project.insight}</p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-white/60">
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-2">{project.clips.length} clip</span>
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
                  Belum ada project aktif. Upload video baru atau jalankan mode demo untuk melihat alur lengkapnya.
                </div>
              )}

              <WorkflowStepper current={project ? (project.status === "ready" ? "review" : "upload") : "upload"} />
            </div>
          </Card>

          <Card className="space-y-5">
            <div>
              <p className="section-eyebrow">Langkah Berikutnya</p>
              <p className="mt-3 text-2xl font-semibold text-white">
                {hasActiveProcessing ? "Fokus saat ini masih di satu proses aktif." : "Aksi tercepat untuk lanjut kerja hari ini."}
              </p>
            </div>

            <div className="space-y-3">
              {hasActiveProcessing ? (
                <div className="rounded-[24px] border border-cyan-300/20 bg-cyan-300/8 p-4">
                  <p className="font-medium text-white">
                    {processingStage === "uploading"
                      ? "Upload masih berjalan"
                      : processingStage === "transcribing"
                        ? "Backend sedang mentranskripsi"
                        : processingStage === "scoring"
                          ? "AI sedang memilih clip terbaik"
                          : "Backend sedang memotong MP4"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/60">
                    {activeProject
                      ? `${activeProject.name} sedang diproses. Progress saat ini ${processingProgress}%.`
                      : `Satu project sedang diproses. Progress saat ini ${processingProgress}%.`}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link href="/dashboard#upload">
                      <Button variant="outline">Lihat progress aktif</Button>
                    </Link>
                    {activeProject ? (
                      <Link href={getProjectPrimaryRoute(activeProject)}>
                        <Button className="gap-2">
                          Buka project aktif
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              ) : (
                <>
                  <Link href="/dashboard#upload" className="block rounded-[24px] border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.07]">
                    <p className="font-medium text-white">Mulai project baru</p>
                    <p className="mt-2 text-sm leading-6 text-white/60">Masukkan satu video lalu biarkan aplikasi langsung menyiapkan clip terbaik.</p>
                  </Link>
                  {project ? (
                    <Link
                      href={getProjectPrimaryRoute(project)}
                      className="block rounded-[24px] border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.07]"
                    >
                      <p className="font-medium text-white">Lanjutkan project terbaru</p>
                      <p className="mt-2 text-sm leading-6 text-white/60">Masuk lagi ke langkah kerja paling penting tanpa muter-muter halaman.</p>
                    </Link>
                  ) : null}
                  <Link href="/dashboard#library" className="block rounded-[24px] border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.07]">
                    <p className="font-medium text-white">Lihat clip siap review</p>
                    <p className="mt-2 text-sm leading-6 text-white/60">Bandingkan kandidat, edit, lalu lanjut ke download MP4.</p>
                  </Link>
                </>
              )}
              <ResetWorkspaceButton
                fullWidth
                title="Reset penuh workspace"
                description="Pakai ini kalau data lama bentrok, preview terasa aneh, atau kamu ingin mulai benar-benar bersih lagi."
              />
            </div>

            <div className="rounded-[28px] border border-cyan-300/15 bg-cyan-300/8 p-5">
              <p className="font-medium text-white">Yang diprioritaskan</p>
              <div className="mt-3 space-y-2 text-sm text-white/65">
                <p>Upload harus terlihat hidup dalam beberapa detik.</p>
                <p>Upload jaringan ke HF free tier bisa terasa lambat untuk file besar, jadi status harus jujur.</p>
                <p>Clip terbaik harus muncul cepat dan mudah dipilih.</p>
                <p>Download MP4 harus jadi tujuan akhir yang paling jelas.</p>
              </div>
            </div>
          </Card>
        </section>

        <section id="upload" className="scroll-mt-6 space-y-4">
          <div>
            <p className="section-eyebrow">Mulai Dari Sini</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Area upload dibuat lebih sederhana dan lebih mudah dimengerti.</h2>
          </div>
          <UploadEngine />
        </section>

        <section id="projects" className="grid scroll-mt-6 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
                <Film className="h-5 w-5 text-cyan-200" />
              </div>
              <div>
                <p className="font-medium text-white">Project aktif</p>
                <p className="text-sm text-white/55">
                  Daftar ini menampilkan source terbaru beserta status dan ringkasan pentingnya.
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
                  <div className="grid gap-4 rounded-[24px] border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.07] md:grid-cols-[112px_1fr]">
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
                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">{item.clips.length} clip</span>
                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">{item.progress}% progres</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="space-y-5">
            <div>
              <p className="font-medium text-white">Flow kerja yang sedang dipakai</p>
              <p className="text-sm text-white/55">Semua fitur yang tersisa sekarang diarahkan untuk menyokong alur inti, bukan menambah beban baca.</p>
            </div>

            <WorkflowStepper current={project ? (project.status === "ready" ? "review" : "upload") : "upload"} />

            <div className="grid gap-3 md:grid-cols-2">
              {[
                "Review memakai ranking viral score",
                "Edit per clip tetap tersedia",
                "Preview vertical tetap satu klik",
                "Download MP4 jadi aksi utama"
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70">
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
                <p className="text-sm text-white/55">Tempat tercepat untuk membandingkan kandidat dan masuk ke editor.</p>
              </div>
            </div>
            {project ? <Badge className="w-fit">{project.name}</Badge> : null}
          </div>

          {project ? (
            <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
              {project.clips.map((clip) => (
                <ClipCard key={clip.id} clip={clip} project={project} />
              ))}
            </div>
          ) : (
            <Card>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                  <Clapperboard className="h-5 w-5 text-cyan-200" />
                </div>
                <div>
                  <p className="font-medium text-white">Clip library masih kosong</p>
                  <p className="mt-2 text-sm leading-6 text-white/60">
                    Upload video atau aktifkan demo mode untuk mengisi library dengan clip kandidat.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </section>

        <section id="settings" className="scroll-mt-6 space-y-4">
          <div>
            <p className="section-eyebrow">Konfigurasi</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Pengaturan dibuat lebih jelas untuk tahap prototipe sampai integrasi produksi.</h2>
          </div>
          <Settings />
        </section>

      </AppShell>
    </>
  );
}
