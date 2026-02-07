import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHorizontalScroll } from "@/hooks/useHorizontalScroll";

function createMockElement(overrides: Partial<HTMLDivElement> = {}) {
  return {
    scrollLeft: 0,
    clientWidth: 500,
    scrollWidth: 1500,
    scrollBy: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    setPointerCapture: vi.fn(),
    releasePointerCapture: vi.fn(),
    hasPointerCapture: vi.fn(() => false),
    style: { scrollSnapType: "", scrollBehavior: "", cursor: "" },
    ...overrides,
  } as unknown as HTMLDivElement;
}

function createPointerEvent(overrides: Partial<React.PointerEvent> = {}) {
  return {
    clientX: 0,
    pointerId: 1,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...overrides,
  } as unknown as React.PointerEvent;
}

function createMouseEvent(overrides: Partial<React.MouseEvent> = {}) {
  return {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...overrides,
  } as unknown as React.MouseEvent;
}

function createDragEvent(overrides: Partial<React.DragEvent> = {}) {
  return {
    preventDefault: vi.fn(),
    ...overrides,
  } as unknown as React.DragEvent;
}

describe("useHorizontalScroll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns expected shape", () => {
    const { result } = renderHook(() => useHorizontalScroll());
    expect(result.current.scrollRef).toBeDefined();
    expect(result.current.canScrollLeft).toBe(false);
    expect(result.current.canScrollRight).toBe(false);
    expect(typeof result.current.scroll).toBe("function");
    expect(result.current.handlers.onPointerDown).toBeDefined();
    expect(result.current.handlers.onPointerMove).toBeDefined();
    expect(result.current.handlers.onPointerUp).toBeDefined();
    expect(result.current.handlers.onPointerCancel).toBeDefined();
    expect(result.current.handlers.onClickCapture).toBeDefined();
    expect(result.current.handlers.onDragStart).toBeDefined();
  });

  describe("scroll state", () => {
    it("canScrollLeft is false at start", () => {
      const { result } = renderHook(() => useHorizontalScroll());
      expect(result.current.canScrollLeft).toBe(false);
    });

    it("canScrollRight is false at start", () => {
      const { result } = renderHook(() => useHorizontalScroll());
      expect(result.current.canScrollRight).toBe(false);
    });
  });

  describe("scroll function", () => {
    it("scrolls right with auto amount (80% of clientWidth)", () => {
      const el = createMockElement();
      const { result } = renderHook(() => useHorizontalScroll());
      act(() => { (result.current.scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el; });
      act(() => { result.current.scroll("right"); });
      expect(el.scrollBy).toHaveBeenCalledWith({ left: 400, behavior: "smooth" });
    });

    it("scrolls left with auto amount", () => {
      const el = createMockElement();
      const { result } = renderHook(() => useHorizontalScroll());
      act(() => { (result.current.scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el; });
      act(() => { result.current.scroll("left"); });
      expect(el.scrollBy).toHaveBeenCalledWith({ left: -400, behavior: "smooth" });
    });

    it("scrolls with fixed amount when specified", () => {
      const el = createMockElement();
      const { result } = renderHook(() => useHorizontalScroll({ scrollAmount: 200 }));
      act(() => { (result.current.scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el; });
      act(() => { result.current.scroll("right"); });
      expect(el.scrollBy).toHaveBeenCalledWith({ left: 200, behavior: "smooth" });
    });

    it("does nothing when scrollRef is null", () => {
      const { result } = renderHook(() => useHorizontalScroll());
      act(() => { result.current.scroll("right"); });
    });
  });

  describe("pointer drag", () => {
    it("does not capture on pointerdown (defers until threshold)", () => {
      const el = createMockElement();
      const { result } = renderHook(() => useHorizontalScroll());
      act(() => { (result.current.scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el; });
      act(() => { result.current.handlers.onPointerDown(createPointerEvent({ clientX: 100 })); });
      expect(el.setPointerCapture).not.toHaveBeenCalled();
    });

    it("captures after drag threshold exceeded", () => {
      const el = createMockElement();
      const { result } = renderHook(() => useHorizontalScroll({ dragThreshold: 5 }));
      act(() => { (result.current.scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el; });
      act(() => { result.current.handlers.onPointerDown(createPointerEvent({ clientX: 100, pointerId: 3 })); });

      const moveSmall = createPointerEvent({ clientX: 98 });
      act(() => { result.current.handlers.onPointerMove(moveSmall); });
      expect(el.setPointerCapture).not.toHaveBeenCalled();
      expect(moveSmall.preventDefault).not.toHaveBeenCalled();

      const moveBig = createPointerEvent({ clientX: 90 });
      act(() => { result.current.handlers.onPointerMove(moveBig); });
      expect(el.setPointerCapture).toHaveBeenCalledWith(3);
      expect(el.style.cursor).toBe("grabbing");
      expect(moveBig.preventDefault).toHaveBeenCalled();
    });

    it("sets snap scroll styles when drag starts with snapScroll", () => {
      const el = createMockElement();
      const { result } = renderHook(() => useHorizontalScroll({ snapScroll: true, dragThreshold: 3 }));
      act(() => { (result.current.scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el; });
      act(() => { result.current.handlers.onPointerDown(createPointerEvent({ clientX: 100 })); });
      act(() => { result.current.handlers.onPointerMove(createPointerEvent({ clientX: 90 })); });
      expect(el.style.scrollSnapType).toBe("none");
      expect(el.style.scrollBehavior).toBe("auto");
    });

    it("does not set snap scroll when snapScroll is false", () => {
      const el = createMockElement();
      const { result } = renderHook(() => useHorizontalScroll({ snapScroll: false, dragThreshold: 3 }));
      act(() => { (result.current.scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el; });
      act(() => { result.current.handlers.onPointerDown(createPointerEvent({ clientX: 100 })); });
      act(() => { result.current.handlers.onPointerMove(createPointerEvent({ clientX: 90 })); });
      expect(el.style.scrollSnapType).toBe("");
    });

    it("updates scrollLeft on pointermove after threshold", () => {
      const el = createMockElement({ scrollLeft: 50 });
      const { result } = renderHook(() => useHorizontalScroll({ dragThreshold: 3 }));
      act(() => { (result.current.scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el; });
      act(() => { result.current.handlers.onPointerDown(createPointerEvent({ clientX: 100 })); });
      const moveEvent = createPointerEvent({ clientX: 80 });
      act(() => { result.current.handlers.onPointerMove(moveEvent); });
      expect(moveEvent.preventDefault).toHaveBeenCalled();
      expect(el.scrollLeft).toBe(70);
    });

    it("does not scroll before drag threshold", () => {
      const el = createMockElement({ scrollLeft: 50 });
      const { result } = renderHook(() => useHorizontalScroll({ dragThreshold: 10 }));
      act(() => { (result.current.scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el; });
      act(() => { result.current.handlers.onPointerDown(createPointerEvent({ clientX: 100 })); });
      act(() => { result.current.handlers.onPointerMove(createPointerEvent({ clientX: 95 })); });
      expect(el.scrollLeft).toBe(50);
    });

    it("releases capture on pointerup", () => {
      const el = createMockElement();
      (el.hasPointerCapture as ReturnType<typeof vi.fn>).mockReturnValue(true);
      const { result } = renderHook(() => useHorizontalScroll({ dragThreshold: 3 }));
      act(() => { (result.current.scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el; });
      act(() => { result.current.handlers.onPointerDown(createPointerEvent({ clientX: 100, pointerId: 7 })); });
      act(() => { result.current.handlers.onPointerMove(createPointerEvent({ clientX: 50, pointerId: 7 })); });
      act(() => { result.current.handlers.onPointerUp(createPointerEvent({ clientX: 50, pointerId: 7 })); });
      expect(el.releasePointerCapture).toHaveBeenCalledWith(7);
      expect(el.style.cursor).toBe("");
      expect(el.style.scrollSnapType).toBe("");
    });

    it("does nothing on pointermove when not dragging", () => {
      const el = createMockElement();
      const { result } = renderHook(() => useHorizontalScroll());
      act(() => { (result.current.scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el; });
      const moveEvent = createPointerEvent({ clientX: 200 });
      act(() => { result.current.handlers.onPointerMove(moveEvent); });
      expect(moveEvent.preventDefault).not.toHaveBeenCalled();
    });

    it("does nothing on pointerup when not dragging", () => {
      const el = createMockElement();
      const { result } = renderHook(() => useHorizontalScroll());
      act(() => { (result.current.scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el; });
      act(() => { result.current.handlers.onPointerUp(createPointerEvent()); });
      expect(el.releasePointerCapture).not.toHaveBeenCalled();
    });

    it("does nothing on pointerdown when scrollRef is null", () => {
      const { result } = renderHook(() => useHorizontalScroll());
      act(() => { result.current.handlers.onPointerDown(createPointerEvent()); });
    });

    it("skips releasePointerCapture when not captured", () => {
      const el = createMockElement();
      (el.hasPointerCapture as ReturnType<typeof vi.fn>).mockReturnValue(false);
      const { result } = renderHook(() => useHorizontalScroll());
      act(() => { (result.current.scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el; });
      act(() => { result.current.handlers.onPointerDown(createPointerEvent({ clientX: 100, pointerId: 5 })); });
      act(() => { result.current.handlers.onPointerUp(createPointerEvent({ clientX: 98, pointerId: 5 })); });
      expect(el.releasePointerCapture).not.toHaveBeenCalled();
    });
  });

  describe("click capture", () => {
    it("prevents click after drag", () => {
      const el = createMockElement();
      const { result } = renderHook(() => useHorizontalScroll({ dragThreshold: 3 }));
      act(() => { (result.current.scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el; });
      act(() => { result.current.handlers.onPointerDown(createPointerEvent({ clientX: 100 })); });
      act(() => { result.current.handlers.onPointerMove(createPointerEvent({ clientX: 50 })); });
      const clickEvent = createMouseEvent();
      act(() => { result.current.handlers.onClickCapture(clickEvent); });
      expect(clickEvent.preventDefault).toHaveBeenCalled();
      expect(clickEvent.stopPropagation).toHaveBeenCalled();
    });

    it("allows click when not dragged", () => {
      const { result } = renderHook(() => useHorizontalScroll());
      const clickEvent = createMouseEvent();
      act(() => { result.current.handlers.onClickCapture(clickEvent); });
      expect(clickEvent.preventDefault).not.toHaveBeenCalled();
      expect(clickEvent.stopPropagation).not.toHaveBeenCalled();
    });
  });

  describe("drag start prevention", () => {
    it("prevents drag start when preventDragStart is true", () => {
      const { result } = renderHook(() => useHorizontalScroll({ preventDragStart: true }));
      const dragEvent = createDragEvent();
      act(() => { result.current.handlers.onDragStart(dragEvent); });
      expect(dragEvent.preventDefault).toHaveBeenCalled();
    });

    it("allows drag start when preventDragStart is false", () => {
      const { result } = renderHook(() => useHorizontalScroll({ preventDragStart: false }));
      const dragEvent = createDragEvent();
      act(() => { result.current.handlers.onDragStart(dragEvent); });
      expect(dragEvent.preventDefault).not.toHaveBeenCalled();
    });
  });
});
