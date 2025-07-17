import type { SpeechDetail, SpeechMetadata, AvatarMap } from '../types/speech';
import { logError, withErrorHandling, validateData, retryWithBackoff } from './errorHandler';

// Cache for build-time data loading
const speechCache = new Map<string, SpeechDetail>();
const speechListCache: SpeechMetadata[] | null = null;

/**
 * Gets the list of all speeches metadata
 * This function loads the generated index file containing speech metadata
 */
export async function getSpeeches(): Promise<SpeechMetadata[]> {
  return await retryWithBackoff(async () => {
    const { speeches } = await import('./generated/index.js');
    
    // Validate the imported data
    const validatedSpeeches = validateData(
      speeches,
      (data): data is SpeechMetadata[] => {
        if (!Array.isArray(data)) return false;
        return data.every((speech: any) => {
          return speech && 
                 typeof speech === 'object' &&
                 typeof speech.name === 'string' &&
                 typeof speech.filename === 'string' &&
                 typeof speech.date === 'string';
        });
      },
      { component: 'getSpeeches', action: 'loadSpeechMetadata' }
    );
    
    if (!validatedSpeeches) {
      throw new Error('Speech metadata validation failed');
    }
    
    return validatedSpeeches;
  }, 2, 1000, { component: 'getSpeeches' }) || [];
}

/**
 * Gets the details of a specific speech by filename
 * This function dynamically imports the generated speech file
 */
export async function getSpeech(filename: string): Promise<SpeechDetail | null> {
  try {
    // Input validation
    if (!filename || typeof filename !== 'string') {
      logError(new Error('Invalid filename provided'), { 
        component: 'getSpeech', 
        filename,
        action: 'validateInput'
      }, 'low');
      return null;
    }

    const decodedFilename = decodeURIComponent(filename);
    
    // Sanitize filename to prevent path traversal
    const sanitizedFilename = decodedFilename.replace(/[^a-zA-Z0-9\-_.]/g, '');
    if (sanitizedFilename !== decodedFilename) {
      logError(new Error('Filename contains invalid characters'), { 
        component: 'getSpeech', 
        filename: decodedFilename,
        sanitizedFilename,
        action: 'sanitizeFilename'
      }, 'medium');
      return null;
    }
    
    // Check cache first
    if (speechCache.has(decodedFilename)) {
      return speechCache.get(decodedFilename)!;
    }

    try {
      // Dynamically import the specific speech module from the generated directory
      const speechModule = await import(`./generated/speeches/${decodedFilename}.js`);
      const speechData: SpeechDetail = speechModule.default;

      // Comprehensive validation using the validateData utility
      const validatedSpeech = validateData(
        speechData,
        (data): data is SpeechDetail => {
          if (!data || typeof data !== 'object') return false;
          if (!data.info || typeof data.info !== 'object') return false;
          if (!Array.isArray(data.content)) return false;
          return true;
        },
        { 
          component: 'getSpeech', 
          filename: decodedFilename,
          action: 'validateSpeechStructure'
        }
      );

      if (!validatedSpeech) {
        return null;
      }

      // Add fallbacks for missing info fields
      if (!validatedSpeech.info.name || typeof validatedSpeech.info.name !== 'string') {
        validatedSpeech.info.name = decodedFilename;
        logError(new Error('Speech missing name field, using filename as fallback'), {
          component: 'getSpeech',
          filename: decodedFilename,
          action: 'addNameFallback'
        }, 'low');
      }
      
      if (!validatedSpeech.info.date || typeof validatedSpeech.info.date !== 'string') {
        validatedSpeech.info.date = new Date(0).toISOString();
        logError(new Error('Speech missing date field, using epoch as fallback'), {
          component: 'getSpeech',
          filename: decodedFilename,
          action: 'addDateFallback'
        }, 'low');
      }
      
      if (!validatedSpeech.info.filename || typeof validatedSpeech.info.filename !== 'string') {
        validatedSpeech.info.filename = decodedFilename;
      }
      
      if (!validatedSpeech.info.slug || typeof validatedSpeech.info.slug !== 'string') {
        validatedSpeech.info.slug = decodedFilename;
      }

      // Validate and filter content items
      const validContent = validatedSpeech.content.filter((item: any) => {
        if (!item || typeof item !== 'object') return false;
        if (!item.id || typeof item.id !== 'string') return false;
        if (!item.type || typeof item.type !== 'string') return false;
        return true;
      });

      if (validContent.length !== validatedSpeech.content.length) {
        const filteredCount = validatedSpeech.content.length - validContent.length;
        logError(new Error(`Filtered out invalid content items`), {
          component: 'getSpeech',
          filename: decodedFilename,
          filteredCount,
          totalCount: validatedSpeech.content.length,
          action: 'filterInvalidContent'
        }, 'low');
        validatedSpeech.content = validContent;
      }

      // Ensure we have at least some valid content
      if (validContent.length === 0) {
        logError(new Error('Speech has no valid content items'), {
          component: 'getSpeech',
          filename: decodedFilename,
          action: 'validateContentExists'
        }, 'medium');
        return null;
      }

      // Cache the result
      speechCache.set(decodedFilename, validatedSpeech);
      
      return validatedSpeech;
    } catch (error: any) {
      // Enhanced error handling with categorization
      if (error instanceof Error) {
        if (error.message.includes('Cannot find module') ||
            error.message.includes('Failed to fetch dynamically imported module') ||
            error.message.includes('Unknown variable dynamic import')) {
          logError(error, {
            component: 'getSpeech',
            filename: decodedFilename,
            action: 'importSpeechModule',
            category: 'moduleNotFound'
          }, 'low');
        } else {
          logError(error, {
            component: 'getSpeech',
            filename: decodedFilename,
            action: 'importSpeechModule',
            category: 'importError'
          }, 'medium');
        }
      }
      return null;
    }
  } catch (error: any) {
    logError(error as Error, { component: 'getSpeech', filename }, 'medium');
    return null;
  }
}

// Cache for avatar map to avoid repeated imports
let avatarMapCache: AvatarMap | null = null;

/**
 * Gets the avatar map containing available avatars
 */
export async function getAvatarMap(): Promise<AvatarMap> {
  if (avatarMapCache) {
    return avatarMapCache;
  }
  
  try {
    const { avatarMap } = await import('./generated/avatars.js');
    avatarMapCache = avatarMap as AvatarMap;
    return avatarMapCache;
  } catch (error) {
    console.error('Error loading avatar map:', error);
    avatarMapCache = {};
    return avatarMapCache;
  }
}

/**
 * Gets avatar metadata for a specific speaker
 */
export async function getAvatarMetadata(speakerName: string): Promise<any> {
  try {
    const { avatarMetadata } = await import('./generated/avatars.js');
    
    // Type-safe access to avatar metadata
    if (avatarMetadata && typeof avatarMetadata === 'object') {
      return (avatarMetadata as Record<string, any>)[speakerName] || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error loading avatar metadata:', error);
    return null;
  }
}

/**
 * Checks if an avatar exists for a given speaker name with fuzzy matching
 */
export async function hasAvatar(speakerName: string): Promise<boolean> {
  const avatarMap = await getAvatarMap();
  
  // Direct match first
  if (avatarMap[speakerName] === true) {
    return true;
  }
  
  // Fuzzy matching for similar names
  const normalizedName = normalizeNameForMatching(speakerName);
  const availableNames = Object.keys(avatarMap);
  
  for (const availableName of availableNames) {
    const normalizedAvailable = normalizeNameForMatching(availableName);
    if (normalizedName === normalizedAvailable) {
      return true;
    }
  }
  
  return false;
}

/**
 * Gets the avatar path for a speaker if it exists, with fuzzy matching
 */
export async function getAvatarPath(speakerName: string): Promise<string | null> {
  const avatarMap = await getAvatarMap();
  
  // Direct match first
  if (avatarMap[speakerName] === true) {
    return `/avatars/${encodeURIComponent(speakerName)}.jpg`;
  }
  
  // Fuzzy matching for similar names
  const normalizedName = normalizeNameForMatching(speakerName);
  const availableNames = Object.keys(avatarMap);
  
  for (const availableName of availableNames) {
    const normalizedAvailable = normalizeNameForMatching(availableName);
    if (normalizedName === normalizedAvailable) {
      return `/avatars/${encodeURIComponent(availableName)}.jpg`;
    }
  }
  
  return null;
}

/**
 * Normalizes speaker names for better matching
 * Removes common titles and standardizes formatting
 */
function normalizeNameForMatching(name: string): string {
  return name
    .trim()
    .replace(/^(部長|署長|委員|主委|院長|局長|主任|教授|博士|先生|女士|小姐|總統|副總統|市長|縣長|立委|議員|理事長|會長|董事長|執行長|總經理|經理|主管|專員|助理|秘書|顧問|律師|醫師|工程師|研究員|分析師)\s*/, '')
    .replace(/\s*(部長|署長|委員|主委|院長|局長|主任|教授|博士|先生|女士|小姐|總統|副總統|市長|縣長|立委|議員|理事長|會長|董事長|執行長|總經理|經理|主管|專員|助理|秘書|顧問|律師|醫師|工程師|研究員|分析師)$/, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Gets all available avatar names for debugging/admin purposes
 */
export async function getAvailableAvatarNames(): Promise<string[]> {
  const avatarMap = await getAvatarMap();
  return Object.keys(avatarMap).filter(name => avatarMap[name] === true);
}

/**
 * Preloads avatar images for better performance
 */
export function preloadAvatarImage(speakerName: string): void {
  if (typeof window !== 'undefined') {
    getAvatarPath(speakerName).then(avatarPath => {
      if (avatarPath) {
        const img = new Image();
        img.src = avatarPath;
      }
    });
  }
}

/**
 * Gets a specific message from a speech by message ID
 */
export async function getSpeechMessage(filename: string, messageId: string) {
  const speech = await getSpeech(filename);
  if (!speech) return null;
  
  const message = speech.content.find(item => item.id === messageId);
  return message || null;
}

/**
 * Gets context messages around a specific message (for sharing pages)
 */
export async function getSpeechMessageWithContext(filename: string, messageId: string, contextSize: number = 2) {
  try {
    // Input validation
    if (!filename || typeof filename !== 'string') {
      logError(new Error('Invalid filename provided'), {
        component: 'getSpeechMessageWithContext',
        filename,
        messageId,
        action: 'validateFilename'
      }, 'low');
      return null;
    }
    
    if (!messageId || typeof messageId !== 'string') {
      logError(new Error('Invalid messageId provided'), {
        component: 'getSpeechMessageWithContext',
        filename,
        messageId,
        action: 'validateMessageId'
      }, 'low');
      return null;
    }
    
    if (typeof contextSize !== 'number' || contextSize < 0) {
      logError(new Error('Invalid contextSize provided'), {
        component: 'getSpeechMessageWithContext',
        filename,
        messageId,
        contextSize,
        action: 'validateContextSize'
      }, 'low');
      contextSize = 2; // Default fallback
    }

    const speech = await getSpeech(filename);
    if (!speech) {
      logError(new Error('Speech not found for message context'), {
        component: 'getSpeechMessageWithContext',
        filename,
        messageId,
        action: 'loadSpeech'
      }, 'medium');
      return null;
    }
    
    if (!Array.isArray(speech.content) || speech.content.length === 0) {
      logError(new Error('Speech has no content for message context'), {
        component: 'getSpeechMessageWithContext',
        filename,
        messageId,
        contentLength: speech.content?.length || 0,
        action: 'validateSpeechContent'
      }, 'medium');
      return null;
    }
    
    const messageIndex = speech.content.findIndex(item => item && item.id === messageId);
    if (messageIndex === -1) {
      logError(new Error('Message not found in speech'), {
        component: 'getSpeechMessageWithContext',
        filename,
        messageId,
        totalMessages: speech.content.length,
        action: 'findMessage'
      }, 'medium');
      return null;
    }
    
    const targetMessage = speech.content[messageIndex];
    if (!targetMessage) {
      logError(new Error('Target message is invalid'), {
        component: 'getSpeechMessageWithContext',
        filename,
        messageId,
        messageIndex,
        action: 'validateTargetMessage'
      }, 'medium');
      return null;
    }
    
    const startIndex = Math.max(0, messageIndex - contextSize);
    const endIndex = Math.min(speech.content.length - 1, messageIndex + contextSize);
    
    const contextMessages = speech.content.slice(startIndex, endIndex + 1).filter(item => item && item.id);
    
    if (contextMessages.length === 0) {
      logError(new Error('No valid context messages found'), {
        component: 'getSpeechMessageWithContext',
        filename,
        messageId,
        startIndex,
        endIndex,
        action: 'filterContextMessages'
      }, 'medium');
      return null;
    }
    
    return {
      speech,
      targetMessage,
      contextMessages,
      messageIndex
    };
  } catch (error: any) {
    logError(error as Error, { 
      component: 'getSpeechMessageWithContext', 
      filename, 
      messageId 
    }, 'medium');
    return null;
  }
}