"use client";

import { cn } from "@/lib/utils";

interface FilterChipProps {
  label: string;
  emoji: string;
  selected: boolean;
  onToggle: () => void;
}

export function FilterChip({
  label,
  emoji,
  selected,
  onToggle,
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all",
        selected
          ? "border-accent bg-accent/10 text-accent"
          : "border-border bg-background text-muted-foreground hover:bg-muted"
      )}
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </button>
  );
}
