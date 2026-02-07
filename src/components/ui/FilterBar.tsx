"use client";

import { useRef } from "react";
import { FilterChip } from "./FilterChip";
import { GENRES, PLATFORMS } from "@/lib/constants";

interface FilterBarProps {
  selectedGenres: number[];
  selectedPlatforms: number[];
  onToggleGenre: (id: number) => void;
  onTogglePlatform: (id: number) => void;
}

export function FilterBar({
  selectedGenres,
  selectedPlatforms,
  onToggleGenre,
  onTogglePlatform,
}: FilterBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className="flex w-full gap-2 overflow-x-auto pb-2 scrollbar-hide"
    >
      {GENRES.map((genre) => (
        <FilterChip
          key={`genre-${genre.id}`}
          label={genre.label}
          emoji={genre.emoji}
          selected={selectedGenres.includes(genre.id)}
          onToggle={() => onToggleGenre(genre.id)}
        />
      ))}
      <div className="mx-2 h-8 w-px bg-border" />
      {PLATFORMS.map((platform) => (
        <FilterChip
          key={`platform-${platform.id}`}
          label={platform.label}
          emoji={platform.emoji}
          selected={selectedPlatforms.includes(platform.id)}
          onToggle={() => onTogglePlatform(platform.id)}
        />
      ))}
    </div>
  );
}
