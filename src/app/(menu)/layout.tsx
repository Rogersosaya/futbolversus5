import type { ReactNode } from "react";

import { Topbar } from "@/components/Topbar";
import { HomeNav } from "@/components/HomeNav";
import { ViewFrame } from "@/components/ViewFrame";
import { PROFILE } from "@/data/profile";

/**
 * The Menú screen shell shared by every home-hub view (Liga, Amistoso,
 * Mercado, …). Each view route renders into the animated `.view` content area.
 */
export default function MenuLayout({ children }: { children: ReactNode }) {
  return (
    <section className="screen active" data-screen="menu" data-screen-label="Menú principal">
      <div className="bg">
        <div className="streaks" />
        <div className="vignette" />
      </div>

      <Topbar>
        <span>{PROFILE.season}</span>
        <span className="coin">
          <i /> {PROFILE.coins}
        </span>
        <span className="who">
          {PROFILE.name}{" "}
          <u
            style={{
              backgroundImage: `url('${PROFILE.avatar}')`,
              backgroundSize: "180%",
              backgroundPosition: "50% 12%",
            }}
          />
        </span>
      </Topbar>

      <div className="home">
        <HomeNav />
        <div className="home-content">
          <ViewFrame>{children}</ViewFrame>
        </div>
      </div>
    </section>
  );
}
