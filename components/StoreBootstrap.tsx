"use client";

import { useEffect } from "react";

import { useClipForgeStore } from "@/store/useClipForgeStore";

export function StoreBootstrap() {
  const hydrated = useClipForgeStore((state) => state.hydrated);
  const seedDemoProjects = useClipForgeStore((state) => state.seedDemoProjects);
  const projects = useClipForgeStore((state) => state.projects);

  useEffect(() => {
    if (hydrated && projects.length === 0) {
      seedDemoProjects();
    }
  }, [hydrated, projects.length, seedDemoProjects]);

  return null;
}
