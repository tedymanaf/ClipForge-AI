import { VideoAsset } from "@/types";

export function extractStoredFileId(asset: Pick<VideoAsset, "id" | "path" | "name">) {
  const directId = asset.id?.trim();
  if (directId && /\.[a-z0-9]{2,5}$/i.test(directId)) {
    return directId.split(/[\\/]+/).filter(Boolean).at(-1);
  }

  if (!asset.path) {
    return undefined;
  }

  return asset.path.split("?")[0].split(/[\\/]+/).filter(Boolean).at(-1);
}
