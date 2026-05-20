import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const runtime = "edge";
export const alt = siteConfig.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Satori (the OG image renderer) requires `display: flex` on any element
// with multiple children. Every <div> below either has one child or sets
// display explicitly.
export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: siteConfig.backgroundColor,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 32,
            color: siteConfig.themeColor,
            fontWeight: 600,
            letterSpacing: "-0.02em",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 16,
              height: 16,
              borderRadius: 999,
              background: "#c8975b",
            }}
          />
          <div style={{ display: "flex" }}>{siteConfig.name}</div>
        </div>

        {/* Tagline + lede */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontSize: 96,
              lineHeight: 1.02,
              color: siteConfig.themeColor,
              letterSpacing: "-0.03em",
              fontWeight: 500,
              maxWidth: 900,
            }}
          >
            <div style={{ display: "flex" }}>Snap your meal.&nbsp;</div>
            <div
              style={{
                display: "flex",
                color: "#c8975b",
                fontStyle: "italic",
              }}
            >
              Track your day.
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: "#2a2a2a",
              maxWidth: 800,
              lineHeight: 1.4,
            }}
          >
            AI-powered, protein-first health tracker. Meals, weight, training,
            how you feel — in one tap.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 32,
            borderTop: "1px solid rgba(26, 58, 46, 0.15)",
            fontSize: 22,
            color: "#6b6b6b",
          }}
        >
          <div style={{ display: "flex" }}>leanscan.app</div>
          <div
            style={{
              display: "flex",
              color: siteConfig.themeColor,
              fontWeight: 600,
            }}
          >
            Early access · Founder cohort
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
