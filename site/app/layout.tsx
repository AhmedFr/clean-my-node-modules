// Cabinet Grotesk / General Sans are Fontshare fonts (not in next/font), and
// these <head> links live in the root layout so they load site-wide; the
// no-page-custom-font rule's pages/_document premise does not apply here.
/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata } from "next";
import "./globals.css";
import "./landing.css";
import { SvgSprite } from "@/components/SvgSprite";
import { RevealClient } from "@/components/RevealClient";
import { Analytics } from "@vercel/analytics/next";
import { SITE_URL } from "@/lib/site-url";

const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%23e23d3d'/%3E%3Cg fill='none' stroke='%23fff' stroke-width='1.8' stroke-linejoin='round' stroke-linecap='round'%3E%3Cpath d='M12 4.6 19 8.5v7L12 19.4 5 15.5v-7z'/%3E%3Cpath d='M5 8.5 12 12.4l7-3.9M12 12.4v7'/%3E%3C/g%3E%3C/svg%3E";

const TITLE =
  "TidyDisk: see what is eating your dev disk, reclaim it in one click";
const DESCRIPTION =
  "TidyDisk lives in your macOS menu bar and shows what your dev projects really cost: every node_modules folder, your pnpm store, and every installed package. Free to scan. One-click cleanup with a 19 euro lifetime license. Safely, to the Trash, never rm -rf.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  icons: { icon: FAVICON },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "TidyDisk",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "TidyDisk: the macOS menu bar app that reclaims the disk your dev projects cost",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://api.fontshare.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&f[]=cabinet-grotesk@700,800,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="lp-bg" />
        <SvgSprite />
        {children}
        <RevealClient />
        <Analytics />
      </body>
    </html>
  );
}
