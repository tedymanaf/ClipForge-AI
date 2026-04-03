import * as React from "react";

import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default:
    "bg-primary text-white shadow-glow hover:-translate-y-px hover:bg-blue-500",
  secondary: "border border-white/10 bg-white/8 text-white hover:bg-white/12",
  ghost: "bg-transparent text-white/78 hover:bg-white/8 hover:text-white",
  outline: "border border-white/15 bg-white/[0.03] text-white hover:bg-white/8"
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  default: "h-11 px-5",
  sm: "h-9 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-11 w-11"
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-2xl font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
