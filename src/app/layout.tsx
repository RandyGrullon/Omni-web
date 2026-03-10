// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OMNI HUD | The Ghost AI",
  description: "High-performance invisible heads-up display for modern engineers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#0D0D0D] text-[#E0E0E0] antialiased selection:bg-[#00FF41] selection:text-black`}>
        {children}
      </body>
    </html>
  );
}
