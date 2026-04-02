import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  Captions,
  ChartNoAxesCombined,
  Clapperboard,
  FolderKanban,
  Layers3,
  Sparkles,
  WandSparkles
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SupportProjectCard } from "@/components/SupportProjectCard";

const features = [
  {
    icon: BrainCircuit,
    title: "Analisis AI berlapis",
    description: "Transcript Whisper, penilaian hook, deteksi energi, dan pembacaan momen penting."
  },
  {
    icon: Captions,
    title: "Caption setingkat editor viral",
    description: "Timing per kata, penekanan karaoke, petunjuk emoji, dan preset gaya caption."
  },
  {
    icon: WandSparkles,
    title: "Penjelasan hook",
    description: "Setiap clip dilengkapi alasan yang mudah dipahami tentang kenapa ia berpotensi perform."
  },
  {
    icon: ChartNoAxesCombined,
    title: "Dashboard virality",
    description: "Radar chart, saran seri konten, dan arahan optimasi per platform."
  }
];

const heroStats = [
  { value: "3 langkah", label: "Upload, review, export" },
  { value: "3 platform", label: "TikTok, Reels, Shorts" },
  { value: "1 bundle", label: "MP4, caption, thumb, metadata" }
];

const workflowPillars = [
  {
    icon: FolderKanban,
    title: "Sumber masuk",
    description: "Long-form file masuk dengan preview frame, ukuran, dan metadata dasar."
  },
  {
    icon: Layers3,
    title: "Struktur oleh AI",
    description: "Transcript, clip ranking, thumbnails, captions, dan copy semua terhubung."
  },
  {
    icon: Sparkles,
    title: "Rilis lebih cepat",
    description: "Review yang jelas, export yang stabil, dan fallback saat source tidak tersedia."
  }
];

const comparisonRows = [
  ["Dukungan Bahasa Indonesia", "UI + caption + metadata penuh", "Sebagian", "Sebagian", "Sebagian"],
  ["Penjelasan kualitas hook", "Sudah tersedia", "Terbatas", "Tidak", "Tidak"],
  ["Preview platform berdampingan", "TikTok / Reels / Shorts", "Tidak", "Tidak", "Tidak"],
  ["Pemrosesan ramah offline", "Fallback FFmpeg.wasm", "Tidak", "Tidak", "Tidak"]
];

export default function LandingPage() {
  return (
    <main className="overflow-hidden">
      <section className="relative">
        <div className="hero-orb left-[-120px] top-[80px] h-80 w-80 bg-primary/25" />
        <div className="hero-orb right-[-120px] top-[120px] h-96 w-96 bg-cyan-400/20" />

        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
          <div className="glass-card flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-glow">
                <Clapperboard className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">ClipForge AI</p>
                <p className="text-sm text-white/50">Upload sekali. Review lebih cepat. Export ke mana saja.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="border-cyan-300/20 bg-cyan-300/10 text-cyan-100">Siap Bahasa Indonesia</Badge>
              <Link href="/dashboard">
                <Button className="gap-2">
                  Buka Workspace
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:grid-cols-[1.08fr_0.92fr] lg:px-6 lg:py-20">
          <div>
            <Badge className="border-cyan-300/20 bg-cyan-300/10 text-cyan-100">Workspace clipping yang siap distribusi</Badge>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[1.02] text-white md:text-7xl">
              Potong konten panjang.
              <span className="text-gradient mt-2 block">Jadi paket short-form yang siap kirim.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">
              ClipForge AI merapikan alur dari upload sampai export menjadi satu workspace yang konsisten:
              transcript, hook scoring, caption, thumbnail, metadata, dan bundle siap post untuk TikTok, Reels,
              dan Shorts.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  Mulai Kliping Gratis
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard?demo=1">
                <Button size="lg" variant="outline">
                  Coba tanpa upload
                </Button>
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {heroStats.map((stat) => (
                <div key={stat.label} className="rounded-[24px] border border-white/10 bg-black/20 px-4 py-4">
                  <p className="text-2xl font-semibold text-white">{stat.value}</p>
                  <p className="mt-1 text-sm text-white/50">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <Card className="relative overflow-hidden p-0">
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-primary/20 via-transparent to-accent/20" />
            <div className="relative space-y-6 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Preview Workspace</p>
                  <p className="mt-2 text-2xl font-semibold text-white">Alur otomatis dalam 3 langkah</p>
                  <p className="mt-2 text-sm leading-6 text-white/55">Upload, review candidate clips, lalu kirim satu bundle export yang lengkap.</p>
                </div>
                <Badge className="border-emerald-300/20 bg-emerald-300/10 text-emerald-100">Pipeline aktif</Badge>
              </div>

              <div className="grid gap-3">
                {[
                  ["01", "Sumber video diunggah dan dipreview"],
                  ["02", "Transcript Whisper dan analisis hook dijalankan"],
                  ["03", "Clip diurutkan berdasarkan skor viral"],
                  ["04", "Caption, thumbnail, dan metadata dibuat"],
                  ["05", "Bundle per platform siap diexport"]
                ].map(([step, label]) => (
                  <div key={step} className="flex items-center gap-4 rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                    <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-semibold tracking-[0.24em] text-cyan-100">
                      {step}
                    </div>
                    <p className="text-sm text-white/72">{label}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {workflowPillars.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8">
                        <Icon className="h-5 w-5 text-cyan-200" />
                      </div>
                      <p className="mt-4 font-medium text-white">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-white/55">{item.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Kenapa Terasa Berbeda</p>
          <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">Satu visual language dari landing sampai halaman project.</h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-white/60">
            Bukan cuma kumpulan tool. ClipForge dibangun sebagai workspace yang menjaga konteks dari upload,
            processing, review, editor, sampai export.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="relative overflow-hidden">
                <div className="absolute right-[-28px] top-[-28px] h-24 w-24 rounded-full bg-cyan-300/10 blur-2xl" />
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/8">
                    <Icon className="h-5 w-5 text-cyan-200" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/60">{feature.description}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Ringkasan Perbandingan</p>
            <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">Dibuat untuk workflow creator yang butuh hasil rapi, bukan sekadar auto-cut.</h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-white/55">
            Fokusnya bukan hanya menghasilkan clip, tapi menjaga semua artefak penting tetap sinkron dalam satu jalur kerja.
          </p>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <div className="grid min-w-[880px] gap-px bg-white/10 lg:grid-cols-[1.2fr_0.95fr_0.95fr_0.95fr_0.95fr]">
              <div className="bg-black/30 p-5 font-semibold text-white">Fitur</div>
              <div className="bg-black/30 p-5 font-semibold text-white">ClipForge</div>
              <div className="bg-black/30 p-5 font-semibold text-white">OpusClip</div>
              <div className="bg-black/30 p-5 font-semibold text-white">Munch</div>
              <div className="bg-black/30 p-5 font-semibold text-white">Vidyo</div>
              {comparisonRows.flatMap((row) =>
                row.map((cell, index) => (
                  <div
                    key={`${row[0]}-${index}`}
                    className={`p-5 text-sm ${index === 1 ? "bg-cyan-300/10 text-cyan-50" : "bg-white/5 text-white/70"}`}
                  >
                    {cell}
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4 lg:px-6">
        <Card className="relative overflow-hidden p-0">
          <div className="absolute left-[-6rem] top-[-4rem] h-40 w-40 rounded-full bg-primary/25 blur-3xl" />
          <div className="absolute bottom-[-4rem] right-[-4rem] h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Siap mencoba alur penuhnya?</p>
              <h3 className="mt-3 text-3xl font-semibold text-white">Masuk ke dashboard dan lihat workspace yang sama dipakai untuk project nyata.</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  Buka Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard?demo=1">
                <Button size="lg" variant="outline">
                  Jalankan Data Demo
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </section>

      <SupportProjectCard />
    </main>
  );
}
