import { NextResponse } from "next/server";

import { generateMetadataBundle } from "@/modules/metadata/MetadataEngine";
import { ClipCandidate } from "@/types";

export async function POST(request: Request) {
  const body = (await request.json()) as { clip: ClipCandidate };
  const metadata = generateMetadataBundle(body.clip);
  return NextResponse.json({ metadata });
}
