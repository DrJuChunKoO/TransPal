// types/generated.d.ts

// Structure for individual speech files in utils/generated/speeches/
interface SpeechContentModule {
  default: {
    info: { name?: string; date?: string; description?: string; time?: string };
    content: {
      id: string;
      speaker: string;
      text: string;
      type: string;
    }[];
  };
}

// Structure for a single content summary item within SpeechMetadata
export interface SpeechContentSummaryItem {
  id: string;
  text: string;
  speaker: string;
}

// Structure for the entries in the index file (utils/generated/index.js)
export interface SpeechMetadata {
  name: string;
  date: string;
  filename: string;
  contentSummary: SpeechContentSummaryItem[];
}

// Declare the index module
declare module "@/utils/generated/index" {
  export const speeches: SpeechMetadata[];
}

// Add an empty export to make this file a module
export {};

// Declare the dynamically imported speech modules
// This is a bit tricky. Using a wildcard might not work well with all tools.
// A more specific approach might be needed if this causes issues, but let's try this.
// declare module '@/utils/generated/speeches/*' {
//   const value: SpeechContentModule['default'];
//   export default value;
// }
// Alternative: Rely on type assertion within getSpeech function, which is often simpler.
