"use client";

import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export function Button({
  variant = "primary",
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "w-full rounded-xl px-6 py-3 text-sm font-medium transition-colors",
        variant === "primary" &&
          "bg-accent text-white hover:opacity-90 disabled:opacity-50",
        variant === "secondary" &&
          "border border-border bg-transparent text-foreground hover:bg-muted disabled:opacity-50",
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
