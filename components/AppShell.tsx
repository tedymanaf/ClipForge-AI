"use client";

import { MouseEvent, ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Clapperboard, Home, Settings2, UploadCloud } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard#upload", label: "Upload", icon: UploadCloud },
  { href: "/dashboard#library", label: "Review Clip", icon: Clapperboard },
  { href: "/dashboard#settings", label: "Pengaturan", icon: Settings2 }
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

  useEffect(() => {
    if (pathname !== "/dashboard" || !hash) {
      return;
    }

    let attempts = 0;

    const scrollToHashTarget = () => {
      const target = document.getElementById(hash.slice(1));

      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      if (attempts < 12) {
        attempts += 1;
        window.setTimeout(scrollToHashTarget, 120);
      }
    };

    scrollToHashTarget();
  }, [hash, pathname]);

  function handleNavigation(event: MouseEvent<HTMLAnchorElement>, href: string) {
    const [itemPath, itemHash = ""] = href.split("#");
    const nextHash = itemHash ? `#${itemHash}` : "";

    event.preventDefault();

    if (pathname !== itemPath) {
      window.location.assign(href);
      return;
    }

    if (!itemHash) {
      window.history.pushState(null, "", itemPath);
      setHash("");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    window.history.pushState(null, "", href);
    setHash(nextHash);

    const target = document.getElementById(itemHash);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 gap-6 px-4 py-4 lg:grid-cols-[292px_1fr]">
        <aside className="glass-card sticky top-4 h-fit overflow-y-auto p-5 lg:h-[calc(100vh-2rem)]">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-primary/90 to-accent/80 shadow-glow">
                <Clapperboard className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">ClipForge AI</p>
                <p className="text-xs text-white/45">Upload, review, edit, download.</p>
              </div>
            </Link>
          </div>

          <div className="mb-4 rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <p className="section-eyebrow">Cara Pakai</p>
            <div className="mt-3 space-y-3 text-sm text-white/65">
              <p>1. Upload satu video.</p>
              <p>2. Review clip terbaik.</p>
              <p>3. Edit seperlunya dan download MP4.</p>
            </div>
          </div>

          <div className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/35">
            Navigasi
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
                  onClick={(event) => handleNavigation(event, item.href)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm text-white/68 transition hover:border-white/10 hover:bg-white/[0.06] hover:text-white",
                    active && "border-white/10 bg-white/[0.08] text-white"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]",
                      active && "border-primary/30 bg-primary/12 text-blue-100"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {active ? <ArrowUpRight className="h-4 w-4 text-white/40" /> : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 rounded-[24px] border border-cyan-300/10 bg-cyan-400/8 p-4">
            <p className="text-sm font-semibold text-white">Tujuan utama</p>
            <p className="mt-2 text-xs leading-5 text-white/60">
              Buat orang cepat sampai ke clip yang bisa diunduh, bukan tersesat di banyak layar.
            </p>
          </div>
        </aside>

        <main className="min-w-0 space-y-6">
          <div className="glass-card flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
              <h1 className="mt-2 break-words text-3xl font-semibold text-white md:text-4xl">{title}</h1>
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-3 md:justify-end">{actions}</div> : null}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
