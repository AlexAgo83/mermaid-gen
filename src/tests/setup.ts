import "@testing-library/jest-dom/vitest";
import { afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

beforeAll(() => {
  if (!Range.prototype.getClientRects) {
    Range.prototype.getClientRects = function getClientRects() {
      return {
        item: () => null,
        length: 0,
        [Symbol.iterator]: function* iterator() {},
      } as DOMRectList;
    };
  }

  if (!Range.prototype.getBoundingClientRect) {
    Range.prototype.getBoundingClientRect = function getBoundingClientRect() {
      return new DOMRect(0, 0, 0, 0);
    };
  }
});
