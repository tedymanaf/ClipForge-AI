"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-10 text-white">
      <div className="glass-card w-full p-8 md:p-10">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Runtime recovery</p>
        <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">Halaman sempat gagal dimuat</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65">
          Saya tampilkan fallback ini supaya app tidak berhenti di layar kosong. Coba muat ulang state halaman,
          atau kembali ke dashboard untuk masuk lewat project yang masih valid.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={reset}>Coba lagi</Button>
          <Link href="/dashboard">
            <Button variant="outline">Kembali ke dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
