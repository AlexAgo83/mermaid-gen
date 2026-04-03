import { describe, expect, it } from "vitest";
import { calculateWheelZoomViewport } from "@/hooks/usePreviewInteraction";

describe("usePreviewInteraction", () => {
  it("keeps the cursor anchored while wheel zooming", () => {
    const nextViewport = calculateWheelZoomViewport(
      { scale: 1, x: 20, y: 10 },
      200,
      100,
      -120,
    );

    expect(nextViewport.scale).toBeCloseTo(1.12);
    expect(nextViewport.x).toBeCloseTo(-1.6);
    expect(nextViewport.y).toBeCloseTo(-0.8);
  });
});
