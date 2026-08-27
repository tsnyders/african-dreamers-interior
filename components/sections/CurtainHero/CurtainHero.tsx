"use client";

import { useRef } from "react";
import { PIN_PRIORITY, gsap, useGSAP } from "@/lib/gsap";
import { KineticHeading } from "@/components/KineticHeading/KineticHeading";
import { HERO } from "@/lib/site";
import styles from "./CurtainHero.module.scss";

/**
 * The entry sequence: two ivory panels carrying the brand monogram split
 * outward as the viewport pins, while the room behind them settles from a
 * slight pull-back to full scale — stepping into a showroom.
 *
 * Panels move on xPercent, not clip-path. Both read the same visually, but
 * transform stays on the compositor and clip-path does not.
 */
export function CurtainHero() {
  const root = useRef<HTMLDivElement>(null);
  const left = useRef<HTMLDivElement>(null);
  const right = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          reduced: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          if (context.conditions?.reduced) {
            // Curtains are pure theatre. Open them and leave the section as a
            // static hero.
            gsap.set(left.current, { xPercent: -100 });
            gsap.set(right.current, { xPercent: 100 });
            gsap.set(content.current, { scale: 1, opacity: 1 });
            return;
          }

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: "+=150%",
              scrub: 1,
              pin: true,
              anticipatePin: 1,
              refreshPriority: PIN_PRIORITY.hero,
            },
          });

          tl.to(left.current, { xPercent: -100, ease: "power2.inOut" }, 0)
            .to(right.current, { xPercent: 100, ease: "power2.inOut" }, 0)
            .fromTo(
              content.current,
              { scale: 0.92, opacity: 0.55 },
              { scale: 1, opacity: 1, ease: "power1.out" },
              0,
            );
        },
      );
    },
    { scope: root },
  );

  return (
    <section ref={root} data-section="hero" className={styles.stage}>
      <div ref={content} className={styles.content}>
        <KineticHeading
          as="h1"
          trigger="immediate"
          className={styles.title}
        >
          {HERO.title}
        </KineticHeading>
        <p className={styles.subtitle}>{HERO.subtitle}</p>
      </div>

      <div
        ref={left}
        data-curtain="left"
        className={`${styles.panel} ${styles.panelLeft}`}
        aria-hidden="true"
      >
        <span className={styles.brandMark}>{HERO.curtainLeft}</span>
      </div>
      <div
        ref={right}
        data-curtain="right"
        className={`${styles.panel} ${styles.panelRight}`}
        aria-hidden="true"
      >
        <span className={styles.brandMark}>{HERO.curtainRight}</span>
      </div>

      <span className={styles.scrollCue}>{HERO.scrollCue}</span>
    </section>
  );
}
