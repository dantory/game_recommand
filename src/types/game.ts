export interface RawgPlatform {
  platform: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface RawgGenre {
  id: number;
  name: string;
  slug: string;
}

export interface RawgTag {
  id: number;
  name: string;
  slug: string;
}

export interface RawgGame {
  id: number;
  name: string;
  slug: string;
  background_image: string | null;
  rating: number;
  rating_top: number;
  metacritic: number | null;
  released: string | null;
  genres: RawgGenre[];
  tags: RawgTag[];
  platforms: RawgPlatform[];
}

export interface RawgListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RawgGame[];
}

export interface GameRecommendResponse {
  games: RawgGame[];
  totalCount: number;
}
