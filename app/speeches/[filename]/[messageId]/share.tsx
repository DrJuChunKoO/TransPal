"use client";
import { ShareIcon } from "lucide-react";
export default function Share() {
  async function handleShare() {
    if (navigator.share) {
      navigator.share({
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert("已複製連結");
    }
  }
  return (
    <button
      className="flex flex-col items-center gap-1 px-4 text-gray-800 dark:text-white"
      onClick={handleShare}
    >
      <div className="rounded-full bg-blue-50 p-2 hover:bg-blue-200 active:bg-blue-300 dark:bg-white/5 dark:hover:bg-white/10 dark:active:bg-white/15">
        <ShareIcon />
      </div>
      <div className="text-sm opacity-50">分享</div>
    </button>
  );
}
