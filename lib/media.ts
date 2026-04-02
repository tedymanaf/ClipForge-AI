import { VideoAsset } from "@/types";

function extractStoredFileId(asset: Pick<VideoAsset, "path" | "name">) {
  if (!asset.path) {
    return undefined;
  }

  const segments = asset.path.split(/[\\/]+/).filter(Boolean);
  return segments[segments.length - 1];
}

export function buildAssetMediaUrl(asset: Pick<VideoAsset, "path" | "name">) {
  const fileId = extractStoredFileId(asset);
  const params = new URLSearchParams();

  if (fileId) {
    params.set("file", fileId);
  } else if (asset.name) {
    params.set("name", asset.name);
  }

  const query = params.toString();
  return query ? `/api/media?${query}` : null;
}

export function createDownloadFileName(title: string, extension: string) {
  const baseName = title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return `${baseName || "clipforge_export"}.${extension.replace(/^\./, "")}`;
}
