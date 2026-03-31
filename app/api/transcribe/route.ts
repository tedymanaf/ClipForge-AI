import { NextResponse } from "next/server";

import { transcribeWithWhisperMock } from "@/lib/whisper";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { sourceName?: string };
  const transcript = await transcribeWithWhisperMock(body.sourceName ?? "uploaded-video");
  return NextResponse.json({ transcript });
}
