import { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Card({
  className,
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("glass-card p-6", className)}>{children}</div>;
}

export function CardHeader({
  className,
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("mb-5 flex items-start justify-between gap-4", className)}>{children}</div>;
}

export function CardTitle({
  className,
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  return <h3 className={cn("text-lg font-semibold tracking-tight text-white", className)}>{children}</h3>;
}

export function CardDescription({
  className,
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  return <p className={cn("text-sm leading-6 text-white/60", className)}>{children}</p>;
}
