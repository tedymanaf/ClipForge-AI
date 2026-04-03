"use client";

import { useEffect } from "react";

import { useClipForgeStore } from "@/store/useClipForgeStore";

export function StoreBootstrap() {
  const hydrated = useClipForgeStore((state) => state.hydrated);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
  }, [hydrated]);

  return null;
}
