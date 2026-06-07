"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import { Icon, Sym } from "@/components/svg";
import { HOME_NAV } from "@/data/navigation";

/** Left-hand navigation inside the Menú screen, highlighting the active view. */
export function HomeNav() {
  const pathname = usePathname();

  return (
    <nav className="home-nav">
      {HOME_NAV.map((section, i) => (
        <Fragment key={section.eyebrow}>
          <div className="home-eyebrow" style={i > 0 ? { marginTop: 18 } : undefined}>
            {section.eyebrow}
          </div>
          {section.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`hn-item${pathname === item.href ? " on" : ""}`}
            >
              <span className="hn-ic">
                <Sym id={item.ic} />
              </span>
              <span className="hn-tx">{item.label}</span>
              <span className="hn-go">
                <Icon id="arr" width={20} height={20} />
              </span>
            </Link>
          ))}
        </Fragment>
      ))}
    </nav>
  );
}
