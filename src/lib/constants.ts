export interface GenreOption {
  slug: string;
  label: string;
  emoji: string;
}

export interface TagOption {
  slug: string;
  label: string;
  emoji: string;
}

export const GENRES: GenreOption[] = [
  { slug: "action", label: "액션", emoji: "⚔️" },
  { slug: "role-playing-games-rpg", label: "RPG", emoji: "🗡️" },
  { slug: "puzzle", label: "퍼즐", emoji: "🧩" },
  { slug: "strategy", label: "전략", emoji: "♟️" },
  { slug: "adventure", label: "어드벤처", emoji: "🗺️" },
  { slug: "casual", label: "캐주얼", emoji: "🎮" },
  { slug: "simulation", label: "시뮬레이션", emoji: "🏗️" },
  { slug: "racing", label: "레이싱", emoji: "🏎️" },
  { slug: "sports", label: "스포츠", emoji: "⚽" },
  { slug: "arcade", label: "아케이드", emoji: "👾" },
];

export const TAGS: TagOption[] = [
  { slug: "multiplayer", label: "멀티플레이어", emoji: "👥" },
  { slug: "singleplayer", label: "싱글플레이어", emoji: "🧑" },
  { slug: "free-to-play", label: "무료", emoji: "💰" },
  { slug: "offline", label: "오프라인", emoji: "📴" },
  { slug: "co-op", label: "협동", emoji: "🤝" },
  { slug: "competitive", label: "경쟁", emoji: "🏆" },
  { slug: "open-world", label: "오픈월드", emoji: "🌍" },
  { slug: "pixel-graphics", label: "픽셀 그래픽", emoji: "🎨" },
  { slug: "survival", label: "서바이벌", emoji: "🏕️" },
  { slug: "controller-support", label: "컨트롤러 지원", emoji: "🕹️" },
];

export const MOBILE_PLATFORM_IDS = "3,21"; // iOS, Android
export const RESULTS_PER_PAGE = 6;
