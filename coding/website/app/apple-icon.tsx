import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: siteConfig.themeColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#c8975b",
          fontSize: 120,
          fontWeight: 700,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "-0.04em",
        }}
      >
        L
      </div>
    ),
    { ...size }
  );
}
