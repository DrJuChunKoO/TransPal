/**
 * Markdown processing cache utility
 * Provides build-time caching for markdown content to improve performance
 */

import { unified } from "unified";
import rehypeStringify from "rehype-stringify";
import remarkCjkFriendly from "remark-cjk-friendly";
import remarkCjkFriendlyGfmStrikethrough from "remark-cjk-friendly-gfm-strikethrough";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import sanitizeHtml from "sanitize-html";
import { logError } from "./errorHandler";

// Cache for processed markdown content
const markdownCache = new Map<string, string>();

// Unified processor configured with GFM and CJK-friendly remark plugins.
// Order matters: remarkGfm must run before the CJK plugins, and
// remarkCjkFriendlyGfmStrikethrough between remarkGfm and remarkRehype.
const remarkProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkCjkFriendly)
  .use(remarkCjkFriendlyGfmStrikethrough)
  .use(remarkRehype)
  .use(rehypeStringify);

// Configure sanitize-html to allow safe HTML elements.
// sanitize-html runs natively in Node.js without requiring a DOM environment,
// making it reliable across SSR, build, and test contexts.
const sanitizeConfig: sanitizeHtml.IOptions = {
  allowedTags: [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "br",
    "strong",
    "em",
    "u",
    "s",
    "ul",
    "ol",
    "li",
    "blockquote",
    "code",
    "pre",
    "a",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "hr",
    "img",
  ],
  allowedAttributes: {
    a: ["href", "title"],
    img: ["src", "alt", "title"],
    "*": ["class", "id"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
};

/**
 * Process markdown content with caching
 * @param content Raw markdown content
 * @param cacheKey Optional cache key, defaults to content hash
 * @returns Processed HTML content
 */
export function processMarkdown(content: string, cacheKey?: string): string {
  try {
    const key = cacheKey || generateCacheKey(content);

    if (markdownCache.has(key)) {
      return markdownCache.get(key)!;
    }

    const htmlContent = String(remarkProcessor.processSync(content));
    const safeHtml = sanitizeHtml(htmlContent, sanitizeConfig);

    markdownCache.set(key, safeHtml);
    return safeHtml;
  } catch (error) {
    logError(
      error as Error,
      {
        component: "processMarkdown",
        contentLength: content.length,
        action: "processMarkdown",
      },
      "medium",
    );

    // Graceful degradation: return escaped plain text
    return content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/\n/g, "<br>");
  }
}

/**
 * Generate a cache key for markdown content
 */
function generateCacheKey(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `md_${hash}`;
}

/**
 * Clear the markdown cache
 */
export function clearMarkdownCache(): void {
  markdownCache.clear();
}

/**
 * Get the current cache size
 */
export function getMarkdownCacheSize(): number {
  return markdownCache.size;
}

/**
 * Pre-process and cache markdown content in bulk
 */
export function bulkProcessMarkdown(contentMap: Record<string, string>): void {
  Object.entries(contentMap).forEach(([key, content]) => {
    processMarkdown(content, key);
  });
}

/**
 * Check if content is cached
 */
export function isMarkdownCached(cacheKey: string): boolean {
  return markdownCache.has(cacheKey);
}

/**
 * Get cache statistics
 */
export function getMarkdownCacheStats(): {
  size: number;
  keys: string[];
  totalContentSize: number;
  averageContentSize: number;
} {
  const keys = Array.from(markdownCache.keys());
  const totalContentSize = Array.from(markdownCache.values()).reduce(
    (sum, content) => sum + content.length,
    0,
  );

  return {
    size: markdownCache.size,
    keys,
    totalContentSize,
    averageContentSize:
      markdownCache.size > 0 ? totalContentSize / markdownCache.size : 0,
  };
}
