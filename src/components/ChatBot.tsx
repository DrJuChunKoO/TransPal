"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isTextUIPart } from "ai";
import Markdown from "markdown-to-jsx";

import LucideArrowDown from "~icons/lucide/arrow-down";
import LucideArrowRight from "~icons/lucide/arrow-right";
import LucideArrowUp from "~icons/lucide/arrow-up";
import LucideBot from "~icons/lucide/bot";
import LucideCheck from "~icons/lucide/check";
import LucideChevronDown from "~icons/lucide/chevron-down";
import LucideCopy from "~icons/lucide/copy";
import LucideEye from "~icons/lucide/eye";
import LucideLightbulb from "~icons/lucide/lightbulb";
import LucideMaximize2 from "~icons/lucide/maximize-2";
import LucideMinimize2 from "~icons/lucide/minimize-2";
import LucideRefreshCw from "~icons/lucide/refresh-cw";
import LucideSquare from "~icons/lucide/square";
import LucideTriangleAlert from "~icons/lucide/triangle-alert";
import LucideWrench from "~icons/lucide/wrench";
import LucideX from "~icons/lucide/x";

import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import {
  Message,
  MessageContent,
  MessageFooter,
} from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { applyDialogScrollLock } from "@/utils/scrollLock";
import {
  collectToolParts,
  extractMessageText,
  extractReasoningText,
  getToolDescriptor,
  getToolLabel,
  hasRenderableText,
  isBusyStatus,
  isToolPartRunning,
  selectQuickPrompts,
  type NormalizedToolPart,
  type QuickPrompt,
  type ToolIconName,
} from "./chat-bot";

type IconComponent = (props: React.SVGProps<SVGSVGElement>) => React.ReactNode;

const TOOL_ICONS: Record<ToolIconName, IconComponent> = {
  view: LucideEye,
  tool: LucideWrench,
};

/** One persistent row per tool call, so the activity stays readable after the answer lands. */
function ToolMarker({ toolPart }: { toolPart: NormalizedToolPart }) {
  const running = isToolPartRunning(toolPart.state);
  const failed = toolPart.state === "output-error";
  const ToolIcon = TOOL_ICONS[getToolDescriptor(toolPart.toolName).iconName];
  const label = getToolLabel(toolPart.toolName);

  return (
    <Marker
      role={running ? "status" : undefined}
      className={cn(failed && "text-destructive")}
    >
      <MarkerIcon>{running ? <Spinner /> : <ToolIcon />}</MarkerIcon>
      <MarkerContent className={cn(running && "shimmer")}>
        {failed ? `${label} · 工具執行失敗` : label}
      </MarkerContent>
    </Marker>
  );
}

function ReasoningDisclosure({ text }: { text: string }) {
  return (
    <Collapsible>
      <CollapsibleTrigger
        className="group/reasoning text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-2 text-sm transition-colors"
        render={<button type="button" />}
      >
        <LucideLightbulb className="size-4" />
        推理過程
        <LucideChevronDown className="size-3.5 transition-transform duration-150 group-data-panel-open/reasoning:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="text-muted-foreground h-(--collapsible-panel-height) overflow-hidden text-xs whitespace-pre-wrap transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0">
        <div className="border-border mt-2 border-s ps-3">{text}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function QuickPromptList({
  quickPrompts,
  onSelect,
  className,
}: {
  quickPrompts: QuickPrompt[];
  onSelect: (prompt: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      {quickPrompts.map((quickPrompt) => (
        <button
          key={quickPrompt.text}
          type="button"
          onClick={() => onSelect(quickPrompt.prompt)}
          aria-label={`快速提示：${quickPrompt.text}`}
          className="group text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-0.5 rounded p-1 text-left text-sm transition-all hover:font-medium hover:tracking-wide"
        >
          {quickPrompt.text}
          <LucideArrowRight className="size-4 opacity-50 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
        </button>
      ))}
    </div>
  );
}

export default function ChatBot() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const copyResetRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const prefersReducedMotion = Boolean(useReducedMotion());

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        // Read the pathname at send time so the worker's `viewPage` tool always sees the page
        // the reader is actually on.
        prepareSendMessagesRequest: ({ messages }) => ({
          body: {
            messages,
            filename:
              typeof window === "undefined" ? "/" : window.location.pathname,
          },
        }),
      }),
    [],
  );

  const { messages, status, sendMessage, stop, regenerate, error, clearError } =
    useChat({ transport });

  const busy = isBusyStatus(status);

  const closePanel = useCallback(() => {
    setIsOpen(false);
    setExpanded(false);
  }, []);

  // 全螢幕時鎖住頁面滾動，關閉後還原
  useEffect(() => {
    if (!isOpen || !expanded) return;
    return applyDialogScrollLock(document);
  }, [isOpen, expanded]);

  // Esc 先離開全螢幕，再關閉視窗
  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (expanded) {
        setExpanded(false);
        return;
      }
      setIsOpen(false);
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, expanded]);

  useEffect(() => {
    if (!isOpen) return;
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(focusTimer);
  }, [isOpen]);

  useEffect(() => () => clearTimeout(copyResetRef.current), []);

  // 使用者只會看到本地化的錯誤訊息，實際原因保留在 console 供除錯
  useEffect(() => {
    if (error) console.error("AI assistant chat request failed", error);
  }, [error]);

  const sentTexts = useMemo(
    () =>
      messages
        .filter((message) => message.role === "user")
        .map((message) => extractMessageText(message.parts)),
    [messages],
  );
  const quickPrompts = useMemo(
    () => selectQuickPrompts(sentTexts),
    [sentTexts],
  );

  const submitPrompt = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      if (status === "error") clearError();
      sendMessage({ text: trimmed });
    },
    [busy, clearError, sendMessage, status],
  );

  const handleSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!input.trim()) return;
    submitPrompt(input);
    setInput("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleRetry = useCallback(() => {
    if (status === "error") clearError();
    void regenerate();
  }, [clearError, regenerate, status]);

  const handleCopy = useCallback(async (messageId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      clearTimeout(copyResetRef.current);
      copyResetRef.current = setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (copyError) {
      // 剪貼簿權限可能被拒絕，僅記錄不中斷對話
      console.error("Failed to copy assistant message", copyError);
    }
  }, []);

  const lastMessage = messages[messages.length - 1];
  const lastAssistantMessage =
    lastMessage?.role === "assistant" ? lastMessage : undefined;
  const hasRunningTool = lastAssistantMessage
    ? collectToolParts(lastAssistantMessage.parts).some((toolPart) =>
        isToolPartRunning(toolPart.state),
      )
    : false;
  // 只有在還沒有任何工具或文字可看時才顯示「思考中」，避免與工具列重複
  const showThinking =
    busy && !hasRunningTool && !hasRenderableText(lastAssistantMessage?.parts);
  const canRetry = !busy && lastAssistantMessage !== undefined;

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            type="button"
            layoutId="chat-bot"
            className="bg-card/75 ring-border/50 text-foreground hover:bg-muted fixed right-4 bottom-4 z-40 flex w-max cursor-pointer items-center gap-2 rounded-full px-4 py-3 text-base shadow-lg ring-1 backdrop-blur-xl transition-colors md:py-2 md:text-sm"
            aria-label="開啟 AI 助手對話視窗"
            aria-expanded={false}
            aria-controls="chat-bot-panel"
            onClick={() => setIsOpen(true)}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
          >
            <motion.span
              layoutId="chat-bot-title"
              className="flex items-center gap-2"
            >
              <LucideBot className="text-primary size-5" />和 AI 一起討論
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            layoutId="chat-bot"
            id="chat-bot-panel"
            role="dialog"
            aria-modal={expanded}
            aria-label="AI 助手"
            className={cn(
              "ring-border/50 fixed flex flex-col overflow-hidden",
              expanded
                ? "bg-card inset-0 z-50 rounded-none ring-0"
                : "bg-card/75 right-4 bottom-4 z-40 w-100 max-w-[calc(100vw-32px)] origin-bottom-right rounded-xl shadow-lg ring-1 backdrop-blur-xl",
            )}
          >
            {/* 標題欄 */}
            <div className="bg-muted text-foreground border-border shrink-0 border-b">
              <div
                className={cn(
                  "flex items-center justify-between gap-2 p-2 pl-4",
                  expanded && "mx-auto w-full max-w-3xl",
                )}
              >
                <motion.h3
                  layoutId="chat-bot-title"
                  className="flex items-center gap-2 font-semibold"
                >
                  <LucideBot className="text-primary size-5" />
                  AI 助手
                </motion.h3>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
                    onClick={() => setExpanded((value) => !value)}
                    aria-label={expanded ? "離開全螢幕" : "放大為全螢幕"}
                  >
                    {expanded ? <LucideMinimize2 /> : <LucideMaximize2 />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
                    onClick={closePanel}
                    aria-label="關閉對話視窗"
                  >
                    <LucideX />
                  </Button>
                </div>
              </div>
            </div>

            {/* 對話內容 */}
            <MessageScrollerProvider
              autoScroll
              defaultScrollPosition="last-anchor"
              scrollPreviousItemPeek={48}
            >
              <MessageScroller
                className={cn(
                  "bg-card/50",
                  expanded ? "min-h-0 flex-1" : "h-100 max-h-[60vh] w-full",
                )}
              >
                <MessageScrollerViewport aria-label="對話紀錄">
                  <MessageScrollerContent
                    aria-busy={busy}
                    className={cn(
                      "gap-4 p-4",
                      expanded && "mx-auto w-full max-w-3xl gap-6 py-6",
                    )}
                  >
                    <MessageScrollerItem messageId="disclaimer">
                      <Marker variant="separator">
                        <MarkerContent className="text-xs">
                          AI 可能會犯錯，可能會有錯誤或不準確的回應。
                        </MarkerContent>
                      </Marker>
                    </MessageScrollerItem>

                    {messages.length === 0 ? (
                      <MessageScrollerItem
                        messageId="empty-state"
                        className="flex shrink flex-col"
                      >
                        <Empty className="border-0 p-2">
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <LucideBot />
                            </EmptyMedia>
                            <EmptyTitle className="text-base">
                              AI 助手
                            </EmptyTitle>
                            <EmptyDescription>
                              嗨，我是 AI
                              助手，隨時準備回答您的問題！請問有什麼我可以幫助您的？
                            </EmptyDescription>
                          </EmptyHeader>
                          <EmptyContent>
                            <QuickPromptList
                              quickPrompts={quickPrompts}
                              onSelect={submitPrompt}
                              className="w-full items-start"
                            />
                          </EmptyContent>
                        </Empty>
                      </MessageScrollerItem>
                    ) : (
                      messages.map((message) => {
                        const isUser = message.role === "user";
                        const messageText = extractMessageText(message.parts);
                        const reasoningText = extractReasoningText(
                          message.parts,
                        );
                        const toolParts = collectToolParts(message.parts);
                        const showFooter =
                          !isUser && messageText !== "" && !busy;

                        return (
                          <MessageScrollerItem
                            key={message.id}
                            messageId={message.id}
                            scrollAnchor={isUser}
                          >
                            <Message align={isUser ? "end" : "start"}>
                              <MessageContent>
                                {toolParts.map((toolPart, index) => (
                                  <ToolMarker
                                    key={
                                      toolPart.toolCallId ??
                                      `${toolPart.toolName}-${index}`
                                    }
                                    toolPart={toolPart}
                                  />
                                ))}

                                {reasoningText !== "" && (
                                  <ReasoningDisclosure text={reasoningText} />
                                )}

                                {messageText !== "" && (
                                  <Bubble
                                    variant={isUser ? "default" : "muted"}
                                    align={isUser ? "end" : "start"}
                                    aria-label={
                                      isUser ? "使用者訊息" : "助理訊息"
                                    }
                                  >
                                    <BubbleContent
                                      className={cn(
                                        // `prose-tight` collapses typography margins so replies stay
                                        // readable inside the narrow floating panel.
                                        "prose prose-sm prose-neutral prose-tight max-w-none rounded-2xl",
                                        isUser
                                          ? "prose-invert"
                                          : "dark:prose-invert",
                                      )}
                                    >
                                      {message.parts.map((part, index) =>
                                        isTextUIPart(part) &&
                                        part.text !== "" ? (
                                          <Markdown key={index}>
                                            {part.text}
                                          </Markdown>
                                        ) : null,
                                      )}
                                    </BubbleContent>
                                  </Bubble>
                                )}

                                {showFooter && (
                                  <MessageFooter className="gap-0.5 px-0">
                                    <Button
                                      variant="ghost"
                                      size="icon-xs"
                                      className="text-muted-foreground hover:text-foreground cursor-pointer rounded-md"
                                      onClick={() =>
                                        void handleCopy(message.id, messageText)
                                      }
                                      aria-label={
                                        copiedMessageId === message.id
                                          ? "已複製"
                                          : "複製回覆"
                                      }
                                    >
                                      {copiedMessageId === message.id ? (
                                        <LucideCheck />
                                      ) : (
                                        <LucideCopy />
                                      )}
                                    </Button>
                                    {canRetry &&
                                      message.id ===
                                        lastAssistantMessage?.id && (
                                        <Button
                                          variant="ghost"
                                          size="icon-xs"
                                          className="text-muted-foreground hover:text-foreground cursor-pointer rounded-md"
                                          onClick={handleRetry}
                                          aria-label="重新產生"
                                        >
                                          <LucideRefreshCw />
                                        </Button>
                                      )}
                                  </MessageFooter>
                                )}
                              </MessageContent>
                            </Message>
                          </MessageScrollerItem>
                        );
                      })
                    )}

                    {showThinking && (
                      <MessageScrollerItem messageId="thinking">
                        <Marker role="status">
                          <MarkerIcon>
                            <Spinner />
                          </MarkerIcon>
                          <MarkerContent className="shimmer">
                            思考中
                          </MarkerContent>
                        </Marker>
                      </MessageScrollerItem>
                    )}

                    {status === "error" && (
                      <MessageScrollerItem messageId="error">
                        <Marker role="status" className="text-destructive">
                          <MarkerIcon>
                            <LucideTriangleAlert />
                          </MarkerIcon>
                          <MarkerContent>
                            回覆時發生錯誤，請再試一次。
                          </MarkerContent>
                        </Marker>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 cursor-pointer rounded-lg"
                          onClick={handleRetry}
                        >
                          <LucideRefreshCw />
                          重新產生
                        </Button>
                      </MessageScrollerItem>
                    )}

                    {messages.length > 0 &&
                      status === "ready" &&
                      quickPrompts.length > 0 && (
                        <MessageScrollerItem messageId="quick-prompts">
                          <QuickPromptList
                            quickPrompts={quickPrompts}
                            onSelect={submitPrompt}
                          />
                        </MessageScrollerItem>
                      )}
                  </MessageScrollerContent>
                </MessageScrollerViewport>
                <MessageScrollerButton className="rounded-full">
                  <LucideArrowDown />
                  <span className="sr-only">捲動至最新訊息</span>
                </MessageScrollerButton>
              </MessageScroller>
            </MessageScrollerProvider>

            {/* 輸入區域 */}
            <form
              aria-label="聊天表單"
              onSubmit={handleSubmit}
              className={cn(
                "shrink-0 p-2",
                expanded && "mx-auto w-full max-w-3xl pb-4",
              )}
            >
              <div className="bg-muted/50 ring-border/50 focus-within:ring-primary/50 focus-within:bg-muted flex items-end gap-2 rounded-lg p-1 ring-1 transition-all">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="請輸入您的問題..."
                  aria-describedby="chat-bot-instructions"
                  rows={1}
                  className="text-foreground max-h-40 min-h-9 flex-1 rounded-md border-0 bg-transparent px-3 py-2 text-sm focus-visible:ring-0 md:text-sm"
                />
                {busy ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon-lg"
                    className="cursor-pointer rounded-lg"
                    onClick={() => stop()}
                    aria-label="停止生成"
                  >
                    <LucideSquare className="size-3.5 fill-current" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="icon-lg"
                    className="cursor-pointer rounded-lg"
                    disabled={input.trim() === ""}
                    aria-label="送出訊息"
                  >
                    <LucideArrowUp />
                  </Button>
                )}
              </div>
              <div id="chat-bot-instructions" className="sr-only">
                按下 Enter 鍵送出訊息
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
