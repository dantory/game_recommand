"use client";

import { cn } from "@/lib/utils";

interface SelectableChipProps {
  label: string;
  emoji: string;
  selected: boolean;
  onToggle: () => void;
}

export function SelectableChip({
  label,
  emoji,
  selected,
  onToggle,
}: SelectableChipProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all",
        selected
          ? "border-accent bg-accent-light text-accent"
          : "border-border bg-transparent text-foreground hover:bg-muted"
      )}
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </button>
  );
}
