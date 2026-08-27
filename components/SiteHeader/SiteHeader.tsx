"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { NAV, SITE } from "@/lib/site";
import styles from "./SiteHeader.module.scss";

export function SiteHeader() {
  const ref = useRef<HTMLElement>(null);

  // The header is fixed and draws no space, so every section has to pad past
  // it by hand. Its height is not a constant — it wraps to two rows on narrow
  // viewports — so publish the measured value and let the sections read it.
  // Hard-coding a guess is what put the section eyebrows underneath it.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const publish = () =>
      document.documentElement.style.setProperty(
        "--header-h",
        `${Math.round(el.getBoundingClientRect().height)}px`,
      );
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useGSAP(() => {
    const el = ref.current;
    if (!el) return;

    // Over the hero the header is drawn straight onto the stone and needs no
    // ground of its own. Past it, section content scrolls underneath and the
    // wordmark stops being legible — so the bar takes on the ivory surface and
    // a hairline. Toggled, not faded, and only on a class: no layout is read or
    // written during the scroll.
    ScrollTrigger.create({
      start: () => window.innerHeight * 0.85,
      end: "max",
      onToggle: (self) =>
        el.setAttribute("data-grounded", String(self.isActive)),
    });
  }, []);

  return (
    <header ref={ref} className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.wordmark} aria-label={SITE.fullName}>
          <span className={styles.wordmarkName}>{SITE.name}</span>
          <span className={styles.wordmarkSuffix}>{SITE.suffix}</span>
        </Link>

        <nav aria-label="Primary">
          <ul className={styles.nav}>
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={styles.navLink}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
