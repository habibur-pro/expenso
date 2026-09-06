import { ImageResponse } from "next/og";

export const alt = "Expenso — Track Expenses, Understand Your Spending";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 24,
        padding: 80,
        background: "#0a0a0a",
        color: "#fafafa",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: 56,
          fontWeight: 700,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 72,
            height: 72,
            borderRadius: 20,
            background: "#fafafa",
            color: "#0a0a0a",
          }}
        >
          $
        </div>
        Expenso
      </div>
      <div style={{ fontSize: 34, color: "#a3a3a3", maxWidth: 900 }}>
        Track expenses, organize by category, and see where your money goes.
      </div>
    </div>,
    { ...size },
  );
}
