export interface SteamGame {
  appid: number;
  name: string;
  headerImage: string;
  capsuleImage: string;
  url: string;
  released: string | null;
  reviewSummary: string | null;
  reviewPercent: number | null;
  reviewCount: number | null;
  priceFinal: number | null;
  priceOriginal: number | null;
  discountPercent: number | null;
  platforms: SteamPlatform[];
  tagIds: number[];
}

export interface SteamPlatform {
  slug: "windows" | "mac" | "linux";
  label: string;
}

export interface SteamSearchResponse {
  games: SteamGame[];
  totalCount: number;
}
