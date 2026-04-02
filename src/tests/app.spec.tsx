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

  it("opens settings from the top bar", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));

    expect(screen.getByRole("dialog", { name: "Settings" })).toBeInTheDocument();
  });

  it("can reopen onboarding from settings", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Reopen onboarding" }));

    expect(screen.getByRole("dialog", { name: "Welcome" })).toBeInTheDocument();
  });
});
