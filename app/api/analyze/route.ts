import { NextResponse } from "next/server";

import { analyzeProject } from "@/modules/analysis/AnalysisEngine";
import { createId } from "@/lib/utils";
import { Project, TranscriptSegment } from "@/types";

function toMilliseconds(value: number | undefined, fallback: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return value > 1000 ? value : Math.round(value * 1000);
}

function normalizeTranscript(input: Array<Partial<TranscriptSegment> & { startSec?: number; endSec?: number }> | undefined) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((segment, index) => {
      const startMs = toMilliseconds(segment.startMs, toMilliseconds(segment.startSec, index * 1000));
      const endMs = toMilliseconds(segment.endMs, toMilliseconds(segment.endSec, startMs + 1600));

      return {
        id: segment.id ?? createId("segment"),
        startMs,
        endMs: Math.max(endMs, startMs + 500),
        text: segment.text?.trim() ?? "",
        confidence: segment.confidence ?? 0.96,
        words: segment.words ?? []
      } satisfies TranscriptSegment;
    })
    .filter((segment) => segment.text.length > 0);
}

function buildFallbackProject(body: {
  projectName?: string;
  durationSec?: number;
  transcript?: Array<Partial<TranscriptSegment> & { startSec?: number; endSec?: number }>;
}): Project {
  const name = body.projectName?.trim() || "Uploaded Video";

  return {
    id: createId("project"),
    name,
    status: "queued",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    asset: {
      id: createId("asset"),
      name: `${name}.mp4`,
      source: "demo",
      durationSec: body.durationSec ?? 60,
      width: 1920,
      height: 1080,
      sizeBytes: 100_000_000,
      codec: "H.264",
      thumbnail:
        "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1280' height='720'%3E%3Crect width='1280' height='720' fill='%230b1020'/%3E%3Ctext x='64' y='620' fill='white' font-size='64' font-family='Arial'%3EAnalysis Preview%3C/text%3E%3C/svg%3E"
    },
    clips: [],
    transcript: normalizeTranscript(body.transcript),
    captions: {},
    thumbnails: {},
    metadata: {},
    processingSteps: [],
    progress: 0,
    insight: "Analysis pending.",
    settings: {
      defaultPlatforms: ["tiktok", "instagram", "youtube"],
      captionStyle: "creator-pro",
      language: "id-ID",
      uiLanguage: "id",
      qualityPreset: "standard",
      removeSilence: true,
      autoPublish: false
    }
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    project?: Project;
    projectName?: string;
    durationSec?: number;
    transcript?: Array<Partial<TranscriptSegment> & { startSec?: number; endSec?: number }>;
  };
  const project = body.project ?? buildFallbackProject(body);
  const transcript = normalizeTranscript(body.project?.transcript ?? body.transcript);
  const analyzed = await analyzeProject(project, transcript.length > 0 ? { transcript } : undefined);
  return NextResponse.json({ project: analyzed });
}
