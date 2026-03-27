import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#4A5E4C",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "#FDFBF7",
            fontSize: 13,
            fontWeight: 800,
            fontFamily: "serif",
            letterSpacing: "-0.5px",
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
