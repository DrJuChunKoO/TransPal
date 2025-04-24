import { cache } from "react";
// Remove fs and path imports as they are no longer needed
// import fs from "fs/promises";
// import path from "path";
// Import the index file containing the list of speeches
import { speeches as speechMetadataList } from "@/utils/generated/index";

// Define the structure for a single speech detail (matching the dynamically imported module's default export)
interface SpeechDetail {
  info: { name?: string; date?: string; description?: string; time?: string }; // Make fields optional as fallback might occur
  content: {
    id: string;
    speaker: string;
    text: string;
    type: string;
  }[];
}

// Define the structure for the speech list entry (derived from index)
interface SpeechListEntry {
  filename: string;
  name: string;
  date: string;
}

// No longer need BASE_URL or fetch

// Gets the list of speeches from the imported index data
export const getSpeeches = cache(async (): Promise<SpeechListEntry[]> => {
  try {
    // The imported list is already sorted by the build script
    // Map to the required structure for the list
    return speechMetadataList.map((meta) => ({
      filename: meta.filename,
      name: meta.name,
      date: meta.date,
    }));
  } catch (error) {
    console.error("Error processing speech metadata list:", error);
    return []; // Return empty array on error
  }
});

// Dynamically imports the details of a single speech file
export const getSpeech = cache(
  async (filename: string): Promise<SpeechDetail | null> => {
    const decodedFilename = decodeURIComponent(filename);
    // Revert to dynamic import
    try {
      // Use dynamic import to load the specific speech module from the generated directory
      const speechModule = await import(
        `@/utils/generated/speeches/${decodedFilename}.js`
      );

      // The content is the default export of the module
      const speechData: SpeechDetail = speechModule.default;

      // Basic validation remains useful
      if (!speechData || typeof speechData !== "object") {
        console.warn(
          `Speech data module loaded but content is invalid for: ${decodedFilename}.js`,
        );
        return null;
      }

      // Add fallbacks here if necessary (build script should handle most cases)
      if (!speechData.info) speechData.info = {};
      if (!speechData.info.name) speechData.info.name = decodedFilename;
      if (!speechData.info.date)
        speechData.info.date = new Date(0).toISOString();
      if (!speechData.content) speechData.content = [];

      return speechData;
    } catch (error: any) {
      // Handle module not found error specifically (dynamic import error)
      if (
        error instanceof Error &&
        (error.message.includes("Cannot find module") || // Node.js error
          error.message.includes("Failed to fetch dynamically imported module")) // Browser/Bundler error
      ) {
        console.warn(
          `Speech data module not found for filename: ${decodedFilename}.js`,
        );
      } else {
        console.error(
          `Error dynamically importing speech data for ${decodedFilename}.js:`,
          error,
        );
      }
      return null; // Return null on error
    }
  },
);
