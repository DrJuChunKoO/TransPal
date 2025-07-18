import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DarkModeToggle from "./DarkModeToggle";

describe("DarkModeToggle Component", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset document class
    document.documentElement.className = "";

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
      removeItem: vi.fn(),
    };

    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });

    // Mock matchMedia
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("renders toggle button", () => {
    render(<DarkModeToggle />);
    const toggleButton = screen.getByRole("button");
    expect(toggleButton).toBeInTheDocument();
  });

  it("toggles dark mode when clicked", async () => {
    const user = userEvent.setup();
    render(<DarkModeToggle />);

    const toggleButton = screen.getByRole("button");
    await user.click(toggleButton);

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalledWith("theme", "dark");
  });

  it("toggles back to light mode", async () => {
    const user = userEvent.setup();
    render(<DarkModeToggle />);

    const toggleButton = screen.getByRole("button");

    // First click - enable dark mode
    await user.click(toggleButton);
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    // Second click - disable dark mode
    await user.click(toggleButton);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.setItem).toHaveBeenCalledWith("theme", "light");
  });

  it("respects system preference when no stored preference", () => {
    // Mock system preference for dark mode
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(<DarkModeToggle />);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("loads stored theme preference", () => {
    // Mock localStorage to return 'dark'
    (localStorage.getItem as any).mockReturnValue("dark");

    render(<DarkModeToggle />);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem).toHaveBeenCalledWith("theme");
  });
});
