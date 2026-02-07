"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface UseHorizontalScrollOptions {
  dragThreshold?: number;
  scrollAmount?: number | "auto";
  snapScroll?: boolean;
  preventDragStart?: boolean;
}

interface ScrollHandlers {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
  onClickCapture: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent) => void;
}

interface UseHorizontalScrollReturn {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  scroll: (direction: "left" | "right") => void;
  handlers: ScrollHandlers;
}

export function useHorizontalScroll(
  options: UseHorizontalScrollOptions = {}
): UseHorizontalScrollReturn {
  const {
    dragThreshold = 5,
    scrollAmount = "auto",
    snapScroll = false,
    preventDragStart = false,
  } = options;

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const hasDragged = useRef(false);
  const storedPointerId = useRef<number | null>(null);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      resizeObserver.disconnect();
    };
  }, [updateScrollState]);

  const scroll = useCallback(
    (direction: "left" | "right") => {
      const el = scrollRef.current;
      if (!el) return;
      const amount =
        scrollAmount === "auto" ? el.clientWidth * 0.8 : scrollAmount;
      el.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      });
    },
    [scrollAmount]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const el = scrollRef.current;
      if (!el) return;
      isDragging.current = true;
      hasDragged.current = false;
      dragStartX.current = e.clientX;
      dragScrollLeft.current = el.scrollLeft;
      storedPointerId.current = e.pointerId;
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      const el = scrollRef.current;
      if (!el) return;
      const dx = e.clientX - dragStartX.current;

      if (!hasDragged.current && Math.abs(dx) > dragThreshold) {
        hasDragged.current = true;
        if (storedPointerId.current !== null) {
          el.setPointerCapture(storedPointerId.current);
        }
        if (snapScroll) {
          el.style.scrollSnapType = "none";
          el.style.scrollBehavior = "auto";
        }
        el.style.cursor = "grabbing";
      }

      if (hasDragged.current) {
        e.preventDefault();
        el.scrollLeft = dragScrollLeft.current - dx;
      }
    },
    [dragThreshold, snapScroll]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const el = scrollRef.current;
    if (!el) return;

    if (storedPointerId.current !== null) {
      if (el.hasPointerCapture(storedPointerId.current)) {
        el.releasePointerCapture(storedPointerId.current);
      }
    }

    el.style.scrollSnapType = "";
    el.style.scrollBehavior = "";
    el.style.cursor = "";
    storedPointerId.current = null;

    requestAnimationFrame(() => {
      hasDragged.current = false;
    });
  }, []);

  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, []);

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      if (preventDragStart) {
        e.preventDefault();
      }
    },
    [preventDragStart]
  );

  return {
    scrollRef,
    canScrollLeft,
    canScrollRight,
    scroll,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
      onClickCapture: handleClickCapture,
      onDragStart: handleDragStart,
    },
  };
}
