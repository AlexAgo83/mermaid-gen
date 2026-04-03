import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/mermaid", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/mermaid")>("@/lib/mermaid");

  return {
    ...actual,
    renderMermaidDiagram: vi
      .fn()
      .mockRejectedValue(new Error("Syntax error in text")),
  };
});

import App from "@/App";

describe("App render error handling", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows app-owned preview copy instead of Mermaid raw syntax text", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));

    expect(
      await screen.findByRole("heading", { name: "Preview unavailable" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This Mermaid source could not be rendered/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Syntax error in text/i)).not.toBeInTheDocument();
  });
});
