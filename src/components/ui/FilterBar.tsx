"use client";

import { useRef, useState, useCallback, useEffect } from "react";
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
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const hasDragged = useRef(false);
  const pointerId = useRef<number | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    isDragging.current = true;
    hasDragged.current = false;
    dragStartX.current = e.clientX;
    dragScrollLeft.current = el.scrollLeft;
    pointerId.current = e.pointerId;
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const dx = e.clientX - dragStartX.current;
    if (!hasDragged.current && Math.abs(dx) > 5) {
      hasDragged.current = true;
      if (pointerId.current !== null) {
        el.setPointerCapture(pointerId.current);
      }
      el.style.cursor = "grabbing";
    }
    if (hasDragged.current) {
      e.preventDefault();
      el.scrollLeft = dragScrollLeft.current - dx;
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const el = scrollRef.current;
    if (!el) return;
    if (hasDragged.current && pointerId.current !== null) {
      el.releasePointerCapture(pointerId.current);
    }
    el.style.cursor = "";
    pointerId.current = null;
  }, []);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      resizeObserver.disconnect();
    };
  }, [updateScrollState]);

  const scroll = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "left" ? -200 : 200,
      behavior: "smooth",
    });
  }, []);

  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, []);

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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClickCapture={handleClickCapture}
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
