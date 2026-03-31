"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useClipForgeStore } from "@/store/useClipForgeStore";

const steps = [
  "Upload or paste a long-form source.",
  "Review AI-ranked clips with virality explainers.",
  "Fine-tune captions, thumbnails, and export bundles.",
  "Compare TikTok, Reels, and Shorts previews side by side.",
  "Ship a full package or queue direct publishing."
];

export function OnboardingOverlay() {
  const onboardingSeen = useClipForgeStore((state) => state.onboardingSeen);
  const markOnboardingSeen = useClipForgeStore((state) => state.markOnboardingSeen);
  const [open, setOpen] = useState(!onboardingSeen);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-xl">
      <Card className="w-full max-w-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">5-step onboarding</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">ClipForge AI walkthrough</h2>
        <div className="mt-6 space-y-3">
          {steps.map((step, index) => (
            <div key={step} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/75">
              {index + 1}. {step}
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button
            onClick={() => {
              markOnboardingSeen();
              setOpen(false);
            }}
          >
            Start clipping
          </Button>
        </div>
      </Card>
    </div>
  );
}
