import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../App";

describe("App foundation shell", () => {
  it("renders the project title", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Mermaid Generator" }),
    ).toBeInTheDocument();
  });
});
