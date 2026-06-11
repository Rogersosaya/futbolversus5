import type { Metadata } from "next";
import { Barlow_Condensed, Barlow_Semi_Condensed } from "next/font/google";

import { PresenceProvider } from "@/components/realtime/presence";
import { MatchInviteToasts } from "@/components/MatchInviteToasts";
import { getAuthUserId } from "@/actions/profile";

import "./globals.css";
import "@/styles/styles.css";
import "@/styles/home.css";
import "@/styles/home2.css";
import "@/styles/ligas.css";
import "@/styles/lobby.css";
import "@/styles/game.css";
import "@/styles/auth.css";
import "@/styles/profile-setup.css";
import "@/styles/match.css";
import "@/styles/arena.css";

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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Global presence: a signed-in user counts as "online" on every route, not
  // just specific screens. Match-invite toasts are global for the same reason.
  const userId = await getAuthUserId();

  return (
    <html lang="es" className={`${barlowCondensed.variable} ${barlowSemi.variable}`}>
      <body>
        <PresenceProvider userId={userId}>
          {children}
          {userId && <MatchInviteToasts userId={userId} />}
        </PresenceProvider>
      </body>
    </html>
  );
}
