import { createRef } from "react";
import type { ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SettingsModal } from "@/components/modals/SettingsModal";
import type { ProviderSettings } from "@/lib/app-types";

function createSettingsDraft(
  overrides: Partial<ProviderSettings> = {},
): ProviderSettings {
  return {
    activeProviderId: "anthropic",
    providerKeys: {
      openai: "",
      openrouter: "",
      anthropic: "sk-ant-123",
      grok: "",
      mistral: "",
      gemini: "",
    },
    ...overrides,
  };
}

function createProps(
  overrides: Partial<ComponentProps<typeof SettingsModal>> = {},
) {
  return {
    isOpen: true,
    dialogRef: createRef<HTMLDivElement>(),
    settingsDraft: createSettingsDraft(),
    isDraftKeyVisible: false,
    onClose: vi.fn(),
    onSave: vi.fn((event) => event.preventDefault()),
    onReopenOnboarding: vi.fn(),
    onToggleKeyVisibility: vi.fn(),
    onDismissEscape: vi.fn(),
    onSelectProvider: vi.fn(),
    onChangeProviderKey: vi.fn(),
    onRemoveProviderKey: vi.fn(),
    ...overrides,
  };
}

describe("SettingsModal", () => {
  it("returns null when closed", () => {
    const { container } = render(
      <SettingsModal {...createProps({ isOpen: false })} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders provider details, local key summary, and the Anthropic warning", () => {
    render(<SettingsModal {...createProps()} />);

    expect(
      screen.getByRole("dialog", { name: "Settings" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("1 provider keys saved locally"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Anthropic" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Anthropic blocks direct browser calls from arbitrary origins/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("sk-ant-123")).toHaveAttribute(
      "type",
      "password",
    );
  });

  it("wires selection, key editing, toggle visibility, footer actions, and save", () => {
    const props = createProps();

    render(<SettingsModal {...props} />);

    fireEvent.click(screen.getByRole("radio", { name: "Gemini" }));
    fireEvent.change(screen.getByLabelText("Anthropic API key"), {
      target: { value: "updated-key" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove key" }));
    fireEvent.click(screen.getByRole("button", { name: "Reopen onboarding" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.submit(
      screen.getByRole("button", { name: "Save settings" }).closest("form")!,
    );

    expect(props.onSelectProvider).toHaveBeenCalledWith("gemini");
    expect(props.onChangeProviderKey).toHaveBeenCalledWith(
      "anthropic",
      "updated-key",
    );
    expect(props.onToggleKeyVisibility).toHaveBeenCalledTimes(1);
    expect(props.onRemoveProviderKey).toHaveBeenCalledWith("anthropic");
    expect(props.onReopenOnboarding).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onSave).toHaveBeenCalledTimes(1);
  });
});
