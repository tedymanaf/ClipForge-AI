import { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Badge({
  className,
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-medium text-white/78",
        className
      )}
    >
      {children}
    </span>
  );
}
