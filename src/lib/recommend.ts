import { supabase } from "@/lib/supabase";
import { getGenreMap, getPlatformMap, coverUrl } from "@/lib/supabase-games";
import type { IGDBGame } from "@/types/game";

interface RawRecommendation {
  id: number;
  name: string;
  slug: string | null;
  summary: string | null;
  cover_image_id: string | null;
  rating: number | null;
  rating_count: number | null;
  first_release_date: string | null;
  genre_ids: number[] | null;
  theme_ids: number[] | null;
  platform_ids: number[] | null;
  similarity_score: number;
}

export interface RecommendedGame extends IGDBGame {
  similarity_score: number;
}

export async function getRecommendations(
  gameId: number,
  limit: number = 10
): Promise<RecommendedGame[]> {
  const { data, error } = await supabase.rpc("recommend_games", {
    source_game_id: gameId,
    result_limit: limit,
  });

  if (error) {
    throw new Error(`Recommendation failed: ${error.message}`);
  }

  const raw = (data ?? []) as RawRecommendation[];
  if (raw.length === 0) return [];

  const [genreMap, platformMap] = await Promise.all([
    getGenreMap(),
    getPlatformMap(),
  ]);

  return raw.map((r) => ({
    id: r.id,
    name: r.name,
    summary: r.summary ?? undefined,
    cover: r.cover_image_id
      ? { url: coverUrl(r.cover_image_id) }
      : undefined,
    rating: r.rating ?? undefined,
    first_release_date: r.first_release_date
      ? Math.floor(new Date(r.first_release_date).getTime() / 1000)
      : undefined,
    genres: (r.genre_ids ?? []).map((id) => ({
      id,
      name: genreMap.get(id) ?? `Genre ${id}`,
    })),
    platforms: (r.platform_ids ?? []).map((id) => ({
      id,
      name: platformMap.get(id) ?? `Platform ${id}`,
    })),
    similarity_score: r.similarity_score,
  }));
}
