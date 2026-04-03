import { extractStoredFileId } from "@/lib/storage-id";
import { VideoAsset } from "@/types";

export function buildAssetMediaUrl(asset: Pick<VideoAsset, "id" | "path" | "name">) {
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
