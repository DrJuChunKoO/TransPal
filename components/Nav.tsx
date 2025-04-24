"use client";
import Link from "next/link";
import { LinkHTMLAttributes } from "react";
import { usePathname, useRouter } from "next/navigation";
import { twMerge } from "tailwind-merge";
import { motion, AnimatePresence } from "motion/react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import useDarkMode from "@/utils/useDarkMode";
import Search from "@/components/Search";
import NavButton from "@/components/NavButton";

function DarkModeButton() {
  const { theme, setTheme } = useDarkMode();

  function handleThemeChange() {
    if (theme === "dark") {
      return setTheme("light");
    }
    setTheme("dark");
  }
  return (
    <NavButton onClick={handleThemeChange}>
      {theme === "dark" && (
        <MoonIcon className="size-6 text-gray-800 dark:text-gray-200" />
      )}

      {theme === "light" && (
        <SunIcon className="size-6 text-gray-800 dark:text-gray-200" />
      )}
    </NavButton>
  );
}

function NavLink({
  href,
  children,
  className,
  ...props
}: {
  href: string;
} & LinkHTMLAttributes<HTMLAnchorElement>) {
  const isActive = usePathname() === href;
  return (
    <Link
      href={href}
      className={twMerge(
        "relative rounded px-4 py-1 text-gray-400 transition-all",
        isActive ? "text-gray-700" : "hover:bg-gray-100 hover:text-gray-600",
        isActive
          ? "text-blue-500 dark:text-[#6ECC93]"
          : "dark:hover:bg-white/5 dark:hover:text-white/50",
        className,
      )}
      {...props}
    >
      {children}
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="absolute right-0 -bottom-2 left-0 m-auto h-1 w-[75%] rounded-t-full bg-blue-500 dark:bg-[#6ECC93]"
            layoutId="underline"
          />
        )}
      </AnimatePresence>
    </Link>
  );
}
function NavLinkMobile({
  href,
  children,
  className,
  ...props
}: {
  href: string;
} & LinkHTMLAttributes<HTMLAnchorElement>) {
  const isActive = usePathname() === href;
  return (
    <Link
      href={href}
      className={twMerge(
        "rounded px-4 py-2 text-gray-500 transition-all",
        isActive
          ? "bg-gray-200 text-gray-700"
          : "hover:bg-gray-100 hover:text-gray-600 active:bg-gray-200",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

export default function Nav() {
  const isIndex = usePathname() === "/";
  const currentPath = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const isMessage = usePathname().match(/\/speeches\/[^/]+\/[^/]+/) !== null;
  const router = useRouter();
  return (
    <nav className="sticky top-0 z-10 bg-white/90 shadow-[0_2px_4px_rgba(0,0,0,.02),0_1px_0_rgba(0,0,0,.06)] backdrop-blur-xl dark:bg-[#232323]/90 dark:shadow-[0_-1px_0_rgba(255,255,255,.1)_inset]">
      <div className="relative container flex flex-col gap-2 py-2">
        <div className="flex h-8 items-center justify-between gap-2">
          <div className="flex">
            <AnimatePresence>
              {!isIndex && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  {isMessage ? (
                    <NavButton
                      onClick={() =>
                        router.push(
                          currentPath.split("/").slice(0, -1).join("/") +
                            `/#${currentPath.split("/").at(-1)}`,
                        )
                      }
                      className="mr-2"
                    >
                      <ArrowLeft className="size-6" />
                    </NavButton>
                  ) : (
                    <NavButton
                      onClick={() => router.push("/")}
                      className="mr-2"
                    >
                      <ArrowLeft className="size-6" />
                    </NavButton>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            <Link href="/" className="flex items-center gap-2">
              <div className="text-lg font-semibold text-gray-800 dark:text-white">
                TransPal
              </div>
            </Link>
          </div>
          <div className="flex items-center">
            <Search />
            <DarkModeButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
