"use client";
//@ts-nocheck
import Markdown from "react-markdown";
export default function RenderMarkdown({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Markdown>{children as any}</Markdown>;
}
