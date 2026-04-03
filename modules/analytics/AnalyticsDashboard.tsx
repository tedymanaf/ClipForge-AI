"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toRadarData } from "@/lib/scoring";
import { Project } from "@/types";

export function AnalyticsDashboard({ project }: { project: Project }) {
  const topClip = project.clips[0];
  const radarData = topClip ? toRadarData(topClip.breakdown) : [];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="section-eyebrow">Tampilan Performa</p>
            <p className="mt-2 text-xl font-semibold text-white">Rincian skor clip teratas</p>
            <p className="text-sm text-white/55">Radar chart ini membantu membaca kekuatan clip secara cepat tanpa membuka detail panjang.</p>
          </div>
          {topClip ? <Badge className="w-fit">{topClip.title}</Badge> : null}
        </div>
        <div className="rounded-[28px] border border-white/10 bg-black/20 p-4">
          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.12)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "#D1D5DB", fontSize: 12 }} />
                <Radar dataKey="score" stroke="#06B6D4" fill="#7C3AED" fillOpacity={0.45} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="space-y-4">
          <div>
            <p className="font-medium text-white">Kenapa skornya tinggi</p>
            <p className="text-sm text-white/55">Poin-poin ini dibuat supaya hasil analisis bisa langsung ditindaklanjuti saat review.</p>
          </div>
          {topClip?.whyItWorks.map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-white/70">
              {item}
            </div>
          ))}
        </Card>

        <Card className="space-y-4">
          <div>
            <p className="font-medium text-white">Rekomendasi</p>
            <p className="text-sm text-white/55">Saran ini menjaga dashboard tetap berorientasi aksi, bukan cuma laporan.</p>
          </div>
          <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/10 p-4 text-sm leading-6 text-white/75">
            Angle dengan performa terbaik saat ini adalah urgensi edukatif. Buka dengan klaim tegas, lalu masuk ke takeaway praktis sebelum detik kelima.
          </div>
          <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-4 text-sm leading-6 text-white/75">
            Rangkaian seri terbaik: Senin penjelasan hook, Rabu studi kasus, Jumat checklist taktis.
          </div>
        </Card>
      </div>
    </div>
  );
}
