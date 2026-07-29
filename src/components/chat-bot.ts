/**
 * Pure helpers behind `ChatBot.tsx`.
 *
 * The worker streams more than plain text — tool calls and reasoning parts arrive on the same
 * message. Keeping the normalisation and selection logic here (free of React and of the AI SDK's
 * types, which change shape between majors) makes it unit-testable and keeps the component
 * focused on rendering.
 */

/** Which lucide icon family a tool belongs to. Mapped to components in the React layer. */
export type ToolIconName = "view" | "tool";

export interface ToolDescriptor {
  iconName: ToolIconName;
  /** User-visible label shown on the tool marker. */
  label: string;
}

/** Mirrors the tools registered in `src/worker/index.ts`. */
const TOOL_DESCRIPTORS: Record<string, ToolDescriptor> = {
  viewPage: { iconName: "view", label: "查看頁面內容" },
};

const FALLBACK_DESCRIPTOR: ToolDescriptor = {
  iconName: "tool",
  label: "使用工具",
};

export function getToolDescriptor(toolName: string): ToolDescriptor {
  return TOOL_DESCRIPTORS[toolName] ?? FALLBACK_DESCRIPTOR;
}

export function getToolLabel(toolName: string): string {
  return getToolDescriptor(toolName).label;
}

export type ToolPartState =
  | "input-streaming"
  | "input-available"
  | "output-available"
  | "output-error";

export interface NormalizedToolPart {
  toolName: string;
  state: ToolPartState;
  toolCallId?: string;
}

/** Both static (`tool-<name>`) and dynamic tool parts normalize to the same shape. */
export function normalizeToolPart(part: unknown): NormalizedToolPart | null {
  if (typeof part !== "object" || part === null) return null;

  const candidate = part as {
    type?: unknown;
    toolName?: unknown;
    state?: unknown;
    toolCallId?: unknown;
  };
  const type = typeof candidate.type === "string" ? candidate.type : "";
  const state =
    typeof candidate.state === "string"
      ? (candidate.state as ToolPartState)
      : "input-available";
  const toolCallId =
    typeof candidate.toolCallId === "string" ? candidate.toolCallId : undefined;

  if (type === "dynamic-tool" && typeof candidate.toolName === "string") {
    return { toolName: candidate.toolName, state, toolCallId };
  }

  if (type.startsWith("tool-")) {
    return { toolName: type.slice("tool-".length), state, toolCallId };
  }

  return null;
}

export function collectToolParts(
  parts: readonly unknown[] | undefined,
): NormalizedToolPart[] {
  if (!parts) return [];

  const toolParts: NormalizedToolPart[] = [];
  for (const part of parts) {
    const normalized = normalizeToolPart(part);
    if (normalized) toolParts.push(normalized);
  }

  return toolParts;
}

/** A tool marker should show a spinner until its output (or error) has landed. */
export function isToolPartRunning(state: ToolPartState): boolean {
  return state === "input-streaming" || state === "input-available";
}

function readPartText(
  part: unknown,
  type: "text" | "reasoning",
): string | null {
  if (typeof part !== "object" || part === null) return null;
  const candidate = part as { type?: unknown; text?: unknown };
  if (candidate.type !== type || typeof candidate.text !== "string")
    return null;
  return candidate.text;
}

/** Joins every text part of a message into the plain string the copy action puts on the clipboard. */
export function extractMessageText(
  parts: readonly unknown[] | undefined,
): string {
  if (!parts) return "";

  return parts
    .map((part) => readPartText(part, "text"))
    .filter((text): text is string => text !== null && text !== "")
    .join("\n\n");
}

export function extractReasoningText(
  parts: readonly unknown[] | undefined,
): string {
  if (!parts) return "";

  return parts
    .map((part) => readPartText(part, "reasoning"))
    .filter((text): text is string => text !== null && text.trim() !== "")
    .join("\n\n");
}

export function hasRenderableText(
  parts: readonly unknown[] | undefined,
): boolean {
  return extractMessageText(parts) !== "";
}

export interface QuickPrompt {
  /** Button label. */
  text: string;
  /** Message actually sent to the model. */
  prompt: string;
}

export const QUICK_PROMPTS: readonly QuickPrompt[] = [
  { text: "重點摘要", prompt: "摘要此對話的重點" },
  { text: "背景資訊", prompt: "提供此內容的背景資訊" },
  { text: "主要觀點", prompt: "說明此內容的主要觀點?" },
  { text: "詳細解釋", prompt: "詳細解釋此內容?" },
  { text: "生成問答", prompt: "為此內容生成問答" },
];

/** Hides prompts the user already sent, so the suggestion list shrinks as the conversation grows. */
export function selectQuickPrompts(
  sentTexts: readonly string[],
): QuickPrompt[] {
  const sent = new Set(sentTexts);
  return QUICK_PROMPTS.filter((quickPrompt) => !sent.has(quickPrompt.prompt));
}

export type ChatStatus = "submitted" | "streaming" | "ready" | "error";

export function isBusyStatus(status: ChatStatus): boolean {
  return status === "submitted" || status === "streaming";
}
