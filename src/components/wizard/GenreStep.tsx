"use client";

import { GENRES } from "@/lib/constants";
import { SelectableChip } from "@/components/ui/SelectableChip";
import { Button } from "@/components/ui/Button";

interface GenreStepProps {
  selectedGenres: string[];
  onToggleGenre: (slug: string) => void;
  onNext: () => void;
}

export function GenreStep({
  selectedGenres,
  onToggleGenre,
  onNext,
}: GenreStepProps) {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-bold">어떤 장르를 좋아하세요?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          하나 이상 선택해주세요
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {GENRES.map((genre) => (
          <SelectableChip
            key={genre.slug}
            label={genre.label}
            emoji={genre.emoji}
            selected={selectedGenres.includes(genre.slug)}
            onToggle={() => onToggleGenre(genre.slug)}
          />
        ))}
      </div>
      <Button onClick={onNext} disabled={selectedGenres.length === 0}>
        다음
      </Button>
    </div>
  );
}
