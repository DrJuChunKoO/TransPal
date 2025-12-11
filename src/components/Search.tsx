import { useState, useEffect, useRef } from "react";

interface SearchResult {
  name: string;
  date: string;
  filename: string;
  contentSummary: {
    id: string;
    text: string;
    speaker: string;
  }[];
}

interface HighlightedSearchResult extends SearchResult {
  highlightedContent: {
    id: string;
    text: string;
    speaker: string;
    highlightedText: string;
  }[];
  score: number;
}

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<HighlightedSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchData, setSearchData] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load search data with retry logic
    const loadSearchData = async (retryCount = 0) => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/search-data.json");

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();

        // Validate search data structure
        if (!Array.isArray(data)) {
          throw new Error("搜尋資料格式錯誤");
        }

        // Filter out invalid entries
        const validData = data.filter((item: any) => {
          return (
            item &&
            typeof item === "object" &&
            typeof item.name === "string" &&
            typeof item.filename === "string" &&
            Array.isArray(item.contentSummary)
          );
        });

        if (validData.length !== data.length) {
          console.warn(
            `Filtered out ${
              data.length - validData.length
            } invalid search entries`,
          );
        }

        setSearchData(validData);
        setError(null);
      } catch (err) {
        console.error("Failed to load search data:", err);

        // Retry once after a delay
        if (retryCount < 1) {
          setTimeout(() => loadSearchData(retryCount + 1), 1000);
          return;
        }

        // Set user-friendly error message based on error type
        if (err instanceof Error) {
          if (err.message.includes("HTTP 404")) {
            setError("搜尋資料檔案不存在，請聯繫管理員");
          } else if (
            err.message.includes("HTTP 500") ||
            err.message.includes("HTTP 502") ||
            err.message.includes("HTTP 503")
          ) {
            setError("伺服器暫時無法回應，請稍後再試");
          } else if (
            err.message.includes("Failed to fetch") ||
            err.message.includes("NetworkError")
          ) {
            setError("網路連線問題，請檢查您的網路連線後重試");
          } else if (err.message.includes("搜尋資料格式錯誤")) {
            setError("搜尋資料格式有誤，請聯繫管理員");
          } else if (err.message.includes("JSON")) {
            setError("搜尋資料解析失敗，請重新整理頁面");
          } else {
            setError("搜尋資料載入失敗，請重新整理頁面或稍後再試");
          }
        } else {
          setError("搜尋功能發生未知錯誤，請重新整理頁面");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSearchData();
  }, []);

  useEffect(() => {
    // Handle clicks outside search
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Function to highlight search terms in text
  const highlightText = (text: string, searchTerm: string): string => {
    if (!searchTerm.trim()) return text;

    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedTerm})`, "gi");
    return text.replace(
      regex,
      '<mark class="bg-yellow-200 dark:bg-yellow-600 px-1 rounded">$1</mark>',
    );
  };

  // Function to create highlighted text component
  const HighlightedText = ({
    text,
    className = "",
  }: {
    text: string;
    className?: string;
  }) => {
    return (
      <span className={className} dangerouslySetInnerHTML={{ __html: text }} />
    );
  };

  // Enhanced search function with scoring and highlighting
  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);

    if (!searchQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    if (error) {
      return; // Don't search if there's an error loading data
    }

    const searchTerms = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term.length > 0);

    // Enhanced search with scoring
    const searchResults = searchData
      .map((item) => {
        let score = 0;
        const highlightedContent: HighlightedSearchResult["highlightedContent"] =
          [];

        // Check title match (higher score)
        const titleMatches = searchTerms.filter((term) =>
          item.name.toLowerCase().includes(term),
        );
        score += titleMatches.length * 10;

        // Check content matches
        item.contentSummary.forEach((content) => {
          const textMatches = searchTerms.some(
            (term) =>
              content.text.toLowerCase().includes(term) ||
              content.speaker.toLowerCase().includes(term),
          );

          if (textMatches) {
            score += 1;

            // Create highlighted version of the text
            let highlightedText = content.text;
            searchTerms.forEach((term) => {
              highlightedText = highlightText(highlightedText, term);
            });

            highlightedContent.push({
              ...content,
              highlightedText,
            });
          }
        });

        return {
          ...item,
          highlightedContent: highlightedContent.slice(0, 3), // Limit to 3 matching snippets
          score,
          hasMatch: score > 0,
        };
      })
      .filter((item) => item.hasMatch)
      .sort((a, b) => b.score - a.score) // Sort by relevance score
      .slice(0, 10); // Limit to 10 results

    setResults(searchResults);
    setIsOpen(true);
  };

  // Function to navigate to specific message with error handling
  const navigateToMessage = (filename: string, messageId?: string) => {
    try {
      // Validate parameters
      if (!filename || typeof filename !== "string") {
        console.error("Invalid filename for navigation:", filename);
        return;
      }

      // Sanitize filename to prevent issues
      const sanitizedFilename = encodeURIComponent(filename);
      const sanitizedMessageId = messageId
        ? encodeURIComponent(messageId)
        : undefined;

      const url = sanitizedMessageId
        ? `/speeches/${sanitizedFilename}/${sanitizedMessageId}`
        : `/speeches/${sanitizedFilename}`;

      // Use window.location.href for navigation
      window.location.href = url;
      setIsOpen(false);
    } catch (error) {
      console.error("Error navigating to message:", error);
      // Fallback to home page if navigation fails
      window.location.href = "/";
    }
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <input
          id="search-input"
          type="text"
          value={query}
          onChange={(e) => {
            const newValue = e.target.value;
            setQuery(newValue);
            handleSearch(newValue); // 立即觸發搜尋
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && results.length > 0) {
              e.preventDefault();
              const firstResult = document.querySelector(
                `[data-search-result="0"]`,
              ) as HTMLElement;
              firstResult?.focus();
            } else if (e.key === "Escape") {
              setIsOpen(false);
            }
          }}
          onFocus={() => {
            if (query) setIsOpen(true);
          }}
          placeholder="搜尋對話內容..."
          className="w-full rounded-full border-0 bg-gray-100 px-4 py-2 pl-10 text-sm text-gray-900 placeholder-gray-500 ring-0 outline-0 transition-all focus:bg-gray-200 sm:text-base dark:bg-white/10 dark:text-white dark:placeholder-gray-400 dark:focus:bg-black"
          role="searchbox"
          aria-label="搜尋對話內容"
          aria-expanded={isOpen}
          aria-controls={isOpen ? "search-results" : undefined}
          autoComplete="off"
        />
        <svg
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {isLoading && (
          <div
            className="absolute top-1/2 right-3 -translate-y-1/2"
            aria-hidden="true"
          >
            <div className="size-4 animate-spin rounded-full border-2 border-transparent border-b-gray-900 dark:border-white"></div>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && isOpen && (
        <div
          id="search-error"
          className="absolute top-full right-0 left-0 z-50 mt-2 rounded-2xl border border-red-200 bg-red-50 p-4 shadow-lg dark:border-red-900/50 dark:bg-red-900/20"
          role="alert"
          aria-live="polite"
        >
          <div className="mb-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-200 dark:hover:bg-red-900/60"
            >
              重新載入頁面
            </button>
            <button
              onClick={() => {
                setError(null);
                setIsOpen(false);
              }}
              className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20"
            >
              關閉
            </button>
          </div>
        </div>
      )}

      {/* Search results */}
      {isOpen && !error && results.length > 0 && (
        <div
          className="absolute top-full right-0 left-0 z-50 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-xl dark:border-white/10 dark:bg-[#1C1C1C]"
          role="listbox"
          aria-label="搜尋結果"
        >
          {results.map((result, index) => (
            <div
              key={result.filename}
              className="border-b border-gray-100 last:border-b-0 dark:border-white/5"
            >
              <button
                data-search-result={index}
                onClick={() => navigateToMessage(result.filename)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    const nextResult = document.querySelector(
                      `[data-search-result="${index + 1}"]`,
                    ) as HTMLElement;
                    nextResult?.focus();
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    if (index === 0) {
                      document.getElementById("search-input")?.focus();
                    } else {
                      const prevResult = document.querySelector(
                        `[data-search-result="${index - 1}"]`,
                      ) as HTMLElement;
                      prevResult?.focus();
                    }
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    navigateToMessage(result.filename);
                  } else if (e.key === "Escape") {
                    setIsOpen(false);
                    document.getElementById("search-input")?.focus();
                  }
                }}
                className="w-full cursor-pointer p-4 text-left transition-colors hover:bg-gray-50 focus:bg-gray-50 focus:outline-none dark:hover:bg-white/5 dark:focus:bg-white/5"
                role="option"
                aria-selected="false"
              >
                <div className="mb-1 line-clamp-1 text-base font-semibold text-gray-900 dark:text-white">
                  {result.name}
                </div>
                <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  {result.date}
                </div>

                {/* Display highlighted content snippets */}
                {result.highlightedContent.length > 0
                  ? result.highlightedContent.slice(0, 2).map((content) => (
                      <div
                        key={content.id}
                        className="mt-1 text-sm text-gray-600 dark:text-gray-300"
                      >
                        <span className="font-medium text-gray-900 dark:text-white">
                          {content.speaker}:
                        </span>{" "}
                        <HighlightedText
                          text={
                            content.highlightedText.slice(0, 120) +
                            (content.highlightedText.length > 120 ? "..." : "")
                          }
                        />
                      </div>
                    ))
                  : // Fallback to original content if no highlighted content
                    result.contentSummary.slice(0, 2).map((content) => (
                      <div
                        key={content.id}
                        className="mt-1 text-sm text-gray-600 dark:text-gray-300"
                      >
                        <span className="font-medium text-gray-900 dark:text-white">
                          {content.speaker}:
                        </span>{" "}
                        {content.text.slice(0, 80)}...
                      </div>
                    ))}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* No results state */}
      {isOpen && !error && query && results.length === 0 && !isLoading && (
        <div className="absolute top-full right-0 left-0 z-50 mt-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#1C1C1C]">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            沒有找到包含「{query}」的相關結果
          </div>
        </div>
      )}
    </div>
  );
}
