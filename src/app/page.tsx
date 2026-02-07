"use client";

import { useState, useEffect, useCallback } from "react";
import { SearchBar } from "@/components/ui/SearchBar";
import { FilterBar } from "@/components/ui/FilterBar";
import { GameSection } from "@/components/sections/GameSection";
import { GameGrid } from "@/components/sections/GameGrid";
import type { IGDBGame, IGDBGamesResponse } from "@/types/game";

export default function Home() {
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // State for filtered/search results
  const [filteredGames, setFilteredGames] = useState<IGDBGame[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const hasActiveFilters = selectedGenres.length > 0 || selectedPlatforms.length > 0;
  const isSearching = searchQuery.length > 0;

  const handleToggleGenre = useCallback((id: number) => {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  }, []);

  const handleTogglePlatform = useCallback((id: number) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query) {
      setSelectedGenres([]);
      setSelectedPlatforms([]);
    }
  }, []);

  // Effect to fetch filtered results
  useEffect(() => {
    if (!hasActiveFilters && !isSearching) {
      setFilteredGames([]);
      setIsFiltering(false);
      return;
    }

    const fetchFilteredGames = async () => {
      setIsLoading(true);
      setIsFiltering(true);
      try {
        let url = "/api/games?";
        const params = new URLSearchParams();

        if (isSearching) {
          url = `/api/games/search?q=${encodeURIComponent(searchQuery)}`;
        } else {
          url = "/api/games?section=filter";
          if (selectedGenres.length > 0) {
            params.append("genres", selectedGenres.join(","));
          }
          if (selectedPlatforms.length > 0) {
            params.append("platforms", selectedPlatforms.join(","));
          }
          url += "&" + params.toString();
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch");
        const data: IGDBGamesResponse = await res.json();
        setFilteredGames(data.games);
      } catch (error) {
        console.error("Error fetching games:", error);
        setFilteredGames([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search if needed, but here we trigger on effect change.
    // For search query, it's updated via onSearch (Enter key), so no debounce needed here.
    // For filters, they update immediately.
    fetchFilteredGames();
  }, [selectedGenres, selectedPlatforms, searchQuery, hasActiveFilters, isSearching]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-10 pb-20">
      <header className="space-y-6">
        <h1 className="text-3xl font-bold">🎮 게임 디스커버리</h1>
        <SearchBar onSearch={handleSearch} />
      </header>

      <FilterBar
        selectedGenres={selectedGenres}
        selectedPlatforms={selectedPlatforms}
        onToggleGenre={handleToggleGenre}
        onTogglePlatform={handleTogglePlatform}
      />

      {isFiltering || isSearching ? (
        <section className="space-y-4">
          <h2 className="text-xl font-bold">
            {isSearching ? `"${searchQuery}" 검색 결과` : "필터링된 결과"}
          </h2>
          <GameGrid games={filteredGames} isLoading={isLoading} />
        </section>
      ) : (
        <div className="space-y-12">
          <GameSection
            title="지금 뜨는 게임"
            fetchUrl="/api/games?section=popular"
          />
          <GameSection
            title="높은 평점 신작"
            fetchUrl="/api/games?section=top-rated"
          />
          <GameSection
            title="RPG"
            fetchUrl="/api/games?section=genre&genreId=12"
          />
          <GameSection
            title="어드벤처"
            fetchUrl="/api/games?section=genre&genreId=31"
          />
          <GameSection
            title="슈팅"
            fetchUrl="/api/games?section=genre&genreId=5"
          />
        </div>
      )}
    </main>
  );
}
