import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  Captions,
  ChartNoAxesCombined,
  CheckCircle2,
  Clapperboard,
  FolderKanban,
  Layers3,
  Sparkles,
  WandSparkles
} from "lucide-react";

import { SupportProjectCard } from "@/components/SupportProjectCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const featureCards = [
  {
    icon: BrainCircuit,
    title: "Analisis yang bisa dijelaskan",
    description: "AI tidak hanya memberi skor, tapi juga menjelaskan momen mana yang kuat sebagai hook dan kenapa."
  },
  {
    icon: Captions,
    title: "Caption siap edit",
    description: "Transkrip, timing, dan gaya caption sudah tersusun supaya revisi lebih cepat dan tidak bikin bingung."
  },
  {
    icon: Layers3,
    title: "Satu sumber, banyak output",
    description: "Clip, thumbnail, metadata, dan export bundle tersimpan dalam konteks project yang sama."
  },
  {
    icon: ChartNoAxesCombined,
    title: "Review lebih terarah",
    description: "Kamu bisa lihat skor, alasan performa, dan preview per platform tanpa pindah alur kerja."
  }
];

const workflow = [
  {
    step: "01",
    title: "Masukkan video panjang",
    description: "Upload file lokal atau pakai import link untuk memulai project baru."
  },
  {
    step: "02",
    title: "Biarkan ClipForge menyusun draft",
    description: "Transkrip, ranking clip, caption, thumbnail, dan metadata dibuat sebagai draft kerja."
  },
  {
    step: "03",
    title: "Review dan kirim lebih cepat",
    description: "Pilih clip terbaik, rapikan hasilnya, lalu export paket siap upload ke platform."
  }
];

const valueHighlights = [
  "Lebih cocok untuk creator workflow daripada sekadar auto-cut.",
  "Bahasa Indonesia sudah jadi alur utama, bukan fitur tambahan.",
  "Bisa dipakai sebagai prototipe lokal sambil integrasi API produksi disiapkan."
];

export default function LandingPage() {
  return (
    <main className="overflow-hidden">
      <section className="relative">
        <div className="hero-orb left-[-7rem] top-[5rem] h-72 w-72 bg-primary/20" />
        <div className="hero-orb right-[-7rem] top-[7rem] h-80 w-80 bg-cyan-400/15" />

        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
          <div className="glass-card flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-primary to-accent shadow-glow">
                <Clapperboard className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">ClipForge AI</p>
                <p className="text-sm text-white/50">Workspace AI untuk mengubah video panjang jadi short-form yang siap kerja.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="border-cyan-300/20 bg-cyan-300/10 text-cyan-100">Bahasa Indonesia</Badge>
              <Link href="/dashboard">
                <Button className="gap-2">
                  Buka Workspace
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1.08fr_0.92fr] lg:px-6 lg:py-16">
          <div className="space-y-6">
            <Badge className="border-white/10 bg-white/[0.06] text-white/80">Minimal, modern, dan fokus ke keputusan berikutnya</Badge>
            <div>
              <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] text-white md:text-7xl">
                Potong video panjang
                <span className="text-gradient mt-2 block">menjadi paket short-form yang siap publish.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">
                Niat utama ClipForge adalah mempersingkat kerja creator dari upload sampai export, dengan satu
                workspace yang tetap menjaga konteks transcript, clip ranking, caption, thumbnail, dan metadata.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  Mulai dari Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard?demo=1">
                <Button size="lg" variant="outline">
                  Coba data demo
                </Button>
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { value: "1 workspace", label: "Upload, review, edit, export" },
                { value: "3 platform", label: "TikTok, Reels, Shorts" },
                { value: "AI-assisted", label: "Bukan auto-cut buta" }
              ].map((item) => (
                <div key={item.label} className="surface-muted px-4 py-4">
                  <p className="text-2xl font-semibold text-white">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-white/55">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <Card className="relative overflow-hidden p-0">
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-primary/15 via-transparent to-accent/15" />
            <div className="relative space-y-6 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="section-eyebrow">Preview Alur Kerja</p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">ClipForge dibuat untuk menjawab satu pertanyaan:</h2>
                  <p className="mt-3 text-sm leading-6 text-white/60">
                    &quot;Setelah upload, langkah paling cepat untuk sampai ke clip yang siap diposting itu apa?&quot;
                  </p>
                </div>
                <Badge className="border-emerald-300/20 bg-emerald-300/10 text-emerald-100">Pipeline jelas</Badge>
              </div>

              <div className="grid gap-3">
                {workflow.map((item) => (
                  <div key={item.step} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-start gap-4">
                      <div className="rounded-2xl border border-primary/20 bg-primary/12 px-3 py-2 text-xs font-semibold tracking-[0.24em] text-blue-100">
                        {item.step}
                      </div>
                      <div>
                        <p className="font-medium text-white">{item.title}</p>
                        <p className="mt-2 text-sm leading-6 text-white/58">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    icon: FolderKanban,
                    title: "Project terstruktur",
                    description: "Semua aset tetap terkait dengan project asal."
                  },
                  {
                    icon: WandSparkles,
                    title: "Draft dibantu AI",
                    description: "AI mempercepat keputusan awal, bukan mengambil alih sepenuhnya."
                  },
                  {
                    icon: Sparkles,
                    title: "Output siap kirim",
                    description: "Export bundle memudahkan distribusi lintas platform."
                  }
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.title} className="surface-muted p-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
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
        <div className="mb-6 max-w-3xl">
          <p className="section-eyebrow">Apa Yang Dibuat Lebih Mudah</p>
          <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
            Dari tampilan sampai copy, semuanya diarahkan supaya pengguna cepat paham apa yang harus dilakukan.
          </h2>
          <p className="mt-3 text-base leading-7 text-white/60">
            Fokusnya bukan dekorasi berlebihan. Fokusnya adalah orientasi, hirarki, dan keputusan yang bisa diambil
            lebih cepat di setiap tahap project.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card key={feature.title} className="relative overflow-hidden">
                <div className="absolute right-[-24px] top-[-24px] h-24 w-24 rounded-full bg-white/5 blur-2xl" />
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
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

      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="space-y-5">
            <div>
              <p className="section-eyebrow">Arah Produk</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Niat awal aplikasi ini tetap dipertahankan.</h2>
              <p className="mt-3 text-sm leading-6 text-white/60">
                ClipForge paling masuk akal bila diposisikan sebagai workspace AI-assisted untuk tim konten, editor,
                atau creator yang butuh draft cepat tapi tetap ingin memegang keputusan akhir.
              </p>
            </div>

            <div className="space-y-3">
              {valueHighlights.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" />
                  <p className="text-sm leading-6 text-white/68">{item}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-5">
            <div>
              <p className="section-eyebrow">Pembeda Utama</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Lebih cocok untuk &quot;review lalu putuskan&quot;, bukan &quot;klik lalu pasrah&quot;.</h2>
            </div>

            <div className="grid gap-3">
              {[
                "Ada penjelasan kenapa clip berpotensi perform, bukan sekadar skor mentah.",
                "Preview platform dibuat supaya keputusan distribusi lebih cepat.",
                "Caption, thumbnail, metadata, dan export tetap sinkron dalam satu project.",
                "Mode demo dan fallback lokal membuat prototyping jauh lebih ringan."
              ].map((item) => (
                <div key={item} className="surface-muted px-4 py-4 text-sm leading-6 text-white/68">
                  {item}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <Card className="relative overflow-hidden p-0">
          <div className="absolute left-[-5rem] top-[-4rem] h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-[-4rem] right-[-4rem] h-44 w-44 rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div>
              <p className="section-eyebrow">Siap Masuk</p>
              <h3 className="mt-3 text-3xl font-semibold text-white">Masuk ke dashboard untuk melihat alur baru yang lebih rapi dan mudah dipahami.</h3>
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
                  Lihat Mode Demo
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
