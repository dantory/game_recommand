import { supabase } from "@/lib/supabase";
import { searchGames as igdbSearchGames } from "@/lib/igdb";
import { igdbImageUrl, shuffleArray } from "@/lib/utils";
import type { IGDBGame } from "@/types/game";
import type { Database } from "@/types/supabase";

type GameRow = Database["public"]["Tables"]["games"]["Row"];

// ---------------------------------------------------------------------------
// Shared helpers (also used by recommend.ts)
// ---------------------------------------------------------------------------

let genreCache: Map<number, string> | null = null;
let platformCache: Map<number, string> | null = null;

export async function getGenreMap(): Promise<Map<number, string>> {
  if (genreCache) return genreCache;
  const { data } = await supabase.from("genres").select("id, name");
  genreCache = new Map((data ?? []).map((g) => [g.id, g.name]));
  return genreCache;
}

export async function getPlatformMap(): Promise<Map<number, string>> {
  if (platformCache) return platformCache;
  const { data } = await supabase.from("platforms").select("id, name");
  platformCache = new Map((data ?? []).map((p) => [p.id, p.name]));
  return platformCache;
}

export function coverUrl(imageId: string): string {
  return igdbImageUrl(
    `//images.igdb.com/igdb/image/upload/t_thumb/${imageId}.jpg`,
    "t_cover_big",
  );
}

export function screenshotUrl(imageId: string): string {
  return igdbImageUrl(
    `//images.igdb.com/igdb/image/upload/t_thumb/${imageId}.jpg`,
    "t_screenshot_big",
  );
}

/** Convert a Supabase game row + lookup maps into the IGDBGame shape. */
export function toIGDBGame(
  row: GameRow,
  genreMap: Map<number, string>,
  platformMap: Map<number, string>,
  extras?: {
    screenshots?: { image_id: string }[];
    videos?: { video_id: string }[];
    similarGames?: IGDBGame[];
  },
): IGDBGame {
  return {
    id: row.id,
    name: row.name,
    summary: row.summary ?? undefined,
    cover: row.cover_image_id
      ? { url: coverUrl(row.cover_image_id) }
      : undefined,
    rating: row.rating ?? undefined,
    first_release_date: row.first_release_date
      ? Math.floor(new Date(row.first_release_date).getTime() / 1000)
      : undefined,
    genres: (row.genre_ids ?? []).map((id) => ({
      id,
      name: genreMap.get(id) ?? `Genre ${id}`,
    })),
    platforms: (row.platform_ids ?? []).map((id) => ({
      id,
      name: platformMap.get(id) ?? `Platform ${id}`,
    })),
    screenshots: extras?.screenshots?.map((s) => ({
      url: screenshotUrl(s.image_id),
    })),
    videos: extras?.videos,
    similar_games: extras?.similarGames,
  };
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

const GAME_SELECT =
  "id, name, slug, summary, cover_image_id, rating, rating_count, first_release_date, genre_ids, platform_ids" as const;

async function fetchAndTransform(
  queryBuilder: ReturnType<ReturnType<typeof supabase.from>["select"]>,
): Promise<IGDBGame[]> {
  const { data, error } = await queryBuilder;
  if (error) throw new Error(`Supabase query failed: ${error.message}`);

  const rows = (data ?? []) as GameRow[];
  if (rows.length === 0) return [];

  const [genreMap, platformMap] = await Promise.all([
    getGenreMap(),
    getPlatformMap(),
  ]);

  return rows.map((row) => toIGDBGame(row, genreMap, platformMap));
}

// ---------------------------------------------------------------------------
// Public query functions (mirrors igdb.ts API surface)
// ---------------------------------------------------------------------------

export async function getPopularRecentGames(
  limit: number = 20,
): Promise<IGDBGame[]> {
  const sixMonthsAgo = new Date(
    Date.now() - 6 * 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const query = supabase
    .from("games")
    .select(GAME_SELECT)
    .gt("first_release_date", sixMonthsAgo)
    .gt("rating_count", 5)
    .not("cover_image_id", "is", null)
    .order("rating_count", { ascending: false })
    .limit(limit);

  return fetchAndTransform(query);
}

export async function getTopRatedGames(
  limit: number = 20,
): Promise<IGDBGame[]> {
  const oneYearAgo = new Date(
    Date.now() - 365 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const query = supabase
    .from("games")
    .select(GAME_SELECT)
    .gt("first_release_date", oneYearAgo)
    .gt("rating", 80)
    .gt("rating_count", 10)
    .not("cover_image_id", "is", null)
    .order("rating", { ascending: false })
    .limit(limit);

  return fetchAndTransform(query);
}

export async function getGamesByGenre(
  genreId: number,
  limit: number = 20,
): Promise<IGDBGame[]> {
  const twoYearsAgo = new Date(
    Date.now() - 2 * 365 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const query = supabase
    .from("games")
    .select(GAME_SELECT)
    .contains("genre_ids", [genreId])
    .gt("first_release_date", twoYearsAgo)
    .gt("rating_count", 3)
    .not("cover_image_id", "is", null)
    .order("rating", { ascending: false })
    .limit(limit);

  return fetchAndTransform(query);
}

export async function getFilteredGames(
  genreIds: number[],
  platformIds: number[],
  limit: number = 20,
): Promise<IGDBGame[]> {
  let query = supabase
    .from("games")
    .select(GAME_SELECT)
    .gt("rating_count", 1)
    .not("cover_image_id", "is", null);

  if (genreIds.length > 0) {
    query = query.contains("genre_ids", genreIds);
  }
  if (platformIds.length > 0) {
    query = query.contains("platform_ids", platformIds);
  }

  query = query.order("rating", { ascending: false }).limit(limit);

  return fetchAndTransform(query);
}

export async function getRandomCuratedGames(
  limit: number = 20,
): Promise<IGDBGame[]> {
  // Fetch a larger pool and shuffle client-side for randomness
  const poolSize = Math.min(limit * 10, 200);

  const { data, error } = await supabase
    .from("games")
    .select(GAME_SELECT)
    .gt("rating", 70)
    .gt("rating_count", 5)
    .not("cover_image_id", "is", null)
    .order("rating", { ascending: false })
    .limit(poolSize);

  if (error) throw new Error(`Supabase query failed: ${error.message}`);

  const rows = (data ?? []) as GameRow[];
  if (rows.length === 0) return [];

  const [genreMap, platformMap] = await Promise.all([
    getGenreMap(),
    getPlatformMap(),
  ]);

  const games = rows.map((row) => toIGDBGame(row, genreMap, platformMap));
  return shuffleArray(games).slice(0, limit);
}

async function searchSupabase(
  query: string,
  limit: number,
): Promise<IGDBGame[]> {
  const tsQuery = query
    .trim()
    .split(/\s+/)
    .map((term) => `'${term.replace(/'/g, "''")}'`)
    .join(" & ");

  const { data, error } = await supabase
    .from("games")
    .select(GAME_SELECT)
    .not("cover_image_id", "is", null)
    .textSearch("search_tsv", tsQuery)
    .order("rating_count", { ascending: false })
    .limit(limit);

  if (error) {
    const fallbackQuery = supabase
      .from("games")
      .select(GAME_SELECT)
      .not("cover_image_id", "is", null)
      .ilike("name", `%${query.trim()}%`)
      .order("rating_count", { ascending: false })
      .limit(limit);

    return fetchAndTransform(fallbackQuery);
  }

  const rows = (data ?? []) as GameRow[];
  if (rows.length === 0) {
    const fallbackQuery = supabase
      .from("games")
      .select(GAME_SELECT)
      .not("cover_image_id", "is", null)
      .ilike("name", `%${query.trim()}%`)
      .order("rating_count", { ascending: false })
      .limit(limit);

    return fetchAndTransform(fallbackQuery);
  }

  const [genreMap, platformMap] = await Promise.all([
    getGenreMap(),
    getPlatformMap(),
  ]);

  return rows.map((row) => toIGDBGame(row, genreMap, platformMap));
}

function deduplicateById(games: IGDBGame[]): IGDBGame[] {
  const seen = new Set<number>();
  return games.filter((g) => {
    if (seen.has(g.id)) return false;
    seen.add(g.id);
    return true;
  });
}

const IGDB_FALLBACK_THRESHOLD = 3;

export async function searchGames(
  query: string,
  limit: number = 20,
): Promise<IGDBGame[]> {
  const supabaseResults = await searchSupabase(query, limit);

  if (supabaseResults.length >= IGDB_FALLBACK_THRESHOLD) {
    return supabaseResults.slice(0, limit);
  }

  try {
    const igdbResults = await igdbSearchGames(query, limit);
    const merged = [...supabaseResults, ...igdbResults];
    return deduplicateById(merged).slice(0, limit);
  } catch {
    return supabaseResults;
  }
}

export async function getGameDetail(
  gameId: number,
): Promise<IGDBGame | null> {
  const { data: gameRows, error: gameError } = await supabase
    .from("games")
    .select(GAME_SELECT)
    .eq("id", gameId)
    .limit(1);

  if (gameError || !gameRows || gameRows.length === 0) return null;

  const row = gameRows[0] as GameRow;

  // Fetch related data in parallel
  const [
    { data: screenshots },
    { data: videos },
    { data: similarLinks },
    genreMap,
    platformMap,
  ] = await Promise.all([
    supabase
      .from("game_screenshots")
      .select("image_id")
      .eq("game_id", gameId),
    supabase.from("game_videos").select("video_id").eq("game_id", gameId),
    supabase
      .from("game_similar")
      .select("similar_game_id")
      .eq("game_id", gameId),
    getGenreMap(),
    getPlatformMap(),
  ]);

  // Fetch similar games data if we have links
  let similarGames: IGDBGame[] | undefined;
  const similarIds = (similarLinks ?? []).map((s) => s.similar_game_id);
  if (similarIds.length > 0) {
    const { data: similarData } = await supabase
      .from("games")
      .select(GAME_SELECT)
      .in("id", similarIds)
      .not("cover_image_id", "is", null)
      .limit(20);

    if (similarData && similarData.length > 0) {
      similarGames = (similarData as GameRow[]).map((r) =>
        toIGDBGame(r, genreMap, platformMap),
      );
    }
  }

  return toIGDBGame(row, genreMap, platformMap, {
    screenshots: (screenshots ?? []) as { image_id: string }[],
    videos: (videos ?? []) as { video_id: string }[],
    similarGames,
  });
}
