import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sakura Blizzard — Next.js Port",
  description: "Strict 1:1 port of the sakura_blizzard physics algorithm to Next.js.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
