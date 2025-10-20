"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import LucideBot from "~icons/lucide/bot";
import LucideSend from "~icons/lucide/send";
import LucideX from "~icons/lucide/x";
import LucideArrowRight from "~icons/lucide/arrow-right";
import { useChat } from "@ai-sdk/react";
import Markdown from "markdown-to-jsx";
import LoadingDots from "./LoadingDots.tsx";

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const handleDialogKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Preserve scroll position and always scroll to the latest message.
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    status,
    append,
  } = useChat({
    api: "/api/chat",
    body: {
      filename: typeof window !== "undefined" ? window.location.pathname : "/",
    },
  });

  // Quick prompts definitions
  const quickPrompts = [
    {
      text: "重點摘要",
      prompt: "摘要此對話的重點",
    },
    {
      text: "背景資訊",
      prompt: "提供此內容的背景資訊",
    },
    {
      text: "主要觀點",
      prompt: "說明此內容的主要觀點?",
    },
    {
      text: "詳細解釋",
      prompt: "詳細解釋此內容?",
    },
    {
      text: `生成問答`,
      prompt: "為此內容生成問答",
    },
  ] as { text: string; prompt: string }[];

  const sendQuickPrompt = (promptStr: string) => {
    append({ role: "user", content: promptStr });
  };

  useEffect(() => {
    // scroll to bottom when new message arrives
    messagesEndRef.current?.scrollIntoView();
  }, [messages, status]);

  return (
    <motion.div layoutScroll>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            className="fixed right-4 bottom-4 block w-max cursor-pointer rounded-full bg-gray-100/90 p-3 px-4 text-base shadow-sm backdrop-blur-sm hover:bg-gray-200 active:bg-gray-300 md:m-auto md:p-2 md:px-4 md:text-sm dark:bg-gray-800/80 dark:text-gray-100 dark:hover:bg-gray-700 dark:active:bg-gray-600"
            aria-label="開始討論對話視窗"
            aria-expanded={isOpen}
            aria-controls="chat-bot-panel"
            onClick={() => setIsOpen(true)}
            layoutId="chat-bot"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="flex items-center gap-2"
              layoutId="chat-bot-title"
            >
              <LucideBot className="h-5 w-5" /> 和 AI 一起討論
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            layoutId="chat-bot"
            className="fixed right-2 bottom-2 z-20 w-90 max-w-[90vw] overflow-hidden rounded-xl bg-white shadow-lg dark:bg-gray-900"
          >
            <div
              id="chat-bot-panel"
              className="rounded-xl border border-gray-200 bg-gray-50 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
              role="dialog"
              aria-labelledby="chat-bot-title"
            >
              <div className="flex justify-between gap-1 p-2 pl-4">
                <motion.div
                  layoutId="chat-bot-title"
                  className="flex items-center gap-2"
                >
                  <LucideBot className="h-5 w-5" /> AI 助手
                </motion.div>

                <motion.button
                  className="cursor-pointer rounded-md border border-black/5 bg-gray-200 p-1 text-sm hover:bg-gray-300 active:bg-gray-300 dark:border-white/5 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 dark:active:bg-gray-700"
                  onClick={() => setIsOpen(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LucideX className="h-5 w-5" />
                </motion.button>
              </div>
              {/* Message list */}
              <div
                className="h-120 max-h-[60vh] border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950"
                role="log"
                aria-live="polite"
              >
                <motion.div
                  className="flex h-full flex-col space-y-3 overflow-y-auto p-4 text-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: 0.35 }}
                >
                  <div className="text-center text-xs text-gray-500">
                    AI 可能會犯錯，可能會有錯誤或不準確的回應。
                  </div>

                  {[
                    {
                      id: "system",
                      role: "assistant",
                      content:
                        "嗨，我是 AI 助手，隨時準備回答您的問題！請問有什麼我可以幫助您的？",
                    },
                    ...messages,
                  ].map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${
                        m.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <motion.div
                        className={[
                          "prose prose-sm prose-neutral prose-tight max-w-[80%] rounded-lg px-3 py-1 break-words whitespace-pre-wrap",
                          m.role === "user"
                            ? "prose-invert origin-right bg-blue-500 text-white"
                            : "dark:prose-invert origin-left bg-gray-100 dark:bg-gray-800",
                        ].join(" ")}
                        role="article"
                        aria-label={
                          m.role === "user" ? "使用者訊息" : "助理訊息"
                        }
                        initial={{
                          opacity: 0,
                          x: m.role === "user" ? 10 : -10,
                          rotate: m.role === "user" ? 1 : -1,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                          rotate: 0,
                        }}
                        exit={{
                          opacity: 0,
                          x: m.role === "user" ? 10 : -10,
                          rotate: m.role === "user" ? -1 : 1,
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        {m.content === "" ? (
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-500">
                              載入中
                            </span>
                            <LoadingDots />
                          </div>
                        ) : (
                          <Markdown>{m.content}</Markdown>
                        )}
                      </motion.div>
                    </div>
                  ))}
                  {/* Quick prompt buttons */}
                  <AnimatePresence>
                    {status === "ready" && (
                      <motion.div
                        className="-mt-1.5 flex flex-col dark:border-gray-800"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {quickPrompts
                          // filter is in messages
                          .filter(
                            (qp) =>
                              !messages.some((m) => m.content === qp.prompt),
                          )
                          .map((qp) => (
                            <button
                              key={qp.text}
                              onClick={() => sendQuickPrompt(qp.prompt)}
                              aria-label={`快速提示: ${qp.text}`}
                              aria-pressed={false}
                              role="button"
                              tabIndex={0}
                              className="group flex cursor-pointer items-center gap-0.5 rounded p-1 text-left text-sm text-gray-500 transition-all hover:font-medium hover:tracking-wide hover:text-gray-700 disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                              {qp.text}
                              <LucideArrowRight className="h-4 w-4 opacity-50 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                            </button>
                          ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div ref={messagesEndRef} className="flex-1" />
                </motion.div>
              </div>

              {/* Input area */}
              <form
                role="form"
                aria-label="聊天表單"
                onSubmit={(e) => {
                  handleSubmit(e);
                  setInput("");
                }}
                className="dark:border-gray-800"
              >
                <div className="flex items-center gap-2 rounded-b-lg border-t border-gray-200 dark:border-gray-800">
                  <textarea
                    className="h-10 w-full resize-none bg-transparent p-2 px-4 text-gray-900 placeholder-gray-400 outline-none dark:text-gray-100 dark:placeholder-gray-500"
                    placeholder="請輸入您的問題..."
                    value={input}
                    onChange={handleInputChange}
                    // Ignore Enter while the user is still composing (IME)
                    onKeyDown={(e) => {
                      const isComposing = (e.nativeEvent as any).isComposing;
                      if (e.key === "Enter" && !e.shiftKey && !isComposing) {
                        e.preventDefault();
                        handleSubmit();
                        setInput("");
                      }
                    }}
                    tabIndex={0}
                    aria-describedby="chat-bot-instructions"
                    ref={textareaRef}
                  />
                  <button
                    type="submit"
                    disabled={status === "streaming" || input.trim() === ""}
                    aria-label="送出訊息"
                    aria-disabled={
                      status === "streaming" || input.trim() === ""
                        ? "true"
                        : "false"
                    }
                    className="flex h-10 w-14 cursor-pointer items-center justify-center rounded-br-lg bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:disabled:bg-gray-800"
                  >
                    <LucideSend className="h-4 w-4" />
                  </button>
                  <div id="chat-bot-instructions" className="sr-only">
                    按下 Enter 鍵送出訊息
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
