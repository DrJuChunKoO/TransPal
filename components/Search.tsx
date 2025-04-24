"use client";
import { useState, useEffect, useCallback, useRef } from "react";
// Removed direct import of generated index data
// import { speeches as searchData } from "@/utils/generated/index";
// Import the type definition, assuming it's still valid for the structure in search-data.json
import type {
  SpeechMetadata,
  SpeechContentSummaryItem,
} from "@/types/generated.d.ts";
import * as Dialog from "@radix-ui/react-dialog";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "motion/react"; // Updated import
import NavButton from "@/components/NavButton";

// Define type for the flattened search item with score
// Explicitly list all required fields
interface SearchItem {
  // Fields from SpeechMetadata
  name: string;
  date: string;
  filename: string;
  // Fields from SpeechContentSummaryItem
  id: string;
  text: string;
  speaker: string;
  // Added field
  score: number;
}

function HighlightText({
  text,
  keywords,
}: {
  text: string;
  keywords: string[];
}) {
  if (!text) return null;
  const regex = new RegExp(`(${keywords.join("|")})`, "gi");
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, index) => {
        if (regex.test(part)) {
          return (
            <span
              key={index}
              className="rounded bg-yellow-200 px-0.5 text-yellow-950 dark:bg-yellow-500"
            >
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

function SearchResults({
  search,
  splitedSearch,
  isOpen,
}: {
  search: string;
  splitedSearch: string[];
  isOpen: boolean;
}) {
  const [searchData, setSearchData] = useState<SpeechMetadata[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchLength, setSearchLength] = useState(50);
  const scrollableDivRef = useRef<HTMLDivElement>(null);

  // Fetch data when the dialog becomes open and data hasn't been fetched yet
  useEffect(() => {
    if (isOpen && !searchData && isLoading) {
      fetch("/search-data.json")
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          setSearchData(data);
          setIsLoading(false);
        })
        .catch((e) => {
          console.error("Error fetching search data:", e);
          setError("無法載入搜尋資料，請稍後再試。 ");
          setIsLoading(false);
        });
    }
    // Reset loading state if dialog closes (optional, depends on desired behavior)
    // if (!isOpen) {
    //   setIsLoading(true); // To force reload next time
    // }
  }, [isOpen, searchData, isLoading]);

  useEffect(() => {
    setSearchLength(50);
  }, [search]);

  useEffect(() => {
    const scrollableElement = scrollableDivRef.current;

    const handleScroll = () => {
      if (!scrollableElement) return;

      if (
        scrollableElement.scrollHeight - scrollableElement.scrollTop <=
        scrollableElement.clientHeight + 50
      ) {
        setSearchLength((prevLength) => prevLength + 50);
      }
    };

    scrollableElement?.addEventListener("scroll", handleScroll);
    return () => scrollableElement?.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredSearch: SearchItem[] = searchData
    ? searchData
        .flatMap((speech: SpeechMetadata): SearchItem[] =>
          speech.contentSummary.map(
            (contentItem: SpeechContentSummaryItem): SearchItem => ({
              name: speech.name,
              date: speech.date,
              filename: speech.filename,
              id: contentItem.id,
              text: contentItem.text,
              speaker: contentItem.speaker,
              score: 0, // Initialize score
            }),
          ),
        )
        .map((item: SearchItem): SearchItem => {
          // Ensure return type is SearchItem
          let score = 0;
          const lowerCaseText = item.text?.toLowerCase() || "";
          const lowerCaseSpeaker = item.speaker?.toLowerCase() || "";
          const lowerCaseName = item.name?.toLowerCase() || "";
          for (let keyword of splitedSearch) {
            if (lowerCaseName.includes(keyword)) score += 1;
            if (lowerCaseSpeaker.includes(keyword)) score += 3;
            if (lowerCaseText.includes(keyword)) score += 10;
          }
          return { ...item, score };
        })
        .filter((item: SearchItem): boolean => item.score > 0) // Explicit boolean return type
        .filter(
          (
            item: SearchItem,
            index: number,
            self: SearchItem[],
          ): boolean => // Explicit boolean return type
            index ===
            self.findIndex(
              (t: SearchItem) =>
                t.filename === item.filename && t.id === item.id,
            ),
        )
        .sort((a: SearchItem, b: SearchItem): number => b.score - a.score) // Explicit number return type
        .slice(0, searchLength)
    : [];

  // Handle Loading and Error states
  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-gray-500 dark:text-white/50">
        載入中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div ref={scrollableDivRef} className="h-[60vh] overflow-y-auto">
      {search.length === 0 && (
        <div className="py-10 text-center text-gray-500 dark:text-white/50">
          輸入人名或對話內容來搜尋，像是「葛如鈞」、「電子簽章」等等
        </div>
      )}
      {search.length >= 1 &&
        filteredSearch.map((item: SearchItem) => (
          <a
            // Construct URL using filename
            href={`/speeches/${item.filename}#${item.id}`}
            className="block px-4 py-2 hover:bg-blue-50 dark:hover:bg-white/5"
            key={`${item.filename}-${item.id}`} // Use filename in key
          >
            <div className="font-bold">
              <HighlightText text={item.name} keywords={splitedSearch} />{" "}
              <span className="font-normal text-gray-500 dark:text-white/50">
                {item.date}
              </span>
            </div>

            <div>
              {item.speaker && (
                <span className="mr-1 rounded border border-gray-200 bg-blue-50 px-1 py-0.5 text-sm font-normal tracking-wide text-gray-500 dark:border-white/5 dark:bg-white/5 dark:text-white/50">
                  <HighlightText text={item.speaker} keywords={splitedSearch} />
                </span>
              )}
              <HighlightText text={item.text} keywords={splitedSearch} />
            </div>
          </a>
        ))}
      {search.length > 1 && filteredSearch.length === 0 && (
        <div className="my-12 text-center text-gray-500 dark:text-white/50">
          無法找到符合的結果，請嘗試其他關鍵字
        </div>
      )}

      {search.length >= 1 &&
        filteredSearch.length !== 0 &&
        filteredSearch.length >= searchLength && (
          <div className="my-12 text-center text-gray-500 dark:text-white/50">
            向下捲動以載入更多結果...
          </div>
        )}

      {search.length >= 1 &&
        filteredSearch.length !== 0 &&
        filteredSearch.length < searchLength && (
          <div className="my-12 text-center text-gray-500 dark:text-white/50">
            <span className="opacity-50">-</span> 以上是所有結果{" "}
            <span className="opacity-50">-</span>
          </div>
        )}
    </div>
  );
}

export default function Search() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const splitedSearch = search
    .trim()
    .split(" ")
    .map((x) => x.toLowerCase());

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setIsOpen((open) => !open);
      }
    },
    [setIsOpen],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <NavButton>
          <MagnifyingGlassIcon className="size-6" />
        </NavButton>
      </Dialog.Trigger>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs dark:bg-black/25"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild forceMount>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 m-auto h-max w-2xl max-w-[90vw] rounded-xl bg-white shadow-lg dark:bg-neutral-900"
              >
                <Dialog.Title className="sr-only">搜尋</Dialog.Title>
                <Dialog.Description className="sr-only">
                  在這裡輸入人名或對話內容來搜尋逐字稿。
                </Dialog.Description>
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    className="w-full rounded-t-xl border-b border-gray-300 bg-transparent p-4 outline-none dark:border-white/10 dark:bg-white/5"
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="輸入關鍵字⋯"
                    autoFocus
                  />
                  <Dialog.Close asChild>
                    <button
                      className="ring-offset-background focus:ring-ring absolute top-0 right-4 bottom-0 m-auto cursor-pointer rounded-sm opacity-70 transition-opacity hover:opacity-100 disabled:pointer-events-none"
                      aria-label="Close"
                    >
                      <XMarkIcon className="size-5 text-gray-500 dark:text-white/50" />
                    </button>
                  </Dialog.Close>
                </div>
                <SearchResults
                  search={search}
                  splitedSearch={splitedSearch}
                  isOpen={isOpen}
                />
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
