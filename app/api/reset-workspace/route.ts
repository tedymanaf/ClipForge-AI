import { readdir, rm } from "fs/promises";
import { join } from "path";

import { NextResponse } from "next/server";

import { getReadableUploadsDirs } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST() {
  try {
    const uploadsDirs = await getReadableUploadsDirs();
    let clearedFiles = 0;

    for (const uploadsDir of uploadsDirs) {
      try {
        const entries = await readdir(uploadsDir, { withFileTypes: true });

        for (const entry of entries) {
          const targetPath = join(uploadsDir, entry.name);
          await rm(targetPath, { recursive: true, force: true });
          clearedFiles += 1;
        }
      } catch {
        // Skip unreadable directories and continue clearing the rest.
      }
    }

    return NextResponse.json({
      ok: true,
      clearedFiles,
      message:
        clearedFiles > 0
          ? `${clearedFiles} file upload lama dibersihkan dari server.`
          : "Tidak ada file upload lama yang perlu dibersihkan di server."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reset server gagal dijalankan.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
