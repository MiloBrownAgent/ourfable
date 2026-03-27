import { Suspense } from "react";
import WelcomeClient from "./WelcomeClient";

export default function WelcomePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <p style={{ fontSize: 13, color: "var(--text-3)" }}>Loading…</p>
      </div>
    }>
      <WelcomeClient />
    </Suspense>
  );
}
