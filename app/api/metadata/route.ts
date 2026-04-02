import { NextResponse } from "next/server";

import { generateMetadataBundle } from "@/modules/metadata/MetadataEngine";
import { ClipCandidate } from "@/types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { clip?: ClipCandidate };
  if (!body.clip) {
    return NextResponse.json({ error: "Clip payload is required." }, { status: 400 });
  }

  const metadata = generateMetadataBundle(body.clip);
  return NextResponse.json({ metadata });
}
