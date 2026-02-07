"use client";

import { useEffect, useState, useCallback } from "react";
import { GameCard } from "@/components/ui/GameCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { GENRES, TAGS } from "@/lib/constants";
import type { SteamGame } from "@/types/game";

interface ResultStepProps {
  selectedGenres: string[];
  selectedTags: string[];
  onStartOver: () => void;
}

export function ResultStep({
  selectedGenres,
  selectedTags,
  onStartOver,
}: ResultStepProps) {
  const [games, setGames] = useState<SteamGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const genreTagIds = selectedGenres
      .map((slug) => GENRES.find((genre) => genre.slug === slug)?.tagId)
      .filter((tagId): tagId is number => tagId !== undefined);
    const tagTagIds = selectedTags
      .map((slug) => TAGS.find((tag) => tag.slug === slug)?.tagId)
      .filter((tagId): tagId is number => tagId !== undefined);
    const allTagIds = [...genreTagIds, ...tagTagIds];

    const params = new URLSearchParams();
    if (allTagIds.length > 0) {
      params.set("tags", allTagIds.join(","));
    }

    try {
      const res = await fetch(`/api/games?${params.toString()}`);
      if (!res.ok) throw new Error("API request failed");
      const data = await res.json();
      setGames(data.games);
    } catch {
      setError("게임 데이터를 가져올 수 없습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedGenres, selectedTags]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-bold">추천 게임</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          이런 게임은 어떠세요?
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button className="mt-4" onClick={fetchGames}>
            다시 시도
          </Button>
        </div>
      )}

      {!isLoading && !error && games.length === 0 && (
        <div className="rounded-xl border border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            조건에 맞는 게임을 찾지 못했습니다.
            <br />
            다른 조건으로 다시 시도해보세요!
          </p>
        </div>
      )}

      {!isLoading && !error && games.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {games.map((game) => (
            <GameCard key={game.appid} game={game} />
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onStartOver}>
          처음부터
        </Button>
        <Button onClick={fetchGames} disabled={isLoading}>
          🎲 다시 추천
        </Button>
      </div>
    </div>
  );
}
