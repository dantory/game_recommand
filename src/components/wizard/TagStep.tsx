"use client";

import { TAGS } from "@/lib/constants";
import { SelectableChip } from "@/components/ui/SelectableChip";
import { Button } from "@/components/ui/Button";

interface TagStepProps {
  selectedTags: string[];
  onToggleTag: (slug: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function TagStep({
  selectedTags,
  onToggleTag,
  onNext,
  onBack,
}: TagStepProps) {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-bold">원하는 태그를 선택하세요</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          선택하지 않아도 괜찮아요
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {TAGS.map((tag) => (
          <SelectableChip
            key={tag.slug}
            label={tag.label}
            emoji={tag.emoji}
            selected={selectedTags.includes(tag.slug)}
            onToggle={() => onToggleTag(tag.slug)}
          />
        ))}
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack}>
          이전
        </Button>
        <Button onClick={onNext}>추천받기</Button>
      </div>
    </div>
  );
}
