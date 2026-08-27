"use client";

import { useEffect, useRef } from "react";
import { PIN_PRIORITY, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { KineticHeading } from "@/components/KineticHeading/KineticHeading";
import { FLOORING_INTRO, FLOORING_ROOM, FLOOR_OPTIONS } from "@/lib/site";
import { FLOOR_FRAGMENT, FLOOR_VERTEX } from "./shaders";
import {
  coverTransform,
  floorLuminance,
  squareToQuad,
  toScreen,
  type Point,
} from "./floorGeometry";
import styles from "./FlooringSwapper.module.scss";

/**
 * The one WebGL module on the page. A vertical divider sweeps across the floor
 * twice — oak into walnut, walnut into micro-cement — so all three laminates
 * are judged in the same room under the same light.
 *
 * The floor is *replaced*, not covered. The canvas sits over the whole plate,
 * but the shader discards everything above the wall/floor junction and pastes
 * the new material through a homography built from the floor corners measured
 * in `FLOORING_ROOM.floor`, then relights it from the photograph itself. Walls,
 * window and garden are never drawn over.
 *
 * Two lifecycles, deliberately kept apart:
 *
 * 1. The pin is built at mount, like every other section's. A pin inserts a
 *    spacer, so creating it late would shift everything below it mid-scroll.
 *    It writes scroll progress to a ref.
 * 2. Three.js is `await import()`ed, and only once the section is within a
 *    couple of viewports. Starting that at mount would defeat the dynamic
 *    import — the component mounts during page load, so the library would land
 *    inside the initial page weight regardless of living in its own chunk.
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
      // error path would have to be flawless for the module to look right.
      const fallbacks = FLOOR_OPTIONS.map((option) => solid(option.swatch));
      const loaded: import("three").Texture[] = [];
      const geo = FLOORING_ROOM.floor;

      const material = new THREE.ShaderMaterial({
        vertexShader: FLOOR_VERTEX,
        fragmentShader: FLOOR_FRAGMENT,
        transparent: true,
        uniforms: {
          uTex0: { value: fallbacks[0] },
          uTex1: { value: fallbacks[1] },
          uTex2: { value: fallbacks[2] },
          uRoom: { value: solid("#cccccc") },
          uProgress: { value: progress.current },
          uRepeat: { value: new THREE.Vector2(geo.repeat[0], geo.repeat[1]) },
          uInvFloor: { value: new THREE.Matrix3() },
          uWallY: { value: geo.wallY },
          uKinkX: { value: geo.kinkX },
          uSlope: { value: geo.slope },
          uPlateOffset: { value: new THREE.Vector2(0, 0) },
          uPlateScale: { value: new THREE.Vector2(1, 1) },
          uLightRef: { value: 0.5 },
        },
      });

      FLOOR_OPTIONS.forEach((option, i) => {
        loader.load(option.texture, (tex) => {
          if (disposed) return tex.dispose();
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
          material.uniforms[`uTex${i}`].value = tex;
          loaded.push(tex);
        });
      });

      // The plate is loaded a second time here, as a texture, so the shader can
      // read the room's own light. The browser serves it from cache — the
      // <img> underneath has already requested it.
      let plate: HTMLImageElement | null = null;
      loader.load(FLOORING_ROOM.image, (tex) => {
        if (disposed) return tex.dispose();
        // Top-left origin, matching how the floor geometry is measured.
        tex.flipY = false;
        tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
        material.uniforms.uRoom.value = tex;
        plate = tex.image as HTMLImageElement;
        material.uniforms.uLightRef.value = floorLuminance(
          plate,
          geo.wallY,
          geo.kinkX,
          geo.slope,
        );
        loaded.push(tex);
        project();
      });

      scene.add(new THREE.Mesh(geometry, material));

      /**
       * Rebuild the screen-space projection. Depends on the canvas box and on
       * the plate's aspect, so it has to run on every resize as well as when
       * the plate finally arrives.
       */
      const project = () => {
        const { clientWidth: w, clientHeight: h } = el;
        if (!w || !h || !plate) return;

        const cover = coverTransform(w, h, plate.naturalWidth, plate.naturalHeight);
        const [nl, nr, fr, fl] = geo.quad.map((p) =>
          toScreen(p as Point, cover),
        ) as Point[];

        const m = squareToQuad(nl, nr, fr, fl);
        material.uniforms.uInvFloor.value
          .set(m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8])
          .invert();

        // The junction is measured in plate space, so it moves with the crop.
        material.uniforms.uWallY.value =
          geo.wallY * cover.scale[1] + cover.offset[1];
        material.uniforms.uKinkX.value =
          geo.kinkX * cover.scale[0] + cover.offset[0];
        material.uniforms.uSlope.value =
          (geo.slope * cover.scale[1]) / cover.scale[0];

        material.uniforms.uPlateOffset.value.set(cover.offset[0], cover.offset[1]);
        material.uniforms.uPlateScale.value.set(cover.scale[0], cover.scale[1]);
      };

      const resize = () => {
        const { clientWidth: w, clientHeight: h } = el;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        project();
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
        {/* The untouched room. The canvas covers it exactly and repaints only
            the floor, so everything else you see here is the original plate. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={FLOORING_ROOM.image}
          alt={FLOORING_ROOM.alt}
          className={styles.room}
        />
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
