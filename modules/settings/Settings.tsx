"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useClipForgeStore } from "@/store/useClipForgeStore";

export function Settings() {
  const preferences = useClipForgeStore((state) => state.preferences);
  const setPreferences = useClipForgeStore((state) => state.setPreferences);
  const resetWorkspace = useClipForgeStore((state) => state.resetWorkspace);
  const [draft, setDraft] = useState(preferences);

  useEffect(() => {
    setDraft(preferences);
  }, [preferences]);

  function handleResetWorkspace() {
    if (!window.confirm("Hapus semua project lokal, queue, dan onboarding dari browser ini?")) {
      return;
    }

    resetWorkspace();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="section-eyebrow">Pengaturan Workspace</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Kontrol API, brand, dan strategi integrasi dalam satu tempat.</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
          Pengaturan ini memengaruhi perilaku prototipe, branding output, dan kesiapan saat aplikasi ingin diarahkan ke mode produksi.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-5">
          <div>
            <p className="font-medium text-white">Kunci API</p>
            <p className="text-sm text-white/55">Kunci disimpan secara lokal lewat persistence Zustand untuk tahap prototipe ini.</p>
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
            Pakai kunci yang berbeda untuk pengujian kalau kamu ingin membandingkan stabilitas connector per platform.
          </div>
        </Card>

        <Card className="space-y-5">
          <div>
            <p className="font-medium text-white">Kit Brand</p>
            <p className="text-sm text-white/55">Brand default untuk thumbnail, metadata, dan gaya visual output.</p>
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

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="space-y-4">
          <div>
            <p className="font-medium text-white">Strategi AI yang disarankan</p>
            <p className="text-sm text-white/55">
              Untuk aplikasi seperti ini, paling aman memisahkan fungsi AI berdasarkan jenis pekerjaan.
            </p>
          </div>

          <div className="grid gap-3">
            {[
              "Transkripsi: prioritaskan provider speech-to-text yang murah atau bisa dijalankan lokal.",
              "Skor hook dan metadata: gunakan model teks yang hemat biaya dan cepat, karena request-nya sering.",
              "Thumbnail atau rewrite kreatif: jadikan fitur opsional agar biaya tidak membebani alur utama."
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-white/68">
                {item}
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <p className="font-medium text-white">Catatan integrasi produksi</p>
            <p className="text-sm text-white/55">
              Arsitektur ClipForge saat ini cocok untuk bertumbuh dari mode mock ke mode hybrid secara bertahap.
            </p>
          </div>

          <div className="space-y-3">
            <div className="rounded-[24px] border border-cyan-300/15 bg-cyan-300/8 p-4 text-sm leading-6 text-white/70">
              Mulai dari transkripsi dan analisis teks dulu. Dua area ini memberi dampak terbesar terhadap pengalaman pengguna.
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/60">
              Publish connector bisa tetap mock lebih lama, karena nilai utama aplikasi ini justru ada di proses review dan packaging.
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/60">
              Simpan konfigurasi sensitif di environment server saat masuk tahap produksi. Penyimpanan lokal hanya cocok untuk demo dan eksplorasi.
            </div>
          </div>
        </Card>
      </div>

      <Card className="space-y-4">
        <div>
          <p className="font-medium text-white">Recovery Tools</p>
          <p className="text-sm text-white/55">
            Kalau data lama di browser membuat daftar project terasa salah, tool ini membantu memulai ulang dengan cepat.
          </p>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="rounded-[24px] border border-rose-300/15 bg-rose-300/8 p-4 text-sm leading-6 text-white/68">
            Reset workspace akan menghapus project lokal yang tersimpan di browser ini. File sumber di server tidak ikut dihapus.
          </div>
          <Button variant="outline" className="border-rose-300/20 bg-rose-300/8 hover:bg-rose-300/12" onClick={handleResetWorkspace}>
            Reset Workspace Lokal
          </Button>
        </div>
      </Card>
    </div>
  );
}
