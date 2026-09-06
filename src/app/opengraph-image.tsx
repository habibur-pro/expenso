import { ImageResponse } from "next/og";

export const alt = "Expenso — Track Expenses, Understand Your Spending";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BARS = [
  { width: 620, color: "#8B5CF6" },
  { width: 410, color: "#D946C6" },
  { width: 330, color: "#F2683C" },
  { width: 240, color: "#F2A93B" },
];

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 28,
        padding: 80,
        background: "linear-gradient(135deg, #16112b 0%, #241640 100%)",
        color: "#faf7ff",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
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
            background: "#6D33F0",
            color: "#ffffff",
          }}
        >
          $
        </div>
        Expenso
      </div>
      <div style={{ fontSize: 34, color: "#b9aede", maxWidth: 900 }}>
        Track expenses, organize by category, and see where your money goes.
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          marginTop: 8,
        }}
      >
        {BARS.map((bar) => (
          <div
            key={bar.color}
            style={{
              width: bar.width,
              height: 14,
              borderRadius: 999,
              background: bar.color,
            }}
          />
        ))}
      </div>
    </div>,
    { ...size },
  );
}
