"use client";

import { useState, useCallback } from "react";
import { StepIndicator } from "./StepIndicator";
import { GenreStep } from "./GenreStep";
import { TagStep } from "./TagStep";
import { ResultStep } from "./ResultStep";

export function WizardShell() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleGenre = useCallback((slug: string) => {
    setSelectedGenres((prev) =>
      prev.includes(slug) ? prev.filter((g) => g !== slug) : [...prev, slug]
    );
  }, []);

  const toggleTag = useCallback((slug: string) => {
    setSelectedTags((prev) =>
      prev.includes(slug) ? prev.filter((t) => t !== slug) : [...prev, slug]
    );
  }, []);

  const handleStartOver = useCallback(() => {
    setStep(1);
    setSelectedGenres([]);
    setSelectedTags([]);
  }, []);

  return (
    <div>
      <StepIndicator currentStep={step} />
      {step === 1 && (
        <GenreStep
          selectedGenres={selectedGenres}
          onToggleGenre={toggleGenre}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <TagStep
          selectedTags={selectedTags}
          onToggleTag={toggleTag}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <ResultStep
          selectedGenres={selectedGenres}
          selectedTags={selectedTags}
          onStartOver={handleStartOver}
        />
      )}
    </div>
  );
}
