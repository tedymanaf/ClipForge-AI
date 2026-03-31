"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useClipForgeStore } from "@/store/useClipForgeStore";

export function Settings() {
  const preferences = useClipForgeStore((state) => state.preferences);
  const setPreferences = useClipForgeStore((state) => state.setPreferences);
  const [draft, setDraft] = useState(preferences);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="space-y-4">
        <div>
          <p className="font-medium text-white">API Keys</p>
          <p className="text-sm text-white/55">Keys are stored locally in Zustand persistence for this prototype.</p>
        </div>

        <Input
          value={draft.openAiKey ?? ""}
          onChange={(event) => setDraft((current) => ({ ...current, openAiKey: event.target.value }))}
          placeholder="OpenAI API Key"
        />
        <Input
          value={draft.youtubeKey ?? ""}
          onChange={(event) => setDraft((current) => ({ ...current, youtubeKey: event.target.value }))}
          placeholder="YouTube API Key"
        />
        <Input
          value={draft.tiktokKey ?? ""}
          onChange={(event) => setDraft((current) => ({ ...current, tiktokKey: event.target.value }))}
          placeholder="TikTok API Key"
        />
        <Input
          value={draft.instagramKey ?? ""}
          onChange={(event) => setDraft((current) => ({ ...current, instagramKey: event.target.value }))}
          placeholder="Instagram API Key"
        />
      </Card>

      <Card className="space-y-4">
        <div>
          <p className="font-medium text-white">Brand Kit</p>
          <p className="text-sm text-white/55">Default branding used in thumbnail overlays, metadata voice, and lower thirds.</p>
        </div>

        <Input
          value={draft.brandName}
          onChange={(event) => setDraft((current) => ({ ...current, brandName: event.target.value }))}
          placeholder="Brand name"
        />
        <Input
          value={draft.fontFamily}
          onChange={(event) => setDraft((current) => ({ ...current, fontFamily: event.target.value }))}
          placeholder="Heading font"
        />

        <div className="grid grid-cols-3 gap-3">
          {draft.brandColors.map((color, index) => (
            <Input
              key={index}
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
          ))}
        </div>

        <Button onClick={() => setPreferences(draft)} className="w-full">
          Save preferences
        </Button>
      </Card>
    </div>
  );
}
