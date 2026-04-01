import { NextResponse } from "next/server";

import { createRenderPlan } from "@/modules/clipper/ClipGenerator";
import { createId } from "@/lib/utils";
import { ClipCandidate, Platform, TranscriptSegment } from "@/types";

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
      const endMs = toMilliseconds(segment.endMs, toMilliseconds(segment.endSec, startMs + 1800));

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

function buildFallbackClip(
  body: {
    clip?: Partial<ClipCandidate>;
    transcript?: Array<Partial<TranscriptSegment> & { startSec?: number; endSec?: number }>;
    durationSec?: number;
    platform?: Platform;
  },
  transcript: TranscriptSegment[]
): ClipCandidate {
  const startSec = Math.floor((transcript[0]?.startMs ?? 0) / 1000);
  const lastEndMs = transcript[transcript.length - 1]?.endMs ?? Math.max((body.durationSec ?? 30) * 1000, 15_000);
  const endSec = Math.max(startSec + 15, Math.ceil(lastEndMs / 1000));

  return {
    id: body.clip?.id ?? createId("clip"),
    projectId: body.clip?.projectId ?? createId("project"),
    title: body.clip?.title ?? transcript[0]?.text ?? "AI clip preview",
    description: body.clip?.description ?? "Preview clip plan generated from the provided transcript.",
    startSec,
    endSec,
    durationSec: Math.max(1, endSec - startSec),
    viralScore: body.clip?.viralScore ?? 82,
    breakdown: body.clip?.breakdown ?? {
      hook: 84,
      emotion: 76,
      value: 81,
      narrative: 74,
      quotability: 79,
      platformFit: 86,
      trendAlignment: 72,
      engagementPrediction: 80
    },
    whyItWorks: body.clip?.whyItWorks ?? ["Strong opening line is available for platform preview rendering."],
    hookLine: body.clip?.hookLine ?? transcript[0]?.text ?? "AI clip preview",
    transcript,
    platforms: body.clip?.platforms ?? [body.platform ?? "tiktok", "instagram", "youtube"],
    contentType: body.clip?.contentType ?? "education",
    sentiment: body.clip?.sentiment ?? "positive",
    status: body.clip?.status ?? "approved",
    previewImage:
      body.clip?.previewImage ??
      "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1080' height='1920'%3E%3Crect width='1080' height='1920' fill='%230b1020'/%3E%3Ctext x='84' y='1580' fill='white' font-size='72' font-family='Arial'%3EClip Preview%3C/text%3E%3C/svg%3E"
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    clip?: Partial<ClipCandidate>;
    transcript?: Array<Partial<TranscriptSegment> & { startSec?: number; endSec?: number }>;
    durationSec?: number;
    platform?: Platform;
  };
  const transcript = normalizeTranscript(body.clip?.transcript ?? body.transcript);
  const clip =
    body.clip && body.clip.id && Array.isArray(body.clip.platforms)
      ? (body.clip as ClipCandidate)
      : buildFallbackClip(body, transcript);
  const plan = createRenderPlan(clip, body.platform ?? clip.platforms[0] ?? "tiktok");
  return NextResponse.json({ plan });
}
