import { ThumbnailVariant, ClipCandidate } from "@/types";
import { createId, svgToDataUri } from "@/lib/utils";

function createThumbnailSvg(title: string, label: string, accent: string, size: string) {
  const [width, height] = size.split("x").map(Number);

  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#111827" offset="0%"/>
          <stop stop-color="#09090F" offset="100%"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)"/>
      <circle cx="${width - 180}" cy="120" r="180" fill="${accent}" fill-opacity="0.2"/>
      <rect x="36" y="36" width="${width - 72}" height="${height - 72}" rx="28" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)"/>
      <text x="72" y="${height - 180}" fill="#FFFFFF" font-size="${Math.max(40, width / 18)}" font-weight="700" font-family="Arial, sans-serif">${label}</text>
      <text x="72" y="${height - 110}" fill="#D1D5DB" font-size="${Math.max(22, width / 35)}" font-family="Arial, sans-serif">${title}</text>
    </svg>
  `);
}

export function generateThumbnailVariants(clip: ClipCandidate): ThumbnailVariant[] {
  const baseImage = clip.previewImage?.trim();

  return [
    {
      id: createId("thumb"),
      kind: "face-close-up",
      label: "Face Close-Up",
      image: baseImage || createThumbnailSvg(clip.title, "Face Close-Up", "#7C3AED", "1280x720"),
      size: "1280x720"
    },
    {
      id: createId("thumb"),
      kind: "action-frame",
      label: "Action Frame",
      image: baseImage || createThumbnailSvg(clip.title, "Action Frame", "#06B6D4", "1080x1080"),
      size: "1080x1080"
    },
    {
      id: createId("thumb"),
      kind: "text-forward",
      label: "Text Forward",
      image: baseImage || createThumbnailSvg(clip.title, "Text Forward", "#10B981", "1080x1920"),
      size: "1080x1920"
    }
  ];
}
