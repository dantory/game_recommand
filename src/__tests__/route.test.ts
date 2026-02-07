import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/games/route";
import { NextRequest } from "next/server";
import type { SteamSearchResponse } from "@/types/game";

vi.mock("@/lib/steam", () => ({
  searchSteamGames: vi.fn(),
}));

import { searchSteamGames } from "@/lib/steam";
const mockSearch = vi.mocked(searchSteamGames);

function makeRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

function makeMockResponse(count: number): SteamSearchResponse {
  return {
    totalCount: count,
    games: Array.from({ length: count }, (_, i) => ({
      appid: i + 1,
      name: `Game ${i + 1}`,
      capsuleImage: `https://img/${i + 1}.jpg`,
      headerImage: `https://header/${i + 1}.jpg`,
      url: `https://store.steampowered.com/app/${i + 1}/`,
      released: "2024년 1월 1일",
      reviewSummary: "긍정적",
      reviewPercent: 80,
      reviewCount: 1000,
      discountPercent: null,
      priceFinal: 1500000,
      priceOriginal: 1500000,
      platforms: [{ slug: "windows" as const, label: "Windows" }],
      tagIds: [19],
    })),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/games", () => {
  it("returns shuffled games sliced to RESULTS_PER_PAGE (6)", async () => {
    mockSearch.mockResolvedValue(makeMockResponse(20));

    const res = await GET(makeRequest("/api/games?tags=19,122"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.games).toHaveLength(6);
    expect(body.totalCount).toBe(20);
    expect(mockSearch).toHaveBeenCalledWith({ tags: "19,122", count: 50 });
  });

  it("passes undefined tags when not provided", async () => {
    mockSearch.mockResolvedValue(makeMockResponse(3));

    const res = await GET(makeRequest("/api/games"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.games).toHaveLength(3);
    expect(mockSearch).toHaveBeenCalledWith({ tags: undefined, count: 50 });
  });

  it("returns 500 on search failure", async () => {
    mockSearch.mockRejectedValue(new Error("Steam down"));

    const res = await GET(makeRequest("/api/games?tags=19"));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("게임 데이터를 가져올 수 없습니다.");
  });

  it("returns fewer than 6 games when results are limited", async () => {
    mockSearch.mockResolvedValue(makeMockResponse(2));

    const res = await GET(makeRequest("/api/games?tags=19"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.games).toHaveLength(2);
  });
});
