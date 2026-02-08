import { describe, it, expect, vi, beforeEach } from "vitest";
import type { IGDBGame } from "@/types/game";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const mockGame: IGDBGame = {
  id: 1942,
  name: "The Witcher 3: Wild Hunt",
  summary: "An open world RPG",
  cover: { url: "//images.igdb.com/igdb/image/upload/t_thumb/abc.jpg" },
  genres: [{ id: 12, name: "RPG" }],
  platforms: [{ id: 6, name: "PC (Microsoft Windows)" }],
  first_release_date: 1431993600,
  rating: 93.5,
  screenshots: [{ url: "//images.igdb.com/igdb/image/upload/t_thumb/ss1.jpg" }],
  videos: [{ video_id: "c0i88t0Kacs" }],
  similar_games: [
    {
      id: 2000,
      name: "Elden Ring",
      cover: { url: "//images.igdb.com/igdb/image/upload/t_thumb/er.jpg" },
      rating: 92,
    },
  ],
};

function createTokenResponse(token: string = "test_access_token", expiresIn: number = 5000) {
  return {
    ok: true,
    json: () => Promise.resolve({ access_token: token, expires_in: expiresIn }),
  };
}

function createIGDBResponse(games: IGDBGame[]) {
  return {
    ok: true,
    json: () => Promise.resolve(games),
  };
}

describe("igdb client", () => {
  beforeEach(() => {
    vi.stubEnv("TWITCH_CLIENT_ID", "test_client_id");
    vi.stubEnv("TWITCH_CLIENT_SECRET", "test_client_secret");
    mockFetch.mockReset();
    vi.resetModules();
  });

  describe("getAccessToken", () => {
    it("fetches a new token from Twitch OAuth", async () => {
      mockFetch.mockResolvedValueOnce(createTokenResponse());
      const { getAccessToken } = await import("@/lib/igdb");

      const token = await getAccessToken();

      expect(token).toBe("test_access_token");
      expect(mockFetch).toHaveBeenCalledOnce();
      expect(mockFetch.mock.calls[0][0]).toContain("id.twitch.tv/oauth2/token");
      expect(mockFetch.mock.calls[0][1]).toEqual({ method: "POST" });
    });

    it("returns cached token on subsequent calls", async () => {
      mockFetch.mockResolvedValueOnce(createTokenResponse("cached_token", 9999));
      const { getAccessToken } = await import("@/lib/igdb");

      const first = await getAccessToken();
      const second = await getAccessToken();

      expect(first).toBe("cached_token");
      expect(second).toBe("cached_token");
      expect(mockFetch).toHaveBeenCalledOnce();
    });

    it("throws when env vars are missing", async () => {
      vi.stubEnv("TWITCH_CLIENT_ID", "");
      vi.stubEnv("TWITCH_CLIENT_SECRET", "");
      const { getAccessToken } = await import("@/lib/igdb");

      await expect(getAccessToken()).rejects.toThrow(
        "TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are required"
      );
    });

    it("throws when Twitch returns non-ok response", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });
      const { getAccessToken } = await import("@/lib/igdb");

      await expect(getAccessToken()).rejects.toThrow("Twitch token request failed: 401");
    });

    it("includes client_id and client_secret in request params", async () => {
      mockFetch.mockResolvedValueOnce(createTokenResponse());
      const { getAccessToken } = await import("@/lib/igdb");

      await getAccessToken();

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("client_id=test_client_id");
      expect(url).toContain("client_secret=test_client_secret");
      expect(url).toContain("grant_type=client_credentials");
    });
  });

  describe("queryIGDB", () => {
    it("sends POST request with correct headers and body", async () => {
      mockFetch
        .mockResolvedValueOnce(createTokenResponse())
        .mockResolvedValueOnce(createIGDBResponse([mockGame]));
      const { queryIGDB } = await import("@/lib/igdb");

      const result = await queryIGDB<IGDBGame>("games", "fields name; limit 10;");

      expect(result).toEqual([mockGame]);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      const [igdbUrl, igdbOptions] = mockFetch.mock.calls[1];
      expect(igdbUrl).toBe("https://api.igdb.com/v4/games");
      expect(igdbOptions.method).toBe("POST");
      expect(igdbOptions.headers["Client-ID"]).toBe("test_client_id");
      expect(igdbOptions.headers.Authorization).toBe("Bearer test_access_token");
      expect(igdbOptions.headers["Content-Type"]).toBe("text/plain");
      expect(igdbOptions.body).toBe("fields name; limit 10;");
    });

    it("throws when IGDB returns non-ok response", async () => {
      mockFetch
        .mockResolvedValueOnce(createTokenResponse())
        .mockResolvedValueOnce({ ok: false, status: 500 });
      const { queryIGDB } = await import("@/lib/igdb");

      await expect(queryIGDB("games", "fields name;")).rejects.toThrow(
        "IGDB API error: 500"
      );
    });

    it("retries with new token on 401 response", async () => {
      mockFetch
        .mockResolvedValueOnce(createTokenResponse("stale_token"))
        .mockResolvedValueOnce({ ok: false, status: 401 })
        .mockResolvedValueOnce(createTokenResponse("fresh_token"))
        .mockResolvedValueOnce(createIGDBResponse([mockGame]));
      const { queryIGDB } = await import("@/lib/igdb");

      const result = await queryIGDB<IGDBGame>("games", "fields name;");

      expect(result).toEqual([mockGame]);
      expect(mockFetch).toHaveBeenCalledTimes(4);
      const retryHeaders = mockFetch.mock.calls[3][1].headers;
      expect(retryHeaders.Authorization).toBe("Bearer fresh_token");
    });

    it("throws when retry after 401 also fails", async () => {
      mockFetch
        .mockResolvedValueOnce(createTokenResponse("stale_token"))
        .mockResolvedValueOnce({ ok: false, status: 401 })
        .mockResolvedValueOnce(createTokenResponse("another_token"))
        .mockResolvedValueOnce({ ok: false, status: 403 });
      const { queryIGDB } = await import("@/lib/igdb");

      await expect(queryIGDB("games", "fields name;")).rejects.toThrow(
        "IGDB API error: 403"
      );
    });

    it("invalidates token cache on 401", async () => {
      mockFetch
        .mockResolvedValueOnce(createTokenResponse("old_token"))
        .mockResolvedValueOnce({ ok: false, status: 401 })
        .mockResolvedValueOnce(createTokenResponse("new_token"))
        .mockResolvedValueOnce(createIGDBResponse([]));
      const { queryIGDB, getAccessToken } = await import("@/lib/igdb");

      await queryIGDB("games", "fields name;");
      const tokenAfterRetry = await getAccessToken();

      expect(tokenAfterRetry).toBe("new_token");
    });
  });

  describe("getPopularRecentGames", () => {
    it("returns games sorted by rating_count", async () => {
      mockFetch
        .mockResolvedValueOnce(createTokenResponse())
        .mockResolvedValueOnce(createIGDBResponse([mockGame]));
      const { getPopularRecentGames } = await import("@/lib/igdb");

      const games = await getPopularRecentGames();

      expect(games).toEqual([mockGame]);
      const body = mockFetch.mock.calls[1][1].body as string;
      expect(body).toContain("sort rating_count desc");
      expect(body).toContain("limit 20");
      expect(body).toContain("cover != null");
    });

    it("accepts a custom limit", async () => {
      mockFetch
        .mockResolvedValueOnce(createTokenResponse())
        .mockResolvedValueOnce(createIGDBResponse([]));
      const { getPopularRecentGames } = await import("@/lib/igdb");

      await getPopularRecentGames(5);

      const body = mockFetch.mock.calls[1][1].body as string;
      expect(body).toContain("limit 5");
    });
  });

  describe("getTopRatedGames", () => {
    it("returns games sorted by rating desc", async () => {
      mockFetch
        .mockResolvedValueOnce(createTokenResponse())
        .mockResolvedValueOnce(createIGDBResponse([mockGame]));
      const { getTopRatedGames } = await import("@/lib/igdb");

      const games = await getTopRatedGames();

      expect(games).toEqual([mockGame]);
      const body = mockFetch.mock.calls[1][1].body as string;
      expect(body).toContain("sort rating desc");
      expect(body).toContain("rating > 80");
      expect(body).toContain("limit 20");
    });

    it("accepts a custom limit", async () => {
      mockFetch
        .mockResolvedValueOnce(createTokenResponse())
        .mockResolvedValueOnce(createIGDBResponse([]));
      const { getTopRatedGames } = await import("@/lib/igdb");

      await getTopRatedGames(10);

      const body = mockFetch.mock.calls[1][1].body as string;
      expect(body).toContain("limit 10");
    });
  });

  describe("getGamesByGenre", () => {
    it("filters by genre ID", async () => {
      mockFetch
        .mockResolvedValueOnce(createTokenResponse())
        .mockResolvedValueOnce(createIGDBResponse([mockGame]));
      const { getGamesByGenre } = await import("@/lib/igdb");

      const games = await getGamesByGenre(12);

      expect(games).toEqual([mockGame]);
      const body = mockFetch.mock.calls[1][1].body as string;
      expect(body).toContain("genres = (12)");
      expect(body).toContain("sort rating desc");
    });

    it("accepts a custom limit", async () => {
      mockFetch
        .mockResolvedValueOnce(createTokenResponse())
        .mockResolvedValueOnce(createIGDBResponse([]));
      const { getGamesByGenre } = await import("@/lib/igdb");

      await getGamesByGenre(5, 15);

      const body = mockFetch.mock.calls[1][1].body as string;
      expect(body).toContain("genres = (5)");
      expect(body).toContain("limit 15");
    });
  });

  describe("getGameDetail", () => {
    it("returns a single game by ID", async () => {
      mockFetch
        .mockResolvedValueOnce(createTokenResponse())
        .mockResolvedValueOnce(createIGDBResponse([mockGame]));
      const { getGameDetail } = await import("@/lib/igdb");

      const game = await getGameDetail(1942);

      expect(game).toEqual(mockGame);
      const body = mockFetch.mock.calls[1][1].body as string;
      expect(body).toContain("where id = 1942");
      expect(body).toContain("limit 1");
    });

    it("returns null when no game found", async () => {
      mockFetch
        .mockResolvedValueOnce(createTokenResponse())
        .mockResolvedValueOnce(createIGDBResponse([]));
      const { getGameDetail } = await import("@/lib/igdb");

      const game = await getGameDetail(99999);

      expect(game).toBeNull();
    });
  });

  describe("getFilteredGames", () => {
    it("filters by genre and platform IDs", async () => {
      mockFetch
        .mockResolvedValueOnce(createTokenResponse())
        .mockResolvedValueOnce(createIGDBResponse([mockGame]));
      const { getFilteredGames } = await import("@/lib/igdb");

      const games = await getFilteredGames([12, 31], [6, 48]);

      expect(games).toEqual([mockGame]);
      const body = mockFetch.mock.calls[1][1].body as string;
      expect(body).toContain("genres = (12,31)");
      expect(body).toContain("platforms = (6,48)");
      expect(body).toContain("sort rating desc");
    });

    it("omits genre filter when genreIds is empty", async () => {
      mockFetch
        .mockResolvedValueOnce(createTokenResponse())
        .mockResolvedValueOnce(createIGDBResponse([]));
      const { getFilteredGames } = await import("@/lib/igdb");

      await getFilteredGames([], [6]);

      const body = mockFetch.mock.calls[1][1].body as string;
      expect(body).not.toContain("genres =");
      expect(body).toContain("platforms = (6)");
    });

    it("omits platform filter when platformIds is empty", async () => {
      mockFetch
        .mockResolvedValueOnce(createTokenResponse())
        .mockResolvedValueOnce(createIGDBResponse([]));
      const { getFilteredGames } = await import("@/lib/igdb");

      await getFilteredGames([12], []);

      const body = mockFetch.mock.calls[1][1].body as string;
      expect(body).toContain("genres = (12)");
      expect(body).not.toContain("platforms =");
    });

    it("includes base conditions even with no filters", async () => {
      mockFetch
        .mockResolvedValueOnce(createTokenResponse())
        .mockResolvedValueOnce(createIGDBResponse([]));
      const { getFilteredGames } = await import("@/lib/igdb");

      await getFilteredGames([], []);

      const body = mockFetch.mock.calls[1][1].body as string;
      expect(body).toContain("cover != null");
      expect(body).toContain("rating_count > 1");
    });

    it("accepts a custom limit", async () => {
      mockFetch
        .mockResolvedValueOnce(createTokenResponse())
        .mockResolvedValueOnce(createIGDBResponse([]));
      const { getFilteredGames } = await import("@/lib/igdb");

      await getFilteredGames([12], [6], 10);

      const body = mockFetch.mock.calls[1][1].body as string;
      expect(body).toContain("limit 10");
    });
  });

  describe("getRandomCuratedGames", () => {
    it("returns shuffled games with random offset", async () => {
      mockFetch
        .mockResolvedValueOnce(createTokenResponse())
        .mockResolvedValueOnce(createIGDBResponse([mockGame]));
      const { getRandomCuratedGames } = await import("@/lib/igdb");

      const games = await getRandomCuratedGames();

      expect(games).toEqual([mockGame]);
      const body = mockFetch.mock.calls[1][1].body as string;
      expect(body).toContain("rating > 70");
      expect(body).toContain("rating_count > 5");
      expect(body).toContain("cover != null");
      expect(body).toContain("limit 20");
      expect(body).toMatch(/offset \d+/);
    });

    it("accepts a custom limit", async () => {
      mockFetch
        .mockResolvedValueOnce(createTokenResponse())
        .mockResolvedValueOnce(createIGDBResponse([]));
      const { getRandomCuratedGames } = await import("@/lib/igdb");

      await getRandomCuratedGames(10);

      const body = mockFetch.mock.calls[1][1].body as string;
      expect(body).toContain("limit 10");
    });

    it("returns all fetched games (shuffled order may differ)", async () => {
      const games = [
        { ...mockGame, id: 1 },
        { ...mockGame, id: 2 },
        { ...mockGame, id: 3 },
      ];
      mockFetch
        .mockResolvedValueOnce(createTokenResponse())
        .mockResolvedValueOnce(createIGDBResponse(games));
      const { getRandomCuratedGames } = await import("@/lib/igdb");

      const result = await getRandomCuratedGames();

      expect(result).toHaveLength(3);
      const ids = result.map((g: IGDBGame) => g.id).sort();
      expect(ids).toEqual([1, 2, 3]);
    });
  });

  describe("searchGames", () => {
    it("searches with query string", async () => {
      mockFetch
        .mockResolvedValueOnce(createTokenResponse())
        .mockResolvedValueOnce(createIGDBResponse([mockGame]));
      const { searchGames } = await import("@/lib/igdb");

      const games = await searchGames("witcher");

      expect(games).toEqual([mockGame]);
      const body = mockFetch.mock.calls[1][1].body as string;
      expect(body).toContain('search "witcher"');
      expect(body).toContain("cover != null");
      expect(body).toContain("limit 20");
    });

    it("escapes double quotes in query", async () => {
      mockFetch
        .mockResolvedValueOnce(createTokenResponse())
        .mockResolvedValueOnce(createIGDBResponse([]));
      const { searchGames } = await import("@/lib/igdb");

      await searchGames('test "game"');

      const body = mockFetch.mock.calls[1][1].body as string;
      expect(body).toContain('search "test \\"game\\""');
    });

    it("accepts a custom limit", async () => {
      mockFetch
        .mockResolvedValueOnce(createTokenResponse())
        .mockResolvedValueOnce(createIGDBResponse([]));
      const { searchGames } = await import("@/lib/igdb");

      await searchGames("zelda", 5);

      const body = mockFetch.mock.calls[1][1].body as string;
      expect(body).toContain("limit 5");
    });
  });
});
