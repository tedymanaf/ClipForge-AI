import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storageDir = join(process.cwd(), "storage", "uploads");
  await mkdir(storageDir, { recursive: true });

  const safeName = `${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]+/g, "_")}`;
  const fullPath = join(storageDir, safeName);
  await writeFile(fullPath, buffer);

  return NextResponse.json({
    id: safeName,
    path: fullPath,
    name: file.name,
    sizeBytes: file.size,
    type: file.type
  });
}
