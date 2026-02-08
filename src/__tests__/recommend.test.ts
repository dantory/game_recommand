import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockRpc = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

vi.mock("@/lib/supabase-games", async () => {
  return vi.importActual<typeof import("@/lib/supabase-games")>("@/lib/supabase-games");
});

const mockRpcResult = [
  {
    id: 100,
    name: "Similar RPG",
    slug: "similar-rpg",
    summary: "A similar RPG game",
    cover_image_id: "co1abc",
    rating: 88.5,
    rating_count: 500,
    first_release_date: "2023-06-15T00:00:00+00:00",
    genre_ids: [12, 31],
    theme_ids: [1],
    platform_ids: [6, 48],
    similarity_score: 0.75,
  },
  {
    id: 200,
    name: "Another Game",
    slug: "another-game",
    summary: null,
    cover_image_id: null,
    rating: null,
    rating_count: null,
    first_release_date: null,
    genre_ids: null,
    theme_ids: null,
    platform_ids: null,
    similarity_score: 0.4,
  },
];

const mockGenres = [
  { id: 12, name: "Role-playing (RPG)" },
  { id: 31, name: "Adventure" },
];

const mockPlatforms = [
  { id: 6, name: "PC (Microsoft Windows)" },
  { id: 48, name: "PlayStation 4" },
];

function setupFromMock() {
  mockFrom.mockImplementation((table: string) => {
    if (table === "genres") {
      return { select: () => ({ data: mockGenres, error: null }) };
    }
    if (table === "platforms") {
      return { select: () => ({ data: mockPlatforms, error: null }) };
    }
    return { select: mockSelect };
  });
}

describe("getRecommendations", () => {
  beforeEach(() => {
    vi.resetModules();
    mockRpc.mockReset();
    mockFrom.mockReset();
    mockSelect.mockReset();
    setupFromMock();
  });

  async function loadGetRecommendations() {
    const mod = await import("@/lib/recommend");
    return mod.getRecommendations;
  }

  it("returns formatted recommendations with genre/platform names", async () => {
    mockRpc.mockResolvedValue({ data: mockRpcResult, error: null });
    const getRecommendations = await loadGetRecommendations();

    const results = await getRecommendations(1942, 10);

    expect(mockRpc).toHaveBeenCalledWith("recommend_games", {
      source_game_id: 1942,
      result_limit: 10,
    });
    expect(results).toHaveLength(2);

    const first = results[0];
    expect(first.id).toBe(100);
    expect(first.name).toBe("Similar RPG");
    expect(first.cover).toEqual({
      url: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1abc.jpg",
    });
    expect(first.rating).toBe(88.5);
    expect(first.genres).toEqual([
      { id: 12, name: "Role-playing (RPG)" },
      { id: 31, name: "Adventure" },
    ]);
    expect(first.platforms).toEqual([
      { id: 6, name: "PC (Microsoft Windows)" },
      { id: 48, name: "PlayStation 4" },
    ]);
    expect(first.similarity_score).toBe(0.75);
    expect(typeof first.first_release_date).toBe("number");
  });

  it("handles null fields gracefully", async () => {
    mockRpc.mockResolvedValue({ data: mockRpcResult, error: null });
    const getRecommendations = await loadGetRecommendations();

    const results = await getRecommendations(999, 10);
    const second = results[1];

    expect(second.id).toBe(200);
    expect(second.cover).toBeUndefined();
    expect(second.rating).toBeUndefined();
    expect(second.first_release_date).toBeUndefined();
    expect(second.genres).toEqual([]);
    expect(second.platforms).toEqual([]);
  });

  it("returns empty array when no recommendations found", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    const getRecommendations = await loadGetRecommendations();

    const results = await getRecommendations(999, 10);
    expect(results).toEqual([]);
  });

  it("throws on RPC error", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "function not found" },
    });
    const getRecommendations = await loadGetRecommendations();

    await expect(getRecommendations(1, 10)).rejects.toThrow(
      "Recommendation failed: function not found"
    );
  });

  it("falls back to placeholder names for unknown genre/platform IDs", async () => {
    const singleResult = [
      {
        ...mockRpcResult[0],
        genre_ids: [999],
        platform_ids: [888],
      },
    ];
    mockRpc.mockResolvedValue({ data: singleResult, error: null });
    const getRecommendations = await loadGetRecommendations();

    const results = await getRecommendations(1, 5);
    expect(results[0].genres).toEqual([{ id: 999, name: "Genre 999" }]);
    expect(results[0].platforms).toEqual([{ id: 888, name: "Platform 888" }]);
  });
});

describe("GET /api/games/recommend", () => {
  beforeEach(() => {
    vi.resetModules();
    mockRpc.mockReset();
    mockFrom.mockReset();
    setupFromMock();
  });

  async function callRecommendRoute(params: string = "") {
    const { GET } = await import("@/app/api/games/recommend/route");
    const request = new NextRequest(
      new URL(`http://localhost/api/games/recommend${params ? `?${params}` : ""}`)
    );
    return GET(request);
  }

  it("returns 400 when gameId is missing", async () => {
    const response = await callRecommendRoute();
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("gameId");
  });

  it("returns 400 when gameId is not a number", async () => {
    const response = await callRecommendRoute("gameId=abc");
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("gameId");
  });

  it("returns recommendations for valid gameId", async () => {
    mockRpc.mockResolvedValue({ data: mockRpcResult, error: null });

    const response = await callRecommendRoute("gameId=1942");
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.games).toHaveLength(2);
    expect(body.games[0].name).toBe("Similar RPG");
  });

  it("respects limit parameter", async () => {
    mockRpc.mockResolvedValue({ data: [mockRpcResult[0]], error: null });

    const response = await callRecommendRoute("gameId=1942&limit=1");
    expect(response.status).toBe(200);
    expect(mockRpc).toHaveBeenCalledWith("recommend_games", {
      source_game_id: 1942,
      result_limit: 1,
    });
  });

  it("clamps limit to valid range (1-50)", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    await callRecommendRoute("gameId=1&limit=100");
    expect(mockRpc).toHaveBeenCalledWith("recommend_games", {
      source_game_id: 1,
      result_limit: 50,
    });
  });

  it("defaults limit to 10 when not specified", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    await callRecommendRoute("gameId=1");
    expect(mockRpc).toHaveBeenCalledWith("recommend_games", {
      source_game_id: 1,
      result_limit: 10,
    });
  });

  it("returns 500 on internal error", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "db error" },
    });

    const response = await callRecommendRoute("gameId=1942");
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });
});
