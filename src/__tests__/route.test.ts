import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { IGDBGame } from "@/types/game";

vi.mock("@/lib/igdb", () => ({
  getPopularRecentGames: vi.fn(),
  getTopRatedGames: vi.fn(),
  getGamesByGenre: vi.fn(),
  getFilteredGames: vi.fn(),
  getRandomCuratedGames: vi.fn(),
  getGameDetail: vi.fn(),
  searchGames: vi.fn(),
}));

import {
  getPopularRecentGames,
  getTopRatedGames,
  getGamesByGenre,
  getFilteredGames,
  getRandomCuratedGames,
  getGameDetail,
  searchGames,
} from "@/lib/igdb";

const mockGame: IGDBGame = {
  id: 1942,
  name: "The Witcher 3: Wild Hunt",
  summary: "An open world RPG",
  cover: { url: "//images.igdb.com/igdb/image/upload/t_thumb/abc.jpg" },
  genres: [{ id: 12, name: "RPG" }],
  platforms: [{ id: 6, name: "PC (Microsoft Windows)" }],
  first_release_date: 1431993600,
  rating: 93.5,
};

describe("GET /api/games", () => {
  beforeEach(() => {
    vi.mocked(getPopularRecentGames).mockReset();
    vi.mocked(getTopRatedGames).mockReset();
    vi.mocked(getGamesByGenre).mockReset();
    vi.mocked(getFilteredGames).mockReset();
    vi.mocked(getRandomCuratedGames).mockReset();
  });

  async function callGamesRoute(params: string = "") {
    const { GET } = await import("@/app/api/games/route");
    const request = new NextRequest(
      new URL(`http://localhost/api/games${params ? `?${params}` : ""}`)
    );
    return GET(request);
  }

  it("returns popular games by default", async () => {
    vi.mocked(getPopularRecentGames).mockResolvedValue([mockGame]);

    const response = await callGamesRoute();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.games).toEqual([mockGame]);
    expect(getPopularRecentGames).toHaveBeenCalledWith(20);
  });

  it("returns popular games with section=popular", async () => {
    vi.mocked(getPopularRecentGames).mockResolvedValue([mockGame]);

    const response = await callGamesRoute("section=popular");
    const data = await response.json();

    expect(data.games).toEqual([mockGame]);
    expect(getPopularRecentGames).toHaveBeenCalledWith(20);
  });

  it("returns top-rated games with section=top-rated", async () => {
    vi.mocked(getTopRatedGames).mockResolvedValue([mockGame]);

    const response = await callGamesRoute("section=top-rated");
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.games).toEqual([mockGame]);
    expect(getTopRatedGames).toHaveBeenCalledWith(20);
  });

  it("returns genre-filtered games with section=genre and genreId", async () => {
    vi.mocked(getGamesByGenre).mockResolvedValue([mockGame]);

    const response = await callGamesRoute("section=genre&genreId=12");
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.games).toEqual([mockGame]);
    expect(getGamesByGenre).toHaveBeenCalledWith(12, 20);
  });

  it("returns 400 when section=genre without genreId", async () => {
    const response = await callGamesRoute("section=genre");
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("returns filtered games with section=filter and genres/platforms", async () => {
    vi.mocked(getFilteredGames).mockResolvedValue([mockGame]);

    const response = await callGamesRoute("section=filter&genres=12,31&platforms=6,48");
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.games).toEqual([mockGame]);
    expect(getFilteredGames).toHaveBeenCalledWith([12, 31], [6, 48], 20);
  });

  it("passes empty arrays when filter has no genres/platforms", async () => {
    vi.mocked(getFilteredGames).mockResolvedValue([]);

    const response = await callGamesRoute("section=filter");
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.games).toEqual([]);
    expect(getFilteredGames).toHaveBeenCalledWith([], [], 20);
  });

  it("returns random curated games with section=random", async () => {
    vi.mocked(getRandomCuratedGames).mockResolvedValue([mockGame]);

    const response = await callGamesRoute("section=random");
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.games).toEqual([mockGame]);
    expect(getRandomCuratedGames).toHaveBeenCalledWith(20);
  });

  it("respects custom limit parameter", async () => {
    vi.mocked(getPopularRecentGames).mockResolvedValue([]);

    await callGamesRoute("section=popular&limit=5");

    expect(getPopularRecentGames).toHaveBeenCalledWith(5);
  });

  it("returns 500 on internal error", async () => {
    vi.mocked(getPopularRecentGames).mockRejectedValue(new Error("API down"));

    const response = await callGamesRoute("section=popular");
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });
});

describe("GET /api/games/[id]", () => {
  beforeEach(() => {
    vi.mocked(getGameDetail).mockReset();
  });

  async function callGameDetailRoute(id: string) {
    const { GET } = await import("@/app/api/games/[id]/route");
    const request = new NextRequest(
      new URL(`http://localhost/api/games/${id}`)
    );
    return GET(request, { params: Promise.resolve({ id }) });
  }

  it("returns game detail for valid ID", async () => {
    vi.mocked(getGameDetail).mockResolvedValue(mockGame);

    const response = await callGameDetailRoute("1942");
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.game).toEqual(mockGame);
    expect(getGameDetail).toHaveBeenCalledWith(1942);
  });

  it("returns 400 for non-numeric ID", async () => {
    const response = await callGameDetailRoute("abc");
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("returns 404 when game not found", async () => {
    vi.mocked(getGameDetail).mockResolvedValue(null);

    const response = await callGameDetailRoute("99999");
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBeDefined();
  });

  it("returns 500 on internal error", async () => {
    vi.mocked(getGameDetail).mockRejectedValue(new Error("IGDB error"));

    const response = await callGameDetailRoute("1942");
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });
});

describe("GET /api/games/search", () => {
  beforeEach(() => {
    vi.mocked(searchGames).mockReset();
  });

  async function callSearchRoute(params: string = "") {
    const { GET } = await import("@/app/api/games/search/route");
    const request = new NextRequest(
      new URL(`http://localhost/api/games/search${params ? `?${params}` : ""}`)
    );
    return GET(request);
  }

  it("returns search results for valid query", async () => {
    vi.mocked(searchGames).mockResolvedValue([mockGame]);

    const response = await callSearchRoute("q=witcher");
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.games).toEqual([mockGame]);
    expect(searchGames).toHaveBeenCalledWith("witcher");
  });

  it("returns 400 when query is missing", async () => {
    const response = await callSearchRoute();
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("returns 400 when query is empty string", async () => {
    const response = await callSearchRoute("q=");
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("returns 400 when query is whitespace only", async () => {
    const response = await callSearchRoute("q=%20%20%20");
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("trims query before searching", async () => {
    vi.mocked(searchGames).mockResolvedValue([]);

    await callSearchRoute("q=%20zelda%20");

    expect(searchGames).toHaveBeenCalledWith("zelda");
  });

  it("returns 500 on internal error", async () => {
    vi.mocked(searchGames).mockRejectedValue(new Error("Search failed"));

    const response = await callSearchRoute("q=test");
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });
});
