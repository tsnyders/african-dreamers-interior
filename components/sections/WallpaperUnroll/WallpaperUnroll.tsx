"use client";

import { useRef } from "react";
import { PIN_PRIORITY, gsap, useGSAP } from "@/lib/gsap";
import { KineticHeading } from "@/components/KineticHeading/KineticHeading";
import { WALLPAPER_INTRO, WALLPAPER_PATTERNS } from "@/lib/site";
import styles from "./WallpaperUnroll.module.scss";

const PANEL_X = [40, 420, 800];
const PANEL_W = 360;
const PANEL_Y = 40;
const PANEL_H = 620;

/**
 * A bare wall frame pins, then three vector masks unroll top to bottom,
 * printing the house patterns onto the surface as a light sweep travels across
 * them.
 *
 * The patterns are authored as SVG `<pattern>` tiles rather than photographed:
 * they are line work, so vector keeps them crisp at any viewport, weighs a few
 * hundred bytes, and recolours from the same tokens as the rest of the page.
 *
 * Masks are driven with scaleY on a transform-box of their own fill box, which
 * stays on the compositor. Animating the rect's `height` would re-rasterise the
 * mask every frame.
 */
export function WallpaperUnroll() {
  const root = useRef<HTMLDivElement>(null);
  const scene = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          reduced: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const svg = scene.current;
          if (!svg) return;

          const masks = svg.querySelectorAll<SVGRectElement>("[data-mask]");
          const sweep = svg.querySelector<SVGRectElement>("[data-sweep]");

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
            { scaleY: 1, ease: "none", stagger: 0.18 },
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

      <div className={styles.wall}>
        <svg
          ref={scene}
          className={styles.scene}
          viewBox="0 0 1200 700"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Three wallpaper patterns unrolling onto a bare wall: ${WALLPAPER_PATTERNS.map((p) => p.name).join(", ")}`}
        >
          <defs>
            {/* Reed — fine vertical rule, the quietest of the three. */}
            <pattern
              id="adi-reed"
              width="14"
              height="14"
              patternUnits="userSpaceOnUse"
            >
              <path d="M3 0V14M10 0V14" className={styles.ink} strokeWidth="1" />
            </pattern>

            {/* Woven grid — interlocking squares on a half-drop repeat. */}
            <pattern
              id="adi-grid"
              width="48"
              height="48"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M0 24H48M24 0V48M12 12H36V36H12Z"
                className={styles.ink}
                strokeWidth="1.1"
              />
            </pattern>

            {/* Protea — a stylised rosette, wide repeat. */}
            <pattern
              id="adi-protea"
              width="90"
              height="90"
              patternUnits="userSpaceOnUse"
            >
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
            </pattern>

            <linearGradient id="adi-sweep" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#fff" stopOpacity="0" />
              <stop offset="50%" stopColor="#fff" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </linearGradient>

            {PANEL_X.map((x, i) => (
              <mask key={x} id={`adi-unroll-${i}`}>
                <rect
                  data-mask
                  x={x}
                  y={PANEL_Y}
                  width={PANEL_W}
                  height={PANEL_H}
                  fill="#fff"
                  style={{ transformOrigin: `${x}px ${PANEL_Y}px` }}
                />
              </mask>
            ))}
          </defs>

          {/* Bare wall: the frame is drawn, never shaded. */}
          {PANEL_X.map((x) => (
            <rect
              key={`frame-${x}`}
              x={x}
              y={PANEL_Y}
              width={PANEL_W}
              height={PANEL_H}
              className={styles.frame}
            />
          ))}

          {WALLPAPER_PATTERNS.map((pattern, i) => (
            <g key={pattern.id} mask={`url(#adi-unroll-${i})`}>
              <rect
                x={PANEL_X[i]}
                y={PANEL_Y}
                width={PANEL_W}
                height={PANEL_H}
                className={styles.ground}
              />
              <rect
                x={PANEL_X[i]}
                y={PANEL_Y}
                width={PANEL_W}
                height={PANEL_H}
                fill={`url(#adi-${["reed", "grid", "protea"][i]})`}
              />
            </g>
          ))}

          <rect
            data-sweep
            x="0"
            y={PANEL_Y}
            width="240"
            height={PANEL_H}
            fill="url(#adi-sweep)"
            className={styles.sweep}
          />
        </svg>

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
