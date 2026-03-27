import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "#4A5E4C",
          borderRadius: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "#FDFBF7",
            fontSize: 72,
            fontWeight: 800,
            fontFamily: "serif",
            letterSpacing: "-2px",
            lineHeight: 1,
          }}
        >
          OF
        </span>
      </div>
    ),
    { ...size }
  );
}
