"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { GameCard } from "@/components/ui/GameCard";
import { Skeleton } from "@/components/ui/Skeleton";
import type { IGDBGame, IGDBGamesResponse } from "@/types/game";

interface GameSectionProps {
  title: string;
  fetchUrl: string;
}

export function GameSection({ title, fetchUrl }: GameSectionProps) {
  const [games, setGames] = useState<IGDBGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(fetchUrl);
        if (!res.ok) throw new Error("Failed to fetch");
        const data: IGDBGamesResponse = await res.json();
        setGames(data.games);
      } catch {
        setError("게임을 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGames();
  }, [fetchUrl]);

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
  }, [isLoading, games, updateScrollState]);

  const scroll = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  }, []);

  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const hasDragged = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    isDragging.current = true;
    hasDragged.current = false;
    dragStartX.current = e.clientX;
    dragScrollLeft.current = el.scrollLeft;
    el.setPointerCapture(e.pointerId);
    el.style.scrollSnapType = "none";
    el.style.scrollBehavior = "auto";
    el.style.cursor = "grabbing";
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const el = scrollRef.current;
    if (!el) return;
    const dx = e.clientX - dragStartX.current;
    if (Math.abs(dx) > 3) hasDragged.current = true;
    el.scrollLeft = dragScrollLeft.current - dx;
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const el = scrollRef.current;
    if (!el) return;
    el.releasePointerCapture(e.pointerId);
    el.style.scrollSnapType = "";
    el.style.scrollBehavior = "";
    el.style.cursor = "";
  }, []);

  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  if (error) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="group/scroll relative">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            className="absolute -left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-lg border border-border opacity-0 transition-opacity group-hover/scroll:opacity-100 hover:bg-muted"
            aria-label="왼쪽으로 스크롤"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll("right")}
            className="absolute -right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-lg border border-border opacity-0 transition-opacity group-hover/scroll:opacity-100 hover:bg-muted"
            aria-label="오른쪽으로 스크롤"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          onDragStart={handleDragStart}
          className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide scroll-smooth cursor-grab select-none"
        >
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[200px] shrink-0 snap-start sm:w-[240px]"
                >
                  <Skeleton />
                </div>
              ))
            : games.map((game) => (
                <div
                  key={game.id}
                  className="w-[200px] shrink-0 snap-start self-stretch sm:w-[240px]"
                >
                  <GameCard game={game} />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
