"use client";

import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

const STEPS = [
  { step: 1 as const, label: "장르 선택" },
  { step: 2 as const, label: "키워드 선택" },
  { step: 3 as const, label: "추천 결과" },
];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-6">
      {STEPS.map(({ step, label }, index) => (
        <div key={step} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors",
                step < currentStep &&
                  "bg-accent text-white",
                step === currentStep &&
                  "bg-accent text-white",
                step > currentStep &&
                  "bg-muted text-muted-foreground"
              )}
            >
              {step < currentStep ? "✓" : step}
            </div>
            <span
              className={cn(
                "text-xs",
                step === currentStep
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {label}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <div
              className={cn(
                "mb-5 h-0.5 w-8",
                step < currentStep ? "bg-accent" : "bg-border"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
