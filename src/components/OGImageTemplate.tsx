import React from "react";
import type { RenderFunctionInput } from "astro-opengraph-images";

export default async function OGImageTemplate({
  title,
  description,
}: RenderFunctionInput): Promise<React.ReactNode> {
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
            justifyContent: "center",
            height: "100%",
            gap: 20,
          }}
        >
          <h1
            style={{
              fontSize: 76,
              lineHeight: 1.08,
              fontWeight: 900,
              letterSpacing: -0.5,
              color: "#f8fafc",
              margin: 0,
              maxWidth: 1000,
              wordBreak: "break-word",
              overflowWrap: "anywhere",
              hyphens: "auto",
            }}
          >
            {title}
          </h1>

          {description ? (
            <p
              style={{
                fontSize: 34,
                lineHeight: 1.35,
                color: "#cbd5e1",
                margin: 0,
                opacity: 0.95,
                maxWidth: 980,
              }}
            >
              {description}
            </p>
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
