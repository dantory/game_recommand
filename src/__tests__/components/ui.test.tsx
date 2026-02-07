import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
import type { SteamGame } from "@/types/game";
import { Button } from "@/components/ui/Button";
import { SelectableChip } from "@/components/ui/SelectableChip";
import { GameCard } from "@/components/ui/GameCard";
import { PlatformBadge } from "@/components/ui/PlatformBadge";
import { Skeleton } from "@/components/ui/Skeleton";

afterEach(cleanup);

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, ...rest } = props;
    return React.createElement("img", {
      ...rest,
      "data-fill": fill ? "true" : undefined,
    });
  },
}));

describe("Button", () => {
  it("renders children text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("applies primary variant by default", () => {
    const { container } = render(<Button>Primary</Button>);
    const button = container.querySelector("button");
    expect(button?.className).toContain("bg-accent");
  });

  it("applies secondary variant classes when specified", () => {
    const { container } = render(<Button variant="secondary">Secondary</Button>);
    const button = container.querySelector("button");
    expect(button?.className).toContain("border");
    expect(button?.className).toContain("bg-transparent");
  });

  it("forwards disabled prop", () => {
    const { container } = render(<Button disabled>Disabled</Button>);
    const button = container.querySelector("button") as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it("fires onClick handler", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText("Click"));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});

describe("SelectableChip", () => {
  it("renders emoji and label", () => {
    render(
      <SelectableChip
        emoji="🎮"
        label="Action"
        selected={false}
        onToggle={() => {}}
      />
    );
    expect(screen.getByText("🎮")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
  });

  it("calls onToggle when clicked", () => {
    const handleToggle = vi.fn();
    render(
      <SelectableChip
        emoji="🎮"
        label="Action"
        selected={false}
        onToggle={handleToggle}
      />
    );
    fireEvent.click(screen.getByRole("button"));
    expect(handleToggle).toHaveBeenCalledOnce();
  });

  it("applies selected styles when selected is true", () => {
    const { container } = render(
      <SelectableChip
        emoji="🎮"
        label="Action"
        selected={true}
        onToggle={() => {}}
      />
    );
    const button = container.querySelector("button");
    expect(button?.className).toContain("border-accent");
    expect(button?.className).toContain("bg-accent-light");
  });
});

describe("GameCard", () => {
  const mockGame: SteamGame = {
    appid: 123,
    name: "Test Game",
    headerImage: "https://example.com/image.jpg",
    capsuleImage: "https://example.com/capsule.jpg",
    url: "https://store.steampowered.com/app/123",
    released: "2024-01-01",
    reviewSummary: "Overwhelmingly Positive",
    reviewPercent: 95,
    reviewCount: 1000,
    priceFinal: 3360000,
    priceOriginal: 3360000,
    discountPercent: 0,
    platforms: [{ slug: "windows" as const, label: "Windows" }],
    tagIds: [1, 2],
  };

  it("renders game name and links to Steam URL", () => {
    render(<GameCard game={mockGame} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", mockGame.url);
    expect(screen.getByText(mockGame.name)).toBeInTheDocument();
  });

  it("displays formatted price in KRW", () => {
    render(<GameCard game={mockGame} />);
    expect(screen.getByText("₩ 33,600")).toBeInTheDocument();
  });

  it("shows 무료 for free games", () => {
    const freeGame = { ...mockGame, priceFinal: 0 };
    render(<GameCard game={freeGame} />);
    expect(screen.getByText("무료")).toBeInTheDocument();
  });

  it("shows discount badge when discountPercent > 0", () => {
    const discountedGame = { ...mockGame, discountPercent: 20 };
    render(<GameCard game={discountedGame} />);
    expect(screen.getByText("-20%")).toBeInTheDocument();
  });

  it("shows 평가 없음 when reviewSummary is null", () => {
    const noReviewGame = { ...mockGame, reviewSummary: null };
    render(<GameCard game={noReviewGame} />);
    expect(screen.getByText("평가 없음")).toBeInTheDocument();
  });
});

describe("PlatformBadge", () => {
  it("renders platform labels", () => {
    const platforms = [{ slug: "windows" as const, label: "Windows" }];
    render(<PlatformBadge platforms={platforms} />);
    expect(screen.getByText("Windows")).toBeInTheDocument();
  });

  it("renders null for empty platforms array", () => {
    const { container } = render(<PlatformBadge platforms={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders multiple platforms", () => {
    const platforms = [
      { slug: "windows" as const, label: "Windows" },
      { slug: "mac" as const, label: "macOS" },
      { slug: "linux" as const, label: "Linux" },
    ];
    render(<PlatformBadge platforms={platforms} />);
    expect(screen.getByText("Windows")).toBeInTheDocument();
    expect(screen.getByText("macOS")).toBeInTheDocument();
    expect(screen.getByText("Linux")).toBeInTheDocument();
  });
});

describe("Skeleton", () => {
  it("renders placeholder with animate-pulse class", () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
  });
});
