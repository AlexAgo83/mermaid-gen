import { createRef } from "react";
import type { ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PreviewPanel } from "@/components/workspace/PreviewPanel";
import type { RenderState } from "@/lib/app-types";

const readyRenderState: RenderState = {
  status: "ready",
  error: null,
  svg: "<svg><text>Diagram</text></svg>",
  metrics: {
    width: 420,
    height: 240,
  },
};

function createProps(
  overrides: Partial<ComponentProps<typeof PreviewPanel>> = {},
) {
  return {
    isPreviewFocused: false,
    isPreviewHelpOpen: false,
    previewHelp: "Hold Shift while scrolling to zoom.",
    renderState: readyRenderState,
    isRendering: false,
    previewRef: createRef<HTMLDivElement>(),
    previewTransform: "translate(0px, 0px) scale(1)",
    canExport: true,
    onTogglePreviewHelp: vi.fn(),
    onPointerDown: vi.fn(),
    onPointerMove: vi.fn(),
    onPointerUp: vi.fn(),
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    ...overrides,
  };
}

describe("PreviewPanel", () => {
  it("renders preview controls and wires pointer and zoom callbacks", () => {
    const props = createProps();

    render(<PreviewPanel {...props} />);

    expect(
      screen.getByRole("heading", { name: "Preview" }),
    ).toBeInTheDocument();
    const stage = screen
      .getByRole("button", { name: "Zoom out" })
      .closest(".preview-stage");
    expect(stage).not.toBeNull();
    expect(document.querySelector(".preview-diagram")).toHaveStyle({
      width: "420px",
      height: "240px",
      transform: "translate(0px, 0px) scale(1)",
    });

    fireEvent.click(screen.getByRole("button", { name: "Show preview help" }));
    fireEvent.pointerDown(stage!);
    fireEvent.pointerMove(stage!);
    fireEvent.pointerUp(stage!);
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));

    expect(props.onTogglePreviewHelp).toHaveBeenCalledTimes(1);
    expect(props.onPointerDown).toHaveBeenCalledTimes(1);
    expect(props.onPointerMove).toHaveBeenCalledTimes(1);
    expect(props.onPointerUp).toHaveBeenCalledTimes(1);
    expect(props.onZoomIn).toHaveBeenCalledTimes(1);
    expect(props.onZoomOut).toHaveBeenCalledTimes(1);
  });

  it("shows the help popover and hides local preview chrome in focus mode", () => {
    const { rerender } = render(
      <PreviewPanel {...createProps({ isPreviewHelpOpen: true })} />,
    );

    expect(screen.getByRole("note")).toHaveTextContent(
      "Hold Shift while scrolling to zoom.",
    );

    rerender(<PreviewPanel {...createProps({ isPreviewFocused: true })} />);

    expect(
      screen.queryByRole("heading", { name: "Preview" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Show preview help" }),
    ).not.toBeInTheDocument();
  });

  it("renders loading and error fallback states", () => {
    const { rerender } = render(
      <PreviewPanel {...createProps({ isRendering: true })} />,
    );

    expect(screen.getByText("Rendering Mermaid preview…")).toBeInTheDocument();

    rerender(
      <PreviewPanel
        {...createProps({
          isRendering: false,
          renderState: {
            status: "error",
            error: {
              title: "Preview unavailable",
              message: "Review the editor content.",
            },
            svg: "",
            metrics: null,
          },
        })}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Preview unavailable" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Review the editor content.")).toBeInTheDocument();
  });

  it("disables zoom controls until exportable render output exists", () => {
    render(<PreviewPanel {...createProps({ canExport: false })} />);

    expect(screen.getByRole("button", { name: "Zoom in" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeDisabled();
  });
});
