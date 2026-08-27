"use client";

import { useRef } from "react";
import { PIN_PRIORITY, gsap, useGSAP } from "@/lib/gsap";
import { KineticHeading } from "@/components/KineticHeading/KineticHeading";
import { WALLPAPER_INTRO, WALLPAPER_PATTERNS } from "@/lib/site";
import styles from "./WallpaperUnroll.module.scss";

/** Drawn once per panel into its own <defs>, so the ids stay unique. */
function PatternTile({ id }: { id: string }) {
  if (id === "reed") {
    return (
      <path d="M3 0V14M10 0V14" className={styles.ink} strokeWidth="1" />
    );
  }
  if (id === "woven-grid") {
    return (
      <path
        d="M0 24H48M24 0V48M12 12H36V36H12Z"
        className={styles.ink}
        strokeWidth="1.1"
      />
    );
  }
  return (
    <g className={styles.ink} strokeWidth="1.1">
      <circle cx="45" cy="45" r="7" />
      {[0, 45, 90, 135].map((angle) => (
        <ellipse
          key={angle}
          cx="45"
          cy="45"
          rx="26"
          ry="9"
          transform={`rotate(${angle} 45 45)`}
        />
      ))}
    </g>
  );
}

const TILE = {
  reed: 14,
  "woven-grid": 48,
  protea: 90,
} as const;

/**
 * Three bare wall panels pin, then vector masks unroll top to bottom, printing
 * the house patterns onto them as a light sweep travels across.
 *
 * Each panel is its own <svg> in a grid that shares its column template with
 * the legend, so a swatch always sits directly above its own name. A single
 * SVG spanning all three would letterbox inside the frame — `meet` fits by
 * height and centres — leaving the panels floating in the middle of a
 * full-width legend.
 *
 * The patterns are drawn rather than photographed: they are line work, so
 * vector stays crisp at any size, weighs a few hundred bytes, and recolours
 * from the same tokens as everything else.
 *
 * Masks are driven with scaleY, which stays on the compositor. Animating the
 * rect's `height` would re-rasterise the mask every frame.
 */
export function WallpaperUnroll() {
  const root = useRef<HTMLDivElement>(null);
  const wall = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          reduced: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const scope = wall.current;
          if (!scope) return;

          const masks = scope.querySelectorAll<SVGRectElement>("[data-mask]");
          const sweep = scope.querySelector<HTMLElement>("[data-sweep]");

          if (context.conditions?.reduced) {
            gsap.set(masks, { scaleY: 1 });
            gsap.set(sweep, { autoAlpha: 0 });
            return;
          }

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: "+=140%",
              scrub: 1,
              pin: true,
              anticipatePin: 1,
              refreshPriority: PIN_PRIORITY.wallpaper,
            },
          });

          tl.fromTo(
            masks,
            { scaleY: 0 },
            {
              scaleY: 1,
              ease: "none",
              stagger: 0.18,
              // Explicit, rather than relying on CSS transform-origin: the
              // resolved origin for an SVG element depends on transform-box,
              // which browsers do not agree on.
              svgOrigin: "0 0",
            },
            0,
          ).fromTo(
            sweep,
            { xPercent: -140, autoAlpha: 0 },
            { xPercent: 140, autoAlpha: 1, ease: "none" },
            0.15,
          );
        },
      );
    },
    { scope: root },
  );

  return (
    <section ref={root} data-section="wallpaper" className={styles.section}>
      <div className={styles.intro}>
        <p className={styles.eyebrow}>{WALLPAPER_INTRO.eyebrow}</p>
        <KineticHeading as="h2" className={styles.title}>
          {WALLPAPER_INTRO.title}
        </KineticHeading>
        <p className={styles.body}>{WALLPAPER_INTRO.body}</p>
      </div>

      <div ref={wall} className={styles.wall}>
        <ul className={styles.panels}>
          {WALLPAPER_PATTERNS.map((pattern) => {
            const tile = TILE[pattern.id as keyof typeof TILE];
            return (
              <li key={pattern.id} className={styles.panel}>
                <svg
                  className={styles.sheet}
                  viewBox="0 0 400 600"
                  // `slice` fills the panel and crops, like paper hung on a
                  // wall. `meet` would letterbox and float the sheet.
                  preserveAspectRatio="xMidYMid slice"
                  role="img"
                  aria-label={`${pattern.name} wallpaper — ${pattern.note}`}
                >
                  <defs>
                    <pattern
                      id={`adi-tile-${pattern.id}`}
                      width={tile}
                      height={tile}
                      patternUnits="userSpaceOnUse"
                    >
                      <PatternTile id={pattern.id} />
                    </pattern>
                    <mask id={`adi-mask-${pattern.id}`}>
                      <rect
                        data-mask
                        x="0"
                        y="0"
                        width="400"
                        height="600"
                        fill="#fff"
                      />
                    </mask>
                  </defs>

                  <g mask={`url(#adi-mask-${pattern.id})`}>
                    <rect
                      x="0"
                      y="0"
                      width="400"
                      height="600"
                      className={styles.ground}
                    />
                    <rect
                      x="0"
                      y="0"
                      width="400"
                      height="600"
                      fill={`url(#adi-tile-${pattern.id})`}
                    />
                  </g>
                </svg>
              </li>
            );
          })}

          {/* One sweep across the whole wall rather than three, so the light
              reads as a single source crossing the room. */}
          <span data-sweep className={styles.sweep} aria-hidden="true" />
        </ul>

        <ul className={styles.legend}>
          {WALLPAPER_PATTERNS.map((pattern) => (
            <li key={pattern.id} className={styles.legendItem}>
              <span className={styles.legendName}>{pattern.name}</span>
              <span className={styles.legendNote}>{pattern.note}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
