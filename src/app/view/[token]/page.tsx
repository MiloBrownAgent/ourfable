"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";


interface DispatchData {
  subject: string;
  body: string;
  type: string;
  mediaUrls: string[];
  sentByName: string;
  sentAt: number;
  childName: string;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

export default function ViewDispatchPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<DispatchData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch("/api/ourfable/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "ourfable:getDispatchByViewToken",
        args: { viewToken: token },
      }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.value) setData(d.value);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true));
  }, [token]);

  const cFirst = data?.childName?.split(" ")[0] ?? "";

  if (notFound) {
    return (
      <div style={pageStyle}>
        <div style={{ textAlign: "center", maxWidth: 440 }}>
          <p style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "var(--green)", marginBottom: 32 }}>Our Fable</p>
          <p style={{ fontSize: 40, marginBottom: 16 }}>🍃</p>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>
            This link has expired
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-3)", lineHeight: 1.7 }}>
            This dispatch is no longer available at this link.
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={pageStyle}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "var(--green)", marginBottom: 32 }}>Our Fable</p>
          <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2.5px solid var(--green)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...pageStyle, alignItems: "stretch", padding: 0 }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        video { width: 100%; border-radius: 12px; background: #000; display: block; }
        @media (max-width: 640px) {
          .view-card { padding: 32px 24px !important; }
          .view-outer { padding: 40px 16px 60px !important; }
        }
      `}</style>

      <div className="view-outer" style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px 80px" }}>

        {/* Wordmark */}
        <Link href="/" style={{ textDecoration: "none", marginBottom: 36 }}>
          <span style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "var(--green)", letterSpacing: "-0.01em" }}>
            Our Fable
          </span>
        </Link>

        {/* Card */}
        <div className="view-card" style={{
          width: "100%", maxWidth: 560,
          background: "#fff", borderRadius: 20,
          boxShadow: "0 4px 32px rgba(0,0,0,0.07)",
          border: "1px solid var(--border)",
          overflow: "hidden",
          animation: "fadeUp 0.5s ease both",
        }}>
          {/* Green top bar */}
          <div style={{ height: 4, background: "var(--green)" }} />

          {/* Header */}
          <div style={{ padding: "32px 40px 24px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--green)", marginBottom: 8 }}>
              From {cFirst}&rsquo;s family
            </p>
            <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 24, fontWeight: 700, color: "var(--text)", lineHeight: 1.3, marginBottom: 8 }}>
              {data.subject}
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-3)" }}>
              Sent by {data.sentByName} · {formatDate(data.sentAt)}
            </p>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "var(--border)", margin: "0 40px" }} />

          {/* Content */}
          <div style={{ padding: "28px 40px 36px" }}>

            {/* Body text */}
            {data.body && (
              <div style={{ marginBottom: data.mediaUrls.length > 0 ? 28 : 0 }}>
                {data.body.split("\n").map((line, i) =>
                  line.trim() === "" ? (
                    <div key={i} style={{ height: 10 }} />
                  ) : (
                    <p key={i} style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.8, margin: "0 0 12px" }}>
                      {line}
                    </p>
                  )
                )}
              </div>
            )}

            {/* Media */}
            {data.mediaUrls.length > 0 && (
              <div>
                {data.type === "photo" && data.mediaUrls.map((url, i) => (
                  <img key={i} src={url} alt={`Photo from ${cFirst}'s family`}
                    style={{ width: "100%", borderRadius: 12, display: "block", marginBottom: 12 }} />
                ))}

                {data.type === "voice" && data.mediaUrls.map((url, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <audio controls style={{ width: "100%", borderRadius: 8 }}>
                      <source src={url} />
                      <a href={url} style={{ color: "var(--green)" }}>Listen to voice message</a>
                    </audio>
                  </div>
                ))}

                {data.type === "video" && data.mediaUrls.map((url, i) => (
                  <div key={i} style={{ marginBottom: 12, borderRadius: 12, overflow: "hidden", background: "#000" }}>
                    <video controls playsInline>
                      <source src={url} />
                      <a href={url} style={{ color: "var(--green)" }}>Watch video</a>
                    </video>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer inside card */}
          <div style={{ height: 1, background: "var(--border)", margin: "0 40px" }} />
          <div style={{ padding: "20px 40px 28px" }}>
            <p style={{ fontSize: 12, color: "var(--text-4)", lineHeight: 1.7 }}>
              This is private — just for {cFirst}&rsquo;s circle. Not on social media, not shared anywhere else.
            </p>
          </div>
        </div>

        {/* Soft CTA */}
        <p style={{ marginTop: 32, fontSize: 13, color: "var(--text-4)", textAlign: "center" }}>
          Want to keep memories like this forever?{" "}
          <Link href="/" style={{ color: "var(--green)", textDecoration: "none", fontWeight: 500 }}>
            Learn about Our Fable →
          </Link>
        </p>

      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "var(--bg)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "40px 24px",
};
