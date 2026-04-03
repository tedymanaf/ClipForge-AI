"use client";

import { CheckCircle2, LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

const WORKFLOW_STEPS = [
  { id: "upload", label: "Upload" },
  { id: "review", label: "Review" },
  { id: "edit", label: "Edit" },
  { id: "download", label: "Download MP4" }
] as const;

export function WorkflowStepper({
  current,
  className
}: {
  current: (typeof WORKFLOW_STEPS)[number]["id"];
  className?: string;
}) {
  const currentIndex = WORKFLOW_STEPS.findIndex((step) => step.id === current);

  return (
    <div className={cn("grid gap-3 md:grid-cols-4", className)}>
      {WORKFLOW_STEPS.map((step, index) => {
        const complete = index < currentIndex;
        const active = index === currentIndex;

        return (
          <div
            key={step.id}
            className={cn(
              "rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3",
              active && "border-cyan-300/25 bg-cyan-300/8",
              complete && "border-emerald-300/20 bg-emerald-300/8"
            )}
          >
            <div className="flex items-center gap-3">
              {complete ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              ) : active ? (
                <LoaderCircle className="h-4 w-4 animate-spin text-cyan-300" />
              ) : (
                <div className="h-4 w-4 rounded-full border border-white/15" />
              )}
              <div>
                <p className="text-sm font-medium text-white">{step.label}</p>
                <p className="text-xs text-white/45">
                  {complete ? "Selesai" : active ? "Sedang aktif" : "Berikutnya"}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
