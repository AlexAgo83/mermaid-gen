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

  it("shows the locked prompt state before a local key is configured", () => {
    render(<App />);

    expect(
      screen.getByText(/Configure an OpenAI API key in Settings/i),
    ).toBeInTheDocument();
  });

  it("opens settings from the top bar", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));

    expect(screen.getByRole("dialog", { name: "Settings" })).toBeInTheDocument();
  });
});
