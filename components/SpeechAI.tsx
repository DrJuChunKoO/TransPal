"use client";
import { useEffect, useState, useRef, useCallback, FormEvent } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  MotionValue,
} from "motion/react";
import {
  BotMessageSquare,
  Minus,
  Bot,
  User,
  RotateCcw,
  Send,
  Copy,
  Check,
  X,
} from "lucide-react";
import { twMerge } from "tailwind-merge";
import { useChat, type Message as AIMessage } from "@ai-sdk/react";
import Markdown from "@/components/Markdown";

// --- Types ---

// Use AIMessage type from @ai-sdk/react which includes id
type MessageData = AIMessage;

// --- Constants ---

const defaultActions: { text: string; prompt: string }[] = [
  {
    text: "📝 對話主題是什麼？",
    prompt: "對話主題是什麼？",
  },
  {
    text: "🤝 達成了哪些共識和決策？",
    prompt: "對話達成了哪些共識和決策？",
  },
  {
    text: "💬 有哪些重要的討論？",
    prompt: "對話中有哪些重要的討論？",
  },
  {
    text: "📖 總結對話討論的重點",
    prompt: "總結對話討論的重點",
  },
];

// --- Sub-components ---

interface MessageProps {
  from: "me" | "ai";
  content: string;
  showCopy?: boolean;
}

function Message({ from, content, showCopy = true }: MessageProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(async (text: string) => {
    if ("clipboard" in navigator) {
      setCopied(true);
      await navigator.clipboard.writeText(text);
      setTimeout(() => setCopied(false), 500);
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mb-4"
    >
      <div
        className={twMerge(
          "flex w-full items-start gap-3",
          from === "me" ? "flex-row-reverse" : "",
        )}
      >
        <div
          className={twMerge(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            from === "me"
              ? "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-300"
              : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
          )}
        >
          {from === "me" ? <User size={16} /> : <Bot size={16} />}
        </div>
        <div
          className={twMerge(
            "group relative max-w-[85%] rounded-lg px-4 py-2",
            from === "me"
              ? "bg-pink-500 text-white"
              : "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100",
          )}
        >
          {from === "ai" && showCopy && (
            <button
              onClick={() => copyToClipboard(content)}
              className="absolute -top-2 -right-2 rounded-lg bg-white p-1.5 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          )}
          <div className="prose prose-sm dark:prose-invert max-w-none text-current">
            <Markdown>{content}</Markdown>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface MessageListProps {
  messages: MessageData[];
  isLoading: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onSendDefaultMessage: (message: string) => void;
}

function MessageList({
  messages,
  isLoading,
  containerRef,
  onSendDefaultMessage,
}: MessageListProps) {
  return (
    <motion.div
      className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-200 hover:scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-800 dark:hover:scrollbar-thumb-neutral-700 h-[400px] overflow-y-scroll bg-white p-4 dark:bg-neutral-900"
      ref={containerRef}
    >
      <div className="flex items-center justify-center pb-4 text-xs text-neutral-400 dark:text-neutral-500">
        <div className="rounded-full bg-neutral-100 px-3 py-1.5 dark:bg-neutral-800">
          <span>AI 可能會犯錯，請仔細檢查生成的內容</span>
        </div>
      </div>
      <Message
        from="ai"
        content="嗨，我是 TransPal AI！有什麼可以幫助你的？"
        showCopy={false}
      />
      <AnimatePresence initial={false}>
        {messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => (
            <Message
              from={m.role === "user" ? "me" : "ai"}
              content={m.content}
              key={m.id}
              showCopy={m.role === "assistant"}
            />
          ))}
      </AnimatePresence>
      <AnimatePresence>
        {!isLoading && (
          <motion.div
            className="flex flex-col gap-2 overflow-hidden pr-2 pl-11"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {defaultActions
              .filter((x) => !messages.some((m) => m.content === x.prompt))
              .map((item, index) => (
                <button
                  onClick={() => onSendDefaultMessage(item.prompt)}
                  className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-left text-sm text-neutral-700 hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600 active:bg-pink-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-pink-900 dark:hover:bg-pink-950 dark:hover:text-pink-300 dark:active:bg-pink-950/70"
                  key={index}
                >
                  {item.text}
                </button>
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  handleInputChange: (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  submitButtonRef: React.RefObject<HTMLButtonElement | null>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

function ChatInput({
  input,
  isLoading,
  handleInputChange,
  handleSubmit,
  submitButtonRef,
  textareaRef,
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        submitButtonRef.current?.form?.requestSubmit();
      }
    }
  };

  return (
    <form
      className="flex border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-1 items-end">
        <textarea
          className="max-h-32 min-h-[44px] w-full resize-none rounded-bl-md bg-neutral-100 px-4 py-3 text-base text-neutral-800 transition-all duration-150 placeholder:text-neutral-500 focus:outline-none dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-400"
          placeholder="在此輸入文字⋯⋯"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          required
          rows={1}
          ref={textareaRef}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = target.scrollHeight + "px";
          }}
        />
      </div>
      <motion.button
        type="submit"
        ref={submitButtonRef}
        className="flex items-center justify-center rounded-br-lg bg-pink-500 px-4 text-white transition-all duration-150 hover:bg-pink-600 active:bg-pink-700 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-600"
        disabled={isLoading || !input.trim()}
        title="傳送訊息"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <Send size={20} />
      </motion.button>
    </form>
  );
}

interface ChatWindowProps {
  y: MotionValue<number>;
  messages: MessageData[];
  isLoading: boolean;
  input: string;
  handleInputChange: (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onSendDefaultMessage: (message: string) => void;
  onReset: () => void;
  onMinimize: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  submitButtonRef: React.RefObject<HTMLButtonElement | null>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

function ChatWindow({
  y,
  messages,
  isLoading,
  input,
  handleInputChange,
  handleSubmit,
  onSendDefaultMessage,
  onReset,
  onMinimize,
  containerRef,
  submitButtonRef,
  textareaRef,
}: ChatWindowProps) {
  return (
    <motion.div
      className="fixed right-4 z-50 w-[min(400px,calc(100vw-32px))] origin-bottom-right overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
      style={{ bottom: y }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.15 }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-2 font-medium text-neutral-800 dark:text-neutral-100">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-300">
            <BotMessageSquare size={18} />
          </div>
          <span>TransPal AI</span>
        </div>
        <div className="flex gap-1">
          <button
            className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            title="重設對話"
            onClick={onReset}
          >
            <RotateCcw size={18} />
          </button>
          <button
            className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            title="最小化"
            onClick={onMinimize}
          >
            <Minus size={18} />
          </button>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <MessageList
          messages={messages}
          isLoading={isLoading}
          containerRef={containerRef}
          onSendDefaultMessage={onSendDefaultMessage}
        />
        <ChatInput
          input={input}
          isLoading={isLoading}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          submitButtonRef={submitButtonRef}
          textareaRef={textareaRef}
        />
      </motion.div>
    </motion.div>
  );
}

interface InitialTipProps {
  onDismiss: () => void;
  onActivate: () => void;
}

function InitialTip({ onDismiss, onActivate }: InitialTipProps) {
  return (
    <motion.div
      className="w-64 origin-bottom-right rounded-lg border border-neutral-200 bg-white text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
      initial={{ opacity: 0, x: 30, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, x: 0, scale: 1, y: 0 }}
      exit={{
        opacity: 0,
        x: 30,
        scale: 0.8,
        y: 20,
        transition: {
          duration: 0.2,
          ease: "easeInOut",
        },
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 1,
        delay: 0.4,
      }}
    >
      <motion.div
        className="flex w-full items-center justify-end rounded-t-lg bg-neutral-50 p-1.5 dark:bg-neutral-800"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <motion.button
          onClick={onDismiss}
          className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-700"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="關閉提示"
        >
          <X size={14} />
        </motion.button>
      </motion.div>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-300">
            <BotMessageSquare size={20} />
          </div>
          <span className="text-neutral-700 dark:text-neutral-100">
            嗨，我是 TransPal AI！有什麼可以幫助你的？
          </span>
        </div>
        <motion.button
          onClick={onActivate}
          className="w-full rounded-lg bg-pink-500 py-2 font-medium text-white transition-all duration-150 hover:bg-pink-600 active:bg-pink-700"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          與 AI 對話
        </motion.button>
      </div>
    </motion.div>
  );
}

interface MinimizedChatButtonProps {
  onActivate: () => void;
}

function MinimizedChatButton({ onActivate }: MinimizedChatButtonProps) {
  return (
    <motion.button
      className="flex h-12 w-12 items-center justify-center rounded-lg bg-pink-500 text-white hover:bg-pink-600 active:bg-pink-700"
      onClick={onActivate}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="flex h-8 w-8 items-center justify-center">
        <BotMessageSquare size={24} />
      </div>
    </motion.button>
  );
}

// --- Main Component ---

export default function SpeechAI({ filename }: { filename: string | null }) {
  const [messageHide, setMessageHide] = useState(false);
  const y = useMotionValue(16);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [active, setActive] = useState(false);

  const {
    messages,
    input,
    setMessages,
    setInput,
    isLoading,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
  } = useChat({
    api: "/api/completion",
    body: { filename },
    onError: (error) => {
      console.error("Completion error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "抱歉，發生錯誤了。",
        },
      ]);
    },
  });

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      originalHandleSubmit(e);
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "44px";
      }
    },
    [originalHandleSubmit, setInput],
  );

  const handleReset = useCallback(() => {
    setMessages([]);
  }, [setMessages]);

  const handleMinimize = useCallback(() => {
    setActive(false);
  }, []);

  const handleActivate = useCallback(() => {
    setActive(true);
    setMessageHide(true);
  }, []);

  const handleDismissTip = useCallback(() => {
    setMessageHide(true);
  }, []);

  const handleSendDefaultMessage = useCallback(
    (message: string) => {
      setInput(message);
      setTimeout(() => {
        if (submitButtonRef.current?.form) {
          submitButtonRef.current.form.requestSubmit();
          setInput("");
        }
      }, 0);
    },
    [setInput, submitButtonRef],
  );

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }
  }, [messages, active, isLoading]);

  useEffect(() => {
    const handleScroll = () => {
      const footer = document.getElementById("footer");
      if (!footer) return;

      const rect = footer.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const top = rect.y - windowHeight;
      const isBottom = top < 0;

      y.set(isBottom ? Math.max(16, 16 - top) : 16);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [y]);

  return (
    <AnimatePresence mode="wait">
      {active ? (
        <ChatWindow
          key="chat-window"
          y={y}
          messages={messages}
          isLoading={isLoading}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          onSendDefaultMessage={handleSendDefaultMessage}
          onReset={handleReset}
          onMinimize={handleMinimize}
          containerRef={messageContainerRef}
          submitButtonRef={submitButtonRef}
          textareaRef={textareaRef}
        />
      ) : (
        <motion.div
          key="minimized-view"
          className="fixed right-4 z-50 flex flex-col items-end gap-2"
          style={{ bottom: y }}
        >
          <AnimatePresence>
            {!messageHide &&
              messages.filter(
                (m) => m.role === "user" || m.role === "assistant",
              ).length === 0 && (
                <InitialTip
                  onDismiss={handleDismissTip}
                  onActivate={handleActivate}
                />
              )}
          </AnimatePresence>
          <MinimizedChatButton onActivate={handleActivate} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
