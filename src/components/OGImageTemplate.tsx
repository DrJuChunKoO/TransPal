import React from "react";
import type { RenderFunctionInput } from "astro-opengraph-images";
import { marked, type Tokens } from "marked";
import { markdownToPlainText } from "../utils/markdownText";

type SatoriTextStyle = React.CSSProperties & {
  lineClamp?: number;
};

type SummaryItem = {
  label: string;
  detail: string;
};

function getOgImageDescription(document: Document): string | null {
  return (
    document
      .querySelector("meta[name='transpal:og-image-description']")
      ?.getAttribute("content") ?? null
  );
}

function splitSummaryItem(text: string): SummaryItem {
  const plainText = markdownToPlainText(text);
  const separatorIndex = plainText.search(/[：:]/);

  if (separatorIndex === -1) {
    return { label: plainText, detail: "" };
  }

  return {
    label: plainText.slice(0, separatorIndex).trim(),
    detail: plainText.slice(separatorIndex + 1).trim(),
  };
}

function measureTextUnits(text: string): number {
  return Array.from(text).reduce((width, char) => {
    if (/\s/.test(char)) return width + 0.35;
    if (/^[\x00-\x7F]$/.test(char)) return width + 0.56;
    return width + 1;
  }, 0);
}

function getTitleFontSize(title: string): number {
  const units = measureTextUnits(title);

  if (units <= 28) return 64;
  if (units <= 42) return 56;
  if (units <= 56) return 48;
  return 40;
}

function renderDescriptionMarkdown(markdown: string): React.ReactNode {
  const tokens = marked
    .lexer(markdown)
    .filter((token) => token.type !== "space");

  const list = tokens.find((token) => token.type === "list");
  const items: SummaryItem[] =
    list?.type === "list"
      ? list.items.map((item: Tokens.ListItem) => splitSummaryItem(item.text))
      : [];

  if (items.length === 0) {
    return <div style={descriptionStyle}>{markdownToPlainText(markdown)}</div>;
  }

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flex: 1,
        flexDirection: "column",
        gap: 14,
        maxWidth: 1056,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          opacity: 0.95,
        }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              color: "#cbd5e1",
              fontSize: 28,
              lineHeight: 1.3,
              maxWidth: 1056,
            }}
          >
            <div style={{ display: "flex", color: "#94a3b8" }}>
              {index + 1}.
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                maxWidth: 996,
              }}
            >
              {item.detail ? `${item.label}：${item.detail}` : item.label}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 72,
          background:
            "linear-gradient(to bottom, rgba(15, 23, 42, 0), #0f172a)",
        }}
      />
    </div>
  );
}

const descriptionStyle: SatoriTextStyle = {
  display: "flex",
  flexWrap: "wrap",
  fontSize: 30,
  lineHeight: 1.35,
  color: "#cbd5e1",
  opacity: 0.95,
  maxWidth: 1056,
};

export default async function OGImageTemplate({
  title,
  description,
  document,
}: RenderFunctionInput): Promise<React.ReactNode> {
  const cleanTitle = markdownToPlainText(title);
  const imageDescription = getOgImageDescription(document);
  const cleanDescription = description ? markdownToPlainText(description) : "";
  const titleFontSize = getTitleFontSize(cleanTitle);
  const titleStyle: SatoriTextStyle = {
    display: "flex",
    flexWrap: "wrap",
    fontSize: titleFontSize,
    lineHeight: 1.08,
    fontWeight: 900,
    letterSpacing: -0.5,
    color: "#f8fafc",
    maxWidth: 1056,
  };

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
          padding: "56px 72px",
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
            gap: 18,
            marginTop: 24,
            minHeight: 0,
          }}
        >
          <div style={{ display: "flex" }}>
            <div style={titleStyle}>{cleanTitle}</div>
          </div>

          {imageDescription ? (
            renderDescriptionMarkdown(imageDescription)
          ) : cleanDescription ? (
            <div
              style={{
                ...descriptionStyle,
                flex: 1,
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              {cleanDescription}
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
