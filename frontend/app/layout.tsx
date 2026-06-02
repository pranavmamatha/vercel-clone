import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Percel — Deploy Instantly",
  description: "A Vercel-like deployment platform. Paste your GitHub repo, get a live URL.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.variable} style={{ background: "#000", margin: 0, fontFamily: "Inter, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
