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
  description: "Workspace AI untuk mengubah video panjang menjadi paket short-form yang siap review, edit, dan distribusi."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className="dark">
      <body className={`${inter.variable} ${display.variable} font-sans`}>
        <StoreBootstrap />
        {children}
      </body>
    </html>
  );
}
