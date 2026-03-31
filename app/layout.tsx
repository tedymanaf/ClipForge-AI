import { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";

import "@/app/globals.css";
import { StoreBootstrap } from "@/components/StoreBootstrap";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans"
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "ClipForge AI",
  description: "Upload Once. Go Viral Everywhere."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${display.variable} font-sans`}>
        <StoreBootstrap />
        {children}
      </body>
    </html>
  );
}
