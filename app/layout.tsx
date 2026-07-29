import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HEARTH · Care execution assurance",
  description:
    "A caregiver-first TRL-3 proof of concept that turns fragmented post-discharge information into source-grounded, permission-aware, closed-loop responsibilities.",
  openGraph: {
    title: "HEARTH · Care execution assurance",
    description: "Care information, made executable.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HEARTH · Care execution assurance",
    description: "Care information, made executable.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#173f32",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
