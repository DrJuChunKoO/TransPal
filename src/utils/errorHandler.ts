/**
 * Centralized error handling and logging utility
 */

export interface ErrorContext {
  component?: string;
  action?: string;
  filename?: string;
  messageId?: string;
  userId?: string;
  userAgent?: string;
  url?: string;
  timestamp?: string;
  [key: string]: any;
}

export interface ErrorReport {
  error: Error;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'network' | 'data' | 'ui' | 'navigation' | 'build' | 'unknown';
}

/**
 * Logs errors with context information
 */
export function logError(error: Error | string, context: ErrorContext = {}, severity: ErrorReport['severity'] = 'medium') {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  
  const enhancedContext: ErrorContext = {
    ...context,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
  };

  const category = categorizeError(errorObj);
  
  const errorReport: ErrorReport = {
    error: errorObj,
    context: enhancedContext,
    severity,
    category
  };

  // Log to console with appropriate level
  switch (severity) {
    case 'critical':
      console.error('🚨 CRITICAL ERROR:', errorReport);
      break;
    case 'high':
      console.error('❌ HIGH SEVERITY ERROR:', errorReport);
      break;
    case 'medium':
      console.warn('⚠️ ERROR:', errorReport);
      break;
    case 'low':
      console.info('ℹ️ LOW SEVERITY ERROR:', errorReport);
      break;
  }

  // In production, you might want to send this to an error tracking service
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    // Example: Send to error tracking service
    // sendToErrorTrackingService(errorReport);
  }

  return errorReport;
}

/**
 * Categorizes errors based on their message and context
 */
function categorizeError(error: Error): ErrorReport['category'] {
  const message = error.message.toLowerCase();
  
  if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
    return 'network';
  }
  
  if (message.includes('cannot find module') || message.includes('import') || message.includes('json')) {
    return 'data';
  }
  
  if (message.includes('render') || message.includes('component') || message.includes('react')) {
    return 'ui';
  }
  
  if (message.includes('navigation') || message.includes('route') || message.includes('redirect')) {
    return 'navigation';
  }
  
  if (message.includes('build') || message.includes('compile') || message.includes('generate')) {
    return 'build';
  }
  
  return 'unknown';
}

/**
 * Creates a safe error handler that won't throw
 */
export function safeErrorHandler<T>(
  fn: () => T | Promise<T>,
  fallback: T,
  context: ErrorContext = {}
): T | Promise<T> {
  try {
    const result = fn();
    
    // Handle async functions
    if (result instanceof Promise) {
      return result.catch((error) => {
        logError(error, context, 'medium');
        return fallback;
      });
    }
    
    return result;
  } catch (error) {
    logError(error as Error, context, 'medium');
    return fallback;
  }
}

/**
 * Wraps async functions with error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: ErrorContext = {}
) {
  return async (...args: T): Promise<R | null> => {
    try {
      // Execute the function and await its result
      const result = await fn(...args);
      return result;
    } catch (error) {
      logError(error as Error, { ...context, args }, 'medium');
      return null;
    }
  };
}

/**
 * Validates data structure and logs errors if invalid
 */
export function validateData<T>(
  data: any,
  validator: (data: any) => data is T,
  context: ErrorContext = {}
): T | null {
  try {
    if (validator(data)) {
      return data;
    } else {
      logError(new Error('Data validation failed'), { ...context, data }, 'low');
      return null;
    }
  } catch (error) {
    logError(error as Error, { ...context, data }, 'medium');
    return null;
  }
}

/**
 * Creates user-friendly error messages
 */
export function getUserFriendlyErrorMessage(error: Error, context: ErrorContext = {}): string {
  const category = categorizeError(error);
  
  switch (category) {
    case 'network':
      return '網路連線發生問題，請檢查您的網路連線後重試。';
    case 'data':
      return '資料載入失敗，請重新整理頁面或稍後再試。';
    case 'ui':
      return '頁面顯示發生問題，請重新整理頁面。';
    case 'navigation':
      return '頁面導航發生問題，請返回首頁重新開始。';
    case 'build':
      return '系統暫時無法使用，請稍後再試。';
    default:
      return '發生未預期的錯誤，請重新整理頁面或稍後再試。';
  }
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  context: ErrorContext = {}
): Promise<T | null> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        logError(lastError, { ...context, attempt, maxRetries }, 'high');
        break;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      logError(lastError, { ...context, attempt, retryDelay: delay }, 'low');
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return null;
}

/**
 * Checks if an error is recoverable
 */
export function isRecoverableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  
  // Network errors are usually recoverable
  if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
    return true;
  }
  
  // Temporary server errors
  if (message.includes('500') || message.includes('502') || message.includes('503')) {
    return true;
  }
  
  // Rate limiting
  if (message.includes('429') || message.includes('rate limit')) {
    return true;
  }
  
  return false;
}