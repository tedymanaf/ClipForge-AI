import JSZip from "jszip";
import { NextResponse } from "next/server";

import { buildExportArtifacts } from "@/modules/clipper/ClipGenerator";
import { ClipCandidate, MetadataBundle } from "@/types";

function buildSrt(clip: ClipCandidate) {
  return clip.transcript
    .map((segment, index) => {
      const start = new Date(segment.startMs).toISOString().slice(11, 23).replace(".", ",");
      const end = new Date(segment.endMs).toISOString().slice(11, 23).replace(".", ",");
      return `${index + 1}\n${start} --> ${end}\n${segment.text}\n`;
    })
    .join("\n");
}

function buildVtt(clip: ClipCandidate) {
  return `WEBVTT\n\n${clip.transcript
    .map((segment) => {
      const start = new Date(segment.startMs).toISOString().slice(11, 23).replace(",", ".");
      const end = new Date(segment.endMs).toISOString().slice(11, 23).replace(",", ".");
      return `${start} --> ${end}\n${segment.text}\n`;
    })
    .join("\n")}`;
}

export async function POST(request: Request) {
  const body = (await request.json()) as { clip: ClipCandidate; metadata?: MetadataBundle };
  const zip = new JSZip();
  const artifacts = buildExportArtifacts(body.clip);
  const metadata = body.metadata ?? null;

  for (const artifact of artifacts) {
    if (artifact.name.endsWith(".json")) {
      zip.file(artifact.name, JSON.stringify(metadata, null, 2));
    } else if (artifact.name.endsWith(".srt")) {
      zip.file(artifact.name, buildSrt(body.clip));
    } else if (artifact.name.endsWith(".vtt")) {
      zip.file(artifact.name, buildVtt(body.clip));
    } else {
      zip.file(
        artifact.name,
        `Placeholder artifact for ${artifact.name}.\nWire this route to FFmpeg render output for production media binaries.`
      );
    }
  }

  const buffer = await zip.generateAsync({ type: "uint8array" });
  const zipBuffer = Buffer.from(buffer);

  return new NextResponse(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${body.clip.id}.zip"`
    }
  });
}
