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
        backgroundColor: "#182848",
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "white",
        padding: "80px",
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
        <div
          style={{
            color: "#a0aec0",
            textAlign: "center",
            fontSize: "30px",
            opacity: 0.85,
            marginBottom: "10px",
          }}
        >
          TransPal
        </div>
        <h1
          style={{
            fontSize: "72px",
            fontWeight: "bold",
            marginBottom: "24px",
            lineHeight: "1.1",
            color: "#f8fafc",
            textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
          }}
        >
          {title}
        </h1>

        {description && (
          <p
            style={{
              fontSize: "36px",
              opacity: 0.9,
              lineHeight: "1.3",
              color: "#a0aec0",
              maxWidth: "800px",
              marginBottom: "30px",
            }}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
