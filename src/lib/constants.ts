export interface GenreOption {
  id: number;
  slug: string;
  label: string;
  emoji: string;
}

export interface PlatformOption {
  id: number;
  slug: string;
  label: string;
  emoji: string;
}

export const GENRES: GenreOption[] = [
  { id: 12, slug: "rpg", label: "RPG", emoji: "🗡️" },
  { id: 31, slug: "adventure", label: "어드벤처", emoji: "🗺️" },
  { id: 5, slug: "shooter", label: "슈팅", emoji: "🔫" },
  { id: 15, slug: "strategy", label: "전략", emoji: "♟️" },
  { id: 9, slug: "puzzle", label: "퍼즐", emoji: "🧩" },
  { id: 14, slug: "sport", label: "스포츠", emoji: "⚽" },
  { id: 10, slug: "racing", label: "레이싱", emoji: "🏎️" },
  { id: 32, slug: "indie", label: "인디", emoji: "🎮" },
  { id: 4, slug: "fighting", label: "격투", emoji: "🥊" },
  { id: 2, slug: "point-and-click", label: "포인트 앤 클릭", emoji: "🖱️" },
];

export const PLATFORMS: PlatformOption[] = [
  { id: 6, slug: "pc", label: "PC", emoji: "🖥️" },
  { id: 48, slug: "ps5", label: "PS5", emoji: "🎮" },
  { id: 49, slug: "xbox-series", label: "Xbox Series", emoji: "🟢" },
  { id: 130, slug: "switch", label: "Switch", emoji: "🔴" },
  { id: 34, slug: "android", label: "Android", emoji: "📱" },
  { id: 39, slug: "ios", label: "iOS", emoji: "🍎" },
];

export const RESULTS_PER_SECTION = 20;
