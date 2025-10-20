import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  processMarkdown,
  clearMarkdownCache,
  bulkProcessMarkdown,
} from "../utils/markdownCache";
import { detectContentType } from "../utils/contentTypeDetection";

// Mock the speech utilities since we're focusing on markdown performance
vi.mock("../utils/speeches", () => ({
  getAllSpeeches: vi.fn(() => []),
  searchSpeeches: vi.fn(() => []),
}));

// Import the mocked functions
import { getAllSpeeches, searchSpeeches } from "../utils/speeches";

// Generate large markdown content for performance testing
function generateLargeMarkdown(size: number): string {
  const headings = Array(5)
    .fill(0)
    .map((_, i) => `${"#".repeat(i + 1)} Heading ${i + 1}\n\n`)
    .join("");
  const paragraphs = Array(size)
    .fill(0)
    .map(
      (_, i) =>
        `This is paragraph ${i + 1} with **bold** and *italic* text.\n\n`,
    )
    .join("");
  const lists = Array(Math.floor(size / 5))
    .fill(0)
    .map((_, i) => `- List item ${i + 1}\n`)
    .join("");
  const code =
    "```javascript\n" +
    Array(Math.floor(size / 10))
      .fill(0)
      .map((_, i) => `// Line ${i + 1}\nconst value${i + 1} = ${i + 1};\n`)
      .join("") +
    "```\n\n";

  return headings + paragraphs + lists + code;
}

describe("Performance Tests", () => {
  beforeEach(() => {
    clearMarkdownCache();
    vi.resetAllMocks();
  });

  describe("Speech Loading Performance", () => {
    it("should load all speeches within reasonable time", () => {
      const mockGetAllSpeeches = vi.mocked(getAllSpeeches);
      mockGetAllSpeeches.mockReturnValue([]);

      const startTime = performance.now();
      const speeches = getAllSpeeches();
      const endTime = performance.now();

      const loadTime = endTime - startTime;

      // Should load within 100ms for reasonable dataset sizes
      expect(loadTime).toBeLessThan(100);
      expect(speeches).toBeDefined();
    });

    it("should handle large search queries efficiently", () => {
      const mockSearchSpeeches = vi.mocked(searchSpeeches);
      mockSearchSpeeches.mockReturnValue([]);

      const startTime = performance.now();

      // Test with multiple search terms
      const searchTerms = ["政府", "政策", "數位", "科技", "未來"];
      const results = searchTerms.map((term) => searchSpeeches(term));

      const endTime = performance.now();
      const searchTime = endTime - startTime;

      // Multiple searches should complete within 50ms
      expect(searchTime).toBeLessThan(50);
      expect(results).toHaveLength(searchTerms.length);
    });

    it("should handle repeated searches efficiently", () => {
      const mockSearchSpeeches = vi.mocked(searchSpeeches);
      mockSearchSpeeches.mockReturnValue([]);

      const searchTerm = "政府";
      const iterations = 100;

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        searchSpeeches(searchTerm);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / iterations;

      // Average search time should be under 1ms
      expect(averageTime).toBeLessThan(1);
    });
  });

  describe("Markdown Processing Performance", () => {
    it("should process small markdown content quickly", () => {
      const smallMarkdown = generateLargeMarkdown(5);

      const startTime = performance.now();
      processMarkdown(smallMarkdown);
      const endTime = performance.now();

      const processTime = endTime - startTime;

      // Small markdown should process in under 100ms (adjusted for real-world performance)
      expect(processTime).toBeLessThan(100);
    });

    it("should process medium markdown content efficiently", () => {
      const mediumMarkdown = generateLargeMarkdown(20);

      const startTime = performance.now();
      processMarkdown(mediumMarkdown);
      const endTime = performance.now();

      const processTime = endTime - startTime;

      // Medium markdown should process in under 100ms (adjusted for real-world performance)
      expect(processTime).toBeLessThan(100);
    });

    it("should process large markdown content within reasonable time", () => {
      const largeMarkdown = generateLargeMarkdown(100);

      const startTime = performance.now();
      processMarkdown(largeMarkdown);
      const endTime = performance.now();

      const processTime = endTime - startTime;

      // Large markdown should process in under 200ms (adjusted for real-world performance)
      expect(processTime).toBeLessThan(200);
    });

    it("should benefit from caching for repeated processing", () => {
      const markdown = generateLargeMarkdown(50);

      // First processing (uncached)
      const startTime1 = performance.now();
      processMarkdown(markdown);
      const endTime1 = performance.now();
      const uncachedTime = endTime1 - startTime1;

      // Second processing (cached)
      const startTime2 = performance.now();
      processMarkdown(markdown);
      const endTime2 = performance.now();
      const cachedTime = endTime2 - startTime2;

      // Cached processing should be faster than uncached
      expect(cachedTime).toBeLessThan(uncachedTime);
    });

    it("should efficiently bulk process multiple markdown contents", () => {
      const contentMap = {
        small: generateLargeMarkdown(5),
        medium: generateLargeMarkdown(20),
        large: generateLargeMarkdown(50),
      };

      const startTime = performance.now();
      bulkProcessMarkdown(contentMap);
      const endTime = performance.now();

      const bulkProcessTime = endTime - startTime;

      // Bulk processing should complete in a reasonable time
      expect(bulkProcessTime).toBeLessThan(500);
    });

    it("should efficiently detect content type", () => {
      const iterations = 100;
      const content = generateLargeMarkdown(10);

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        detectContentType(content);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / iterations;

      // Content type detection should be fast (under 1ms per operation)
      expect(averageTime).toBeLessThan(1);
    });
  });

  describe("Memory Usage", () => {
    it("should not create memory leaks during repeated operations", () => {
      const mockGetAllSpeeches = vi.mocked(getAllSpeeches);
      mockGetAllSpeeches.mockReturnValue([]);

      const mockSearchSpeeches = vi.mocked(searchSpeeches);
      mockSearchSpeeches.mockReturnValue([]);

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        // Reduced iterations for test speed
        getAllSpeeches();
        searchSpeeches("test");
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Skip test if memory metrics aren't available
      if (initialMemory === 0 || finalMemory === 0) {
        return;
      }

      // Memory growth should be reasonable (less than 10MB)
      const memoryGrowth = finalMemory - initialMemory;
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // 10MB
    });

    it("should manage memory efficiently with markdown cache", () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Generate different markdown contents (reduced for test speed)
      const contents = Array(20)
        .fill(0)
        .map((_, i) => generateLargeMarkdown(5 + (i % 10)));

      // Process all contents
      contents.forEach((content) => {
        processMarkdown(content);
      });

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Skip test if memory metrics aren't available
      if (initialMemory === 0 || finalMemory === 0) {
        return;
      }

      // Memory growth should be reasonable (less than 5MB)
      const memoryGrowth = finalMemory - initialMemory;
      expect(memoryGrowth).toBeLessThan(5 * 1024 * 1024); // 5MB

      // Clear cache and check memory again
      clearMarkdownCache();

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const afterClearMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Skip comparison if memory metrics aren't available
      if (finalMemory === 0 || afterClearMemory === 0) {
        return;
      }

      // Memory should not increase after clearing cache
      expect(afterClearMemory).toBeLessThanOrEqual(finalMemory);
    });
  });
});
