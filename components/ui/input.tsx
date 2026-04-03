import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white outline-none ring-0 placeholder:text-white/35 focus:border-primary/50 focus:bg-white/[0.06]",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";
