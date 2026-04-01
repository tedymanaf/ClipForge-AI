import { NextResponse } from "next/server";

import { createId } from "@/lib/utils";
import { ClipCandidate, TranscriptSegment } from "@/types";

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
      const endMs = toMilliseconds(segment.endMs, toMilliseconds(segment.endSec, startMs + 1200));

      return {
        id: segment.id ?? createId("segment"),
        startMs,
        endMs: Math.max(endMs, startMs + 400),
        text: segment.text?.trim() ?? "",
        confidence: segment.confidence ?? 0.96,
        words: segment.words ?? []
      } satisfies TranscriptSegment;
    })
    .filter((segment) => segment.text.length > 0);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    clip?: Partial<ClipCandidate>;
    transcript?: Array<Partial<TranscriptSegment> & { startSec?: number; endSec?: number }>;
  };
  const transcript = normalizeTranscript(body.clip?.transcript ?? body.transcript);
  const cues = transcript.map((segment) => ({
    id: createId("cue"),
    startMs: segment.startMs,
    endMs: segment.endMs,
    text: segment.text,
    emojis: ["HOOK", "WOW"]
  }));

  return NextResponse.json({ cues });
}
