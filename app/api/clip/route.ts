import { NextResponse } from "next/server";

import { createRenderPlan } from "@/modules/clipper/ClipGenerator";
import { ClipCandidate, Platform } from "@/types";

export async function POST(request: Request) {
  const body = (await request.json()) as { clip: ClipCandidate; platform?: Platform };
  const plan = createRenderPlan(body.clip, body.platform ?? body.clip.platforms[0] ?? "tiktok");
  return NextResponse.json({ plan });
}
