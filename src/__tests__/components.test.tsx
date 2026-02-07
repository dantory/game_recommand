import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import type { IGDBGame } from "@/types/game";
import { GENRES, PLATFORMS } from "@/lib/constants";

afterEach(() => {
  cleanup();
});

vi.mock("next/image", () => ({
  default: function MockImage(props: Record<string, unknown>) {
    return <img {...props} />;
  },
}));

vi.mock("next/link", () => ({
  default: function MockLink({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  },
}));

const mockGame: IGDBGame = {
  id: 1942,
  name: "The Witcher 3: Wild Hunt",
  summary: "An open-world RPG adventure",
  cover: { url: "//images.igdb.com/igdb/image/upload/t_thumb/co1wyy.jpg" },
  genres: [
    { id: 12, name: "Role-playing (RPG)" },
    { id: 31, name: "Adventure" },
  ],
  platforms: [
    { id: 6, name: "PC (Microsoft Windows)" },
    { id: 48, name: "PlayStation 5" },
    { id: 49, name: "Xbox Series X|S" },
  ],
  first_release_date: 1431993600,
  rating: 92.4,
  screenshots: [{ url: "//images.igdb.com/igdb/image/upload/t_thumb/sc1.jpg" }],
  videos: [{ video_id: "abc123" }],
};

const mockGameNoRating: IGDBGame = {
  id: 2000,
  name: "Unknown Indie Game",
  genres: [{ id: 32, name: "Indie" }],
  platforms: [{ id: 6, name: "PC (Microsoft Windows)" }],
};

const mockGameNoCover: IGDBGame = {
  id: 2001,
  name: "No Cover Game",
  rating: 55,
  platforms: [],
};

const mockGameMediumRating: IGDBGame = {
  id: 2002,
  name: "Medium Rated Game",
  rating: 72.3,
  cover: { url: "//images.igdb.com/igdb/image/upload/t_thumb/co2abc.jpg" },
  genres: [{ id: 5, name: "Shooter" }],
  platforms: [{ id: 130, name: "Nintendo Switch" }],
};

describe("GameCard", () => {
  async function renderGameCard(game: IGDBGame) {
    const { GameCard } = await import("@/components/ui/GameCard");
    return render(<GameCard game={game} />);
  }

  it("renders game name", async () => {
    await renderGameCard(mockGame);
    expect(screen.getByText("The Witcher 3: Wild Hunt")).toBeInTheDocument();
  });

  it("links to /games/[id]", async () => {
    await renderGameCard(mockGame);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/games/1942");
  });

  it("renders cover image with igdb URL", async () => {
    await renderGameCard(mockGame);
    const img = screen.getByAltText("The Witcher 3: Wild Hunt");
    expect(img).toHaveAttribute(
      "src",
      "https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg"
    );
  });

  it("shows 'No Image' when cover is missing", async () => {
    await renderGameCard(mockGameNoCover);
    expect(screen.getByText("No Image")).toBeInTheDocument();
  });

  it("renders rating with green color for >= 80", async () => {
    await renderGameCard(mockGame);
    const ratingEl = screen.getByText("92점");
    expect(ratingEl).toBeInTheDocument();
    expect(ratingEl.className).toContain("text-green-600");
  });

  it("renders rating with yellow color for 60-79", async () => {
    await renderGameCard(mockGameMediumRating);
    const ratingEl = screen.getByText("72점");
    expect(ratingEl).toBeInTheDocument();
    expect(ratingEl.className).toContain("text-yellow-600");
  });

  it("renders rating with red color for < 60", async () => {
    await renderGameCard(mockGameNoCover);
    const ratingEl = screen.getByText("55점");
    expect(ratingEl).toBeInTheDocument();
    expect(ratingEl.className).toContain("text-red-600");
  });

  it("shows rating placeholder when no rating", async () => {
    await renderGameCard(mockGameNoRating);
    expect(screen.getByText("평가 없음")).toBeInTheDocument();
  });

  it("renders genre names", async () => {
    await renderGameCard(mockGame);
    expect(
      screen.getByText("Role-playing (RPG), Adventure")
    ).toBeInTheDocument();
  });

  it("renders platform badges", async () => {
    await renderGameCard(mockGame);
    expect(screen.getByText("PC")).toBeInTheDocument();
    expect(screen.getByText("PS")).toBeInTheDocument();
    expect(screen.getByText("Xbox")).toBeInTheDocument();
  });
});

describe("PlatformBadge", () => {
  async function renderPlatformBadge(
    platforms: { id: number; name: string }[]
  ) {
    const { PlatformBadge } = await import("@/components/ui/PlatformBadge");
    return render(<PlatformBadge platforms={platforms} />);
  }

  it("renders platform labels correctly", async () => {
    await renderPlatformBadge([
      { id: 6, name: "PC (Microsoft Windows)" },
      { id: 48, name: "PlayStation 5" },
      { id: 49, name: "Xbox Series X|S" },
      { id: 130, name: "Nintendo Switch" },
      { id: 34, name: "Android" },
      { id: 39, name: "iOS" },
    ]);
    expect(screen.getByText("PC")).toBeInTheDocument();
    expect(screen.getByText("PS")).toBeInTheDocument();
    expect(screen.getByText("Xbox")).toBeInTheDocument();
    expect(screen.getByText("Switch")).toBeInTheDocument();
    expect(screen.getByText("Android")).toBeInTheDocument();
    expect(screen.getByText("iOS")).toBeInTheDocument();
  });

  it("deduplicates platforms with same label", async () => {
    await renderPlatformBadge([
      { id: 6, name: "PC (Microsoft Windows)" },
      { id: 162, name: "PC (Steam)" },
    ]);
    const allPC = screen.getAllByText("PC");
    expect(allPC).toHaveLength(1);
  });

  it("returns null for empty platforms", async () => {
    const { container } = await renderPlatformBadge([]);
    expect(container.innerHTML).toBe("");
  });

  it("returns null when all platforms are unrecognized", async () => {
    const { container } = await renderPlatformBadge([
      { id: 999, name: "Commodore 64" },
    ]);
    expect(container.innerHTML).toBe("");
  });
});

describe("SearchBar", () => {
  async function renderSearchBar(onSearch: (query: string) => void) {
    const { SearchBar } = await import("@/components/ui/SearchBar");
    return render(<SearchBar onSearch={onSearch} />);
  }

  it("renders search input with placeholder", async () => {
    await renderSearchBar(vi.fn());
    const input = screen.getByPlaceholderText("게임 검색...");
    expect(input).toBeInTheDocument();
  });

  it("calls onSearch with query on form submit", async () => {
    const onSearch = vi.fn();
    await renderSearchBar(onSearch);
    const input = screen.getByPlaceholderText("게임 검색...");
    fireEvent.change(input, { target: { value: "Zelda" } });
    fireEvent.submit(input.closest("form")!);
    expect(onSearch).toHaveBeenCalledWith("Zelda");
  });

  it("calls onSearch with empty string when submitted without typing", async () => {
    const onSearch = vi.fn();
    await renderSearchBar(onSearch);
    const input = screen.getByPlaceholderText("게임 검색...");
    fireEvent.submit(input.closest("form")!);
    expect(onSearch).toHaveBeenCalledWith("");
  });
});

describe("FilterChip", () => {
  async function renderFilterChip(overrides: Partial<{
    label: string;
    emoji: string;
    selected: boolean;
    onToggle: () => void;
  }> = {}) {
    const { FilterChip } = await import("@/components/ui/FilterChip");
    const props = {
      label: "RPG",
      emoji: "\uD83D\uDDE1\uFE0F",
      selected: false,
      onToggle: vi.fn(),
      ...overrides,
    };
    return { result: render(<FilterChip {...props} />), props };
  }

  it("renders label and emoji", async () => {
    await renderFilterChip();
    expect(screen.getByText("RPG")).toBeInTheDocument();
  });

  it("applies selected styles when selected", async () => {
    await renderFilterChip({ selected: true });
    const button = screen.getByRole("button");
    expect(button.className).toContain("border-accent");
  });

  it("applies unselected styles when not selected", async () => {
    await renderFilterChip({ selected: false });
    const button = screen.getByRole("button");
    expect(button.className).toContain("border-border");
  });

  it("calls onToggle when clicked", async () => {
    const onToggle = vi.fn();
    await renderFilterChip({ onToggle });
    fireEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

describe("FilterBar", () => {
  async function renderFilterBar(overrides: Partial<{
    selectedGenres: number[];
    selectedPlatforms: number[];
    onToggleGenre: (id: number) => void;
    onTogglePlatform: (id: number) => void;
  }> = {}) {
    const { FilterBar } = await import("@/components/ui/FilterBar");
    const props = {
      selectedGenres: [] as number[],
      selectedPlatforms: [] as number[],
      onToggleGenre: vi.fn(),
      onTogglePlatform: vi.fn(),
      ...overrides,
    };
    return { result: render(<FilterBar {...props} />), props };
  }

  it("renders all genre chips", async () => {
    await renderFilterBar();
    for (const genre of GENRES) {
      expect(screen.getByText(genre.label)).toBeInTheDocument();
    }
  });

  it("renders all platform chips", async () => {
    await renderFilterBar();
    for (const platform of PLATFORMS) {
      expect(screen.getByText(platform.label)).toBeInTheDocument();
    }
  });

  it("calls onToggleGenre with genre id when genre chip clicked", async () => {
    const onToggleGenre = vi.fn();
    await renderFilterBar({ onToggleGenre });
    fireEvent.click(screen.getByText("RPG"));
    expect(onToggleGenre).toHaveBeenCalledWith(12);
  });

  it("calls onTogglePlatform with platform id when platform chip clicked", async () => {
    const onTogglePlatform = vi.fn();
    await renderFilterBar({ onTogglePlatform });
    fireEvent.click(screen.getByText("PC"));
    expect(onTogglePlatform).toHaveBeenCalledWith(6);
  });

  it("marks selected genres as selected", async () => {
    await renderFilterBar({ selectedGenres: [12] });
    const rpgButton = screen.getByText("RPG").closest("button");
    expect(rpgButton?.className).toContain("border-accent");
  });
});

describe("GameGrid", () => {
  async function renderGameGrid(games: IGDBGame[], isLoading: boolean) {
    const { GameGrid } = await import("@/components/sections/GameGrid");
    return render(<GameGrid games={games} isLoading={isLoading} />);
  }

  it("shows skeletons when loading", async () => {
    const { container } = await renderGameGrid([], true);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBe(10);
  });

  it("shows empty message when no games and not loading", async () => {
    await renderGameGrid([], false);
    expect(
      screen.getByText("조건에 맞는 게임을 찾지 못했습니다.")
    ).toBeInTheDocument();
  });

  it("renders game cards when games provided", async () => {
    await renderGameGrid([mockGame, mockGameMediumRating], false);
    expect(screen.getByText("The Witcher 3: Wild Hunt")).toBeInTheDocument();
    expect(screen.getByText("Medium Rated Game")).toBeInTheDocument();
  });

  it("does not show empty message when games exist", async () => {
    const { container } = await renderGameGrid([mockGame], false);
    const view = within(container);
    expect(
      view.queryByText("\uC870\uAC74\uC5D0 \uB9DE\uB294 \uAC8C\uC784\uC744 \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.")
    ).not.toBeInTheDocument();
  });

  it("does not show skeletons when not loading", async () => {
    const { container } = await renderGameGrid([mockGame], false);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBe(0);
  });
});

describe("Skeleton", () => {
  it("renders skeleton element with animate-pulse", async () => {
    const { Skeleton } = await import("@/components/ui/Skeleton");
    const { container } = render(<Skeleton />);
    const skeleton = container.firstElementChild;
    expect(skeleton).toBeTruthy();
    expect(skeleton?.className).toContain("animate-pulse");
  });

  it("renders aspect-video placeholder", async () => {
    const { Skeleton } = await import("@/components/ui/Skeleton");
    const { container } = render(<Skeleton />);
    const aspectVideo = container.querySelector(".aspect-video");
    expect(aspectVideo).toBeTruthy();
  });
});

describe("Button", () => {
  async function renderButton(
    overrides: Partial<{
      variant: "primary" | "secondary";
      disabled: boolean;
      onClick: () => void;
      children: React.ReactNode;
    }> = {}
  ) {
    const { Button } = await import("@/components/ui/Button");
    const { children = "Click me", ...rest } = overrides;
    return render(<Button {...rest}>{children}</Button>);
  }

  it("renders children text", async () => {
    await renderButton({ children: "Submit" });
    expect(screen.getByText("Submit")).toBeInTheDocument();
  });

  it("applies primary variant styles by default", async () => {
    await renderButton();
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-accent");
  });

  it("applies secondary variant styles", async () => {
    await renderButton({ variant: "secondary" });
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-transparent");
  });

  it("is disabled when disabled prop is true", async () => {
    await renderButton({ disabled: true });
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("calls onClick handler when clicked", async () => {
    const onClick = vi.fn();
    await renderButton({ onClick });
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
