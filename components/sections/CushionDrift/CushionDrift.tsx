"use client";

import { useRef } from "react";
import { gsap, Observer, useGSAP } from "@/lib/gsap";
import { KineticHeading } from "@/components/KineticHeading/KineticHeading";
import { Plate } from "@/components/Plate/Plate";
import { CUSHIONS, CUSHIONS_INTRO } from "@/lib/site";
import styles from "./CushionDrift.module.scss";

// Resting arrangement, in percentages of the stage. Each cushion also carries a
// drift weight so the group separates under velocity instead of moving as a
// single rigid block.
const ARRANGEMENT = [
  { left: 12, top: 18, rotate: -7, weight: 1 },
  { left: 38, top: 46, rotate: 4, weight: 0.62 },
  { left: 63, top: 14, rotate: 9, weight: 0.84 },
  { left: 78, top: 52, rotate: -3, weight: 0.48 },
];

// Past this the cushions would leave the stage on a single flick.
const MAX_VELOCITY = 2600;

/**
 * Scroll velocity, not scroll position, drives this one.
 *
 * Observer reports how fast the page is moving; that becomes a force applied to
 * each cushion's offset and rotation. `quickTo` keeps one reusable tween per
 * property per element with a power3.out ease, so the cushions settle back into
 * the arrangement whenever the scroll decelerates — no physics engine, and no
 * new tween allocated per frame.
 */
export function CushionDrift() {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const items = gsap.utils.toArray<HTMLElement>(
          stage.current?.querySelectorAll("[data-cushion]") ?? [],
        );
        if (!items.length) return;

        const setters = items.map((el, i) => ({
          y: gsap.quickTo(el, "y", { duration: 0.9, ease: "power3.out" }),
          x: gsap.quickTo(el, "x", { duration: 1.1, ease: "power3.out" }),
          rotation: gsap.quickTo(el, "rotation", {
            duration: 1.2,
            ease: "power3.out",
          }),
          scale: gsap.quickTo(el, "scale", { duration: 0.8, ease: "power3.out" }),
          weight: ARRANGEMENT[i % ARRANGEMENT.length].weight,
          // Alternate the horizontal push so the group opens outward rather
          // than sliding off in one direction.
          lateral: i % 2 === 0 ? -1 : 1,
        }));

        const observer = Observer.create({
          target: window,
          type: "wheel,touch,scroll",
          onChangeY: (self) => {
            const v = gsap.utils.clamp(
              -MAX_VELOCITY,
              MAX_VELOCITY,
              self.velocityY,
            );
            const force = v / MAX_VELOCITY;

            setters.forEach((s) => {
              s.y(force * -90 * s.weight);
              s.x(force * 34 * s.weight * s.lateral);
              s.rotation(force * 16 * s.weight * s.lateral);
              s.scale(1 + Math.abs(force) * 0.06 * s.weight);
            });
          },
          onStop: () => {
            setters.forEach((s) => {
              s.y(0);
              s.x(0);
              s.rotation(0);
              s.scale(1);
            });
          },
        });

        return () => observer.kill();
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} data-section="cushions" className={styles.section}>
      <div className={styles.intro}>
        <p className={styles.eyebrow}>{CUSHIONS_INTRO.eyebrow}</p>
        <KineticHeading as="h2" className={styles.title}>
          {CUSHIONS_INTRO.title}
        </KineticHeading>
        <p className={styles.body}>{CUSHIONS_INTRO.body}</p>
      </div>

      <div ref={stage} className={styles.stage}>
        {CUSHIONS.map((cushion, i) => {
          const spot = ARRANGEMENT[i % ARRANGEMENT.length];
          return (
            <div
              key={cushion.id}
              data-cushion
              className={styles.cushion}
              style={
                {
                  "--left": `${spot.left}%`,
                  "--top": `${spot.top}%`,
                  rotate: `${spot.rotate}deg`,
                } as React.CSSProperties
              }
            >
              <Plate
                bare
                src={cushion.image}
                alt={cushion.alt}
                ratio="1 / 1"
                sizes="(min-width: 960px) 20vw, 44vw"
              />
              <span className={styles.name}>{cushion.name}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
