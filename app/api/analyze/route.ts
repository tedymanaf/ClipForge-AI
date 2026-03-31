import { NextResponse } from "next/server";

import { analyzeProject } from "@/modules/analysis/AnalysisEngine";
import { Project } from "@/types";

export async function POST(request: Request) {
  const body = (await request.json()) as { project: Project };
  const analyzed = await analyzeProject(body.project);
  return NextResponse.json({ project: analyzed });
}
