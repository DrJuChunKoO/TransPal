"use client";
import { twMerge } from "tailwind-merge";
import { UserIcon } from "@heroicons/react/24/solid";
import { avatarMap } from "@/utils/generated/avatars";

function genColor(name: string) {
  let randomSeed = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  let color = Math.floor(Math.abs(Math.sin(randomSeed) * 16777215));
  let resultColor = color.toString(16).padStart(6, "0");
  // 回傳帶有 50% 透明度的顏色 (hex with alpha)
  return `#${resultColor}`;
}

export default function Avatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  // 檢查是否有有效的頭貼
  const hasAvatar = name in avatarMap;

  if (hasAvatar) {
    return (
      <div
        className={twMerge(
          "flex size-12 items-center justify-center overflow-hidden rounded-full bg-white text-white",
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/avatars/${name}.jpg`}
          width={48}
          height={48}
          className="size-12 object-cover object-center"
          alt={`Picture of ${name}`}
        />
      </div>
    );
  }

  const avatarColor = genColor(name);
  return (
    <div
      className={twMerge(
        "flex size-12 items-center justify-center overflow-hidden rounded-full text-white",
        className,
      )}
      style={{
        backgroundColor: `${avatarColor}20`,
        color: avatarColor,
      }}
    >
      <UserIcon className="size-8" strokeWidth={1} />
    </div>
  );
}
