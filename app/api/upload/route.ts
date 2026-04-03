import { randomUUID } from "crypto";
import { writeFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";

import { getWritableUploadsDir } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadsDir = await getWritableUploadsDir();
    const safeName = `${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]+/g, "_")}`;
    const fullPath = join(uploadsDir, safeName);

    await writeFile(fullPath, buffer);

    return NextResponse.json({
      id: safeName,
      path: fullPath,
      name: file.name,
      sizeBytes: file.size,
      type: file.type
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload gagal disimpan di server.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
