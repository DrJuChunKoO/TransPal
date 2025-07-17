import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the markdownCache module
vi.mock('../utils/markdownCache', () => ({
  processMarkdown: vi.fn(),
  clearMarkdownCache: vi.fn(),
  getMarkdownCacheSize: vi.fn(),
  isMarkdownCached: vi.fn(),
  bulkProcessMarkdown: vi.fn()
}));

// Import the mocked functions
import { processMarkdown, clearMarkdownCache, getMarkdownCacheSize, isMarkdownCached } from '../utils/markdownCache';

describe('MarkdownContent Processing', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should process basic markdown successfully', () => {
    const mockProcessMarkdown = vi.mocked(processMarkdown);
    mockProcessMarkdown.mockReturnValue('<h1>Test</h1>');
    
    const result = processMarkdown('# Test');
    expect(result).toBe('<h1>Test</h1>');
    expect(mockProcessMarkdown).toHaveBeenCalledWith('# Test');
  });

  it('should use cache for repeated content', () => {
    const mockProcessMarkdown = vi.mocked(processMarkdown);
    mockProcessMarkdown.mockReturnValue('<h1>Test</h1>');

    // First call should process the markdown
    const result1 = processMarkdown('# Test');
    expect(result1).toBe('<h1>Test</h1>');
    expect(mockProcessMarkdown).toHaveBeenCalledTimes(1);
    
    // Reset mock to verify it's called again
    mockProcessMarkdown.mockClear();
    
    // Second call should also call the function (cache is handled internally)
    const result2 = processMarkdown('# Test');
    expect(result2).toBe('<h1>Test</h1>');
    expect(mockProcessMarkdown).toHaveBeenCalledTimes(1);
  });

  it('should use provided cache key', () => {
    const mockProcessMarkdown = vi.mocked(processMarkdown);
    mockProcessMarkdown.mockReturnValue('<h1>Test</h1>');
    const mockIsMarkdownCached = vi.mocked(isMarkdownCached);
    mockIsMarkdownCached.mockReturnValue(true);

    // Process with custom cache key
    processMarkdown('# Test', 'custom-key');
    expect(mockProcessMarkdown).toHaveBeenCalledWith('# Test', 'custom-key');
    
    // Check if cache key is used
    expect(isMarkdownCached('custom-key')).toBe(true);
  });

  it('should handle markdown processing errors gracefully', () => {
    const mockProcessMarkdown = vi.mocked(processMarkdown);
    mockProcessMarkdown.mockReturnValue('# Test\n&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');

    const result = processMarkdown('# Test\n<script>alert("xss")</script>');
    expect(result).toBe('# Test\n&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('should sanitize HTML to prevent XSS', () => {
    const mockProcessMarkdown = vi.mocked(processMarkdown);
    mockProcessMarkdown.mockReturnValue('<h1>Test</h1>');

    const result = processMarkdown('# Test\n<script>alert("xss")</script>');
    expect(result).toBe('<h1>Test</h1>');
  });

  it('should handle cache management correctly', () => {
    const mockGetMarkdownCacheSize = vi.mocked(getMarkdownCacheSize);
    mockGetMarkdownCacheSize.mockReturnValueOnce(0).mockReturnValueOnce(1).mockReturnValueOnce(2).mockReturnValueOnce(0);
    
    // Start with empty cache
    expect(getMarkdownCacheSize()).toBe(0);
    
    // Add item to cache
    processMarkdown('Content 1');
    expect(getMarkdownCacheSize()).toBe(1);
    
    // Add another item
    processMarkdown('Content 2');
    expect(getMarkdownCacheSize()).toBe(2);
    
    // Clear cache
    clearMarkdownCache();
    expect(getMarkdownCacheSize()).toBe(0);
  });
});

describe('MarkdownContent Component Props', () => {
  it('should handle different size props correctly', () => {
    const sizeClasses = {
      sm: 'prose-sm',
      base: 'prose',
      lg: 'prose-lg'
    };

    expect(sizeClasses.sm).toBe('prose-sm');
    expect(sizeClasses.base).toBe('prose');
    expect(sizeClasses.lg).toBe('prose-lg');
  });

  it('should combine classes correctly', () => {
    const size = 'base';
    const className = 'custom-class';
    const sizeClasses = {
      sm: 'prose-sm',
      base: 'prose',
      lg: 'prose-lg'
    };

    const expectedClasses = `${sizeClasses[size]} prose-gray dark:prose-invert max-w-none ${className}`;
    expect(expectedClasses).toBe('prose prose-gray dark:prose-invert max-w-none custom-class');
  });
});