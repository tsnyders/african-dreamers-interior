"use client";

import { useRef, type ElementType } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import styles from "./KineticHeading.module.scss";

type Props = {
  as?: ElementType;
  children: string;
  className?: string;
  /** Play on scroll-in (default) or immediately, for headings already in view. */
  trigger?: "scroll" | "immediate";
};

/**
 * The PRD's kinetic typography rule, in one place.
 *
 * Lines are split and masked, characters rise from yPercent 100 to 0 on a 0.03s
 * stagger — type printing onto an architectural canvas. SplitText's own `mask`
 * option builds the overflow-hidden line wrappers, so there is no parallel DOM
 * structure to keep in sync.
 */
export function KineticHeading({
  as: Tag = "h2",
  children,
  className,
  trigger = "scroll",
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();

      mm.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          reduced: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          if (context.conditions?.reduced) {
            gsap.set(el, { autoAlpha: 1 });
            return;
          }

          // Splitting before the webfont lands measures line breaks against the
          // fallback face, so the mask wrappers end up the wrong height.
          const split = SplitText.create(el, {
            type: "chars,lines",
            mask: "lines",
            autoSplit: true,
            onSplit: (self) => {
              gsap.set(el, { autoAlpha: 1 });

              return gsap.from(self.chars, {
                yPercent: 100,
                duration: 0.9,
                ease: "power3.out",
                stagger: 0.03,
                scrollTrigger:
                  trigger === "scroll"
                    ? { trigger: el, start: "top 85%", once: true }
                    : undefined,
              });
            },
          });

          return () => split.revert();
        },
      );
    },
    { scope: ref, dependencies: [children, trigger] },
  );

  return (
    <Tag ref={ref} className={`${styles.heading} ${className ?? ""}`}>
      {children}
    </Tag>
  );
}
