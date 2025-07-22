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
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
        color: "white",
        padding: "60px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          maxWidth: "1000px",
        }}
      >
        <h1
          style={{
            fontSize: "64px",
            fontWeight: "bold",
            marginBottom: "24px",
            lineHeight: "1.2",
            color: "#f8fafc",
          }}
        >
          {title}
        </h1>

        {description && (
          <p
            style={{
              fontSize: "32px",
              opacity: 0.9,
              lineHeight: "1.4",
              color: "#cbd5e1",
              maxWidth: "800px",
            }}
          >
            {description}
          </p>
        )}

        <div
          style={{
            marginTop: "40px",
            padding: "16px 32px",
            backgroundColor: "#3b82f6",
            borderRadius: "8px",
            fontSize: "24px",
            fontWeight: "600",
          }}
        >
          TransPal
        </div>
      </div>
    </div>
  );
}
