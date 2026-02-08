"use client";

import { useEffect, useState } from "react";
import { GameCard } from "@/components/ui/GameCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { ScrollableRow } from "@/components/ui/ScrollableRow";
import type { IGDBGame, IGDBGamesResponse } from "@/types/game";

interface GameSectionProps {
  title: string;
  fetchUrl: string;
  refreshKey?: number;
  onRefresh?: () => void;
}

export function GameSection({ title, fetchUrl, refreshKey, onRefresh }: GameSectionProps) {
  const [games, setGames] = useState<IGDBGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setIsLoading(true);
        setError(null);
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
  }, [fetchUrl, refreshKey]);

  const titleRow = (
    <div className="flex items-center gap-3">
      <h2 className="text-xl font-bold">{title}</h2>
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isLoading}
          aria-label="다시 추천받기"
          className="rounded-xl border border-border px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
        >
          🎲 다시 추천
        </button>
      )}
    </div>
  );

  if (error) {
    return (
      <section className="space-y-4">
        {titleRow}
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {titleRow}
      <ScrollableRow snapScroll preventDragStart dragThreshold={3}>
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
      </ScrollableRow>
    </section>
  );
}
