/**
 * Markdown processing cache utility
 * Provides build-time caching for markdown content to improve performance
 */

import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { logError } from './errorHandler';

// Cache for processed markdown content
const markdownCache = new Map<string, string>();

// Server-side DOMPurify setup (once)
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Configure DOMPurify to allow safe HTML elements
const purifyConfig = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'strong', 'em', 'u', 's',
    'ul', 'ol', 'li',
    'blockquote',
    'code', 'pre',
    'a',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'hr',
    'img'
  ],
  ALLOWED_ATTR: [
    'href', 'title', 'alt', 'src',
    'class', 'id'
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
};

// Configure marked for better security and features
marked.setOptions({
  breaks: true,
  gfm: true,
});

/**
 * Process markdown content with caching
 * @param content Raw markdown content
 * @param cacheKey Optional cache key, defaults to content hash
 * @returns Processed HTML content
 */
export function processMarkdown(content: string, cacheKey?: string): string {
  try {
    // Generate cache key if not provided
    const key = cacheKey || generateCacheKey(content);
    
    // Check cache first
    if (markdownCache.has(key)) {
      return markdownCache.get(key)!;
    }
    
    // Process markdown if not in cache
    const htmlContent = marked.parse(content) as string;
    const safeHtml = purify.sanitize(htmlContent, purifyConfig);
    
    // Store in cache
    markdownCache.set(key, safeHtml);
    
    return safeHtml;
  } catch (error) {
    logError(error as Error, { 
      component: 'processMarkdown', 
      contentLength: content.length,
      action: 'processMarkdown'
    }, 'medium');
    
    // Graceful degradation: return escaped plain text with basic line breaks
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/\n/g, '<br>');
  }
}

/**
 * Generate a cache key for markdown content
 * @param content Markdown content
 * @returns Cache key string
 */
function generateCacheKey(content: string): string {
  // Simple hash function for strings
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
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
 * @returns Number of cached items
 */
export function getMarkdownCacheSize(): number {
  return markdownCache.size;
}

/**
 * Pre-process and cache markdown content in bulk
 * Useful for build-time optimization
 * @param contentMap Map of content keys to markdown content
 */
export function bulkProcessMarkdown(contentMap: Record<string, string>): void {
  Object.entries(contentMap).forEach(([key, content]) => {
    processMarkdown(content, key);
  });
}

/**
 * Check if content is cached
 * @param cacheKey Cache key to check
 * @returns True if content is cached
 */
export function isMarkdownCached(cacheKey: string): boolean {
  return markdownCache.has(cacheKey);
}

/**
 * Get cache statistics
 * @returns Cache statistics object
 */
export function getMarkdownCacheStats(): {
  size: number;
  keys: string[];
  totalContentSize: number;
  averageContentSize: number;
} {
  const keys = Array.from(markdownCache.keys());
  const totalContentSize = Array.from(markdownCache.values())
    .reduce((sum, content) => sum + content.length, 0);
  
  return {
    size: markdownCache.size,
    keys,
    totalContentSize,
    averageContentSize: markdownCache.size > 0 ? totalContentSize / markdownCache.size : 0
  };
}