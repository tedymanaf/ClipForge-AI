import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    ok: true,
    provider: "youtube",
    status: "stubbed",
    message: "Connect YouTube Data API credentials to enable direct publishing."
  });
}
