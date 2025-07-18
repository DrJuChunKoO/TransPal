import { describe, it, expect, vi } from "vitest";
import { getSpeeches, getSpeech } from "../utils/speeches";

describe("Integration Tests", () => {
  describe("Speech Data Integration", () => {
    it("should load and process speech data correctly", async () => {
      const speeches = await getSpeeches();

      // Verify basic structure
      expect(Array.isArray(speeches)).toBe(true);

      if (speeches.length > 0) {
        const firstSpeech = speeches[0];
        expect(firstSpeech).toHaveProperty("filename");
        expect(firstSpeech).toHaveProperty("name");
        expect(firstSpeech).toHaveProperty("date");
      }
    });

    it("should maintain data consistency between list and direct access", async () => {
      const allSpeeches = await getSpeeches();

      if (allSpeeches.length > 0) {
        const firstSpeech = allSpeeches[0];
        const directAccess = await getSpeech(firstSpeech.filename);

        expect(directAccess).toBeDefined();
        expect(directAccess?.info.filename).toBe(firstSpeech.filename);
        expect(directAccess?.info.name).toBe(firstSpeech.name);
      }
    });

    it("should load speech details with correct structure", async () => {
      const allSpeeches = await getSpeeches();

      if (allSpeeches.length > 0) {
        const firstSpeech = allSpeeches[0];
        const speechDetail = await getSpeech(firstSpeech.filename);

        expect(speechDetail).toBeDefined();
        expect(speechDetail).toHaveProperty("version");
        expect(speechDetail).toHaveProperty("info");
        expect(speechDetail).toHaveProperty("content");
        expect(Array.isArray(speechDetail?.content)).toBe(true);

        if (speechDetail?.content && speechDetail.content.length > 0) {
          const firstMessage = speechDetail.content[0];
          expect(firstMessage).toHaveProperty("id");
          expect(firstMessage).toHaveProperty("type");
          expect(firstMessage).toHaveProperty("speaker");
          expect(firstMessage).toHaveProperty("text");
        }
      }
    });
  });

  describe("Error Handling Integration", () => {
    it("should handle missing speech files gracefully", async () => {
      const nonExistentSpeech = await getSpeech("non-existent-file");
      expect(nonExistentSpeech).toBeNull();
    });

    it("should handle invalid filenames", async () => {
      const invalidSpeech = await getSpeech("../../../etc/passwd");
      expect(invalidSpeech).toBeNull();
    });

    it("should handle empty filename", async () => {
      const emptySpeech = await getSpeech("");
      expect(emptySpeech).toBeNull();
    });
  });
});
