import { createOpenAI } from "@ai-sdk/openai";
import { streamText, smoothStream } from "ai";
import { getSpeech } from "@/utils/speeches";

export const runtime = "edge";
export const maxDuration = 30;

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL:
    "https://gateway.ai.cloudflare.com/v1/3f1f83a939b2fc99ca45fd8987962514/open-ai/openai",
});

export async function POST(req: Request) {
  let filename: string | null = null;
  let messages: any[] | null = null;

  try {
    const body = await req.json();
    messages = body.messages;
    filename = body.filename;

    // Check if filename and messages were provided
    if (!filename || typeof filename !== "string") {
      console.error(
        "[API Completion] Error: Missing or invalid filename in request body.",
      );
      return new Response("Missing or invalid filename", { status: 400 });
    }
    if (!messages || !Array.isArray(messages)) {
      console.error(
        "[API Completion] Error: Missing or invalid messages in request body.",
      );
      return new Response("Missing or invalid messages", { status: 400 });
    }

    // Now filename is guaranteed to be a string here
    const speechData = await getSpeech(filename);

    if (!speechData) {
      console.error(
        `[API Completion] Error: Speech data not found for filename: ${filename}`,
      );
      return new Response("Speech data not found", { status: 404 });
    }

    if (!speechData.content || speechData.content.length === 0) {
      console.error(
        `[API Completion] Error: Speech content is empty for filename: ${filename}`,
      );
      return new Response("Speech content is empty", { status: 400 });
    }

    let speechMessages = speechData.content.map(
      ({ speaker, text }: { speaker: string; text: string }) => ({
        speaker,
        text,
      }),
    );

    const systemPrompt = `你是會議逐字稿的 AI 助手
  1. 請根據對話內容回答使用者的問題，若無法回答請告知使用者「無法根據現有資訊回答」。
  2. 請不要回答與對話內容嚴重偏題的問題
  3. 請不要根據對話中沒有的資訊回答問題
  4. 在分析議題時，若有不同觀點，請多方參考並總結`;

    const result = streamText({
      model: openai.responses("gpt-4.1-mini"),
      experimental_transform: smoothStream({
        delayInMs: 10,
        chunking: /[\u4E00-\u9FFF]|\S+\s+/,
      }),
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "system",
          content: `這是對話內容：\n\n${speechMessages
            .map((x: { speaker: string; text: string }) => {
              return `${x.speaker}：${x.text}`;
            })
            .join("\n")}`,
        },
        ...messages, // messages from useChat already includes the latest user prompt
      ],
    });

    return result.toDataStreamResponse();
  } catch (e) {
    // Log the error with filename context if available
    console.error(
      `[API Completion] Error caught in POST for filename: ${filename ?? "[unknown]"}. Error:`,
      e,
    );
    return new Response("Unexpected error processing AI completion request", {
      status: 500,
    });
  }
}
