// @ts-nocheck
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  streamText,
  tool,
  smoothStream,
  convertToModelMessages,
  type UIMessage,
} from "ai";
import z from "zod";
import type { ExportedHandler, Fetcher } from "@cloudflare/workers-types";

interface Env {
  // 靜態資源綁定（wrangler.assets.binding）
  ASSETS: Fetcher;

  // Supabase 與 OpenRouter 相關變數，請於 wrangler secret / vars 設定
  OPENROUTER_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    // API 端點 -------------------------------------------------------------
    if (request.method === "POST" && url.pathname === "/api/chat") {
      // --------------------------------------------------------------
      // 初始化 OpenRouter provider
      // --------------------------------------------------------------

      const openrouter = createOpenRouter({
        apiKey: env.OPENROUTER_API_KEY,
        baseURL:
          "https://gateway.ai.cloudflare.com/v1/3f1f83a939b2fc99ca45fd8987962514/transpal/openrouter",
      });

      // --------------------------------------------------------------
      // 解析請求 body
      // --------------------------------------------------------------
      let body: any;
      try {
        body = await request.json();
      } catch {
        return new Response("Invalid JSON body", {
          status: 400,
        });
      }

      const { messages = [], filename = "/" } = body as {
        messages: UIMessage[];
        filename: string;
      };

      // 系統提示詞
      const systemPrompt = `你是國民黨立委葛如鈞（寶博士）逐字稿網站的 AI 助手
- 盡可能簡短、友善回答
- 盡可能使用工具來提供使用者盡可能準確與完整的資訊
- 請以使用者的語言回答問題
- 葛如鈞=寶博士=Ju-Chun KO
- 若無法回答請告知使用者「無法根據現有資訊回答」。
- 請不要回答與對話內容嚴重偏題的問題
- 請不要根據對話中沒有的資訊回答問題
- 在分析議題時，若有不同觀點，請多方參考並總結
<viewPage>
current page: https://transpal.juchunko.com/speeches/${filename}
</viewPage>`;

      // --------------------------------------------------------------
      // 執行 LLM，並注入各種 tool
      // --------------------------------------------------------------
      const result = streamText({
        model: openrouter.chat("google/gemini-3-flash-preview"),
        system: systemPrompt,
        messages: await convertToModelMessages(messages),
        maxSteps: 8,
        experimental_transform: smoothStream({
          delayInMs: 10,
          chunking: /[\u4E00-\u9FFF]|\S+\s+/, // 中英分段顯示
        }),
        tools: {
          // ----------------- 讀取目前頁面 -----------------
          viewPage: tool({
            description: "Get the current page content",
            parameters: z.object({}).strict(),
            execute: async () => {
              try {
                const fileData = await fetch(
                  // remove last slash
                  `https://raw.githubusercontent.com/DrJuChunKoO/TransPal/refs/heads/main/public${filename.replace(
                    /\/$/,
                    "",
                  )}.json`,
                )
                  .then((res) => res.json())
                  .then((x) =>
                    x.content
                      .map(
                        ({
                          speaker,
                          text,
                        }: {
                          speaker: string;
                          text: string;
                        }) => ({
                          speaker,
                          text,
                        }),
                      )
                      .map((x: { speaker: string; text: string }) => {
                        return `${x.speaker}：${x.text}`;
                      })
                      .join("\n"),
                  );

                return `base: https://transpal.juchunko.com/\n目前頁面內容：\n${fileData}`;
              } catch (error) {
                console.error("Error fetching file data:", error);
                return `base: https://transpal.juchunko.com/\n目前頁面內容：\n無法讀取目前頁面內容，請稍後再試。`;
              }
            },
          }),
        },
      });

      return result.toUIMessageStreamResponse();
    }
    if (
      url.pathname.startsWith("/speeches/") &&
      url.pathname.split("/").length > 4
    ) {
      const pathname = url.pathname;
      // 處理帶訊息ID的演講頁面重定向 (格式: /speeches/{filename}/{messageId})
      const speechWithMessagePattern = /^\/speeches\/([^\/]+)\/([^\/]+)$/;
      const speechMatch = pathname.match(speechWithMessagePattern);
      if (speechMatch) {
        const filename = speechMatch[1];
        const location = `https://${request.headers.get(
          "host",
        )}/speeches/${filename}`;
        return Response.redirect(location, 301);
      }
    }

    // 非上述路由 – 直接回傳靜態檔 (免費 CDN)
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
