import { describe, expect, it } from "vitest";

import {
  QUICK_PROMPTS,
  collectToolParts,
  extractMessageText,
  extractReasoningText,
  getToolDescriptor,
  getToolLabel,
  hasRenderableText,
  isBusyStatus,
  isToolPartRunning,
  normalizeToolPart,
  selectQuickPrompts,
} from "./chat-bot";

describe("getToolDescriptor", () => {
  it("maps the worker's tools to their icon family", () => {
    expect(getToolDescriptor("viewPage")).toEqual({
      iconName: "view",
      label: "查看頁面內容",
    });
  });

  it("falls back to the generic tool descriptor", () => {
    expect(getToolDescriptor("somethingNew")).toEqual({
      iconName: "tool",
      label: "使用工具",
    });
  });
});

describe("getToolLabel", () => {
  it("returns the localized label", () => {
    expect(getToolLabel("viewPage")).toBe("查看頁面內容");
    expect(getToolLabel("mysteryTool")).toBe("使用工具");
  });
});

describe("normalizeToolPart", () => {
  it("reads static tool parts from the `tool-<name>` type", () => {
    expect(
      normalizeToolPart({
        type: "tool-viewPage",
        state: "output-available",
        toolCallId: "call-1",
      }),
    ).toEqual({
      toolName: "viewPage",
      state: "output-available",
      toolCallId: "call-1",
    });
  });

  it("reads dynamic tool parts from the `toolName` field", () => {
    expect(
      normalizeToolPart({ type: "dynamic-tool", toolName: "viewPage" }),
    ).toEqual({
      toolName: "viewPage",
      state: "input-available",
      toolCallId: undefined,
    });
  });

  it("rejects non-tool and malformed parts", () => {
    expect(normalizeToolPart({ type: "text", text: "hi" })).toBeNull();
    expect(normalizeToolPart({ type: "dynamic-tool" })).toBeNull();
    expect(normalizeToolPart(null)).toBeNull();
    expect(normalizeToolPart("tool-viewPage")).toBeNull();
  });
});

describe("collectToolParts", () => {
  it("keeps every tool call in stream order and skips the rest", () => {
    expect(
      collectToolParts([
        { type: "step-start" },
        { type: "text", text: "hello" },
        { type: "tool-viewPage", state: "output-available", toolCallId: "a" },
        { type: "reasoning", text: "hmm" },
        { type: "dynamic-tool", toolName: "future", state: "input-streaming" },
      ]),
    ).toEqual([
      { toolName: "viewPage", state: "output-available", toolCallId: "a" },
      { toolName: "future", state: "input-streaming", toolCallId: undefined },
    ]);
  });

  it("tolerates missing parts", () => {
    expect(collectToolParts(undefined)).toEqual([]);
    expect(collectToolParts([null, "text", 42])).toEqual([]);
  });
});

describe("isToolPartRunning", () => {
  it("only treats pre-output states as running", () => {
    expect(isToolPartRunning("input-streaming")).toBe(true);
    expect(isToolPartRunning("input-available")).toBe(true);
    expect(isToolPartRunning("output-available")).toBe(false);
    expect(isToolPartRunning("output-error")).toBe(false);
  });
});

describe("extractMessageText", () => {
  it("joins text parts and skips everything else", () => {
    const parts = [
      { type: "reasoning", text: "internal" },
      { type: "text", text: "first" },
      { type: "text", text: "" },
      { type: "tool-viewPage", state: "output-available" },
      { type: "text", text: "second" },
    ];

    expect(extractMessageText(parts)).toBe("first\n\nsecond");
    expect(hasRenderableText(parts)).toBe(true);
  });

  it("reports no renderable text for empty or tool-only messages", () => {
    expect(extractMessageText(undefined)).toBe("");
    expect(hasRenderableText([{ type: "text", text: "" }])).toBe(false);
    expect(
      hasRenderableText([{ type: "tool-viewPage", state: "input-available" }]),
    ).toBe(false);
  });
});

describe("extractReasoningText", () => {
  it("collects reasoning parts separately from the answer", () => {
    expect(
      extractReasoningText([
        { type: "reasoning", text: "step one" },
        { type: "text", text: "answer" },
        { type: "reasoning", text: "step two" },
      ]),
    ).toBe("step one\n\nstep two");
  });

  it("ignores blank reasoning and missing parts", () => {
    expect(extractReasoningText([{ type: "reasoning", text: "   " }])).toBe("");
    expect(extractReasoningText(undefined)).toBe("");
  });
});

describe("selectQuickPrompts", () => {
  it("returns every prompt for a fresh conversation", () => {
    expect(selectQuickPrompts([])).toHaveLength(QUICK_PROMPTS.length);
  });

  it("hides prompts the user already sent", () => {
    const [first] = QUICK_PROMPTS;
    expect(first).toBeDefined();

    const remaining = selectQuickPrompts([first!.prompt]);
    expect(remaining).toHaveLength(QUICK_PROMPTS.length - 1);
    expect(
      remaining.some((quickPrompt) => quickPrompt.prompt === first!.prompt),
    ).toBe(false);
  });

  it("ignores texts that are not quick prompts", () => {
    expect(selectQuickPrompts(["這不是快速提示"])).toHaveLength(
      QUICK_PROMPTS.length,
    );
  });
});

describe("isBusyStatus", () => {
  it("treats submitted and streaming as busy", () => {
    expect(isBusyStatus("submitted")).toBe(true);
    expect(isBusyStatus("streaming")).toBe(true);
    expect(isBusyStatus("ready")).toBe(false);
    expect(isBusyStatus("error")).toBe(false);
  });
});
