"use client";

import { useEffect, useRef } from "react";
import { PIN_PRIORITY, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { KineticHeading } from "@/components/KineticHeading/KineticHeading";
import { Plate } from "@/components/Plate/Plate";
import { FLOORING_INTRO, FLOORING_ROOM, FLOOR_OPTIONS } from "@/lib/site";
import { FLOOR_FRAGMENT, FLOOR_VERTEX } from "./shaders";
import styles from "./FlooringSwapper.module.scss";

/**
 * The one WebGL module on the page. A vertical divider sweeps across the floor
 * twice — oak into walnut, walnut into micro-cement — so all three laminates
 * are judged under identical ambient light.
 *
 * Two lifecycles, deliberately kept apart:
 *
 * 1. The pin is built at mount, like every other section's. A pin inserts a
 *    spacer into the document, so creating it late would shift everything
 *    below it mid-scroll. It writes scroll progress to a ref.
 * 2. Three.js is `await import()`ed, and only once the section is within a
 *    couple of viewports. Starting that at mount would defeat the dynamic
 *    import entirely — the component mounts during page load, so the library
 *    would land inside the initial page weight regardless of living in its own
 *    chunk. `dynamic({ ssr: false })` is the familiar way to express this and
 *    is rejected inside a Server Component in Next 16; this form needs no
 *    special casing and still server-renders the surrounding markup.
 *
 * The render loop reads the ref, so scrubbing and the swatch legend work
 * whether or not the shader has arrived yet.
 */
export function FlooringSwapper() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const legend = useRef<HTMLUListElement>(null);
  const progress = useRef(0);

  useGSAP(
    () => {
      const container = root.current;
      if (!container) return;

      const items =
        legend.current?.querySelectorAll<HTMLElement>("[data-swatch]");
      let activeIndex = -1;
      const markActive = (value: number) => {
        // Two transitions across three materials: the active one is whichever
        // side of the divider covers most of the floor.
        const index = Math.min(2, Math.round(value * 2));
        if (index === activeIndex || !items) return;
        activeIndex = index;
        items.forEach((item, i) =>
          item.setAttribute("data-active", String(i === index)),
        );
      };
      markActive(0);

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      ScrollTrigger.create({
        trigger: container,
        start: "top top",
        end: "+=180%",
        scrub: reduced ? false : 1,
        pin: true,
        anticipatePin: 1,
        refreshPriority: PIN_PRIORITY.flooring,
        onUpdate: (self) => {
          progress.current = self.progress;
          markActive(self.progress);
        },
      });
    },
    { scope: root },
  );

  useEffect(() => {
    const el = canvas.current;
    const container = root.current;
    if (!el || !container) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    const start = async () => {
      const THREE = await import("three");
      if (disposed) return;

      const renderer = new THREE.WebGLRenderer({
        canvas: el,
        antialias: false,
        alpha: true,
      });
      // Adaptive resolution: uncapped DPR on a 3x phone quadruples the fill
      // cost for detail nobody can resolve on a wood grain.
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const geometry = new THREE.PlaneGeometry(2, 2);
      const loader = new THREE.TextureLoader();

      const solid = (hex: string) => {
        // Parsed by hand rather than through THREE.Color: colour management is
        // on by default, so `new THREE.Color("#5a4133")` decodes the hex from
        // sRGB into the linear working space, and the swatch would be baked
        // into the texture already a gamma too dark. The plates load as stored
        // bytes, so the swatches have to as well.
        const n = parseInt(hex.replace("#", ""), 16);
        const data = new Uint8Array([
          (n >> 16) & 255,
          (n >> 8) & 255,
          n & 255,
          255,
        ]);
        const tex = new THREE.DataTexture(data, 1, 1);
        tex.needsUpdate = true;
        return tex;
      };

      // Start on the swatches and upgrade to photography as it arrives, rather
      // than starting on a texture that has not loaded and downgrading on
      // error. A texture whose image never resolves samples as black, so the
      // error path would have to be flawless for the module to look right —
      // this way there is no error path, and a missing plate stays a swatch.
      const fallbacks = FLOOR_OPTIONS.map((option) => solid(option.swatch));
      const loaded: import("three").Texture[] = [];

      const material = new THREE.ShaderMaterial({
        vertexShader: FLOOR_VERTEX,
        fragmentShader: FLOOR_FRAGMENT,
        transparent: true,
        uniforms: {
          uTex0: { value: fallbacks[0] },
          uTex1: { value: fallbacks[1] },
          uTex2: { value: fallbacks[2] },
          uProgress: { value: progress.current },
          uRepeat: { value: new THREE.Vector2(4, 3) },
          uAspect: { value: 1 },
          uDepth: { value: 0.26 },
        },
      });

      FLOOR_OPTIONS.forEach((option, i) => {
        loader.load(option.texture, (tex) => {
          if (disposed) {
            tex.dispose();
            return;
          }
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
          material.uniforms[`uTex${i}`].value = tex;
          loaded.push(tex);
        });
      });

      scene.add(new THREE.Mesh(geometry, material));

      const resize = () => {
        const { clientWidth: w, clientHeight: h } = el;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        material.uniforms.uAspect.value = w / h;

        // Plank scale is set in CSS pixels, not in tile counts. A fixed repeat
        // keeps four planks across the canvas at every size, so on a phone each
        // plank collapses to a smear; this holds a plank at roughly the same
        // real width whatever the viewport.
        material.uniforms.uRepeat.value.set(
          Math.max(1.6, w / 330),
          Math.max(1.4, h / 190),
        );

        // How hard the plane recedes. The full grazing angle needs vertical
        // room; on a short canvas it crushes the far half into a few pixels,
        // so ease off as the canvas gets shorter.
        material.uniforms.uDepth.value = h < 240 ? 0.55 : 0.26;
      };
      resize();

      const observer = new ResizeObserver(resize);
      observer.observe(el);

      let frame = 0;
      const render = () => {
        material.uniforms.uProgress.value = progress.current;
        renderer.render(scene, camera);
        frame = requestAnimationFrame(render);
      };
      frame = requestAnimationFrame(render);

      cleanup = () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        geometry.dispose();
        material.dispose();
        fallbacks.forEach((tex) => tex.dispose());
        loaded.forEach((tex) => tex.dispose());
        renderer.dispose();
      };
    };

    // Two viewports of lead time: enough for the library and the plates to be
    // ready before the section is looked at, without paying for them up front.
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        io.disconnect();
        void start();
      },
      { rootMargin: "200% 0px" },
    );
    io.observe(container);

    return () => {
      disposed = true;
      io.disconnect();
      cleanup?.();
    };
  }, []);

  return (
    <section ref={root} data-section="flooring" className={styles.section}>
      <div className={styles.intro}>
        <p className={styles.eyebrow}>{FLOORING_INTRO.eyebrow}</p>
        <KineticHeading as="h2" className={styles.title}>
          {FLOORING_INTRO.title}
        </KineticHeading>
        <p className={styles.body}>{FLOORING_INTRO.body}</p>
      </div>

      <div className={styles.stage}>
        <div className={styles.room}>
          <Plate
            src={FLOORING_ROOM.image}
            alt={FLOORING_ROOM.alt}
            sizes="(min-width: 960px) 90vw, 100vw"
          />
        </div>
        {/* The floor plane. Sits over the lower band of the room, where the
            floor is, so the walls and window light stay photographic. */}
        <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />
      </div>

      <ul ref={legend} className={styles.legend}>
        {FLOOR_OPTIONS.map((option) => (
          <li key={option.id} data-swatch className={styles.swatch}>
            <span
              className={styles.chip}
              style={{ backgroundColor: option.swatch }}
              aria-hidden="true"
            />
            <span className={styles.swatchName}>{option.name}</span>
            <span className={styles.swatchNote}>{option.note}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
