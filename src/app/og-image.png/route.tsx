import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const revalidate = 86400;

export async function GET() {
  const fontData = await readFile(join(process.cwd(), "public", "playfair-800.ttf"));

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#FDFBF7",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Top border */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: "#4A5E4C", display: "flex" }} />

        {/* Dot texture */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(74,94,76,0.05) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          display: "flex",
        }} />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 860, textAlign: "center", padding: "0 60px", zIndex: 1 }}>

          {/* Wordmark */}
          <div style={{
            fontFamily: "Playfair",
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: "0.22em",
            color: "#4A5E4C",
            marginBottom: 28,
            display: "flex",
          }}>
            OUR FABLE
          </div>

          {/* Gold rule */}
          <div style={{ width: 48, height: 2, background: "#C8A87A", marginBottom: 36, display: "flex" }} />

          {/* Headline line 1 */}
          <div style={{
            fontFamily: "Playfair",
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "#1A1A18",
            marginBottom: 8,
            display: "flex",
          }}>
            Before they can read,
          </div>

          {/* Headline line 2 — green italic */}
          <div style={{
            fontFamily: "Playfair",
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "#4A5E4C",
            fontStyle: "italic",
            marginBottom: 32,
            display: "flex",
          }}>
            someone should be writing.
          </div>

          {/* Subhead */}
          <div style={{
            fontFamily: "Playfair",
            fontSize: 22,
            fontWeight: 400,
            lineHeight: 1.65,
            color: "#6B6B65",
            fontStyle: "italic",
            display: "flex",
          }}>
            A private vault of letters, memories, and love — sealed until your child is ready.
          </div>

          {/* Chip */}
          <div style={{
            marginTop: 44,
            padding: "12px 28px",
            background: "#EEF2EE",
            border: "1.5px solid #C5D4C6",
            borderRadius: 100,
            fontSize: 16,
            color: "#4A5E4C",
            letterSpacing: "0.04em",
            display: "flex",
            fontFamily: "Playfair",
          }}>
            🌿  Founding families · ourfable.ai
          </div>
        </div>

        {/* Bottom border */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 5, background: "#4A5E4C", display: "flex" }} />
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Playfair",
          data: fontData,
          weight: 800,
          style: "normal",
        },
      ],
    }
  );
}
