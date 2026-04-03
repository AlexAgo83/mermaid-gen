import type { ComponentProps } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppHeader } from "@/components/shell/AppHeader";

function createProps(
  overrides: Partial<ComponentProps<typeof AppHeader>> = {},
) {
  return {
    isPreviewFocused: false,
    isMobileHeader: false,
    isMobileMenuOpen: false,
    canExport: true,
    onOpenSettings: vi.fn(),
    onOpenExport: vi.fn(),
    onOpenChangelog: vi.fn(),
    onTogglePreviewFocus: vi.fn(),
    onToggleMobileMenu: vi.fn(),
    onCloseMobileMenu: vi.fn(),
    onResetPreview: vi.fn(),
    onFitPreview: vi.fn(),
    ...overrides,
  };
}

describe("AppHeader", () => {
  it("renders the desktop action bar and wires callbacks", () => {
    const props = createProps();

    render(<AppHeader {...props} />);

    expect(
      screen.getByRole("heading", { name: "Mermaid Generator" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Reset preview position" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Fit preview" }));
    fireEvent.click(screen.getByRole("button", { name: "Focus preview" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Open changelog history" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Open export dialog" }));
    fireEvent.click(screen.getByRole("button", { name: "Open settings" }));

    expect(props.onResetPreview).toHaveBeenCalledTimes(1);
    expect(props.onFitPreview).toHaveBeenCalledTimes(1);
    expect(props.onTogglePreviewFocus).toHaveBeenCalledTimes(1);
    expect(props.onOpenChangelog).toHaveBeenCalledTimes(1);
    expect(props.onOpenExport).toHaveBeenCalledTimes(1);
    expect(props.onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it("shows the focus pill and exit copy when preview focus is active", () => {
    render(<AppHeader {...createProps({ isPreviewFocused: true })} />);

    expect(screen.getByText("Preview focus")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Exit preview focus" }),
    ).toBeInTheDocument();
  });

  it("renders the mobile navigation sheet and keeps mobile callbacks reachable", () => {
    const props = createProps({
      isMobileHeader: true,
      isMobileMenuOpen: true,
      isPreviewFocused: true,
    });

    render(<AppHeader {...props} />);

    const dialog = screen.getByRole("dialog", { name: "Navigation menu" });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Close navigation menu" }),
    );
    expect(props.onCloseMobileMenu).toHaveBeenCalledTimes(1);
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Open settings" }),
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Open changelog history" }),
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Open export dialog" }),
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Reset preview position" }),
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Fit preview" }),
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Exit preview focus" }),
    );

    expect(props.onOpenSettings).toHaveBeenCalledTimes(1);
    expect(props.onOpenChangelog).toHaveBeenCalledTimes(1);
    expect(props.onOpenExport).toHaveBeenCalledTimes(1);
    expect(props.onResetPreview).toHaveBeenCalledTimes(1);
    expect(props.onFitPreview).toHaveBeenCalledTimes(1);
    expect(props.onTogglePreviewFocus).toHaveBeenCalledTimes(1);
  });

  it("disables export-dependent actions until the preview is ready", () => {
    render(<AppHeader {...createProps({ canExport: false })} />);

    expect(
      screen.getByRole("button", { name: "Reset preview position" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Fit preview" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Focus preview" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Open export dialog" }),
    ).toBeDisabled();
  });
});
