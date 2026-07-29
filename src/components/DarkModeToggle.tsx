import { useState, useEffect } from "react";

export default function DarkModeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check for saved theme preference or default to system preference
    try {
      const savedTheme = localStorage.getItem("theme") as
        | "light"
        | "dark"
        | null;
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;

      const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
      setTheme(initialTheme);

      // Apply theme to document
      if (initialTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      // Update theme color meta tag on initial load
      const themeColorMeta = document.querySelector(
        'meta[name="theme-color"]#theme-color-dynamic',
      );
      if (themeColorMeta) {
        themeColorMeta.setAttribute(
          "content",
          initialTheme === "dark" ? "#0a0a0a" : "#ffffff",
        );
      }
    } catch (error) {
      // Fallback for test environments where localStorage might not be available
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      const initialTheme = prefersDark ? "dark" : "light";
      setTheme(initialTheme);

      if (initialTheme === "dark") {
        document.documentElement.classList.add("dark");
      }
    }
  }, []);

  const handleThemeChange = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);

    // Save to localStorage
    localStorage.setItem("theme", newTheme);

    // Apply to document
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Update theme color meta tag
    const themeColorMeta = document.querySelector(
      'meta[name="theme-color"]#theme-color-dynamic',
    );
    if (themeColorMeta) {
      themeColorMeta.setAttribute(
        "content",
        newTheme === "dark" ? "#0a0a0a" : "#ffffff",
      );
    }
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <button
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2"
        aria-label="載入中"
        type="button"
        disabled
      >
        <div className="bg-accent size-5 animate-pulse rounded-full sm:size-6" />
      </button>
    );
  }

  return (
    <button
      onClick={handleThemeChange}
      className="hover:bg-muted focus:ring-ring active:bg-accent flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-full p-2 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:outline-none"
      aria-label={`切換至${theme === "dark" ? "淺色" : "深色"}模式`}
      title={`切換至${theme === "dark" ? "淺色" : "深色"}模式`}
      type="button"
    >
      {theme === "dark" ? (
        <svg
          className="text-foreground size-5 sm:size-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg
          className="text-foreground size-5 sm:size-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
      <span className="sr-only">
        {theme === "dark" ? "目前為深色模式" : "目前為淺色模式"}
      </span>
    </button>
  );
}
