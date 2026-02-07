"use client";

import { useEffect, useState } from "react";
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
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="min-w-[240px] snap-start sm:min-w-[280px]"
              >
                <Skeleton />
              </div>
            ))
          : games.map((game) => (
              <div
                key={game.id}
                className="min-w-[240px] snap-start sm:min-w-[280px]"
              >
                <GameCard game={game} />
              </div>
            ))}
      </div>
    </section>
  );
}
