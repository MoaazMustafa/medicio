import "@/styles/globals.css";
import clsx from "clsx";
import type { Metadata, Viewport } from "next";

import { Providers } from "./providers";

import { ClickSpark } from "@/components/click-spark";
import { fontSans } from "@/config/fonts";
import { siteConfig } from "@/config/site";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${siteConfig.name} — AI-Powered Healthcare Access`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "AI symptom checker",
    "healthcare platform",
    "doctor appointment booking",
    "verified doctors",
    "medical triage",
    "patient health records",
    "pharmacy finder",
    "lab reports",
  ],
  authors: [{ name: "Medicio Healthcare Solutions" }],
  creator: "Medicio Healthcare Solutions",
  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — AI-Powered Healthcare Access`,
    description: siteConfig.description,
    images: [
      {
        // Placeholder — replace with a real 1200×630 PNG before launch.
        url: "/images/app-preview.svg",
        width: 1200,
        height: 630,
        alt: "Medicio — AI-Powered Healthcare Access Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — AI-Powered Healthcare Access`,
    description: siteConfig.description,
    images: ["/images/app-preview.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        className={clsx(
          "min-h-screen text-foreground bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <ClickSpark sparkColor="var(--primary)" sparkSize={10} sparkRadius={15} sparkCount={8} duration={450}>
            {children}
          </ClickSpark>
        </Providers>
      </body>
    </html>
  );
}
