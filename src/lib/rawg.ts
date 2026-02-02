import { MOBILE_PLATFORM_IDS } from "./constants";
import type { RawgListResponse } from "@/types/game";

const RAWG_BASE = "https://api.rawg.io/api";

export async function fetchMobileGames(params: {
  genres?: string;
  tags?: string;
  page?: number;
  pageSize?: number;
}): Promise<RawgListResponse> {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) {
    throw new Error("RAWG_API_KEY is not configured");
  }

  const url = new URL(`${RAWG_BASE}/games`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("platforms", MOBILE_PLATFORM_IDS);
  url.searchParams.set("page_size", String(params.pageSize ?? 40));
  url.searchParams.set("ordering", "-rating");

  if (params.genres) url.searchParams.set("genres", params.genres);
  if (params.tags) url.searchParams.set("tags", params.tags);
  if (params.page) url.searchParams.set("page", String(params.page));

  const res = await fetch(url.toString(), { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`RAWG API error: ${res.status}`);
  }

  return res.json();
}
