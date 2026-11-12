import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fish Range",
  description: "Shooting-gallery game powered by the Fish API",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}