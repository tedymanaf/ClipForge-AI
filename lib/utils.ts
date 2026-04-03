import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number) {
  if (!bytes) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const order = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** order;
  return `${value.toFixed(value >= 10 || order === 0 ? 0 : 1)} ${units[order]}`;
}

export function formatDuration(totalSec: number) {
  const minutes = Math.floor(totalSec / 60);
  const seconds = Math.floor(totalSec % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

export function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createProjectDisplayName(rawName: string) {
  const withoutExtension = rawName.replace(/\.[a-z0-9]+$/i, "");
  const segments = withoutExtension.split(/[-_]+/).filter(Boolean);
  let startIndex = 0;

  while (startIndex < segments.length) {
    const segment = segments[startIndex];
    const looksLikeUuid = /^[a-f0-9]{8,}$/i.test(segment) || /^[a-f0-9]{4,}$/i.test(segment);
    const looksLikeGeneratedPrefix = /^upload$/i.test(segment) || /^copy$/i.test(segment);

    if (!looksLikeUuid && !looksLikeGeneratedPrefix) {
      break;
    }

    startIndex += 1;
  }

  const cleaned = segments.slice(startIndex).join(" ").trim() || withoutExtension.trim();
  return cleaned.replace(/\s+/g, " ").trim();
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function svgToDataUri(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
