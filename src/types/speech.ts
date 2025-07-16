export interface Message {
  id: string;
  speaker: string;
  content: string;
  timestamp?: string;
  translation?: string;
}

export interface Speech {
  id: string;
  title: string;
  date: string;
  filename: string;
  description?: string;
  participants: string[];
  messages: Message[];
  metadata?: {
    duration?: number;
    location?: string;
    event?: string;
  };
}

export interface Avatar {
  name: string;
  image: string;
  description?: string;
}