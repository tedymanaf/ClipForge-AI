"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useClipForgeStore } from "@/store/useClipForgeStore";

export function Settings() {
  const preferences = useClipForgeStore((state) => state.preferences);
  const setPreferences = useClipForgeStore((state) => state.setPreferences);
  const [draft, setDraft] = useState(preferences);

  useEffect(() => {
    setDraft(preferences);
  }, [preferences]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Pengaturan Workspace</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Kontrol API dan identitas brand dari satu panel.</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
          Pengaturan ini memengaruhi routing metadata, branding thumbnail, dan gaya output default di seluruh workspace.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-5">
          <div>
            <p className="font-medium text-white">Kunci API</p>
            <p className="text-sm text-white/55">Kunci disimpan secara lokal lewat persistence Zustand untuk prototipe ini.</p>
          </div>

          <div className="grid gap-3">
            <Input
              value={draft.openAiKey ?? ""}
              onChange={(event) => setDraft((current) => ({ ...current, openAiKey: event.target.value }))}
              placeholder="Kunci API OpenAI"
            />
            <Input
              value={draft.youtubeKey ?? ""}
              onChange={(event) => setDraft((current) => ({ ...current, youtubeKey: event.target.value }))}
              placeholder="Kunci API YouTube"
            />
            <Input
              value={draft.tiktokKey ?? ""}
              onChange={(event) => setDraft((current) => ({ ...current, tiktokKey: event.target.value }))}
              placeholder="Kunci API TikTok"
            />
            <Input
              value={draft.instagramKey ?? ""}
              onChange={(event) => setDraft((current) => ({ ...current, instagramKey: event.target.value }))}
              placeholder="Kunci API Instagram"
            />
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/55">
            Gunakan key yang berbeda untuk pengujian connector agar publish queue bisa divalidasi per platform.
          </div>
        </Card>

        <Card className="space-y-5">
          <div>
            <p className="font-medium text-white">Kit Brand</p>
            <p className="text-sm text-white/55">Brand default yang dipakai untuk overlay thumbnail, suara metadata, dan lower third.</p>
          </div>

          <div className="grid gap-3">
            <Input
              value={draft.brandName}
              onChange={(event) => setDraft((current) => ({ ...current, brandName: event.target.value }))}
              placeholder="Nama brand"
            />
            <Input
              value={draft.fontFamily}
              onChange={(event) => setDraft((current) => ({ ...current, fontFamily: event.target.value }))}
              placeholder="Font heading"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {draft.brandColors.map((color, index) => (
              <div key={index} className="rounded-[24px] border border-white/10 bg-black/20 p-3">
                <div className="mb-3 h-12 rounded-2xl border border-white/10" style={{ backgroundColor: color }} />
                <Input
                  value={color}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      brandColors: current.brandColors.map((item, itemIndex) =>
                        itemIndex === index ? event.target.value : item
                      )
                    }))
                  }
                />
              </div>
            ))}
          </div>

          <Button onClick={() => setPreferences(draft)} className="w-full">
            Simpan pengaturan
          </Button>
        </Card>
      </div>
    </div>
  );
}
