import { createReadStream } from "fs";
import { access, readdir, stat } from "fs/promises";
import { join, resolve, sep } from "path";
import { Readable } from "stream";

import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getStorageDir() {
  return resolve(process.cwd(), "storage", "uploads");
}

function isInsideStorage(filePath: string) {
  const storageDir = getStorageDir();
  const normalizedFilePath = resolve(filePath).toLowerCase();
  const normalizedStorageDir = storageDir.toLowerCase();

  return normalizedFilePath === normalizedStorageDir || normalizedFilePath.startsWith(`${normalizedStorageDir}${sep}`.toLowerCase());
}

async function exists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveMediaPath(request: Request) {
  const url = new URL(request.url);
  const storageDir = getStorageDir();
  const requestedFileId = url.searchParams.get("file")?.trim();
  const requestedName = url.searchParams.get("name")?.trim();

  if (requestedFileId) {
    const candidate = resolve(join(storageDir, requestedFileId));
    if (isInsideStorage(candidate) && await exists(candidate)) {
      return candidate;
    }
  }

  if (!requestedName) {
    return null;
  }

  try {
    const entries = await readdir(storageDir);
    const safeName = requestedName.replace(/[^a-zA-Z0-9._-]+/g, "_");
    const matched = entries.find((entry) => entry === safeName || entry.endsWith(`-${safeName}`) || entry.includes(safeName));

    if (!matched) {
      return null;
    }

    const candidate = resolve(join(storageDir, matched));
    return isInsideStorage(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

function getContentType(filePath: string) {
  const extension = filePath.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "mov":
      return "video/quicktime";
    case "m4v":
      return "video/x-m4v";
    default:
      return "application/octet-stream";
  }
}

function parseRangeHeader(range: string | null, totalSize: number) {
  if (!range?.startsWith("bytes=")) {
    return null;
  }

  const [rawStart, rawEnd] = range.replace("bytes=", "").split("-");
  const start = Number.parseInt(rawStart, 10);
  const end = rawEnd ? Number.parseInt(rawEnd, 10) : totalSize - 1;

  if (!Number.isFinite(start) || start < 0 || start >= totalSize) {
    return null;
  }

  const clampedEnd = Number.isFinite(end) ? Math.min(end, totalSize - 1) : totalSize - 1;
  if (clampedEnd < start) {
    return null;
  }

  return { start, end: clampedEnd };
}

export async function GET(request: Request) {
  const filePath = await resolveMediaPath(request);

  if (!filePath) {
    return NextResponse.json({ error: "Media file not found." }, { status: 404 });
  }

  const fileStats = await stat(filePath);
  const totalSize = fileStats.size;
  const range = parseRangeHeader(request.headers.get("range"), totalSize);
  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Cache-Control": "no-store",
    "Content-Type": getContentType(filePath)
  });

  if (range) {
    const { start, end } = range;
    headers.set("Content-Length", String(end - start + 1));
    headers.set("Content-Range", `bytes ${start}-${end}/${totalSize}`);

    const stream = Readable.toWeb(createReadStream(filePath, { start, end })) as ReadableStream;
    return new NextResponse(stream, { status: 206, headers });
  }

  headers.set("Content-Length", String(totalSize));
  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
  return new NextResponse(stream, { status: 200, headers });
}
