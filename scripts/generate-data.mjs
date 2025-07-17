import fs from "fs/promises";
import path from "path";

const speechesDir = path.join(process.cwd(), "public", "speeches");
const avatarsDir = path.join(process.cwd(), "public", "avatars");
const outputBaseDir = path.join(process.cwd(), "src", "utils", "generated");
const outputSearchDataFile = path.join(
  process.cwd(),
  "public",
  "search-data.json",
);
const outputIndexFile = path.join(outputBaseDir, "index.js");
const outputSpeechesDir = path.join(outputBaseDir, "speeches");
const outputAvatarsFile = path.join(outputBaseDir, "avatars.js");

async function generateData() {
  console.log(
    "Generating search data JSON, speech index, individual speech files, and avatar list...",
  );
  
  const errors = [];
  const warnings = [];
  let processedFiles = 0;
  let skippedFiles = 0;

  try {
    // Ensure output directories exist
    await fs.mkdir(outputBaseDir, { recursive: true });
    await fs.mkdir(path.dirname(outputSearchDataFile), { recursive: true });
    await fs.mkdir(outputSpeechesDir, { recursive: true });

    // Check if speeches directory exists
    try {
      await fs.access(speechesDir);
    } catch (error) {
      throw new Error(`Speeches directory not found: ${speechesDir}`);
    }

    const files = await fs.readdir(speechesDir);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    if (jsonFiles.length === 0) {
      warnings.push("No JSON files found in speeches directory");
    }

    console.log(`Found ${jsonFiles.length} speech files to process`);

    const searchDataList = [];
    const indexMetadataList = [];

    for (const file of jsonFiles) {
      const filePath = path.join(speechesDir, file);
      const filenameKey = file.replace(/\.json$/, "");
      const outputSpeechFile = path.join(
        outputSpeechesDir,
        `${filenameKey}.js`,
      );

      try {
        // Read and validate file content
        let fileContent;
        try {
          fileContent = await fs.readFile(filePath, "utf-8");
        } catch (readError) {
          errors.push(`Failed to read file ${file}: ${readError.message}`);
          skippedFiles++;
          continue;
        }

        // Parse JSON with better error handling
        let speechParsed;
        try {
          speechParsed = JSON.parse(fileContent);
        } catch (parseError) {
          errors.push(`Invalid JSON in ${file}: ${parseError.message}`);
          skippedFiles++;
          continue;
        }

        // Validate basic structure
        if (!speechParsed || typeof speechParsed !== 'object') {
          errors.push(`Invalid speech data structure in ${file}: not an object`);
          skippedFiles++;
          continue;
        }

        // Handle content array with validation
        let originalContent = [];
        if (Array.isArray(speechParsed.content)) {
          originalContent = speechParsed.content;
        } else if (speechParsed.content) {
          warnings.push(`Content in ${file} is not an array, treating as empty`);
        }

        // Filter and validate content items
        const validContent = originalContent.filter((item, index) => {
          if (!item || typeof item !== 'object') {
            warnings.push(`Invalid content item at index ${index} in ${file}: not an object`);
            return false;
          }
          if (!item.id || typeof item.id !== 'string') {
            warnings.push(`Content item at index ${index} in ${file} missing valid id`);
            return false;
          }
          if (!item.type || typeof item.type !== 'string') {
            warnings.push(`Content item at index ${index} in ${file} missing valid type`);
            return false;
          }
          return true;
        });

        if (validContent.length !== originalContent.length) {
          warnings.push(`Filtered out ${originalContent.length - validContent.length} invalid content items from ${file}`);
        }

        const contentForGeneratedFiles = validContent.map(
          ({ id, text, speaker, type, start, end }) => ({
            id: id || '',
            text: text || '',
            speaker: speaker || '',
            type: type || 'speech',
            start: start || undefined,
            end: end || undefined,
          }),
        );

        // Handle info object with validation and fallbacks
        const { info } = speechParsed;
        let { name, date, time, description, filename, slug } = info || {};

        // Validate and fix name
        if (!name || typeof name !== 'string') {
          name = filenameKey;
          warnings.push(`Speech name missing or invalid in ${file}. Using filename: ${filenameKey}`);
        }

        // Validate and fix date
        if (!date || typeof date !== 'string' || isNaN(new Date(date).getTime())) {
          warnings.push(`Invalid or missing date in ${file}. Using epoch time.`);
          date = new Date(0).toISOString();
        }

        // Validate other fields
        if (time && typeof time !== 'string') {
          warnings.push(`Invalid time format in ${file}, ignoring`);
          time = undefined;
        }

        if (description && typeof description !== 'string') {
          warnings.push(`Invalid description format in ${file}, ignoring`);
          description = undefined;
        }

        // Add filename and slug if missing
        if (!filename || typeof filename !== 'string') filename = filenameKey;
        if (!slug || typeof slug !== 'string') slug = filenameKey;

        // Create search data entry
        const searchDataEntry = {
          name: name,
          date: date,
          filename: filenameKey,
          contentSummary: contentForGeneratedFiles
            .filter(item => item.text && item.speaker) // Only include items with text and speaker
            .map(({ id, text, speaker }) => ({
              id,
              text: text.substring(0, 500), // Limit text length for search
              speaker,
            })),
        };

        searchDataList.push(searchDataEntry);

        // Create index metadata entry
        indexMetadataList.push({
          name: name,
          date: date,
          filename: filenameKey,
        });

        // Create individual speech file
        const speechForJsFile = {
          version: speechParsed.version || "1.0",
          info: {
            name,
            date,
            time,
            description,
            filename,
            slug,
          },
          content: contentForGeneratedFiles,
        };

        const speechFileContentJS = `// Generated from ${file}
// This file is auto-generated. Do not edit manually.
export default ${JSON.stringify(speechForJsFile, null, 2)};
`;

        try {
          await fs.writeFile(outputSpeechFile, speechFileContentJS);
          processedFiles++;
        } catch (writeError) {
          errors.push(`Failed to write speech file for ${file}: ${writeError.message}`);
          skippedFiles++;
        }

      } catch (fileError) {
        errors.push(`Unexpected error processing ${file}: ${fileError.message}`);
        skippedFiles++;
      }
    }

    // Sort data by date (newest first)
    const sortByDateDesc = (a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime();
    searchDataList.sort(sortByDateDesc);
    indexMetadataList.sort(sortByDateDesc);

    // Write search data with error handling
    try {
      await fs.writeFile(outputSearchDataFile, JSON.stringify(searchDataList, null, 2));
      console.log(`✓ Generated search data at ${outputSearchDataFile} (${searchDataList.length} entries)`);
    } catch (writeError) {
      errors.push(`Failed to write search data file: ${writeError.message}`);
    }

    // Write index file with error handling
    const indexFileContentJS = `// This file is generated by scripts/generate-data.mjs during build time.
// Do not edit manually.

// Contains MINIMAL metadata for all speeches, used by getSpeeches.
export const speeches = ${JSON.stringify(indexMetadataList, null, 2)};
`;
    try {
      await fs.writeFile(outputIndexFile, indexFileContentJS);
      console.log(`✓ Generated speech index at ${outputIndexFile} (${indexMetadataList.length} entries)`);
    } catch (writeError) {
      errors.push(`Failed to write index file: ${writeError.message}`);
    }

    console.log(`✓ Generated ${processedFiles} individual speech files in ${outputSpeechesDir}`);

    // Generate enhanced avatar data with metadata
    try {
      let avatarFiles = [];
      try {
        avatarFiles = await fs.readdir(avatarsDir);
      } catch (avatarDirError) {
        warnings.push(`Avatar directory not accessible: ${avatarsDir}`);
        avatarFiles = [];
      }

      const avatarMap = {};
      const avatarMetadata = {};
      let avatarProcessed = 0;
      let avatarSkipped = 0;
      
      for (const file of avatarFiles) {
        if (file.endsWith(".jpg") && !file.startsWith(".")) {
          const name = file.replace(/\.jpg$/, "");
          const filePath = path.join(avatarsDir, file);
          
          try {
            const stats = await fs.stat(filePath);
            avatarMap[name] = true;
            avatarMetadata[name] = {
              filename: file,
              size: stats.size,
              lastModified: stats.mtime.toISOString(),
              // Add normalized name for better matching
              normalizedName: name
                .trim()
                .replace(/^(部長|署長|委員|主委|院長|局長|主任|教授|博士|先生|女士|小姐|總統|副總統|市長|縣長|立委|議員|理事長|會長|董事長|執行長|總經理|經理|主管|專員|助理|秘書|顧問|律師|醫師|工程師|研究員|分析師)\s*/, '')
                .replace(/\s*(部長|署長|委員|主委|院長|局長|主任|教授|博士|先生|女士|小姐|總統|副總統|市長|縣長|立委|議員|理事長|會長|董事長|執行長|總經理|經理|主管|專員|助理|秘書|顧問|律師|醫師|工程師|研究員|分析師)$/, '')
                .replace(/\s+/g, ' ')
                .toLowerCase()
            };
            avatarProcessed++;
          } catch (statError) {
            warnings.push(`Could not get stats for avatar file ${file}: ${statError.message}`);
            avatarMap[name] = true;
            avatarSkipped++;
          }
        }
      }

      const avatarsFileContentJS = `// This file is generated by scripts/generate-data.mjs during build time.
// Do not edit manually.

export const avatarMap = ${JSON.stringify(avatarMap, null, 2)};

export const avatarMetadata = ${JSON.stringify(avatarMetadata, null, 2)};

// Helper function to get avatar info
export function getAvatarInfo(speakerName) {
  return avatarMetadata[speakerName] || null;
}

// Get all available avatar names
export function getAvailableAvatars() {
  return Object.keys(avatarMap).filter(name => avatarMap[name] === true);
}
`;
      
      try {
        await fs.writeFile(outputAvatarsFile, avatarsFileContentJS);
        console.log(`✓ Generated avatar data at ${outputAvatarsFile} (${avatarProcessed} avatars processed)`);
      } catch (writeError) {
        errors.push(`Failed to write avatar data file: ${writeError.message}`);
      }
    } catch (avatarError) {
      errors.push(`Error generating avatar data: ${avatarError.message}`);
    }

    // Print summary
    console.log('\n=== Generation Summary ===');
    console.log(`✓ Processed: ${processedFiles} speech files`);
    console.log(`✗ Skipped: ${skippedFiles} speech files`);
    console.log(`⚠ Warnings: ${warnings.length}`);
    console.log(`❌ Errors: ${errors.length}`);

    // Print warnings
    if (warnings.length > 0) {
      console.log('\n=== Warnings ===');
      warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }

    // Print errors
    if (errors.length > 0) {
      console.log('\n=== Errors ===');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    // Exit with error code if there were critical errors
    if (errors.length > 0) {
      console.log('\n❌ Build completed with errors. Some functionality may not work correctly.');
      process.exit(1);
    } else if (warnings.length > 0) {
      console.log('\n⚠ Build completed with warnings. Please review the warnings above.');
    } else {
      console.log('\n✅ Build completed successfully!');
    }

  } catch (error) {
    console.error('\n❌ Fatal error during data generation:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

generateData();