"use client";

// One registration point for the whole app. Importing GSAP anywhere else risks
// a second, unregistered copy of a plugin and silently dead animations.
//
// GSAP 3.13+ ships SplitText and Observer under the standard licence, so no
// Club token or private registry is involved.

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Observer } from "gsap/Observer";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, Observer);

/**
 * Refresh order for the pinned sections, top of page to bottom.
 *
 * Each pin inserts a spacer, which moves the document position of everything
 * below it. ScrollTrigger only gets that right if it refreshes pins in
 * document order, and it falls back to *creation* order to decide — which is
 * wrong here, because FlooringSwapper builds its trigger after awaiting the
 * Three.js import and so is created last despite sitting third on the page.
 * Higher priority refreshes earlier.
 */
export const PIN_PRIORITY = {
  hero: 40,
  patio: 30,
  flooring: 20,
  wallpaper: 10,
} as const;

if (typeof document !== "undefined") {
  // Montserrat swaps in after first paint. Pin distances measured against the
  // fallback face are wrong by a few pixels per line, which reads as a jump
  // mid-scroll and scores as CLS.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  // Photography settles later still, and a plate that fails to resolve changes
  // its frame's height too.
  window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
}

export { gsap, ScrollTrigger, SplitText, Observer, useGSAP };
