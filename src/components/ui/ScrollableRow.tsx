"use client";

import { useHorizontalScroll } from "@/hooks/useHorizontalScroll";

interface ScrollableRowProps {
  children: React.ReactNode;
  snapScroll?: boolean;
  preventDragStart?: boolean;
  dragThreshold?: number;
  scrollAmount?: number | "auto";
  className?: string;
}

export function ScrollableRow({
  children,
  snapScroll = true,
  preventDragStart = false,
  dragThreshold,
  scrollAmount,
  className,
}: ScrollableRowProps) {
  const { scrollRef, canScrollLeft, canScrollRight, scroll, handlers } =
    useHorizontalScroll({
      snapScroll,
      preventDragStart,
      dragThreshold,
      scrollAmount,
    });

  return (
    <div className="group/scroll relative">
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute -left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-lg border border-border opacity-0 transition-opacity group-hover/scroll:opacity-100 hover:bg-muted"
          aria-label="왼쪽으로 스크롤"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute -right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-lg border border-border opacity-0 transition-opacity group-hover/scroll:opacity-100 hover:bg-muted"
          aria-label="오른쪽으로 스크롤"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      )}
      <div
        ref={scrollRef}
        {...handlers}
        className={
          className ??
          "flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide scroll-smooth cursor-grab select-none"
        }
      >
        {children}
      </div>
    </div>
  );
}
