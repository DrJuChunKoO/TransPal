// Speech content item structure
export interface SpeechContentItem {
  id: string;
  speaker: string;
  text: string;
  type: 'speech' | 'divider' | 'markdown';
  start?: number;
  end?: number;
}

// Speech info structure
export interface SpeechInfo {
  name: string;
  date: string;
  time?: string;
  description?: string;
  filename: string;
  slug: string;
}

// Complete speech detail structure
export interface SpeechDetail {
  version: string;
  info: SpeechInfo;
  content: SpeechContentItem[];
}

// Speech metadata for lists
export interface SpeechMetadata {
  name: string;
  date: string;
  filename: string;
}

// Search data structure
export interface SearchData {
  name: string;
  date: string;
  filename: string;
  contentSummary: {
    id: string;
    text: string;
    speaker: string;
  }[];
}

// Avatar map structure
export interface AvatarMap {
  [speakerName: string]: boolean;
}