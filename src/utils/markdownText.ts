import { unified } from "unified";
import remarkParse from "remark-parse";
import type { List, Nodes, Root } from "mdast";

// Minimal remark parser used to analyze markdown without running transforms.
const remarkParser = unified().use(remarkParse);

function collectText(node: Nodes): string[] {
  const parts: string[] = [];

  switch (node.type) {
    case "text":
    case "inlineCode":
    case "code":
      if ("value" in node) parts.push(node.value as string);
      break;
    case "break":
      parts.push(" ");
      break;
  }

  if ("children" in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      parts.push(...collectText(child));
    }
  }

  return parts;
}

function plainTextFromNode(node: Nodes): string {
  return collectText(node).join(" ").replace(/\s+/g, " ").trim();
}

export function markdownToPlainText(markdown: string): string {
  if (!markdown) return "";

  const tree = remarkParser.parse(markdown) as Root;
  return plainTextFromNode(tree);
}

/**
 * Extract the plain text of each item in the first list of a markdown
 * document, if any. Returns an empty array when no list is present.
 */
export function getMarkdownListItemTexts(markdown: string): string[] {
  if (!markdown) return [];

  const tree = remarkParser.parse(markdown) as Root;
  const list = tree.children.find((node): node is List => node.type === "list");
  if (!list) return [];

  return list.children
    .map((item) => plainTextFromNode(item))
    .filter((text) => text !== "");
}

export function truncatePlainText(text: string, maxLength = 240): string {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) return normalized;

  return `${normalized.slice(0, maxLength).replace(/[，。、；：,.\s]+$/, "")}…`;
}
