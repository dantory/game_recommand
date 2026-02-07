import { describe, it, expect } from "vitest";
import { shuffleArray, pickRandom, cn } from "@/lib/utils";

describe("shuffleArray", () => {
  it("returns a new array with same elements", () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffleArray(input);
    expect(result).toHaveLength(input.length);
    expect(result.sort()).toEqual(input.sort());
  });

  it("does not mutate the original array", () => {
    const input = [1, 2, 3, 4, 5];
    const copy = [...input];
    shuffleArray(input);
    expect(input).toEqual(copy);
  });

  it("returns empty array for empty input", () => {
    expect(shuffleArray([])).toEqual([]);
  });

  it("returns single-element array unchanged", () => {
    expect(shuffleArray([42])).toEqual([42]);
  });
});

describe("pickRandom", () => {
  it("returns n elements from the array", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = pickRandom(input, 3);
    expect(result).toHaveLength(3);
    for (const item of result) {
      expect(input).toContain(item);
    }
  });

  it("returns all elements when n >= array length", () => {
    const input = [1, 2, 3];
    const result = pickRandom(input, 5);
    expect(result).toHaveLength(3);
    expect(result.sort()).toEqual(input.sort());
  });

  it("returns empty array when n is 0", () => {
    expect(pickRandom([1, 2, 3], 0)).toEqual([]);
  });

  it("returns empty array for empty input", () => {
    expect(pickRandom([], 3)).toEqual([]);
  });
});

describe("cn", () => {
  it("joins class names with space", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("filters out falsy values", () => {
    expect(cn("foo", undefined, "bar", false, null, "baz")).toBe(
      "foo bar baz"
    );
  });

  it("returns empty string for no arguments", () => {
    expect(cn()).toBe("");
  });

  it("returns empty string when all values are falsy", () => {
    expect(cn(undefined, false, null)).toBe("");
  });

  it("handles single class", () => {
    expect(cn("solo")).toBe("solo");
  });
});
