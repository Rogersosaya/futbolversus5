import type { Metadata } from "next";
import { Barlow_Condensed, Barlow_Semi_Condensed } from "next/font/google";

import "./globals.css";
import "@/styles/styles.css";
import "@/styles/home.css";
import "@/styles/home2.css";
import "@/styles/ligas.css";
import "@/styles/lobby.css";
import "@/styles/game.css";

import { SvgSymbols } from "@/components/SvgSymbols";
import { GameShell } from "@/components/GameShell";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

const barlowSemi = Barlow_Semi_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow-semi",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FUTBOL VERSUS",
  description: "FUTBOL VERSUS — juego de fútbol por preguntas y rachas.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${barlowCondensed.variable} ${barlowSemi.variable}`}>
      <body>
        <SvgSymbols />
        <GameShell>{children}</GameShell>
      </body>
    </html>
  );
}
