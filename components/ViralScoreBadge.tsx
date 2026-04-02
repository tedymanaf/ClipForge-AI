import { Flame } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ViralScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 80
      ? "border-emerald-400/20 bg-emerald-400/15 text-emerald-200"
      : score >= 60
        ? "border-amber-300/20 bg-amber-300/15 text-amber-100"
        : "border-rose-300/20 bg-rose-300/15 text-rose-200";

  return (
    <Badge className={cn("gap-2 font-semibold", tone)}>
      <Flame className="h-3.5 w-3.5" />
      {score}% Viral
    </Badge>
  );
}
