/**
 * IGDB → Supabase batch importer
 *
 * Fetches popular games from IGDB and upserts into Supabase.
 * Handles rate limiting (4 req/sec), pagination, and checkpoint resume.
 *
 * Usage:
 *   npx tsx scripts/import-igdb.ts
 *
 * Required env vars:
 *   TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const IGDB_BASE_URL = "https://api.igdb.com/v4";
const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const BATCH_SIZE = 500;
const TARGET_GAMES = 5000;
const RATE_LIMIT_MS = 260;
const CHECKPOINT_FILE = "scripts/.import-checkpoint.json";

// ---------------------------------------------------------------------------
// IGDB Auth
// ---------------------------------------------------------------------------
let accessToken: string | null = null;

async function getToken(): Promise<string> {
  if (accessToken) return accessToken;

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET required");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  const res = await fetch(`${TWITCH_TOKEN_URL}?${params}`, { method: "POST" });
  if (!res.ok) throw new Error(`Twitch auth failed: ${res.status}`);
  const data = (await res.json()) as { access_token: string };
  accessToken = data.access_token;
  return accessToken;
}

// ---------------------------------------------------------------------------
// IGDB Query
// ---------------------------------------------------------------------------
async function queryIGDB<T>(endpoint: string, body: string): Promise<T[]> {
  const token = await getToken();
  const clientId = process.env.TWITCH_CLIENT_ID!;

  await sleep(RATE_LIMIT_MS);

  const res = await fetch(`${IGDB_BASE_URL}/${endpoint}`, {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`IGDB ${endpoint} error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T[]>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// IGDB raw types (what the API returns)
// ---------------------------------------------------------------------------
interface IGDBRawGame {
  id: number;
  name: string;
  slug?: string;
  summary?: string;
  storyline?: string;
  cover?: { image_id: string };
  rating?: number;
  rating_count?: number;
  aggregated_rating?: number;
  total_rating?: number;
  first_release_date?: number;
  category?: number;
  status?: number;
  hypes?: number;
  genres?: { id: number; name: string; slug: string }[];
  themes?: { id: number; name: string; slug: string }[];
  game_modes?: { id: number; name: string; slug: string }[];
  platforms?: { id: number; name: string; slug: string }[];
  player_perspectives?: { id: number; name: string; slug: string }[];
  involved_companies?: {
    company: { id: number; name: string; slug?: string };
    developer: boolean;
    publisher: boolean;
  }[];
  keywords?: { id: number; name: string; slug: string }[];
  screenshots?: { image_id: string }[];
  videos?: { video_id: string }[];
  similar_games?: { id: number }[];
  updated_at?: number;
}

// ---------------------------------------------------------------------------
// Supabase client (service role for writes)
// ---------------------------------------------------------------------------
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  }
  return createClient(url, key);
}

// ---------------------------------------------------------------------------
// Checkpoint (resume after interruption)
// ---------------------------------------------------------------------------
interface Checkpoint {
  offset: number;
  totalImported: number;
}

async function loadCheckpoint(): Promise<Checkpoint> {
  try {
    const fs = await import("fs/promises");
    const data = await fs.readFile(CHECKPOINT_FILE, "utf-8");
    return JSON.parse(data) as Checkpoint;
  } catch {
    return { offset: 0, totalImported: 0 };
  }
}

async function saveCheckpoint(cp: Checkpoint): Promise<void> {
  const fs = await import("fs/promises");
  await fs.writeFile(CHECKPOINT_FILE, JSON.stringify(cp, null, 2));
}

async function removeCheckpoint(): Promise<void> {
  const fs = await import("fs/promises");
  try {
    await fs.unlink(CHECKPOINT_FILE);
  } catch {
    // file may not exist
  }
}

// ---------------------------------------------------------------------------
// Upsert helpers
// ---------------------------------------------------------------------------
function uniqueById<T extends { id: number }>(items: T[]): T[] {
  const seen = new Set<number>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

async function upsertMaster(
  supabase: ReturnType<typeof getSupabase>,
  table: string,
  rows: { id: number; name: string; slug: string }[]
) {
  if (rows.length === 0) return;
  const unique = uniqueById(rows);
  const { error } = await supabase.from(table).upsert(unique, { onConflict: "id" });
  if (error) console.error(`  upsert ${table} error:`, error.message);
}

async function upsertJoin(
  supabase: ReturnType<typeof getSupabase>,
  table: string,
  rows: Record<string, unknown>[]
) {
  if (rows.length === 0) return;
  const { error } = await supabase.from(table).upsert(rows, { ignoreDuplicates: true });
  if (error) console.error(`  upsert ${table} error:`, error.message);
}

// ---------------------------------------------------------------------------
// Process a batch of games
// ---------------------------------------------------------------------------
async function processBatch(
  supabase: ReturnType<typeof getSupabase>,
  games: IGDBRawGame[]
): Promise<void> {
  const allGenres: { id: number; name: string; slug: string }[] = [];
  const allThemes: { id: number; name: string; slug: string }[] = [];
  const allModes: { id: number; name: string; slug: string }[] = [];
  const allPlatforms: { id: number; name: string; slug: string }[] = [];
  const allPerspectives: { id: number; name: string; slug: string }[] = [];
  const allCompanies: { id: number; name: string; slug: string | null }[] = [];
  const allKeywords: { id: number; name: string; slug: string }[] = [];

  const gameRows: Record<string, unknown>[] = [];
  const genreJoins: Record<string, unknown>[] = [];
  const themeJoins: Record<string, unknown>[] = [];
  const modeJoins: Record<string, unknown>[] = [];
  const platformJoins: Record<string, unknown>[] = [];
  const perspectiveJoins: Record<string, unknown>[] = [];
  const companyJoins: Record<string, unknown>[] = [];
  const keywordJoins: Record<string, unknown>[] = [];
  const screenshots: Record<string, unknown>[] = [];
  const videos: Record<string, unknown>[] = [];

  for (const game of games) {
    const genreIds = (game.genres ?? []).map((g) => g.id);
    const themeIds = (game.themes ?? []).map((t) => t.id);
    const modeIds = (game.game_modes ?? []).map((m) => m.id);
    const platformIds = (game.platforms ?? []).map((p) => p.id);
    const perspectiveIds = (game.player_perspectives ?? []).map((p) => p.id);
    const keywordIds = (game.keywords ?? []).map((k) => k.id);
    const developerIds = (game.involved_companies ?? [])
      .filter((ic) => ic.developer)
      .map((ic) => ic.company.id);

    gameRows.push({
      id: game.id,
      name: game.name,
      slug: game.slug ?? null,
      summary: game.summary ?? null,
      storyline: game.storyline ?? null,
      cover_image_id: game.cover?.image_id ?? null,
      rating: game.rating ?? null,
      rating_count: game.rating_count ?? 0,
      aggregated_rating: game.aggregated_rating ?? null,
      total_rating: game.total_rating ?? null,
      first_release_date: game.first_release_date
        ? new Date(game.first_release_date * 1000).toISOString()
        : null,
      category: game.category ?? 0,
      status: game.status ?? null,
      hypes: game.hypes ?? 0,
      genre_ids: genreIds,
      theme_ids: themeIds,
      mode_ids: modeIds,
      platform_ids: platformIds,
      perspective_ids: perspectiveIds,
      keyword_ids: keywordIds,
      developer_ids: developerIds,
      raw_igdb: game as unknown as Record<string, unknown>,
      igdb_updated_at: game.updated_at
        ? new Date(game.updated_at * 1000).toISOString()
        : null,
    });

    for (const g of game.genres ?? []) {
      allGenres.push(g);
      genreJoins.push({ game_id: game.id, genre_id: g.id });
    }
    for (const t of game.themes ?? []) {
      allThemes.push(t);
      themeJoins.push({ game_id: game.id, theme_id: t.id });
    }
    for (const m of game.game_modes ?? []) {
      allModes.push(m);
      modeJoins.push({ game_id: game.id, mode_id: m.id });
    }
    for (const p of game.platforms ?? []) {
      allPlatforms.push({ id: p.id, name: p.name, slug: p.slug ?? p.name.toLowerCase().replace(/\s+/g, "-") });
      platformJoins.push({ game_id: game.id, platform_id: p.id });
    }
    for (const p of game.player_perspectives ?? []) {
      allPerspectives.push(p);
      perspectiveJoins.push({ game_id: game.id, perspective_id: p.id });
    }
    for (const ic of game.involved_companies ?? []) {
      allCompanies.push({
        id: ic.company.id,
        name: ic.company.name,
        slug: ic.company.slug ?? null,
      });
      if (ic.developer) {
        companyJoins.push({ game_id: game.id, company_id: ic.company.id, role: "developer" });
      }
      if (ic.publisher) {
        companyJoins.push({ game_id: game.id, company_id: ic.company.id, role: "publisher" });
      }
    }
    for (const k of game.keywords ?? []) {
      allKeywords.push(k);
      keywordJoins.push({ game_id: game.id, keyword_id: k.id });
    }
    for (const ss of game.screenshots ?? []) {
      screenshots.push({ game_id: game.id, image_id: ss.image_id });
    }
    for (const v of game.videos ?? []) {
      videos.push({ game_id: game.id, video_id: v.video_id });
    }
  }

  // 1. Upsert master tables first (FK deps)
  await upsertMaster(supabase, "genres", allGenres);
  await upsertMaster(supabase, "themes", allThemes);
  await upsertMaster(supabase, "game_modes", allModes);
  await upsertMaster(supabase, "platforms", allPlatforms as { id: number; name: string; slug: string }[]);
  await upsertMaster(supabase, "player_perspectives", allPerspectives);
  await upsertMaster(supabase, "keywords", allKeywords);

  // Companies have nullable slug
  if (allCompanies.length > 0) {
    const unique = uniqueById(allCompanies);
    const { error } = await supabase.from("companies").upsert(unique, { onConflict: "id" });
    if (error) console.error("  upsert companies error:", error.message);
  }

  // 2. Upsert games
  const { error: gameErr } = await supabase.from("games").upsert(gameRows, { onConflict: "id" });
  if (gameErr) console.error("  upsert games error:", gameErr.message);

  // 3. Upsert join tables
  await upsertJoin(supabase, "game_genres", genreJoins);
  await upsertJoin(supabase, "game_themes", themeJoins);
  await upsertJoin(supabase, "game_game_modes", modeJoins);
  await upsertJoin(supabase, "game_platforms", platformJoins);
  await upsertJoin(supabase, "game_perspectives", perspectiveJoins);
  await upsertJoin(supabase, "game_companies", companyJoins);
  await upsertJoin(supabase, "game_keywords", keywordJoins);

  // 4. Screenshots & videos (delete-then-insert for idempotency)
  const gameIds = games.map((g) => g.id);
  await supabase.from("game_screenshots").delete().in("game_id", gameIds);
  await supabase.from("game_videos").delete().in("game_id", gameIds);
  if (screenshots.length > 0) {
    await supabase.from("game_screenshots").insert(screenshots);
  }
  if (videos.length > 0) {
    await supabase.from("game_videos").insert(videos);
  }
}

// ---------------------------------------------------------------------------
// IGDB game fields query string
// ---------------------------------------------------------------------------
const IMPORT_FIELDS = `
  fields name, slug, summary, storyline, cover.image_id,
    rating, rating_count, aggregated_rating, total_rating,
    first_release_date, category, status, hypes,
    genres.id, genres.name, genres.slug,
    themes.id, themes.name, themes.slug,
    game_modes.id, game_modes.name, game_modes.slug,
    platforms.id, platforms.name, platforms.slug,
    player_perspectives.id, player_perspectives.name, player_perspectives.slug,
    involved_companies.company.id, involved_companies.company.name, involved_companies.company.slug,
    involved_companies.developer, involved_companies.publisher,
    keywords.id, keywords.name, keywords.slug,
    screenshots.image_id, videos.video_id,
    similar_games.id, updated_at;
`.trim();

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("🎮 IGDB → Supabase importer starting...\n");

  const supabase = getSupabase();
  const checkpoint = await loadCheckpoint();
  let { offset, totalImported } = checkpoint;

  if (offset > 0) {
    console.log(`📌 Resuming from checkpoint: offset=${offset}, imported=${totalImported}\n`);
  }

  while (totalImported < TARGET_GAMES) {
    console.log(`📦 Fetching batch: offset=${offset}, limit=${BATCH_SIZE}`);

    const games = await queryIGDB<IGDBRawGame>(
      "games",
      `${IMPORT_FIELDS}
      where rating_count > 5 & cover != null;
      sort rating_count desc;
      limit ${BATCH_SIZE};
      offset ${offset};`
    );

    if (games.length === 0) {
      console.log("  No more games found. Done.");
      break;
    }

    console.log(`  Received ${games.length} games. Upserting...`);
    await processBatch(supabase, games);

    totalImported += games.length;
    offset += BATCH_SIZE;

    await saveCheckpoint({ offset, totalImported });
    console.log(`  ✅ Total imported: ${totalImported}\n`);
  }

  await removeCheckpoint();
  console.log(`\n🏁 Import complete. Total games: ${totalImported}`);
}

main().catch((err) => {
  console.error("❌ Import failed:", err);
  process.exit(1);
});
