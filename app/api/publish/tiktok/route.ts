import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    ok: true,
    provider: "tiktok",
    status: "stubbed",
    message: "Connect TikTok Content Posting API credentials to enable direct publishing."
  });
}
