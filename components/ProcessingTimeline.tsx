import { CheckCircle2, LoaderCircle } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ProcessingStep } from "@/types";

export function ProcessingTimeline({ steps }: { steps: ProcessingStep[] }) {
  return (
    <div className="space-y-4">
      {steps.map((step) => (
        <div
          key={step.id}
          className={cn(
            "glass-panel rounded-[24px] p-4 transition-all",
            step.state === "active" && "border-cyan-300/25 shadow-cyan",
            step.state === "complete" && "border-emerald-300/20"
          )}
        >
          <div className="flex items-start gap-4">
            <div className="mt-0.5">
              {step.state === "complete" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              ) : step.state === "active" ? (
                <LoaderCircle className="h-5 w-5 animate-spin text-cyan-300" />
              ) : (
                <div className="h-5 w-5 rounded-full border border-white/15" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-white">{step.label}</p>
                  <p className="text-sm text-white/55">{step.description}</p>
                </div>
                <span className="text-sm text-white/50">{step.progress}%</span>
              </div>
              <Progress className="mt-3" value={step.progress} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
