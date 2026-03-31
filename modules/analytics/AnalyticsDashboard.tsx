"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";

import { Card } from "@/components/ui/card";
import { toRadarData } from "@/lib/scoring";
import { Project } from "@/types";

export function AnalyticsDashboard({ project }: { project: Project }) {
  const topClip = project.clips[0];
  const radarData = topClip ? toRadarData(topClip.breakdown) : [];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="space-y-4">
        <div>
          <p className="font-medium text-white">Virality Breakdown</p>
          <p className="text-sm text-white/55">Compare the 8 scoring dimensions that shape short-form performance.</p>
        </div>
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
      </Card>

      <div className="space-y-6">
        <Card className="space-y-3">
          <p className="font-medium text-white">Why it scored high</p>
          {topClip?.whyItWorks.map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              {item}
            </div>
          ))}
        </Card>

        <Card className="space-y-3">
          <p className="font-medium text-white">Recommendations</p>
          <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/10 p-4 text-sm text-white/75">
            Your best-performing angle is educational urgency. Keep opening with a hard claim, then land a practical takeaway by second five.
          </div>
          <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-4 text-sm text-white/75">
            Best series chain: Monday hook explainer, Wednesday case study, Friday tactical checklist.
          </div>
        </Card>
      </div>
    </div>
  );
}
