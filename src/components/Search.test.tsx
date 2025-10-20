import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Search from "./Search";

// Mock fetch for search data
global.fetch = vi.fn();

const mockSearchData = [
  {
    name: "Audrey First Visit",
    date: "2024-02-22",
    filename: "2024-02-22-audrey-first-visit",
    contentSummary: [
      {
        id: "1",
        text: "Hello everyone, this is Audrey Tang",
        speaker: "Audrey Tang",
      },
    ],
  },
  {
    name: "Press Conference",
    date: "2024-03-01",
    filename: "2024-03-01-press-conf",
    contentSummary: [
      {
        id: "1",
        text: "Today we announce new policies",
        speaker: "Minister",
      },
    ],
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  (global.fetch as any).mockResolvedValue({
    ok: true,
    json: async () => mockSearchData,
  });
});

describe("Search Component", () => {
  it("renders search input", async () => {
    render(<Search />);
    // Wait for component to load
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("搜尋會議內容..."),
      ).toBeInTheDocument();
    });
  });

  it("shows results when typing", async () => {
    const user = userEvent.setup();
    render(<Search />);

    // Wait for component to load
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("搜尋會議內容..."),
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("搜尋會議內容...");
    await user.type(searchInput, "audrey");

    await waitFor(
      () => {
        expect(screen.getByText("Audrey First Visit")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("shows no results message when no matches", async () => {
    const user = userEvent.setup();
    render(<Search />);

    // Wait for component to load
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("搜尋會議內容..."),
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("搜尋會議內容...");
    await user.type(searchInput, "nonexistent");

    await waitFor(
      () => {
        expect(
          screen.getByText(/沒有找到.*nonexistent.*的相關結果/i),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("clears results when input is cleared", async () => {
    const user = userEvent.setup();
    render(<Search />);

    // Wait for component to load
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("搜尋會議內容..."),
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("搜尋會議內容...");
    await user.type(searchInput, "audrey");

    await waitFor(
      () => {
        expect(screen.getByText("Audrey First Visit")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    await user.clear(searchInput);

    await waitFor(
      () => {
        expect(
          screen.queryByText("Audrey First Visit"),
        ).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });
});
