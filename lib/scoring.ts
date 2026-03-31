import { ViralScoreBreakdown } from "@/types";

const WEIGHTS: Record<keyof ViralScoreBreakdown, number> = {
  hook: 0.18,
  emotion: 0.12,
  value: 0.16,
  narrative: 0.12,
  quotability: 0.1,
  platformFit: 0.12,
  trendAlignment: 0.08,
  engagementPrediction: 0.12
};

export function calculateViralScore(breakdown: ViralScoreBreakdown) {
  const weighted = Object.entries(breakdown).reduce((total, [key, value]) => {
    return total + value * WEIGHTS[key as keyof ViralScoreBreakdown];
  }, 0);

  return Math.round(weighted);
}

export function toRadarData(breakdown: ViralScoreBreakdown) {
  return [
    { metric: "Hook", score: breakdown.hook },
    { metric: "Emotion", score: breakdown.emotion },
    { metric: "Value", score: breakdown.value },
    { metric: "Narrative", score: breakdown.narrative },
    { metric: "Quote", score: breakdown.quotability },
    { metric: "Fit", score: breakdown.platformFit },
    { metric: "Trend", score: breakdown.trendAlignment },
    { metric: "Engage", score: breakdown.engagementPrediction }
  ];
}
