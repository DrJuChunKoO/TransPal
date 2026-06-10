import React from "react";
import type { RenderFunctionInput } from "astro-opengraph-images";

function stripMarkdown(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*(?:[-*+] |\d+\.\s+)/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/[*_~]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function measureChar(char: string): number {
  if (/\s/.test(char)) return 0.35;
  if (/^[\x00-\x7F]$/.test(char)) return 0.56;
  return 1;
}

function clampLines(
  value: string,
  maxLineWidth: number,
  maxLines: number,
): string[] {
  const normalized = stripMarkdown(value);
  const lines: string[] = [];
  let line = "";
  let width = 0;

  for (const char of normalized) {
    const charWidth = measureChar(char);

    if (width + charWidth > maxLineWidth && line) {
      lines.push(line.trimEnd());
      line = char.trimStart();
      width = measureChar(line);

      if (lines.length === maxLines) break;
      continue;
    }

    line += char;
    width += charWidth;
  }

  if (lines.length < maxLines && line) {
    lines.push(line.trimEnd());
  }

  if (lines.length === maxLines && normalized.length > lines.join("").length) {
    lines[maxLines - 1] =
      `${lines[maxLines - 1].replace(/[，。、；：,.\s]+$/, "")}…`;
  }

  return lines;
}

export default async function OGImageTemplate({
  title,
  description,
}: RenderFunctionInput): Promise<React.ReactNode> {
  const titleLines = clampLines(title, 15.5, 2);
  const descriptionLines = description ? clampLines(description, 29, 5) : [];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        background: "#0f172a",
      }}
    >
      {/* Content */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          padding: "72px 96px",
          width: "100%",
          height: "100%",
          boxSizing: "border-box",
          color: "#e5e7eb",
          fontFamily: '"Noto Sans TC", sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#f8fafc",
              letterSpacing: 0.5,
            }}
          >
            TransPal
          </div>
        </div>

        {/* Main */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            height: "100%",
            gap: 28,
            marginTop: 48,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              fontSize: 64,
              lineHeight: 1.08,
              fontWeight: 900,
              letterSpacing: -0.5,
              color: "#f8fafc",
              maxWidth: 1000,
            }}
          >
            {titleLines.map((line, index) => (
              <div key={index} style={{ display: "flex" }}>
                {line}
              </div>
            ))}
          </div>

          {descriptionLines.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                fontSize: 30,
                lineHeight: 1.35,
                color: "#cbd5e1",
                opacity: 0.95,
                maxWidth: 980,
              }}
            >
              {descriptionLines.map((line, index) => (
                <div key={index} style={{ display: "flex" }}>
                  {line}
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                height: 2,
                width: 160,
                background:
                  "linear-gradient(90deg, rgba(148,163,184,0.0), rgba(148,163,184,0.7), rgba(148,163,184,0.0))",
                marginTop: 8,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
