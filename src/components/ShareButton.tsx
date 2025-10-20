import { useState, useEffect, useCallback, useRef } from "react";

interface ShareButtonProps {
  url: string;
  title: string;
  speaker?: string;
  speechName?: string;
  className?: string;
  onShare?: (platform: string) => void;
}

interface ShareOption {
  name: string;
  label: string;
  icon: React.ReactElement;
  color: string;
  hoverColor: string;
  url?: string;
  action?: () => Promise<void>;
}

// 工具函數：合併 className
const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(" ");
};

// 分享平台 SVG 圖標
const ShareIcons = {
  native: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
      />
    </svg>
  ),
  copy: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  ),
  twitter: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
    </svg>
  ),
  facebook: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  line: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  ),
  telegram: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  ),
};

export default function ShareButton({
  url,
  title,
  speaker,
  speechName,
  className = "",
  onShare,
}: ShareButtonProps) {
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [isNativeShareSupported, setIsNativeShareSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 清理計時器
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  // 檢查原生分享支援
  useEffect(() => {
    setIsNativeShareSupported(
      typeof navigator !== "undefined" && "share" in navigator
    );
  }, []);

  // 分享文字內容
  const shareText =
    speaker && speechName ? `${speaker} 在 ${speechName} 中的發言` : title;

  // 複製連結到剪貼簿
  const handleCopyLink = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await navigator.clipboard.writeText(url);
      setShowCopySuccess(true);

      // 清理之前的計時器
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }

      // 設置新的計時器
      successTimeoutRef.current = setTimeout(() => {
        setShowCopySuccess(false);
      }, 3000);

      onShare?.("copy");
    } catch (err) {
      console.error("Failed to copy link:", err);

      // 後備方案
      try {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();

        if (document.execCommand("copy")) {
          setShowCopySuccess(true);
          successTimeoutRef.current = setTimeout(() => {
            setShowCopySuccess(false);
          }, 3000);
          onShare?.("copy");
        } else {
          throw new Error("Fallback copy failed");
        }

        document.body.removeChild(textArea);
      } catch (fallbackErr) {
        setError("無法複製連結，請手動複製");
      }
    } finally {
      setIsLoading(false);
    }
  }, [url, onShare]);

  // 原生分享功能
  const handleNativeShare = useCallback(async () => {
    if (!navigator.share) return;

    setIsLoading(true);
    setError(null);

    try {
      await navigator.share({
        title: shareText,
        text: shareText,
        url: url,
      });
      onShare?.("native");
    } catch (err) {
      // 使用者取消分享不算錯誤
      if ((err as Error).name !== "AbortError") {
        console.error("Error sharing:", err);
        setError("分享失敗，請稍後再試");
      }
    } finally {
      setIsLoading(false);
    }
  }, [url, shareText, onShare]);

  // 分享選項配置
  const shareOptions: ShareOption[] = [
    ...(isNativeShareSupported
      ? [
          {
            name: "native",
            label: "分享",
            icon: ShareIcons.native,
            color: "bg-gradient-to-r from-green-500 to-green-600",
            hoverColor: "hover:from-green-600 hover:to-green-700",
            action: handleNativeShare,
          },
        ]
      : []),
    {
      name: "copy",
      label: "複製連結",
      icon: ShareIcons.copy,
      color: "bg-gradient-to-r from-blue-500 to-blue-600",
      hoverColor: "hover:from-blue-600 hover:to-blue-700",
      action: handleCopyLink,
    },
    {
      name: "twitter",
      label: "Twitter",
      icon: ShareIcons.twitter,
      color: "bg-gradient-to-r from-sky-500 to-sky-600",
      hoverColor: "hover:from-sky-600 hover:to-sky-700",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        shareText
      )}&url=${encodeURIComponent(url)}`,
    },
    {
      name: "facebook",
      label: "Facebook",
      icon: ShareIcons.facebook,
      color: "bg-gradient-to-r from-blue-600 to-blue-700",
      hoverColor: "hover:from-blue-700 hover:to-blue-800",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        url
      )}`,
    },
    {
      name: "line",
      label: "LINE",
      icon: ShareIcons.line,
      color: "bg-gradient-to-r from-green-500 to-green-600",
      hoverColor: "hover:from-green-600 hover:to-green-700",
      url: `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
        url
      )}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: "telegram",
      label: "Telegram",
      icon: ShareIcons.telegram,
      color: "bg-gradient-to-r from-blue-500 to-blue-600",
      hoverColor: "hover:from-blue-600 hover:to-blue-700",
      url: `https://t.me/share/url?url=${encodeURIComponent(
        url
      )}&text=${encodeURIComponent(shareText)}`,
    },
  ];

  return (
    <div
      className={cn("share-container", className)}
      role="region"
      aria-labelledby="share-heading"
    >
      <h3
        id="share-heading"
        className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4"
      >
        分享此對話
      </h3>

      <div
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        role="group"
        aria-label="分享選項"
      >
        {shareOptions.map((option) => {
          const isLink = !!option.url;
          const buttonClassName = cn(
            "relative flex items-center justify-center px-4 py-3",
            "text-white font-medium rounded-lg",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "hover:scale-105 active:scale-95",
            option.color,
            option.hoverColor,
            option.name === "native" || option.name === "line"
              ? "focus:ring-green-500"
              : option.name === "copy" || option.name === "telegram"
              ? "focus:ring-blue-500"
              : option.name === "twitter"
              ? "focus:ring-sky-500"
              : option.name === "facebook"
              ? "focus:ring-blue-600"
              : ""
          );

          if (isLink) {
            return (
              <a
                key={option.name}
                href={option.url}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClassName}
                aria-label={`分享到 ${option.label}`}
              >
                <span className="mr-2">{option.icon}</span>
                <span className="text-sm">{option.label}</span>
              </a>
            );
          }

          return (
            <button
              key={option.name}
              onClick={option.action}
              disabled={isLoading}
              className={buttonClassName}
              aria-label={`分享到 ${option.label}`}
              type="button"
            >
              <span className="mr-2">{option.icon}</span>
              <span className="text-sm">{option.label}</span>

              {isLoading && option.action && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-lg">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 狀態訊息 */}
      <div className="mt-4 space-y-2">
        {showCopySuccess && (
          <div
            className="flex items-center text-sm text-green-600 dark:text-green-400"
            role="status"
            aria-live="polite"
            style={{
              animation: "fade-in 0.3s ease-out",
            }}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            連結已複製到剪貼簿
          </div>
        )}

        {error && (
          <div
            className="flex items-center text-sm text-red-600 dark:text-red-400"
            role="alert"
            aria-live="assertive"
            style={{
              animation: "fade-in 0.3s ease-out",
            }}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        )}
      </div>

      {/* 預覽文字 */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          分享內容預覽：
        </p>
        <p
          className="text-sm text-gray-800 dark:text-gray-200 mt-1"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {shareText}
        </p>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
