import { marked, type Token } from "marked";

function textFromToken(token: Token): string {
  if ("tokens" in token && Array.isArray(token.tokens)) {
    return token.tokens.map(textFromToken).join(" ");
  }

  if (token.type === "list" && "items" in token) {
    return token.items.map(textFromToken).join(" ");
  }

  if ("text" in token && typeof token.text === "string") {
    return token.text;
  }

  return "";
}

export function markdownToPlainText(markdown: string): string {
  if (!markdown) return "";

  return marked
    .lexer(markdown)
    .map(textFromToken)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncatePlainText(text: string, maxLength = 240): string {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) return normalized;

  return `${normalized.slice(0, maxLength).replace(/[，。、；：,.\s]+$/, "")}…`;
}
