import { constants } from "fs";
import { access, mkdir, readdir } from "fs/promises";
import { tmpdir } from "os";
import { join, resolve } from "path";

import { extractStoredFileId } from "@/lib/storage-id";
import { VideoAsset } from "@/types";

const LEGACY_UPLOADS_DIR = resolve(process.cwd(), "storage", "uploads");

function uniquePaths(paths: Array<string | undefined>) {
  return Array.from(new Set(paths.filter((value): value is string => Boolean(value?.trim()))));
}

function toUploadsDir(root: string) {
  const normalized = resolve(root);
  const lastSegment = normalized.split(/[\\/]+/).filter(Boolean).at(-1)?.toLowerCase();
  return lastSegment === "uploads" ? normalized : join(normalized, "uploads");
}

function getUploadDirCandidates() {
  return uniquePaths([
    process.env.CLIPFORGE_STORAGE_DIR,
    process.platform === "win32" ? undefined : "/data/clipforge",
    join(tmpdir(), "clipforge"),
    resolve(process.cwd(), "storage"),
    LEGACY_UPLOADS_DIR
  ].map((root) => (root ? toUploadsDir(root) : undefined)));
}

async function canReadWrite(directory: string) {
  try {
    await mkdir(directory, { recursive: true });
    await access(directory, constants.R_OK | constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

async function fileExists(filePath: string | undefined) {
  if (!filePath) {
    return false;
  }

  try {
    await access(filePath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

export async function getWritableUploadsDir() {
  for (const directory of getUploadDirCandidates()) {
    if (await canReadWrite(directory)) {
      return directory;
    }
  }

  throw new Error("ClipForge tidak menemukan folder upload yang bisa ditulis oleh server.");
}

export async function getReadableUploadsDirs() {
  const resolved: string[] = [];

  for (const directory of getUploadDirCandidates()) {
    if (await fileExists(directory)) {
      resolved.push(directory);
    }
  }

  return resolved;
}

export async function findStoredFileByName(fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, "_");

  for (const directory of await getReadableUploadsDirs()) {
    try {
      const entries = await readdir(directory);
      const matched = entries.find((entry) => entry === safeName || entry.endsWith(`-${safeName}`) || entry.includes(safeName));

      if (matched) {
        return join(directory, matched);
      }
    } catch {
      // Ignore broken lookup directories and continue scanning.
    }
  }

  return null;
}

export async function resolveStoredAssetPath(asset?: Pick<VideoAsset, "id" | "path" | "name">) {
  if (await fileExists(asset?.path)) {
    return asset?.path ?? null;
  }

  const storedFileId = asset ? extractStoredFileId(asset) : undefined;
  if (storedFileId) {
    for (const directory of await getReadableUploadsDirs()) {
      const candidate = join(directory, storedFileId);
      if (await fileExists(candidate)) {
        return candidate;
      }
    }
  }

  if (!asset?.name) {
    return null;
  }

  return findStoredFileByName(asset.name);
}
