import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";

import { NextResponse } from "next/server";

import { findStoredFileByName, getReadableUploadsDirs } from "@/lib/storage";

export const runtime = "nodejs";

async function resolveMediaPath(request: Request) {
  const url = new URL(request.url);
  const requestedFileId = url.searchParams.get("file")?.trim();
  const requestedName = url.searchParams.get("name")?.trim();

  if (requestedFileId) {
    const { join } = await import("path");
    for (const uploadsDir of await getReadableUploadsDirs()) {
      const candidate = join(uploadsDir, requestedFileId);

      try {
        await stat(candidate);
        return candidate;
      } catch {
        // Continue scanning other upload roots.
      }
    }
  }

  if (!requestedName) {
    return null;
  }

  return findStoredFileByName(requestedName);
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
