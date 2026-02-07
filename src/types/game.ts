export interface IGDBGame {
  id: number;
  name: string;
  summary?: string;
  cover?: { url: string };
  genres?: { id: number; name: string }[];
  platforms?: { id: number; name: string }[];
  first_release_date?: number;
  rating?: number;
  screenshots?: { url: string }[];
  videos?: { video_id: string }[];
  similar_games?: IGDBGame[];
}

export interface IGDBGamesResponse {
  games: IGDBGame[];
}
