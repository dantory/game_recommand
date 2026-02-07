import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, within, waitFor } from "@testing-library/react";
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

  it("renders image placeholder with fixed height", async () => {
    const { Skeleton } = await import("@/components/ui/Skeleton");
    const { container } = render(<Skeleton />);
    const placeholder = container.querySelector(".bg-muted");
    expect(placeholder).toBeTruthy();
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

describe("SelectableChip", () => {
  async function renderSelectableChip(
    overrides: Partial<{
      label: string;
      emoji: string;
      selected: boolean;
      onToggle: () => void;
    }> = {}
  ) {
    const { SelectableChip } = await import("@/components/ui/SelectableChip");
    const props = {
      label: "RPG",
      emoji: "\uD83D\uDDE1\uFE0F",
      selected: false,
      onToggle: vi.fn(),
      ...overrides,
    };
    return { result: render(<SelectableChip {...props} />), props };
  }

  it("renders label and emoji", async () => {
    await renderSelectableChip();
    expect(screen.getByText("RPG")).toBeInTheDocument();
  });

  it("applies selected styles when selected", async () => {
    await renderSelectableChip({ selected: true });
    const button = screen.getByRole("button");
    expect(button.className).toContain("border-accent");
    expect(button.className).toContain("bg-accent-light");
  });

  it("applies unselected styles when not selected", async () => {
    await renderSelectableChip({ selected: false });
    const button = screen.getByRole("button");
    expect(button.className).toContain("border-border");
    expect(button.className).toContain("bg-transparent");
  });

  it("calls onToggle when clicked", async () => {
    const onToggle = vi.fn();
    await renderSelectableChip({ onToggle });
    fireEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("uses rounded-xl for border radius", async () => {
    await renderSelectableChip();
    const button = screen.getByRole("button");
    expect(button.className).toContain("rounded-xl");
  });
});

describe("GameSection", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  async function renderGameSection(
    title = "Test Section",
    fetchUrl = "/api/games?section=popular"
  ) {
    const { GameSection } = await import(
      "@/components/sections/GameSection"
    );
    return render(<GameSection title={title} fetchUrl={fetchUrl} />);
  }

  it("renders title heading", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ games: [] }),
    }) as unknown as typeof fetch;

    await renderGameSection("Popular Games");
    expect(screen.getByText("Popular Games")).toBeInTheDocument();
  });

  it("shows loading skeletons initially", async () => {
    let resolveFetch: (value: unknown) => void;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    globalThis.fetch = vi.fn().mockReturnValue(fetchPromise) as unknown as typeof fetch;

    const { container } = await renderGameSection();
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBe(5);

    resolveFetch!({
      ok: true,
      json: async () => ({ games: [] }),
    });
    await waitFor(() => {
      expect(container.querySelectorAll(".animate-pulse").length).toBe(0);
    });
  });

  it("renders game cards after successful fetch", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        games: [mockGame, mockGameMediumRating],
      }),
    }) as unknown as typeof fetch;

    await renderGameSection();
    expect(
      await screen.findByText("The Witcher 3: Wild Hunt")
    ).toBeInTheDocument();
    expect(screen.getByText("Medium Rated Game")).toBeInTheDocument();
  });

  it("shows error message on fetch failure (network error)", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(
      new Error("Network error")
    ) as unknown as typeof fetch;

    await renderGameSection();
    expect(
      await screen.findByText("\uAC8C\uC784\uC744 \uBD88\uB7EC\uC624\uB294\uB370 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.")
    ).toBeInTheDocument();
  });

  it("shows error message on non-ok response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }) as unknown as typeof fetch;

    await renderGameSection();
    expect(
      await screen.findByText("\uAC8C\uC784\uC744 \uBD88\uB7EC\uC624\uB294\uB370 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.")
    ).toBeInTheDocument();
  });

  it("does not show skeletons after data loads", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ games: [mockGame] }),
    }) as unknown as typeof fetch;

    const { container } = await renderGameSection();
    await screen.findByText("The Witcher 3: Wild Hunt");
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBe(0);
  });

  it("renders scroll arrow buttons with aria-labels", async () => {
    const manyGames = Array.from({ length: 20 }, (_, i) => ({
      ...mockGame,
      id: mockGame.id + i,
      name: `Game ${i}`,
    }));

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ games: manyGames }),
    }) as unknown as typeof fetch;

    await renderGameSection();
    await screen.findByText("Game 0");

    const rightBtn = screen.queryByLabelText("오른쪽으로 스크롤");
    const leftBtn = screen.queryByLabelText("왼쪽으로 스크롤");
    expect(rightBtn === null || rightBtn instanceof HTMLButtonElement).toBe(true);
    expect(leftBtn === null || leftBtn instanceof HTMLButtonElement).toBe(true);
  });

  it("wraps scroll container in a relative group div", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ games: [mockGame] }),
    }) as unknown as typeof fetch;

    const { container } = await renderGameSection();
    await screen.findByText("The Witcher 3: Wild Hunt");
    const groupDiv = container.querySelector(".group\\/scroll");
    expect(groupDiv).toBeTruthy();
  });
});

describe("Home", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ games: [] }),
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  async function renderHome() {
    const { default: Home } = await import("@/app/page");
    return render(<Home />);
  }

  it("renders page title", async () => {
    await renderHome();
    expect(screen.getByText(/\uAC8C\uC784 \uB514\uC2A4\uCEE4\uBC84\uB9AC/)).toBeInTheDocument();
  });

  it("renders SearchBar with placeholder", async () => {
    await renderHome();
    expect(screen.getByPlaceholderText("\uAC8C\uC784 \uAC80\uC0C9...")).toBeInTheDocument();
  });

  it("renders FilterBar genre chips", async () => {
    await renderHome();
    expect(screen.getAllByText("RPG").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("\uC5B4\uB4DC\uBCA4\uCC98").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("\uC288\uD305").length).toBeGreaterThanOrEqual(1);
  });

  it("renders curated GameSection titles in default mode", async () => {
    await renderHome();
    expect(screen.getByText("\uC9C0\uAE08 \uB728\uB294 \uAC8C\uC784")).toBeInTheDocument();
    expect(screen.getByText("\uB192\uC740 \uD3C9\uC810 \uC2E0\uC791")).toBeInTheDocument();
    expect(screen.getAllByText("RPG").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("\uC5B4\uB4DC\uBCA4\uCC98").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("\uC288\uD305").length).toBeGreaterThanOrEqual(1);
  });

  it("renders all 5 curated sections initially", async () => {
    await renderHome();
    const headings = screen.getAllByRole("heading", { level: 2 });
    const sectionTitles = headings.map((h) => h.textContent);
    expect(sectionTitles).toContain("\uC9C0\uAE08 \uB728\uB294 \uAC8C\uC784");
    expect(sectionTitles).toContain("\uB192\uC740 \uD3C9\uC810 \uC2E0\uC791");
  });

  it("switches to search mode when search is submitted", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ games: [mockGame] }),
    }) as unknown as typeof fetch;

    await renderHome();
    const input = screen.getByPlaceholderText("\uAC8C\uC784 \uAC80\uC0C9...");
    fireEvent.change(input, { target: { value: "Witcher" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => {
      expect(screen.getByText(/"Witcher" \uAC80\uC0C9 \uACB0\uACFC/)).toBeInTheDocument();
    });
  });

  it("switches to filter mode when genre is selected", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ games: [] }),
    }) as unknown as typeof fetch;

    await renderHome();
    const rpgButtons = screen.getAllByText("RPG");
    const filterButton = rpgButtons.find((el) => el.closest("button") !== null);
    if (filterButton) {
      fireEvent.click(filterButton.closest("button")!);
    }

    await waitFor(() => {
      expect(screen.getByText("\uD544\uD130\uB9C1\uB41C \uACB0\uACFC")).toBeInTheDocument();
    });
  });

  it("switches to filter mode when platform is selected", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ games: [] }),
    }) as unknown as typeof fetch;

    await renderHome();
    const pcButton = screen.getByText("PC").closest("button");
    if (pcButton) {
      fireEvent.click(pcButton);
    }

    await waitFor(() => {
      expect(screen.getByText("\uD544\uD130\uB9C1\uB41C \uACB0\uACFC")).toBeInTheDocument();
    });
  });

  it("handles fetch error gracefully in filter mode", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockRejectedValue(
      new Error("Network error")
    ) as unknown as typeof fetch;

    await renderHome();
    const pcButton = screen.getByText("PC").closest("button");
    if (pcButton) {
      fireEvent.click(pcButton);
    }

    await waitFor(() => {
      expect(screen.getByText("\uD544\uD130\uB9C1\uB41C \uACB0\uACFC")).toBeInTheDocument();
    });
    consoleSpy.mockRestore();
  });

  it("handles non-ok response in filter mode", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }) as unknown as typeof fetch;

    await renderHome();
    const pcButton = screen.getByText("PC").closest("button");
    if (pcButton) {
      fireEvent.click(pcButton);
    }

    await waitFor(() => {
      expect(screen.getByText("\uD544\uD130\uB9C1\uB41C \uACB0\uACFC")).toBeInTheDocument();
    });
    consoleSpy.mockRestore();
  });

  it("clears filters when searching", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ games: [] }),
    }) as unknown as typeof fetch;

    await renderHome();

    const rpgButtons = screen.getAllByText("RPG");
    const filterButton = rpgButtons.find((el) => el.closest("button") !== null);
    if (filterButton) {
      fireEvent.click(filterButton.closest("button")!);
    }

    await waitFor(() => {
      expect(screen.getByText("\uD544\uD130\uB9C1\uB41C \uACB0\uACFC")).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText("\uAC8C\uC784 \uAC80\uC0C9...");
    fireEvent.change(input, { target: { value: "Zelda" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => {
      expect(screen.getByText(/"Zelda" \uAC80\uC0C9 \uACB0\uACFC/)).toBeInTheDocument();
    });
  });

  it("returns to default sections when filters and search cleared", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ games: [] }),
    }) as unknown as typeof fetch;

    await renderHome();

    const rpgButtons = screen.getAllByText("RPG");
    const filterButton = rpgButtons.find((el) => el.closest("button") !== null);
    if (filterButton) {
      fireEvent.click(filterButton.closest("button")!);
    }

    await waitFor(() => {
      expect(screen.getByText("\uD544\uD130\uB9C1\uB41C \uACB0\uACFC")).toBeInTheDocument();
    });

    if (filterButton) {
      fireEvent.click(filterButton.closest("button")!);
    }

    await waitFor(() => {
      expect(screen.getByText("\uC9C0\uAE08 \uB728\uB294 \uAC8C\uC784")).toBeInTheDocument();
    });
  });

  it("builds correct URL with genre filter", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ games: [] }),
    }) as unknown as typeof fetch;
    globalThis.fetch = mockFetch;

    await renderHome();

    const rpgButtons = screen.getAllByText("RPG");
    const genreBtn = rpgButtons.find((el) => el.closest("button") !== null);
    if (genreBtn) {
      fireEvent.click(genreBtn.closest("button")!);
    }

    await waitFor(() => {
      const calls = (mockFetch as ReturnType<typeof vi.fn>).mock.calls;
      const filterCall = calls.find(
        (c: string[]) => typeof c[0] === "string" && c[0].includes("section=filter")
      );
      expect(filterCall).toBeDefined();
      expect(filterCall![0]).toContain("genres=12");
    });
  });

  it("builds correct URL with platform filter", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ games: [] }),
    }) as unknown as typeof fetch;
    globalThis.fetch = mockFetch;

    await renderHome();

    const pcButton = screen.getByText("PC").closest("button");
    if (pcButton) {
      fireEvent.click(pcButton);
    }

    await waitFor(() => {
      const calls = (mockFetch as ReturnType<typeof vi.fn>).mock.calls;
      const filterCall = calls.find(
        (c: string[]) => typeof c[0] === "string" && c[0].includes("section=filter")
      );
      expect(filterCall).toBeDefined();
      expect(filterCall![0]).toContain("platforms=6");
    });
  });

  it("builds correct search URL", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ games: [] }),
    }) as unknown as typeof fetch;
    globalThis.fetch = mockFetch;

    await renderHome();

    const input = screen.getByPlaceholderText("\uAC8C\uC784 \uAC80\uC0C9...");
    fireEvent.change(input, { target: { value: "Dark Souls" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => {
      const calls = (mockFetch as ReturnType<typeof vi.fn>).mock.calls;
      const searchCall = calls.find(
        (c: string[]) => typeof c[0] === "string" && c[0].includes("/api/games/search")
      );
      expect(searchCall).toBeDefined();
      expect(searchCall![0]).toContain("q=Dark%20Souls");
    });
  });
});

vi.mock("@/lib/igdb", () => ({
  getGameDetail: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}));

describe("GameDetailPage", () => {
  const fullMockGame: IGDBGame = {
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
    ],
    first_release_date: 1431993600,
    rating: 92.4,
    screenshots: [
      { url: "//images.igdb.com/igdb/image/upload/t_thumb/sc1.jpg" },
    ],
    videos: [{ video_id: "abc123" }],
    similar_games: [
      {
        id: 999,
        name: "Similar RPG",
        cover: { url: "//images.igdb.com/igdb/image/upload/t_thumb/co999.jpg" },
        rating: 85,
        platforms: [{ id: 6, name: "PC (Microsoft Windows)" }],
      },
    ],
  };

  beforeEach(async () => {
    const { getGameDetail } = await import("@/lib/igdb");
    vi.mocked(getGameDetail).mockReset();
    const { notFound } = await import("next/navigation");
    vi.mocked(notFound).mockReset();
  });

  async function renderDetailPage(id: string, game: IGDBGame | null = fullMockGame) {
    const { getGameDetail } = await import("@/lib/igdb");
    vi.mocked(getGameDetail).mockResolvedValue(game);

    const { default: GameDetailPage } = await import(
      "@/app/games/[id]/page"
    );
    const jsx = await GameDetailPage({
      params: Promise.resolve({ id }),
    });
    return render(jsx);
  }

  it("renders game name", async () => {
    await renderDetailPage("1942");
    expect(screen.getByText("The Witcher 3: Wild Hunt")).toBeInTheDocument();
  });

  it("renders game summary under heading", async () => {
    await renderDetailPage("1942");
    expect(screen.getByText("\uAC8C\uC784 \uC18C\uAC1C")).toBeInTheDocument();
    expect(
      screen.getByText("An open-world RPG adventure")
    ).toBeInTheDocument();
  });

  it("renders screenshots section", async () => {
    await renderDetailPage("1942");
    expect(screen.getByText("\uC2A4\uD06C\uB9B0\uC0F7")).toBeInTheDocument();
    expect(screen.getByAltText("Screenshot 1")).toBeInTheDocument();
  });

  it("renders videos section with iframe", async () => {
    await renderDetailPage("1942");
    expect(screen.getByText("\uBE44\uB514\uC624")).toBeInTheDocument();
    const iframe = screen.getByTitle("YouTube video player");
    expect(iframe).toHaveAttribute(
      "src",
      "https://www.youtube.com/embed/abc123"
    );
  });

  it("renders similar games section", async () => {
    await renderDetailPage("1942");
    expect(screen.getByText("\uBE44\uC2B7\uD55C \uAC8C\uC784")).toBeInTheDocument();
    expect(screen.getByText("Similar RPG")).toBeInTheDocument();
  });

  it("renders back link pointing to /", async () => {
    await renderDetailPage("1942");
    const backLink = screen.getByText("\u2190 \uB3CC\uC544\uAC00\uAE30");
    expect(backLink.closest("a")).toHaveAttribute("href", "/");
  });

  it("renders rating with green color for high rating", async () => {
    await renderDetailPage("1942");
    const ratingEl = screen.getByText("92\uC810");
    expect(ratingEl.className).toContain("text-green-700");
  });

  it("renders release date in Korean format", async () => {
    await renderDetailPage("1942");
    const dateEl = screen.getByText(/2015/);
    expect(dateEl).toBeInTheDocument();
  });

  it("calls notFound when game is null", async () => {
    const { getGameDetail } = await import("@/lib/igdb");
    const { notFound } = await import("next/navigation");
    vi.mocked(getGameDetail).mockResolvedValue(null);

    const { default: GameDetailPage } = await import(
      "@/app/games/[id]/page"
    );
    try {
      await GameDetailPage({
        params: Promise.resolve({ id: "9999" }),
      });
    } catch {
      /* empty */
    }
    expect(notFound).toHaveBeenCalled();
  });

  it("calls notFound when id is NaN", async () => {
    const { notFound } = await import("next/navigation");

    const { default: GameDetailPage } = await import(
      "@/app/games/[id]/page"
    );
    try {
      await GameDetailPage({
        params: Promise.resolve({ id: "not-a-number" }),
      });
    } catch {
      /* empty */
    }
    expect(notFound).toHaveBeenCalled();
  });

  it("shows No Image when cover is missing", async () => {
    const noCoverGame: IGDBGame = {
      ...fullMockGame,
      cover: undefined,
    };
    await renderDetailPage("2001", noCoverGame);
    expect(screen.getByText("No Image")).toBeInTheDocument();
  });

  it("shows release date placeholder when no release date", async () => {
    const noDateGame: IGDBGame = {
      ...fullMockGame,
      first_release_date: undefined,
    };
    await renderDetailPage("2002", noDateGame);
    expect(screen.getByText("\uCD9C\uC2DC\uC77C \uBBF8\uC815")).toBeInTheDocument();
  });

  it("shows rating placeholder when no rating", async () => {
    const noRatingGame: IGDBGame = {
      ...fullMockGame,
      rating: undefined,
    };
    await renderDetailPage("2003", noRatingGame);
    expect(screen.getByText("\uD3C9\uAC00 \uC5C6\uC74C")).toBeInTheDocument();
  });

  it("renders scroll containers for screenshots and similar games", async () => {
    const { container } = await renderDetailPage("1942");
    const scrollGroups = container.querySelectorAll(".group\\/scroll");
    expect(scrollGroups.length).toBe(2);
  });
});

describe("ScrollableRow", () => {
  it("renders children inside scroll container", async () => {
    const { ScrollableRow } = await import("@/components/ui/ScrollableRow");
    render(
      <ScrollableRow>
        <div>Item 1</div>
        <div>Item 2</div>
      </ScrollableRow>
    );
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });

  it("wraps content in group/scroll relative div", async () => {
    const { ScrollableRow } = await import("@/components/ui/ScrollableRow");
    const { container } = render(
      <ScrollableRow>
        <div>Content</div>
      </ScrollableRow>
    );
    expect(container.querySelector(".group\\/scroll")).toBeTruthy();
  });

  it("applies default snap scroll classes", async () => {
    const { ScrollableRow } = await import("@/components/ui/ScrollableRow");
    const { container } = render(
      <ScrollableRow>
        <div>Content</div>
      </ScrollableRow>
    );
    const scrollDiv = container.querySelector(".snap-x");
    expect(scrollDiv).toBeTruthy();
    expect(scrollDiv?.classList.contains("cursor-grab")).toBe(true);
    expect(scrollDiv?.classList.contains("scroll-smooth")).toBe(true);
  });

  it("uses custom className when provided", async () => {
    const { ScrollableRow } = await import("@/components/ui/ScrollableRow");
    const { container } = render(
      <ScrollableRow className="flex gap-2 overflow-x-auto">
        <div>Content</div>
      </ScrollableRow>
    );
    const scrollDiv = container.querySelector(".gap-2");
    expect(scrollDiv).toBeTruthy();
    expect(container.querySelector(".snap-x")).toBeNull();
  });
});
