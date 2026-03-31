import { NextResponse } from "next/server";

import { ClipCandidate } from "@/types";
import { createId } from "@/lib/utils";

export async function POST(request: Request) {
  const body = (await request.json()) as { clip: ClipCandidate };
  const cues = body.clip.transcript.map((segment) => ({
    id: createId("cue"),
    startMs: segment.startMs,
    endMs: segment.endMs,
    text: segment.text,
    emojis: ["🔥", "🎯"]
  }));

  return NextResponse.json({ cues });
}
