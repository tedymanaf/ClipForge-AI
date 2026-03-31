"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Clapperboard, Home, Library, Settings2, UploadCloud } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard#upload", label: "Upload New Video", icon: UploadCloud },
  { href: "/dashboard#projects", label: "My Projects", icon: Clapperboard },
  { href: "/dashboard#library", label: "Clip Library", icon: Library },
  { href: "/dashboard#analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard#settings", label: "Settings", icon: Settings2 }
];

export function AppShell({
  children,
  title,
  eyebrow,
  actions
}: {
  children: ReactNode;
  title: string;
  eyebrow?: string;
  actions?: ReactNode;
}) {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);

    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  return (
    <div className="min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 gap-6 px-4 py-4 lg:grid-cols-[280px_1fr]">
        <aside className="glass-card sticky top-4 h-fit p-5 lg:h-[calc(100vh-2rem)]">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-glow">
                <Clapperboard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">ClipForge AI</p>
                <p className="text-xs text-white/45">Upload Once. Go Viral Everywhere.</p>
              </div>
            </Link>
          </div>

          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const [itemPath, itemHash = ""] = item.href.split("#");
              const active = pathname === itemPath && (itemHash ? hash === `#${itemHash}` : hash === "");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white/70 transition hover:bg-white/8 hover:text-white",
                    active && "bg-white/10 text-white shadow-glow"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 rounded-[24px] border border-cyan-300/10 bg-cyan-400/8 p-4">
            <p className="text-sm font-semibold text-white">Offline-ready pipeline</p>
            <p className="mt-2 text-xs leading-5 text-white/60">
              Client-side FFmpeg.wasm fallback and mock AI routes keep the workflow usable while real APIs are wired in.
            </p>
          </div>
        </aside>

        <main className="space-y-6">
          <div className="glass-card flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              {eyebrow ? <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">{eyebrow}</p> : null}
              <h1 className="mt-1 text-3xl font-semibold text-white">{title}</h1>
            </div>
            {actions}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
