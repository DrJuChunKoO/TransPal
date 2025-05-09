import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import { twMerge } from "tailwind-merge";
const inter = Inter({ subsets: ["latin"] });
import { GoogleTagManager } from "@next/third-parties/google";
import Footer from "@/components/Footer";
export const metadata: Metadata = {
  title: "TransPal",
  description: "會議記錄網站",
  icons: {
    icon: "/icon.png",
  },
  metadataBase: new URL(`https://transpal.juchunko.com/`),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body
        className={twMerge(
          inter.className,
          "text-gray-950 dark:bg-[#1C1C1C] dark:text-gray-50",
          "flex min-h-screen flex-col",
        )}
      >
        <Nav />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
      <GoogleTagManager gtmId="GTM-MN9HZ6G2" />
    </html>
  );
}
