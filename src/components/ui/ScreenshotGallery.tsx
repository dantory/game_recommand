"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { igdbImageUrl } from "@/lib/utils";
import { ScrollableRow } from "@/components/ui/ScrollableRow";

interface Screenshot {
  url: string;
}

interface ScreenshotGalleryProps {
  screenshots: Screenshot[];
}

export function ScreenshotGallery({ screenshots }: ScreenshotGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const open = useCallback((idx: number) => {
    setSelectedIndex(idx);
  }, []);

  const close = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const prev = useCallback(() => {
    setSelectedIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  }, []);

  const next = useCallback(() => {
    setSelectedIndex((i) =>
      i !== null && i < screenshots.length - 1 ? i + 1 : i
    );
  }, [screenshots.length]);

  useEffect(() => {
    if (selectedIndex === null) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedIndex, close, prev, next]);

  return (
    <>
      <ScrollableRow snapScroll={false} preventDragStart dragThreshold={3}>
        {screenshots.map((shot, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => open(idx)}
            className="relative aspect-video w-[300px] shrink-0 overflow-hidden rounded-xl border border-border md:w-[400px] cursor-pointer transition-opacity hover:opacity-80"
          >
            <Image
              src={igdbImageUrl(shot.url, "t_screenshot_big")}
              alt={`Screenshot ${idx + 1}`}
              fill
              className="object-cover"
              draggable={false}
            />
          </button>
        ))}
      </ScrollableRow>

      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="스크린샷 확대 보기"
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="닫기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>

          {selectedIndex > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="이전 스크린샷"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          )}

          {selectedIndex < screenshots.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="다음 스크린샷"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          )}

          <div
            className="relative max-h-[85vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={igdbImageUrl(screenshots[selectedIndex].url, "t_1080p")}
              alt={`Screenshot ${selectedIndex + 1}`}
              width={1920}
              height={1080}
              className="max-h-[85vh] w-auto rounded-lg object-contain"
              priority
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
              {selectedIndex + 1} / {screenshots.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
