import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VideoGenerator — AI Video Creation",
  description: "Generate videos with AI models like Kling, VEO, and Sora",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
