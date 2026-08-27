"use client";

import { useRef } from "react";
import { PIN_PRIORITY, gsap, useGSAP } from "@/lib/gsap";
import { KineticHeading } from "@/components/KineticHeading/KineticHeading";
import { Plate } from "@/components/Plate/Plate";
import { PATIO_INTRO, PATIO_STYLES } from "@/lib/site";
import styles from "./PatioTrack.module.scss";

/**
 * Vertical scroll drives a pinned horizontal rail.
 *
 * The rail translates in pixels rather than xPercent: card widths are
 * viewport-relative, so the travel distance has to be re-read on every
 * refresh. `invalidateOnRefresh` plus function-based values does that;
 * a fixed xPercent would drift on resize and on the font swap.
 *
 * Depth comes from three planes moving at different rates against each other —
 * the rail itself, the photograph inside each frame, and the caption block.
 */
export function PatioTrack() {
  const root = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          track: "(min-width: 960px) and (prefers-reduced-motion: no-preference)",
        },
        (context) => {
          // Below 960px, and whenever motion is reduced, the rail is left as a
          // plain scrollable row. Pinning a horizontal track on touch fights
          // the browser's own gesture handling and strands people mid-section.
          if (!context.conditions?.track) return;

          const el = rail.current;
          if (!el) return;

          const travel = () => Math.max(0, el.scrollWidth - window.innerWidth);

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: () => `+=${travel()}`,
              scrub: 1,
              pin: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              refreshPriority: PIN_PRIORITY.patio,
            },
          });

          tl.to(el, { x: () => -travel(), ease: "none" }, 0);

          // Background plane: the photograph drifts against its own frame.
          tl.fromTo(
            el.querySelectorAll<HTMLElement>("[data-plane='image']"),
            { xPercent: -8 },
            { xPercent: 8, ease: "none" },
            0,
          );

          // Foreground plane: captions lag the rail slightly.
          tl.fromTo(
            el.querySelectorAll<HTMLElement>("[data-plane='caption']"),
            { xPercent: 5 },
            { xPercent: -5, ease: "none" },
            0,
          );
        },
      );
    },
    { scope: root },
  );

  return (
    <section id="patio" ref={root} data-section="patio" className={styles.section}>
      <div className={styles.intro}>
        <p className={styles.eyebrow}>{PATIO_INTRO.eyebrow}</p>
        <KineticHeading as="h2" className={styles.title}>
          {PATIO_INTRO.title}
        </KineticHeading>
        <p className={styles.body}>{PATIO_INTRO.body}</p>
      </div>

      <div className={styles.viewport}>
        <div ref={rail} className={styles.rail}>
          {PATIO_STYLES.map((style) => (
            <article key={style.slug} className={styles.card}>
              <div className={styles.frame}>
                <div data-plane="image" className={styles.pan}>
                  <Plate
                    src={style.image}
                    alt={style.alt}
                    sizes="(min-width: 960px) 34vw, 78vw"
                  />
                </div>
              </div>

              <div data-plane="caption" className={styles.caption}>
                <span className={styles.index}>{style.index}</span>
                <h3 className={styles.cardTitle}>{style.name}</h3>
                <p className={styles.blurb}>{style.blurb}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
