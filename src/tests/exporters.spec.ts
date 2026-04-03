import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  downloadDiagramAsPng,
  downloadDiagramAsSvg,
} from "../lib/exporters";

function createMockImageClass(mode: "load" | "error") {
  return class MockImage {
    decoding = "";
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;

    set src(_value: string) {
      queueMicrotask(() => {
        if (mode === "load") {
          this.onload?.();
        } else {
          this.onerror?.();
        }
      });
    }
  } as unknown as typeof Image;
}

describe("exporters", () => {
  const originalCreateElement = document.createElement.bind(document);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("downloads SVG exports through a Blob URL and revokes it after click", () => {
    const createObjectUrlMock = vi
      .fn<(blob: Blob) => string>()
      .mockReturnValue("blob:svg-download");
    const revokeObjectUrlMock = vi.fn();
    const anchorClickMock = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: createObjectUrlMock,
      revokeObjectURL: revokeObjectUrlMock,
    });

    downloadDiagramAsSvg("<svg>diagram</svg>", "mermaid-diagram");

    expect(createObjectUrlMock).toHaveBeenCalledTimes(1);
    expect(createObjectUrlMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "image/svg+xml;charset=utf-8",
      }),
    );
    expect(anchorClickMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrlMock).toHaveBeenCalledWith("blob:svg-download");
  });

  it("downloads PNG exports through the canvas pipeline and revokes both Blob URLs", async () => {
    const createObjectUrlMock = vi
      .fn<(blob: Blob) => string>()
      .mockReturnValueOnce("blob:png-source")
      .mockReturnValueOnce("blob:png-download");
    const revokeObjectUrlMock = vi.fn();
    const anchorClickMock = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    const setTransformMock = vi.fn();
    const drawImageMock = vi.fn();
    const toBlobMock = vi.fn((callback: BlobCallback) => {
      callback(new Blob(["png"], { type: "image/png" }));
    });
    const getContextMock = vi.fn(() => ({
      setTransform: setTransformMock,
      drawImage: drawImageMock,
    }));
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: getContextMock,
      toBlob: toBlobMock,
    } as unknown as HTMLCanvasElement;

    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: createObjectUrlMock,
      revokeObjectURL: revokeObjectUrlMock,
    });
    vi.stubGlobal("Image", createMockImageClass("load"));
    vi.spyOn(document, "createElement").mockImplementation(
      ((tagName: string) => {
        if (tagName === "canvas") {
          return mockCanvas;
        }

        return originalCreateElement(tagName);
      }) as typeof document.createElement,
    );

    await downloadDiagramAsPng(
      "<svg>diagram</svg>",
      { width: 200, height: 100 },
      "mermaid-diagram",
      { scale: 3 },
    );

    expect(mockCanvas.width).toBe(600);
    expect(mockCanvas.height).toBe(300);
    expect(getContextMock).toHaveBeenCalledWith("2d");
    expect(setTransformMock).toHaveBeenCalledWith(3, 0, 0, 3, 0, 0);
    expect(drawImageMock).toHaveBeenCalledWith(expect.anything(), 0, 0, 200, 100);
    expect(toBlobMock).toHaveBeenCalledWith(expect.any(Function), "image/png");
    expect(anchorClickMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrlMock).toHaveBeenNthCalledWith(1, "blob:png-source");
    expect(revokeObjectUrlMock).toHaveBeenNthCalledWith(2, "blob:png-download");
  });

  it("revokes the source Blob URL when PNG image loading fails", async () => {
    const createObjectUrlMock = vi
      .fn<(blob: Blob) => string>()
      .mockReturnValue("blob:png-source");
    const revokeObjectUrlMock = vi.fn();

    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: createObjectUrlMock,
      revokeObjectURL: revokeObjectUrlMock,
    });
    vi.stubGlobal("Image", createMockImageClass("error"));

    await expect(
      downloadDiagramAsPng(
        "<svg>diagram</svg>",
        { width: 120, height: 80 },
        "mermaid-diagram",
        { scale: 2 },
      ),
    ).rejects.toThrow("PNG export failed to load SVG.");

    expect(revokeObjectUrlMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrlMock).toHaveBeenCalledWith("blob:png-source");
  });
});
