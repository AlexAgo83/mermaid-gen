import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "../App";

describe("App foundation shell", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the project title", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Mermaid Generator" }),
    ).toBeInTheDocument();
  });

  it("shows onboarding on the first run", () => {
    render(<App />);

    expect(
      screen.getByRole("dialog", { name: "Welcome" }),
    ).toBeInTheDocument();
  });

  it("shows the locked prompt state before a provider key is configured", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));

    expect(
      screen.getByText(/API key in Settings to unlock/i),
    ).toBeInTheDocument();
  });

  it("opens settings from the top bar", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    fireEvent.click(screen.getByRole("button", { name: "Open settings" }));

    expect(
      await screen.findByRole("dialog", { name: "Settings" }),
    ).toBeInTheDocument();
  });

  it("can reopen onboarding from settings", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    fireEvent.click(screen.getByRole("button", { name: "Open settings" }));
    fireEvent.click(await screen.findByRole("button", { name: "Reopen onboarding" }));

    expect(screen.getByRole("dialog", { name: "Welcome" })).toBeInTheDocument();
  });

  it("opens changelog history from the top bar", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    fireEvent.click(screen.getByRole("button", { name: "Open changelog history" }));

    expect(
      await screen.findByRole("dialog", { name: "Changelog history" }),
    ).toBeInTheDocument();
  });

  it("shows Gemini in settings as a selectable provider", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    fireEvent.click(screen.getByRole("button", { name: "Open settings" }));

    expect(
      await screen.findByRole("radio", { name: "Gemini" }),
    ).toBeInTheDocument();
  });

  it("closes settings with Escape", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    fireEvent.click(screen.getByRole("button", { name: "Open settings" }));
    fireEvent.keyDown(await screen.findByRole("dialog", { name: "Settings" }), {
      key: "Escape",
    });

    expect(
      screen.queryByRole("dialog", { name: "Settings" }),
    ).not.toBeInTheDocument();
  });
});
