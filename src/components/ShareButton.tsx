import { useCallback } from "react";
import { toast } from "sonner";

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
  copy: (
    <svg
      className="h-5 w-5"
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
  facebook: (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  line: (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
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
  // 分享文字內容
  const shareText =
    speaker && speechName ? `${speaker} 在 ${speechName} 中的發言` : title;

  // 複製連結到剪貼簿
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("連結已複製到剪貼簿");
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

        const succeeded = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (succeeded) {
          toast.success("連結已複製到剪貼簿");
          onShare?.("copy");
        } else {
          throw new Error("Fallback copy failed");
        }
      } catch {
        toast.error("無法複製連結，請手動複製");
      }
    }
  }, [url, onShare]);

  // 分享選項配置（實心色）
  const shareOptions: ShareOption[] = [
    {
      name: "copy",
      label: "複製連結",
      icon: ShareIcons.copy,
      color: "bg-blue-600",
      hoverColor: "hover:bg-blue-700",
      action: handleCopyLink,
    },
    {
      name: "line",
      label: "LINE",
      icon: ShareIcons.line,
      color: "bg-green-600",
      hoverColor: "hover:bg-green-700",
      url: `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: "facebook",
      label: "Facebook",
      icon: ShareIcons.facebook,
      color: "bg-blue-700",
      hoverColor: "hover:bg-blue-800",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(shareText)}`,
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
        className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100"
      >
        分享此對話
      </h3>

      <div className="flex flex-wrap gap-3" role="group" aria-label="分享選項">
        {shareOptions.map((option) => {
          const isLink = !!option.url;
          const buttonClassName = cn(
            "relative flex items-center justify-center px-4 py-3",
            "w-full sm:flex-1",
            "text-white font-medium rounded-lg",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "hover:scale-105 active:scale-95",
            option.color,
            option.hoverColor,
            option.name === "line"
              ? "focus:ring-green-500"
              : option.name === "copy"
                ? "focus:ring-blue-500"
                : option.name === "facebook"
                  ? "focus:ring-blue-600"
                  : "",
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
              className={buttonClassName}
              aria-label={`分享到 ${option.label}`}
              type="button"
            >
              <span className="mr-2">{option.icon}</span>
              <span className="text-sm">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
