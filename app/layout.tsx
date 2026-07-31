import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "HEARTH · Care, one step at a time",
  description:
    "A calm caregiver workspace that shows what to do next, what can wait, and who can help.",
  openGraph: {
    title: "HEARTH · Care, one step at a time",
    description: "Know what to do next.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HEARTH · Care, one step at a time",
    description: "Know what to do next.",
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
