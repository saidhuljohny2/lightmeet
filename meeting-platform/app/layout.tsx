import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LightMeet",
  description: "A lightweight WebRTC meeting platform.",
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
