import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { AppPanel } from "@/components/AppPanel";

// Fixed 1200×630 social card. Not a marketing page; it exists to be captured
// into public/og.png (see scripts/make-og.mjs). Kept out of search indexes.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function OgCard() {
  return (
    <div
      id="og-card"
      style={{
        width: 1200,
        height: 630,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        gap: 40,
        padding: "0 72px",
        fontFamily: "var(--font-ui)",
        color: "var(--color-ink)",
        background:
          "radial-gradient(900px 560px at 84% -12%, #2c1d3a 0%, transparent 56%), radial-gradient(760px 560px at -6% 24%, #2a1622 0%, transparent 52%), radial-gradient(700px 600px at 60% 130%, #12262c 0%, transparent 55%), #0a0a0d",
      }}
    >
      <div style={{ flex: "1 1 0", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 30 }}>
          <span
            style={{
              width: 46,
              height: 46,
              borderRadius: 13,
              background: "linear-gradient(180deg, #ff7373, #e23d3d)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 20px -6px rgba(226,61,61,0.7)",
            }}
          >
            <Icon id="logo-module" style={{ width: 27, height: 27, color: "#fff" }} />
          </span>
          <span style={{ fontSize: 23, fontWeight: 700, fontFamily: "var(--font-display)" }}>
            TidyDisk
          </span>
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 62,
            lineHeight: 1.03,
            fontWeight: 800,
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          A <span style={{ color: "var(--color-accent)" }}>tidy disk</span>, without
          thinking about it.
        </h1>
        <p
          style={{
            fontSize: 22,
            color: "var(--color-ink-2)",
            marginTop: 22,
            lineHeight: 1.4,
            maxWidth: 520,
          }}
        >
          Dev work quietly eats your Mac. TidyDisk watches from the menu bar,
          shows what it costs, and gives the space back in one click. Safely,
          to the Trash.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 32 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              padding: "13px 22px",
              borderRadius: 13,
              background: "linear-gradient(180deg, #ff7373, #e23d3d)",
              color: "#fff",
              fontWeight: 600,
              fontSize: 18,
            }}
          >
            <Icon id="i-download" style={{ width: 18, height: 18 }} />
            Download for macOS
          </span>
          <span style={{ fontSize: 16, color: "var(--color-ink-3)" }}>
            Free scan · 19 euro lifetime cleanup
          </span>
        </div>
      </div>

      <div style={{ flex: "0 0 auto", width: 360, transform: "rotate(1.6deg)" }}>
        <div
          className="glass-panel"
          style={{ width: 360, boxShadow: "0 45px 90px -25px rgba(0,0,0,0.85)" }}
        >
          <AppPanel />
        </div>
      </div>
    </div>
  );
}
