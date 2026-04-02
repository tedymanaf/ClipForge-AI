"use client";

import { HeartHandshake, QrCode, Sparkles, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { SUPPORT_QRIS_DATA_URI } from "@/lib/support-qris";

export function SupportProjectCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <div className="glass-card relative overflow-hidden p-0">
          <div className="absolute left-[-5rem] top-[-4rem] h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute bottom-[-4rem] right-[-2rem] h-48 w-48 rounded-full bg-rose-500/20 blur-3xl" />

          <div className="relative grid gap-8 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
                <HeartHandshake className="h-3.5 w-3.5" />
                Dukung Project
              </div>

              <div>
                <h2 className="max-w-2xl text-3xl font-semibold leading-tight text-white md:text-4xl">
                  Suka dengan ClipForge AI?
                  <span className="text-gradient block">Bantu project ini tetap berkembang.</span>
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">
                  Dukungan kamu membantu pengembangan fitur baru, perbaikan workflow, dan deployment yang lebih stabil.
                  Scan QRIS untuk support cepat lewat e-wallet atau mobile banking.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  "Support cepat via semua aplikasi QRIS",
                  "Cocok untuk apresiasi sekali klik",
                  "Membantu biaya maintenance dan rilis fitur"
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/72">
                    {item}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="gap-2" onClick={() => setOpen(true)}>
                  <QrCode className="h-4 w-4" />
                  Buka QRIS Dukungan
                </Button>
                <a href={SUPPORT_QRIS_DATA_URI} target="_blank" rel="noreferrer">
                  <Button size="lg" variant="outline" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Lihat Full Image
                  </Button>
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="relative mx-auto max-w-sm overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
                <div className="absolute inset-x-6 top-0 h-20 bg-gradient-to-r from-cyan-400/20 via-transparent to-fuchsia-500/20 blur-2xl" />
                <div className="relative">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/35">Dukungan Creator</p>
                      <p className="mt-1 text-xl font-semibold text-white">Zens Store</p>
                      <p className="text-sm text-white/50">Scan QRIS untuk dukungan project</p>
                    </div>
                    <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
                      QRIS
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="group block w-full rounded-[26px] border border-white/10 bg-white p-3 text-left transition hover:scale-[1.01] hover:shadow-[0_22px_80px_rgba(34,211,238,0.12)]"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-slate-100">
                      <img
                        src={SUPPORT_QRIS_DATA_URI}
                        alt="QRIS Zens Store untuk dukungan project"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                  </button>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
                    Klik preview atau tombol di kiri untuk membuka QRIS dan scan langsung dari perangkat kamu.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/10 bg-[#0b1017] p-4 shadow-[0_32px_120px_rgba(0,0,0,0.6)] md:p-6">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Tutup QRIS modal"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-5 pr-12">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/70">Support via QRIS</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Scan dan dukung project ClipForge AI</h3>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Gunakan aplikasi e-wallet atau mobile banking yang mendukung QRIS. Kalau perlu, buka gambar penuh lalu scan dari perangkat lain.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white p-3">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[20px]">
                <img
                  src={SUPPORT_QRIS_DATA_URI}
                  alt="QRIS Zens Store full preview"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <a href={SUPPORT_QRIS_DATA_URI} target="_blank" rel="noreferrer">
                <Button className="gap-2">Buka Gambar Penuh</Button>
              </a>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
