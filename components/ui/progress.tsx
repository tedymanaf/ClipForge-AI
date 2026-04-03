import { cn } from "@/lib/utils";

export function Progress({
  value,
  className
}: {
  value: number;
  className?: string;
}) {
  return (
    <div className={cn("relative h-3 overflow-hidden rounded-full bg-white/10", className)}>
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
      />
      <div className="absolute inset-y-0 left-0 w-24 -translate-x-full animate-shine bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}
