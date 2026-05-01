import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "../../node_modules/geist/dist/fonts/geist-sans/Geist-Regular.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Jahera — AI Bedtime Stories That Build Character",
  description:
    "Personalized AI-powered bedtime stories that help children develop courage, kindness, discipline and 12+ positive habits. COPPA compliant. 24+ languages.",
  openGraph: {
    title: "Jahera — AI Bedtime Stories That Build Character",
    description:
      "Your child is the hero. Every story builds a habit. Download free on Android.",
    url: "https://jahera.app",
    siteName: "Jahera",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={geistSans.variable}>
      <body className="noise-bg">{children}</body>
    </html>
  );
}
