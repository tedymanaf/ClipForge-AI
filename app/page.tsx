import Link from "next/link";
import { ArrowRight, BrainCircuit, Captions, ChartNoAxesCombined, Clapperboard, WandSparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: BrainCircuit,
    title: "Multi-layer AI analysis",
    description: "Whisper transcript, hook scoring, energy detection, and scene intelligence."
  },
  {
    icon: Captions,
    title: "Submagic-level captions",
    description: "Word-by-word timing, karaoke emphasis, emoji hints, and style presets."
  },
  {
    icon: WandSparkles,
    title: "Hook explainers",
    description: "Every clip comes with a plain-language reason why it should perform."
  },
  {
    icon: ChartNoAxesCombined,
    title: "Virality dashboard",
    description: "Radar charts, series suggestions, and platform-specific optimization cues."
  }
];

const comparisonRows = [
  ["Bahasa Indonesia support", "Full UI + captions + metadata", "Partial", "Partial", "Partial"],
  ["Hook quality explainer", "Built in", "Limited", "No", "No"],
  ["Side-by-side platform preview", "TikTok / Reels / Shorts", "No", "No", "No"],
  ["Offline-friendly processing", "FFmpeg.wasm fallback", "No", "No", "No"]
];

export default function LandingPage() {
  return (
    <main className="overflow-hidden">
      <section className="relative">
        <div className="hero-orb left-[-120px] top-[80px] h-80 w-80 bg-primary/25" />
        <div className="hero-orb right-[-120px] top-[120px] h-96 w-96 bg-cyan-400/20" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-24 lg:grid-cols-[1.1fr_0.9fr] lg:px-6">
          <div>
            <Badge className="border-cyan-300/20 bg-cyan-300/10 text-cyan-100">ClipForge AI</Badge>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[1.05] text-white md:text-7xl">
              Upload Once.
              <span className="text-gradient block">Go Viral Everywhere.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">
              Intelligent long-form to shorts engine with hook scoring, animated captions, thumbnail generation, metadata copywriting, and export bundles for TikTok, Reels, and Shorts.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  Start Clipping Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard#upload">
                <Button size="lg" variant="outline">
                  Try without upload
                </Button>
              </Link>
            </div>
          </div>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-primary/20 via-transparent to-accent/20" />
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-glow">
                  <Clapperboard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white">Automated 3-click workflow</p>
                  <p className="text-sm text-white/55">Upload → Review → Export</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  "Source uploaded and previewed",
                  "Whisper transcript + AI hook analysis",
                  "3 to 10 clip candidates ranked by viral score",
                  "Captions, thumbnails, and metadata generated",
                  "Platform bundles exported"
                ].map((item, index) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                    {index + 1}. {item}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/8">
                  <Icon className="h-5 w-5 text-cyan-200" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/60">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <Card className="overflow-hidden p-0">
          <div className="grid gap-px bg-white/10 lg:grid-cols-[1.2fr_0.95fr_0.95fr_0.95fr_0.95fr]">
            <div className="bg-black/30 p-5 font-semibold text-white">Feature</div>
            <div className="bg-black/30 p-5 font-semibold text-white">ClipForge</div>
            <div className="bg-black/30 p-5 font-semibold text-white">OpusClip</div>
            <div className="bg-black/30 p-5 font-semibold text-white">Munch</div>
            <div className="bg-black/30 p-5 font-semibold text-white">Vidyo</div>
            {comparisonRows.flatMap((row) =>
              row.map((cell, index) => (
                <div key={`${row[0]}-${index}`} className="bg-white/5 p-5 text-sm text-white/70">
                  {cell}
                </div>
              ))
            )}
          </div>
        </Card>
      </section>
    </main>
  );
}
