import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFrom = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

const mockGenres = [
  { id: 12, name: "Role-playing (RPG)" },
  { id: 31, name: "Adventure" },
];

const mockPlatforms = [
  { id: 6, name: "PC (Microsoft Windows)" },
  { id: 48, name: "PlayStation 4" },
];

const mockGameRow = {
  id: 1942,
  name: "The Witcher 3: Wild Hunt",
  slug: "the-witcher-3",
  summary: "An open world RPG",
  storyline: null,
  cover_image_id: "co1wyy",
  rating: 93.5,
  rating_count: 1000,
  aggregated_rating: null,
  total_rating: null,
  first_release_date: "2015-05-19T00:00:00+00:00",
  category: 0,
  status: null,
  hypes: 0,
  genre_ids: [12, 31],
  theme_ids: [],
  mode_ids: [],
  platform_ids: [6, 48],
  perspective_ids: [],
  keyword_ids: [],
  developer_ids: [],
  raw_igdb: null,
  igdb_updated_at: null,
  created_at: "2026-01-01T00:00:00+00:00",
  updated_at: "2026-01-01T00:00:00+00:00",
};

function createChainableMock(finalResult: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  const handler = {
    get(_target: unknown, prop: string): unknown {
      if (prop === "then" || prop === "catch" || prop === "finally") {
        const promise = Promise.resolve(finalResult);
        return (promise as unknown as Record<string, unknown>)[prop];
      }
      if (!(prop in chain)) {
        chain[prop] = vi.fn().mockReturnValue(new Proxy({}, handler));
      }
      return chain[prop];
    },
  };
  return new Proxy({}, handler);
}

function setupFromMock(overrides?: Record<string, unknown>) {
  mockFrom.mockImplementation((table: string) => {
    if (table === "genres") {
      return { select: () => ({ data: mockGenres, error: null }) };
    }
    if (table === "platforms") {
      return { select: () => ({ data: mockPlatforms, error: null }) };
    }
    if (overrides && table in overrides) {
      return overrides[table];
    }
    return createChainableMock({ data: [mockGameRow], error: null });
  });
}

describe("helper functions", () => {
  beforeEach(() => {
    vi.resetModules();
    mockFrom.mockReset();
    setupFromMock();
  });

  it("getGenreMap returns a Map of genre id->name", async () => {
    const { getGenreMap } = await import("@/lib/supabase-games");
    const map = await getGenreMap();
    expect(map.get(12)).toBe("Role-playing (RPG)");
    expect(map.get(31)).toBe("Adventure");
    expect(map.size).toBe(2);
  });

  it("getPlatformMap returns a Map of platform id->name", async () => {
    const { getPlatformMap } = await import("@/lib/supabase-games");
    const map = await getPlatformMap();
    expect(map.get(6)).toBe("PC (Microsoft Windows)");
    expect(map.get(48)).toBe("PlayStation 4");
    expect(map.size).toBe(2);
  });

  it("coverUrl generates correct IGDB cover URL", async () => {
    const { coverUrl } = await import("@/lib/supabase-games");
    const url = coverUrl("co1wyy");
    expect(url).toBe(
      "https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg"
    );
  });

  it("screenshotUrl generates correct IGDB screenshot URL", async () => {
    const { screenshotUrl } = await import("@/lib/supabase-games");
    const url = screenshotUrl("sc1abc");
    expect(url).toBe(
      "https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc1abc.jpg"
    );
  });

  it("toIGDBGame converts a game row to IGDBGame shape", async () => {
    const { toIGDBGame, getGenreMap, getPlatformMap } = await import(
      "@/lib/supabase-games"
    );
    const genreMap = await getGenreMap();
    const platformMap = await getPlatformMap();

    const game = toIGDBGame(mockGameRow, genreMap, platformMap);

    expect(game.id).toBe(1942);
    expect(game.name).toBe("The Witcher 3: Wild Hunt");
    expect(game.summary).toBe("An open world RPG");
    expect(game.cover).toEqual({
      url: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg",
    });
    expect(game.rating).toBe(93.5);
    expect(typeof game.first_release_date).toBe("number");
    expect(game.genres).toEqual([
      { id: 12, name: "Role-playing (RPG)" },
      { id: 31, name: "Adventure" },
    ]);
    expect(game.platforms).toEqual([
      { id: 6, name: "PC (Microsoft Windows)" },
      { id: 48, name: "PlayStation 4" },
    ]);
  });

  it("toIGDBGame handles null fields", async () => {
    const { toIGDBGame, getGenreMap, getPlatformMap } = await import(
      "@/lib/supabase-games"
    );
    const genreMap = await getGenreMap();
    const platformMap = await getPlatformMap();

    const nullRow = {
      ...mockGameRow,
      summary: null,
      cover_image_id: null,
      rating: null,
      first_release_date: null,
      genre_ids: [],
      platform_ids: [],
    };

    const game = toIGDBGame(nullRow, genreMap, platformMap);

    expect(game.summary).toBeUndefined();
    expect(game.cover).toBeUndefined();
    expect(game.rating).toBeUndefined();
    expect(game.first_release_date).toBeUndefined();
    expect(game.genres).toEqual([]);
    expect(game.platforms).toEqual([]);
  });

  it("toIGDBGame includes extras (screenshots, videos, similar games)", async () => {
    const { toIGDBGame, getGenreMap, getPlatformMap } = await import(
      "@/lib/supabase-games"
    );
    const genreMap = await getGenreMap();
    const platformMap = await getPlatformMap();

    const game = toIGDBGame(mockGameRow, genreMap, platformMap, {
      screenshots: [{ image_id: "sc1abc" }],
      videos: [{ video_id: "dQw4w9WgXcQ" }],
      similarGames: [{ id: 100, name: "Similar Game" }],
    });

    expect(game.screenshots).toEqual([
      {
        url: "https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc1abc.jpg",
      },
    ]);
    expect(game.videos).toEqual([{ video_id: "dQw4w9WgXcQ" }]);
    expect(game.similar_games).toEqual([{ id: 100, name: "Similar Game" }]);
  });

  it("toIGDBGame falls back to placeholder names for unknown IDs", async () => {
    const { toIGDBGame, getGenreMap, getPlatformMap } = await import(
      "@/lib/supabase-games"
    );
    const genreMap = await getGenreMap();
    const platformMap = await getPlatformMap();

    const row = { ...mockGameRow, genre_ids: [999], platform_ids: [888] };
    const game = toIGDBGame(row, genreMap, platformMap);

    expect(game.genres).toEqual([{ id: 999, name: "Genre 999" }]);
    expect(game.platforms).toEqual([{ id: 888, name: "Platform 888" }]);
  });
});

describe("query functions", () => {
  beforeEach(() => {
    vi.resetModules();
    mockFrom.mockReset();
  });

  function setupQueryMock(gameRows: unknown[] = [mockGameRow]) {
    const chainMethods = {
      select: vi.fn(),
      gt: vi.fn(),
      not: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      contains: vi.fn(),
      textSearch: vi.fn(),
      ilike: vi.fn(),
      eq: vi.fn(),
      in: vi.fn(),
    };

    const result = { data: gameRows, error: null };

    for (const [, fn] of Object.entries(chainMethods)) {
      fn.mockReturnValue({ ...chainMethods, ...result, then: undefined });
    }

    chainMethods.limit.mockReturnValue(result);
    chainMethods.order.mockReturnValue({ ...chainMethods, ...result });

    mockFrom.mockImplementation((table: string) => {
      if (table === "genres") {
        return { select: () => ({ data: mockGenres, error: null }) };
      }
      if (table === "platforms") {
        return { select: () => ({ data: mockPlatforms, error: null }) };
      }
      return chainMethods;
    });

    return chainMethods;
  }

  it("getPopularRecentGames queries with correct filters", async () => {
    const chain = setupQueryMock();
    const { getPopularRecentGames } = await import("@/lib/supabase-games");

    const games = await getPopularRecentGames(10);

    expect(mockFrom).toHaveBeenCalledWith("games");
    expect(chain.gt).toHaveBeenCalledWith("rating_count", 5);
    expect(chain.not).toHaveBeenCalledWith("cover_image_id", "is", null);
    expect(chain.order).toHaveBeenCalledWith("rating_count", {
      ascending: false,
    });
    expect(chain.limit).toHaveBeenCalledWith(10);
    expect(games).toHaveLength(1);
    expect(games[0].name).toBe("The Witcher 3: Wild Hunt");
  });

  it("getTopRatedGames queries with rating > 80", async () => {
    const chain = setupQueryMock();
    const { getTopRatedGames } = await import("@/lib/supabase-games");

    const games = await getTopRatedGames(5);

    expect(chain.gt).toHaveBeenCalledWith("rating", 80);
    expect(chain.gt).toHaveBeenCalledWith("rating_count", 10);
    expect(chain.order).toHaveBeenCalledWith("rating", { ascending: false });
    expect(chain.limit).toHaveBeenCalledWith(5);
    expect(games).toHaveLength(1);
  });

  it("getGamesByGenre uses contains filter", async () => {
    const chain = setupQueryMock();
    const { getGamesByGenre } = await import("@/lib/supabase-games");

    const games = await getGamesByGenre(12, 15);

    expect(chain.contains).toHaveBeenCalledWith("genre_ids", [12]);
    expect(chain.gt).toHaveBeenCalledWith("rating_count", 3);
    expect(chain.limit).toHaveBeenCalledWith(15);
    expect(games).toHaveLength(1);
  });

  it("getFilteredGames applies genre and platform filters", async () => {
    const chain = setupQueryMock();
    const { getFilteredGames } = await import("@/lib/supabase-games");

    const games = await getFilteredGames([12, 31], [6, 48], 20);

    expect(chain.contains).toHaveBeenCalledWith("genre_ids", [12, 31]);
    expect(chain.contains).toHaveBeenCalledWith("platform_ids", [6, 48]);
    expect(chain.limit).toHaveBeenCalledWith(20);
    expect(games).toHaveLength(1);
  });

  it("getFilteredGames skips empty filter arrays", async () => {
    const chain = setupQueryMock();
    const { getFilteredGames } = await import("@/lib/supabase-games");

    await getFilteredGames([], [], 20);

    expect(chain.contains).not.toHaveBeenCalled();
  });

  it("getRandomCuratedGames shuffles and limits results", async () => {
    const rows = Array.from({ length: 50 }, (_, i) => ({
      ...mockGameRow,
      id: i + 1,
      name: `Game ${i + 1}`,
    }));
    setupQueryMock(rows);
    const { getRandomCuratedGames } = await import("@/lib/supabase-games");

    const games = await getRandomCuratedGames(10);

    expect(games).toHaveLength(10);
  });

  it("getRandomCuratedGames returns empty array when no data", async () => {
    setupQueryMock([]);
    const { getRandomCuratedGames } = await import("@/lib/supabase-games");

    const games = await getRandomCuratedGames(10);

    expect(games).toEqual([]);
  });

  it("searchGames falls back to ilike when textSearch returns empty", async () => {
    let searchCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "genres") {
        return { select: () => ({ data: mockGenres, error: null }) };
      }
      if (table === "platforms") {
        return { select: () => ({ data: mockPlatforms, error: null }) };
      }
      searchCallCount++;
      if (searchCallCount === 1) {
        return {
          select: () => ({
            not: () => ({
              textSearch: () => ({
                order: () => ({
                  limit: () => ({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          not: () => ({
            ilike: () => ({
              order: () => ({
                limit: () => ({
                  data: [mockGameRow],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };
    });

    const { searchGames } = await import("@/lib/supabase-games");

    const games = await searchGames("witcher", 20);

    expect(games).toHaveLength(1);
    expect(games[0].name).toBe("The Witcher 3: Wild Hunt");
  });

  it("searchGames falls back to ilike on textSearch error", async () => {
    let searchCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "genres") {
        return { select: () => ({ data: mockGenres, error: null }) };
      }
      if (table === "platforms") {
        return { select: () => ({ data: mockPlatforms, error: null }) };
      }
      searchCallCount++;
      if (searchCallCount === 1) {
        return {
          select: () => ({
            not: () => ({
              textSearch: () => ({
                order: () => ({
                  limit: () => ({
                    data: null,
                    error: { message: "tsquery parse error" },
                  }),
                }),
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          not: () => ({
            ilike: () => ({
              order: () => ({
                limit: () => ({
                  data: [mockGameRow],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };
    });

    const { searchGames } = await import("@/lib/supabase-games");

    const games = await searchGames("witcher!", 20);

    expect(games).toHaveLength(1);
  });

  it("searchGames returns results from textSearch when found", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "genres") {
        return { select: () => ({ data: mockGenres, error: null }) };
      }
      if (table === "platforms") {
        return { select: () => ({ data: mockPlatforms, error: null }) };
      }
      return {
        select: () => ({
          not: () => ({
            textSearch: () => ({
              order: () => ({
                limit: () => ({
                  data: [mockGameRow],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };
    });

    const { searchGames } = await import("@/lib/supabase-games");

    const games = await searchGames("witcher", 20);

    expect(games).toHaveLength(1);
    expect(games[0].name).toBe("The Witcher 3: Wild Hunt");
  });

  it("getGameDetail returns full game with screenshots, videos, similar", async () => {
    const detailChain = setupQueryMock();
    let callCount = 0;

    mockFrom.mockImplementation((table: string) => {
      if (table === "genres") {
        return { select: () => ({ data: mockGenres, error: null }) };
      }
      if (table === "platforms") {
        return { select: () => ({ data: mockPlatforms, error: null }) };
      }
      if (table === "game_screenshots") {
        return {
          select: () => ({
            eq: () => ({
              data: [{ image_id: "sc1abc" }],
              error: null,
            }),
          }),
        };
      }
      if (table === "game_videos") {
        return {
          select: () => ({
            eq: () => ({
              data: [{ video_id: "dQw4w9WgXcQ" }],
              error: null,
            }),
          }),
        };
      }
      if (table === "game_similar") {
        return {
          select: () => ({
            eq: () => ({
              data: [{ similar_game_id: 100 }],
              error: null,
            }),
          }),
        };
      }
      if (table === "games") {
        callCount++;
        if (callCount === 1) {
          return {
            select: () => ({
              eq: () => ({
                limit: () => ({
                  data: [mockGameRow],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: () => ({
            in: () => ({
              not: () => ({
                limit: () => ({
                  data: [
                    {
                      ...mockGameRow,
                      id: 100,
                      name: "Similar Game",
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      return detailChain;
    });

    const { getGameDetail } = await import("@/lib/supabase-games");

    const game = await getGameDetail(1942);

    expect(game).not.toBeNull();
    expect(game!.id).toBe(1942);
    expect(game!.screenshots).toEqual([
      {
        url: "https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc1abc.jpg",
      },
    ]);
    expect(game!.videos).toEqual([{ video_id: "dQw4w9WgXcQ" }]);
    expect(game!.similar_games).toHaveLength(1);
    expect(game!.similar_games![0].name).toBe("Similar Game");
  });

  it("getGameDetail returns null when game not found", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "genres") {
        return { select: () => ({ data: mockGenres, error: null }) };
      }
      if (table === "platforms") {
        return { select: () => ({ data: mockPlatforms, error: null }) };
      }
      if (table === "games") {
        return {
          select: () => ({
            eq: () => ({
              limit: () => ({
                data: [],
                error: null,
              }),
            }),
          }),
        };
      }
      return createChainableMock({ data: [], error: null });
    });

    const { getGameDetail } = await import("@/lib/supabase-games");

    const game = await getGameDetail(99999);

    expect(game).toBeNull();
  });

  it("getGameDetail returns null on query error", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "genres") {
        return { select: () => ({ data: mockGenres, error: null }) };
      }
      if (table === "platforms") {
        return { select: () => ({ data: mockPlatforms, error: null }) };
      }
      if (table === "games") {
        return {
          select: () => ({
            eq: () => ({
              limit: () => ({
                data: null,
                error: { message: "db error" },
              }),
            }),
          }),
        };
      }
      return createChainableMock({ data: null, error: { message: "error" } });
    });

    const { getGameDetail } = await import("@/lib/supabase-games");

    const game = await getGameDetail(1942);

    expect(game).toBeNull();
  });

  it("getGameDetail handles empty similar games", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "genres") {
        return { select: () => ({ data: mockGenres, error: null }) };
      }
      if (table === "platforms") {
        return { select: () => ({ data: mockPlatforms, error: null }) };
      }
      if (table === "game_screenshots") {
        return {
          select: () => ({
            eq: () => ({ data: [], error: null }),
          }),
        };
      }
      if (table === "game_videos") {
        return {
          select: () => ({
            eq: () => ({ data: [], error: null }),
          }),
        };
      }
      if (table === "game_similar") {
        return {
          select: () => ({
            eq: () => ({ data: [], error: null }),
          }),
        };
      }
      if (table === "games") {
        return {
          select: () => ({
            eq: () => ({
              limit: () => ({
                data: [mockGameRow],
                error: null,
              }),
            }),
          }),
        };
      }
      return createChainableMock({ data: [], error: null });
    });

    const { getGameDetail } = await import("@/lib/supabase-games");

    const game = await getGameDetail(1942);

    expect(game).not.toBeNull();
    expect(game!.screenshots).toEqual([]);
    expect(game!.videos).toEqual([]);
    expect(game!.similar_games).toBeUndefined();
  });

  it("throws on query error in list functions", async () => {
    const errorResult = {
      data: null,
      error: { message: "connection refused" },
    };
    const errorChain = {
      select: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnValue(errorResult),
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === "genres") {
        return { select: () => ({ data: mockGenres, error: null }) };
      }
      if (table === "platforms") {
        return { select: () => ({ data: mockPlatforms, error: null }) };
      }
      return errorChain;
    });

    const { getPopularRecentGames } = await import("@/lib/supabase-games");

    await expect(getPopularRecentGames(10)).rejects.toThrow(
      "Supabase query failed: connection refused"
    );
  });
});
