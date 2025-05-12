"use client";
import Link from "next/link";
import { LinkHTMLAttributes } from "react";
import { usePathname } from "next/navigation";
import { twMerge } from "tailwind-merge";
import { ExternalLink } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";

function NavLink({
  href,
  children,
  className,
  asChild,
  ...props
}: {
  href?: string;
  asChild?: boolean;
} & LinkHTMLAttributes<HTMLAnchorElement>) {
  const pathname = usePathname();
  const isActive = href ? pathname === href : false;

  // If not asChild and no href, render a span
  if (!asChild && !href) {
    // It's generally better to avoid rendering interactive elements without an action
    // Consider what the non-link version should look like.
    // Here, we render a span with similar base styles, but no active/hover states.
    return (
      <span
        className={twMerge(
          "relative rounded px-4 py-1 text-gray-500 dark:text-gray-400",
          className,
        )}
        {...props} // Spread other props like style, etc.
      >
        {children}
      </span>
    );
  }

  // Determine the component (Slot or Link)
  // Link component requires href, so we ensure href is defined here if not asChild.
  const Comp = asChild ? Slot : Link;
  const compProps = {
    ...(href && { href }), // Conditionally add href for Slot or Link
    className: twMerge(
      "relative rounded px-4 py-1 text-gray-500 transition-colors duration-150 dark:text-gray-400",
      isActive
        ? "bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-white"
        : "hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200",
      className,
    ),
    ...props,
  };

  // TypeScript needs assertion here because Link requires href, but Slot doesn't.
  // We've handled the case where href is undefined and asChild is false above.
  // If asChild is true, Slot doesn't need href. If asChild is false, href is guaranteed to be defined.
  // Using type assertion for Link component case.
  return <Comp {...(compProps as any)}>{children}</Comp>;
}

export default function Footer() {
  return (
    <footer className="flex flex-col gap-4 py-2 shadow-[0_-2px_4px_rgba(0,0,0,.02),0_-1px_0_rgba(0,0,0,.06)] dark:bg-[#232323]/90 dark:shadow-[0_-1px_0_rgba(255,255,255,.1)]">
      <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row-reverse">
        <div className="dark:text-gray-40 flex flex-col items-center gap-2 text-sm text-gray-600 sm:flex-row sm:gap-0">
          <NavLink href="/about" className="text-sm">
            關於
          </NavLink>
          <NavLink href="/edit-guide" className="text-sm">
            編輯指南
          </NavLink>

          <NavLink asChild className="text-sm">
            <a
              href="https://github.com/DrJuChunKoO/TransPal"
              className="flex items-center gap-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
              <ExternalLink className="size-4" />
            </a>
          </NavLink>
        </div>
        <div className="text-sm text-gray-600 sm:flex-row dark:text-white/50">
          TransPal 程式碼以 MIT 授權釋出
        </div>
      </div>
    </footer>
  );
}
