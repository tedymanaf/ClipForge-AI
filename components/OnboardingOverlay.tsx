"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useClipForgeStore } from "@/store/useClipForgeStore";

const steps = [
  "Masukkan video panjang atau jalankan mode demo.",
  "Biarkan AI menyusun draft clip, caption, dan metadata awal.",
  "Review hasil, edit seperlunya, lalu export paket yang siap dikirim."
];

export function OnboardingOverlay() {
  const hydrated = useClipForgeStore((state) => state.hydrated);
  const onboardingSeen = useClipForgeStore((state) => state.onboardingSeen);
  const markOnboardingSeen = useClipForgeStore((state) => state.markOnboardingSeen);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (hydrated) {
      setOpen(!onboardingSeen);
    }
  }, [hydrated, onboardingSeen]);

  if (!hydrated || !open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-xl">
      <Card className="w-full max-w-2xl">
        <p className="section-eyebrow">Selamat Datang</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">ClipForge sekarang lebih ringkas dan lebih mudah dipahami.</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/60">
          Fokus workspace ini adalah membantu kamu bergerak dari video panjang ke clip siap publish tanpa kehilangan
          konteks project.
        </p>
        <div className="mt-6 space-y-3">
          {steps.map((step, index) => (
            <div key={step} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-white/75">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/70">Langkah {index + 1}</p>
              <p className="mt-2 text-sm leading-6">{step}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-[24px] border border-cyan-300/15 bg-cyan-300/8 p-4 text-sm leading-6 text-white/68">
          Saran terbaik untuk mulai: buka mode demo dulu kalau kamu ingin merasakan alurnya tanpa upload file.
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Tutup
          </Button>
          <Button
            onClick={() => {
              markOnboardingSeen();
              setOpen(false);
            }}
          >
            Masuk ke workspace
          </Button>
        </div>
      </Card>
    </div>
  );
}
