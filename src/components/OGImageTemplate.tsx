import React from "react";
import type { RenderFunctionInput } from "astro-opengraph-images";

type SatoriTextStyle = React.CSSProperties & {
  lineClamp: number;
};

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

export default async function OGImageTemplate({
  title,
  description,
}: RenderFunctionInput): Promise<React.ReactNode> {
  const cleanTitle = stripMarkdown(title);
  const cleanDescription = description ? stripMarkdown(description) : "";
  const titleStyle: SatoriTextStyle = {
    display: "block",
    fontSize: 64,
    lineHeight: 1.08,
    fontWeight: 900,
    letterSpacing: -0.5,
    color: "#f8fafc",
    maxWidth: 1000,
    lineClamp: 2,
  };
  const descriptionStyle: SatoriTextStyle = {
    display: "block",
    fontSize: 30,
    lineHeight: 1.35,
    color: "#cbd5e1",
    opacity: 0.95,
    maxWidth: 980,
    lineClamp: 5,
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
          <div style={titleStyle}>{cleanTitle}</div>

          {cleanDescription ? (
            <div style={descriptionStyle}>{cleanDescription}</div>
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
