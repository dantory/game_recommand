export interface GenreOption {
  slug: string;
  tagId: number;
  label: string;
  emoji: string;
}

export interface TagOption {
  slug: string;
  tagId: number;
  label: string;
  emoji: string;
}

export const GENRES: GenreOption[] = [
  { slug: "action", tagId: 19, label: "액션", emoji: "⚔️" },
  { slug: "rpg", tagId: 122, label: "RPG", emoji: "🗡️" },
  { slug: "strategy", tagId: 9, label: "전략", emoji: "♟️" },
  { slug: "adventure", tagId: 21, label: "어드벤처", emoji: "🗺️" },
  { slug: "simulation", tagId: 599, label: "시뮬레이션", emoji: "🏗️" },
  { slug: "puzzle", tagId: 1664, label: "퍼즐", emoji: "🧩" },
  { slug: "racing", tagId: 699, label: "레이싱", emoji: "🏎️" },
  { slug: "sports", tagId: 701, label: "스포츠", emoji: "⚽" },
  { slug: "indie", tagId: 492, label: "인디", emoji: "🎮" },
  { slug: "horror", tagId: 1667, label: "호러", emoji: "👻" },
];

export const TAGS: TagOption[] = [
  { slug: "multiplayer", tagId: 3859, label: "멀티플레이어", emoji: "👥" },
  { slug: "singleplayer", tagId: 4182, label: "싱글플레이어", emoji: "🧑" },
  { slug: "free-to-play", tagId: 113, label: "무료", emoji: "💰" },
  { slug: "open-world", tagId: 1695, label: "오픈월드", emoji: "🌍" },
  { slug: "pixel-graphics", tagId: 3964, label: "픽셀 그래픽", emoji: "🎨" },
  { slug: "survival", tagId: 1662, label: "서바이벌", emoji: "🏕️" },
  { slug: "co-op", tagId: 3843, label: "협동", emoji: "🤝" },
  { slug: "competitive", tagId: 3878, label: "경쟁", emoji: "🏆" },
  { slug: "story-rich", tagId: 1742, label: "스토리", emoji: "📖" },
  { slug: "controller-support", tagId: 7481, label: "컨트롤러 지원", emoji: "🕹️" },
];

export const RESULTS_PER_PAGE = 6;
