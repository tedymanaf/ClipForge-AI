"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useClipForgeStore } from "@/store/useClipForgeStore";

const steps = [
  "Upload atau tempel sumber video panjang.",
  "Tinjau clip yang sudah diurutkan AI beserta penjelasan virality-nya.",
  "Rapikan caption, thumbnail, dan bundle export sesuai kebutuhan.",
  "Bandingkan preview TikTok, Reels, dan Shorts secara berdampingan.",
  "Kirim paket lengkap atau masukkan ke antrean publish langsung."
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
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Onboarding 5 Langkah</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Panduan singkat ClipForge AI</h2>
        <div className="mt-6 space-y-3">
          {steps.map((step, index) => (
            <div key={step} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/75">
              {index + 1}. {step}
            </div>
          ))}
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
            Mulai kliping
          </Button>
        </div>
      </Card>
    </div>
  );
}
