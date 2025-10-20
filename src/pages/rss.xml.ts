import type { APIRoute } from "astro";
import { getSpeeches, getSpeech } from "../utils/speeches";

export const GET: APIRoute = async ({ site }) => {
  if (!site) {
    throw new Error("Site URL is required for RSS generation");
  }

  const baseUrl = site.href.replace(/\/$/, "");

  try {
    // Get all speeches
    const speeches = await getSpeeches();

    // Take the latest 30 speeches for the RSS feed
    const latestSpeeches = speeches.slice(0, 30);

    // Generate RSS items
    const rssItems: string[] = [];

    for (const speechMeta of latestSpeeches) {
      try {
        const speech = await getSpeech(speechMeta.filename);
        if (speech && speech.info) {
          const speechUrl = `${baseUrl}/speeches/${speechMeta.filename}`;
          const pubDate = new Date(speech.info.date).toUTCString();
          const title = speech.info.name || speechMeta.filename;
          const description =
            speech.info.description || `對話逐字稿 - ${title}`;

          // Escape XML special characters
          const escapedTitle = escapeXml(title);
          const escapedDescription = escapeXml(description);

          rssItems.push(`
    <item>
      <title>${escapedTitle}</title>
      <link>${speechUrl}</link>
      <guid isPermaLink="true">${speechUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapedDescription}</description>
      <category>對話</category>
      <author>TransPal</author>
    </item>`);
        }
      } catch (error) {
        console.warn(
          `Error processing speech ${speechMeta.filename} for RSS:`,
          error
        );
        // Continue with other speeches
      }
    }

    const buildDate = new Date().toUTCString();

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>TransPal - 對話網站</title>
    <link>${baseUrl}</link>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <description>瀏覽所有對話和逐字稿內容，搜尋特定發言和討論內容</description>
    <language>zh-TW</language>
    <copyright>TransPal</copyright>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <docs>https://www.rssboard.org/rss-specification</docs>${rssItems.join("")}
  </channel>
</rss>`;

    return new Response(rss, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error generating RSS feed:", error);

    // Return minimal RSS feed on error
    const buildDate = new Date().toUTCString();
    const fallbackRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>TransPal - 對話網站</title>
    <link>${baseUrl}</link>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <description>瀏覽所有對話和逐字稿內容，搜尋特定發言和討論內容</description>
    <language>zh-TW</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
  </channel>
</rss>`;

    return new Response(fallbackRss, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  }
};

/**
 * Escapes XML special characters
 */
function escapeXml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
