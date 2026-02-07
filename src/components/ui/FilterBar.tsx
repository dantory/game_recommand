"use client";

import { FilterChip } from "./FilterChip";
import { GENRES, PLATFORMS } from "@/lib/constants";
import { useHorizontalScroll } from "@/hooks/useHorizontalScroll";

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
  const { scrollRef, canScrollLeft, canScrollRight, scroll, handlers } =
    useHorizontalScroll({
      scrollAmount: 200,
    });

  return (
    <div className="group/filter relative">
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute -left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-lg border border-border opacity-0 transition-opacity group-hover/filter:opacity-100 hover:bg-muted"
          aria-label="왼쪽으로 스크롤"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute -right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-lg border border-border opacity-0 transition-opacity group-hover/filter:opacity-100 hover:bg-muted"
          aria-label="오른쪽으로 스크롤"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      )}
      <div
        ref={scrollRef}
        {...handlers}
        className="flex w-full gap-2 overflow-x-auto pb-2 scrollbar-hide select-none"
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
    </div>
  );
}
