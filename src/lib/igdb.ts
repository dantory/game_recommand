import type { IGDBGame } from "@/types/game";

const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const IGDB_BASE_URL = "https://api.igdb.com/v4";

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.accessToken;
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are required");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  const res = await fetch(`${TWITCH_TOKEN_URL}?${params.toString()}`, {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error(`Twitch token request failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000 - 60_000,
  };

  return cachedToken.accessToken;
}

export function invalidateTokenCache() {
  cachedToken = null;
}

export async function queryIGDB<T>(
  endpoint: string,
  body: string
): Promise<T[]> {
  const fetchIGDB = async (token: string) => {
    const clientId = process.env.TWITCH_CLIENT_ID;
    return fetch(`${IGDB_BASE_URL}/${endpoint}`, {
      method: "POST",
      headers: {
        "Client-ID": clientId!,
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
      body,
    });
  };

  let res = await fetchIGDB(await getAccessToken());

  if (res.status === 401) {
    invalidateTokenCache();
    res = await fetchIGDB(await getAccessToken());
  }

  if (!res.ok) {
    throw new Error(`IGDB API error: ${res.status}`);
  }

  return res.json() as Promise<T[]>;
}

const GAME_FIELDS = `
  fields name, cover.url, genres.id, genres.name, platforms.id, platforms.name,
    first_release_date, rating, summary, screenshots.url,
    videos.video_id, similar_games.name, similar_games.cover.url,
    similar_games.id, similar_games.rating, similar_games.genres.name,
    similar_games.platforms.name, similar_games.first_release_date;
`.trim();

export async function getPopularRecentGames(
  limit: number = 20
): Promise<IGDBGame[]> {
  const sixMonthsAgo = Math.floor(Date.now() / 1000) - 6 * 30 * 24 * 60 * 60;
  const now = Math.floor(Date.now() / 1000);

  return queryIGDB<IGDBGame>(
    "games",
    `${GAME_FIELDS}
    where first_release_date > ${sixMonthsAgo} & first_release_date < ${now} & rating_count > 5 & cover != null;
    sort rating_count desc;
    limit ${limit};`
  );
}

export async function getTopRatedGames(
  limit: number = 20
): Promise<IGDBGame[]> {
  const oneYearAgo = Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60;
  const now = Math.floor(Date.now() / 1000);

  return queryIGDB<IGDBGame>(
    "games",
    `${GAME_FIELDS}
    where first_release_date > ${oneYearAgo} & first_release_date < ${now} & rating > 80 & rating_count > 10 & cover != null;
    sort rating desc;
    limit ${limit};`
  );
}

export async function getGamesByGenre(
  genreId: number,
  limit: number = 20
): Promise<IGDBGame[]> {
  const twoYearsAgo = Math.floor(Date.now() / 1000) - 2 * 365 * 24 * 60 * 60;
  const now = Math.floor(Date.now() / 1000);

  return queryIGDB<IGDBGame>(
    "games",
    `${GAME_FIELDS}
    where genres = (${genreId}) & first_release_date > ${twoYearsAgo} & first_release_date < ${now} & rating_count > 3 & cover != null;
    sort rating desc;
    limit ${limit};`
  );
}

export async function getGameDetail(
  gameId: number
): Promise<IGDBGame | null> {
  const results = await queryIGDB<IGDBGame>(
    "games",
    `${GAME_FIELDS}
    where id = ${gameId};
    limit 1;`
  );
  return results[0] ?? null;
}

export async function getFilteredGames(
  genreIds: number[],
  platformIds: number[],
  limit: number = 20
): Promise<IGDBGame[]> {
  const conditions: string[] = ["cover != null", "rating_count > 1"];

  if (genreIds.length > 0) {
    conditions.push(`genres = (${genreIds.join(",")})`);
  }
  if (platformIds.length > 0) {
    conditions.push(`platforms = (${platformIds.join(",")})`);
  }

  return queryIGDB<IGDBGame>(
    "games",
    `${GAME_FIELDS}
    where ${conditions.join(" & ")};
    sort rating desc;
    limit ${limit};`
  );
}

export async function searchGames(
  query: string,
  limit: number = 20
): Promise<IGDBGame[]> {
  return queryIGDB<IGDBGame>(
    "games",
    `${GAME_FIELDS}
    search "${query.replace(/"/g, '\\"')}";
    where cover != null;
    limit ${limit};`
  );
}
