import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { StepIndicator } from "@/components/wizard/StepIndicator";
import { GenreStep } from "@/components/wizard/GenreStep";
import { TagStep } from "@/components/wizard/TagStep";
import { ResultStep } from "@/components/wizard/ResultStep";
import { WizardShell } from "@/components/wizard/WizardShell";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, ...rest } = props;
    return React.createElement("img", {
      ...rest,
      "data-fill": fill ? "true" : undefined,
    });
  },
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("StepIndicator", () => {
  it("renders all 3 step labels", () => {
    render(<StepIndicator currentStep={1} />);
    expect(screen.getByText("장르 선택")).toBeInTheDocument();
    expect(screen.getByText("키워드 선택")).toBeInTheDocument();
    expect(screen.getByText("추천 결과")).toBeInTheDocument();
  });

  it("shows checkmark for completed steps when currentStep=3", () => {
    render(<StepIndicator currentStep={3} />);
    const checkmarks = screen.getAllByText("✓");
    expect(checkmarks.length).toBeGreaterThanOrEqual(2);
  });

  it("shows step number for current and future steps", () => {
    render(<StepIndicator currentStep={2} />);
    const numbers = screen.getAllByText(/^[123]$/);
    expect(numbers.length).toBeGreaterThanOrEqual(3);
  });
});

describe("GenreStep", () => {
  it("renders title and all genre chips", () => {
    const mockOnToggleGenre = vi.fn();
    const mockOnNext = vi.fn();
    render(
      <GenreStep
        selectedGenres={[]}
        onToggleGenre={mockOnToggleGenre}
        onNext={mockOnNext}
      />
    );
    expect(screen.getByText("어떤 장르를 좋아하세요?")).toBeInTheDocument();
    expect(screen.getByText("액션")).toBeInTheDocument();
  });

  it("disables next button when no genres selected", () => {
    const mockOnToggleGenre = vi.fn();
    const mockOnNext = vi.fn();
    const { container } = render(
      <GenreStep
        selectedGenres={[]}
        onToggleGenre={mockOnToggleGenre}
        onNext={mockOnNext}
      />
    );
    const buttons = Array.from(container.querySelectorAll("button"));
    const nextButton = buttons[buttons.length - 1] as HTMLButtonElement;
    expect(nextButton.textContent?.trim()).toBe("다음");
    expect(nextButton).toBeDisabled();
  });

  it("calls onToggleGenre when chip is clicked and onNext when button is clicked", () => {
    const mockOnToggleGenre = vi.fn();
    const mockOnNext = vi.fn();
    const { container } = render(
      <GenreStep
        selectedGenres={["action"]}
        onToggleGenre={mockOnToggleGenre}
        onNext={mockOnNext}
      />
    );
    const buttons = Array.from(container.querySelectorAll("button"));
    const nextButton = buttons[buttons.length - 1] as HTMLButtonElement;
    expect(nextButton.textContent?.trim()).toBe("다음");
    expect(nextButton).not.toBeDisabled();
    fireEvent.click(nextButton);
    expect(mockOnNext).toHaveBeenCalledOnce();
  });
});

describe("TagStep", () => {
  it("renders title and all tag chips", () => {
    const mockOnToggleTag = vi.fn();
    const mockOnNext = vi.fn();
    const mockOnBack = vi.fn();
    render(
      <TagStep
        selectedTags={[]}
        onToggleTag={mockOnToggleTag}
        onNext={mockOnNext}
        onBack={mockOnBack}
      />
    );
    expect(screen.getByText("원하는 태그를 선택하세요")).toBeInTheDocument();
    expect(screen.getByText("멀티플레이어")).toBeInTheDocument();
  });

  it("calls onBack when back button is clicked", () => {
    const mockOnToggleTag = vi.fn();
    const mockOnNext = vi.fn();
    const mockOnBack = vi.fn();
    const { container } = render(
      <TagStep
        selectedTags={[]}
        onToggleTag={mockOnToggleTag}
        onNext={mockOnNext}
        onBack={mockOnBack}
      />
    );
    const buttons = container.querySelectorAll("button");
    const backButton = Array.from(buttons).find((btn) =>
      btn.textContent?.includes("이전")
    ) as HTMLButtonElement;
    expect(backButton).toBeDefined();
    fireEvent.click(backButton);
    expect(mockOnBack).toHaveBeenCalledOnce();
  });

  it("calls onNext when recommend button is clicked", () => {
    const mockOnToggleTag = vi.fn();
    const mockOnNext = vi.fn();
    const mockOnBack = vi.fn();
    const { container } = render(
      <TagStep
        selectedTags={[]}
        onToggleTag={mockOnToggleTag}
        onNext={mockOnNext}
        onBack={mockOnBack}
      />
    );
    const buttons = container.querySelectorAll("button");
    const recommendButton = Array.from(buttons).find((btn) =>
      btn.textContent?.includes("추천받기")
    ) as HTMLButtonElement;
    expect(recommendButton).toBeDefined();
    fireEvent.click(recommendButton);
    expect(mockOnNext).toHaveBeenCalledOnce();
  });
});

describe("ResultStep", () => {
  it("fetches games on mount and displays them", async () => {
    const mockGames = [
      {
        appid: 1,
        name: "Test Game 1",
        headerImage: "https://img/1.jpg",
        capsuleImage: "https://img/1.jpg",
        url: "https://store.steampowered.com/app/1/",
        released: "2024년 1월 1일",
        reviewSummary: "긍정적",
        reviewPercent: 80,
        reviewCount: 1000,
        discountPercent: null,
        priceFinal: 1500000,
        priceOriginal: 1500000,
        platforms: [{ slug: "windows" as const, label: "Windows" }],
        tagIds: [19],
      },
      {
        appid: 2,
        name: "Test Game 2",
        headerImage: "https://img/2.jpg",
        capsuleImage: "https://img/2.jpg",
        url: "https://store.steampowered.com/app/2/",
        released: "2024년 2월 1일",
        reviewSummary: "매우 긍정적",
        reviewPercent: 90,
        reviewCount: 2000,
        discountPercent: null,
        priceFinal: 2000000,
        priceOriginal: 2000000,
        platforms: [{ slug: "windows" as const, label: "Windows" }],
        tagIds: [122],
      },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ games: mockGames }),
      })
    );
    const mockOnStartOver = vi.fn();
    render(
      <ResultStep
        selectedGenres={["action"]}
        selectedTags={[]}
        onStartOver={mockOnStartOver}
      />
    );
    await waitFor(() => {
      expect(screen.getByText("Test Game 1")).toBeInTheDocument();
      expect(screen.getByText("Test Game 2")).toBeInTheDocument();
    });
  });

  it("shows error message on fetch failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
      })
    );
    const mockOnStartOver = vi.fn();
    render(
      <ResultStep
        selectedGenres={["action"]}
        selectedTags={[]}
        onStartOver={mockOnStartOver}
      />
    );
    await waitFor(() => {
      expect(
        screen.getByText(/게임 데이터를 가져올 수 없습니다/)
      ).toBeInTheDocument();
    });
  });

  it("shows empty state when no games returned", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ games: [] }),
      })
    );
    const mockOnStartOver = vi.fn();
    render(
      <ResultStep
        selectedGenres={["action"]}
        selectedTags={[]}
        onStartOver={mockOnStartOver}
      />
    );
    await waitFor(() => {
      expect(
        screen.getByText(/조건에 맞는 게임을 찾지 못했습니다/)
      ).toBeInTheDocument();
    });
  });

  it("calls onStartOver when start over button is clicked", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ games: [] }),
      })
    );
    const mockOnStartOver = vi.fn();
    const { container } = render(
      <ResultStep
        selectedGenres={["action"]}
        selectedTags={[]}
        onStartOver={mockOnStartOver}
      />
    );
    await waitFor(() => {
      const buttons = container.querySelectorAll("button");
      const startOverButton = Array.from(buttons).find((btn) =>
        btn.textContent?.includes("처음부터")
      ) as HTMLButtonElement;
      expect(startOverButton).toBeDefined();
      fireEvent.click(startOverButton);
      expect(mockOnStartOver).toHaveBeenCalledOnce();
    });
  });
});

describe("WizardShell", () => {
  it("renders step 1 (GenreStep) by default", () => {
    const { container } = render(<WizardShell />);
    const heading = container.querySelector("h2");
    expect(heading?.textContent).toContain("어떤 장르를 좋아하세요?");
  });

  it("navigates through full wizard flow: genre -> tag -> result", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ games: [] }),
      })
    );
    const { container } = render(<WizardShell />);

    const heading = container.querySelector("h2");
    expect(heading?.textContent).toContain("어떤 장르를 좋아하세요?");

    const buttons = Array.from(container.querySelectorAll("button"));
    const actionChip = buttons.find((btn) =>
      btn.textContent?.includes("액션")
    ) as HTMLButtonElement;
    expect(actionChip).toBeDefined();
    fireEvent.click(actionChip);

    const nextButton = buttons.find((btn) =>
      btn.textContent?.trim() === "다음"
    ) as HTMLButtonElement;
    expect(nextButton).toBeDefined();
    fireEvent.click(nextButton);

    await waitFor(() => {
      const newHeading = container.querySelector("h2");
      expect(newHeading?.textContent).toContain("원하는 태그를 선택하세요");
    });
  });
});
