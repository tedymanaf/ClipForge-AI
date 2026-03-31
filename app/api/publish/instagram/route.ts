import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    ok: true,
    provider: "instagram",
    status: "stubbed",
    message: "Connect Instagram Graph API credentials to enable direct publishing."
  });
}
