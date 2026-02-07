"use client";

import { useEffect, useState } from "react";
import { GameCard } from "@/components/ui/GameCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { useHorizontalScroll } from "@/hooks/useHorizontalScroll";
import type { IGDBGame, IGDBGamesResponse } from "@/types/game";

interface GameSectionProps {
  title: string;
  fetchUrl: string;
}

export function GameSection({ title, fetchUrl }: GameSectionProps) {
  const [games, setGames] = useState<IGDBGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { scrollRef, canScrollLeft, canScrollRight, scroll, handlers } =
    useHorizontalScroll({
      snapScroll: true,
      preventDragStart: true,
      dragThreshold: 3,
    });

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
          {...handlers}
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
