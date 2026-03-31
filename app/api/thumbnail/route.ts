import { NextResponse } from "next/server";

import { generateThumbnailVariants } from "@/modules/thumbnail/ThumbnailEngine";
import { ClipCandidate } from "@/types";

export async function POST(request: Request) {
  const body = (await request.json()) as { clip: ClipCandidate };
  const thumbnails = generateThumbnailVariants(body.clip);
  return NextResponse.json({ thumbnails });
}
