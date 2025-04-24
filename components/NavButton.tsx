import { twMerge } from "tailwind-merge";
import { ButtonHTMLAttributes } from "react";
export default function NavButton({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={twMerge(
        "rounded-lg p-2 hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-white/5 dark:active:bg-white/10",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
