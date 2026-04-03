import type { ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ExportModal } from "@/components/modals/ExportModal";
import type { RenderState } from "@/lib/app-types";

const readyRenderState: RenderState = {
  status: "ready",
  error: null,
  svg: "<svg />",
  metrics: {
    width: 640,
    height: 320,
  },
};

function createProps(
  overrides: Partial<ComponentProps<typeof ExportModal>> = {},
) {
  return {
    isOpen: true,
    exportFormat: "png" as const,
    exportScale: 2,
    exportError: null,
    isExporting: false,
    isShareLinkCopying: false,
    renderState: readyRenderState,
    onClose: vi.fn(),
    onSubmit: vi.fn((event) => event.preventDefault()),
    onCopyShareLink: vi.fn(),
    onSelectFormat: vi.fn(),
    onSelectScale: vi.fn(),
    ...overrides,
  };
}

describe("ExportModal", () => {
  it("returns null when closed", () => {
    const { container } = render(
      <ExportModal {...createProps({ isOpen: false })} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders export details, PNG scaling controls, and wires callbacks", () => {
    const props = createProps();

    render(<ExportModal {...props} />);

    expect(
      screen.getByRole("dialog", { name: "Export diagram" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Source diagram: 640 x 320 px/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/PNG output: 1280 x 640 px/i)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("radio", {
        name: "SVGVector export for docs and further editing.",
      }),
    );
    fireEvent.click(screen.getByRole("radio", { name: "2x" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy share link" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.submit(
      screen.getByRole("button", { name: "Download" }).closest("form")!,
    );

    expect(props.onSelectFormat).toHaveBeenCalledWith("svg");
    expect(props.onSelectScale).toHaveBeenCalledWith(2);
    expect(props.onCopyShareLink).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });

  it("shows loading/error states and hides raster details when the preview is unavailable", () => {
    render(
      <ExportModal
        {...createProps({
          exportFormat: "svg",
          exportError: "Copy failed",
          isExporting: true,
          isShareLinkCopying: true,
          renderState: {
            status: "error",
            error: {
              title: "Preview unavailable",
              message: "Invalid Mermaid",
            },
            svg: "",
            metrics: null,
          },
        })}
      />,
    );

    expect(screen.queryByText(/Source diagram:/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "1x" })).not.toBeInTheDocument();
    expect(screen.getByText("Copy failed")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Copying link…" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Downloading…" })).toBeDisabled();
  });
});
