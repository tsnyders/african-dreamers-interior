@AGENTS.md

# African Dreamers Interior — Next.js (SCSS Modules)

Client mockup built to `../Claude Prompts/African Dreamers Interior PRD.pdf`.
Scroll-narrative landing page + `/about` + `/contact`.

## Stack
- Next 16 App Router, TypeScript. **SCSS Modules, not Tailwind.**
- GSAP 3.15 (ScrollTrigger, SplitText, Observer) — all free since 3.13, no Club token.
- Three.js in **one** module only (FlooringSwapper), lazily imported.
- Playwright for motion + typography + visual regression.

## Where things live
- **All copy and brand data: `lib/site.ts`.** Edit there, never in JSX.
- Design tokens: `styles/_variables.scss`. Type scale: `styles/_mixins.scss`.
- `styles/` is on the Sass load path (`next.config.ts` → `sassOptions.loadPaths`),
  so modules write `@use "variables" as vars;` with no `../` hops.
- GSAP is registered once in `lib/gsap.ts`. Import it from there, never from `gsap` directly.
- Components are colocated: `Component/Component.tsx` + `Component.module.scss`.

## Rules that are load-bearing
- **The type scale lives only in `_mixins.scss`.** `tests/flagship.spec.ts` asserts
  computed tracking/line-height/weight against the PRD table, so restating any of
  those inline will fail the suite.
- **Every pinned ScrollTrigger declares `refreshPriority`** (`PIN_PRIORITY` in
  `lib/gsap.ts`). Pins insert spacers; if they refresh out of document order every
  offset below goes stale and sections stop pinning. FlooringSwapper builds its
  trigger after an await, so creation order is *not* document order.
- Scrubbed animation uses transform/opacity only — no width/height/top.
- Reduced-motion branches live inside `gsap.matchMedia()` effects, never in
  rendered output (that causes hydration mismatch).
- `<canvas>` is a replaced element: give it an explicit width, never `left`+`right`.
- Tests key on `data-section`, never on a `.pin-spacer` index — PatioTrack does
  not pin below 960px, so the indices differ by breakpoint.
- Read SVG transforms via `el.transform.baseVal.consolidate()`, not
  `getComputedStyle().transform`: WebKit reports "none" for SVG regardless.
- In the shader, don't tag textures `SRGBColorSpace` and don't use `THREE.Color`
  for swatches — colour management decodes to linear and there is no matching
  encode on a custom fragment shader. See the note in `shaders.ts`.
- **Sections clear the header with `@include mix.below-header`**, never a
  hard-coded padding. The header is fixed, draws no space, and wraps to two rows
  on narrow viewports — SiteHeader publishes its measured height as `--header-h`.
- **The flooring module is a composite, not an overlay.** The canvas sits over
  the whole room plate and repaints only the floor, masked by the wall/floor
  junction and mapped through a homography. The geometry that makes that work
  lives in `FLOORING_ROOM.floor` in `lib/site.ts` and is measured *in the
  plate* — **swap the room photo and you must re-measure it**, or the new floor
  will sit at the wrong angle. Overlay a percentage grid on the image to read
  the corners off (there is a recipe in the comment there).
  The room plate is a plain `<img>`, not `next/image`, deliberately: the shader
  loads the same URL and has to reproduce the browser's `object-fit: cover`
  crop exactly, which an optimizer-resized variant would break.
- **Cut-outs must use `<Plate bare>`**, which serves them `unoptimized`. Next's
  image optimizer flattens the alpha channel, so an optimized cut-out comes back
  as opaque RGB and renders as a rectangle.

## Regenerating imagery
`agy --dangerously-skip-permissions -p '<prompt> ... Save the result to <ABSOLUTE path>'`
run with cwd inside this project. Notes learned the hard way:
- agy only reliably writes inside its own working directory; absolute paths
  outside it silently produce nothing.
- It often ignores the exact filename and leaves the output in
  `~/.gemini/antigravity-cli/brain/<session>/<name>_<ts>.jpg`. Check there
  before assuming a generation failed, and check for stray `.jpg`/`.webp`
  variants it creates alongside.
- Cushions are matted to alpha by a script that flood-fills only backdrop
  *reachable from the frame edge* — an ivory subject on an ivory sweep
  otherwise gets holes punched through its middle.

## Outstanding before this is shown to the client
1. **Every `TODO_` value in `lib/site.ts` is a placeholder.** `grep -rn TODO_ lib/`.
   Lint will not catch them.
2. **All imagery is agy-generated placeholder, not the studio's own work.**
   Must be disclosed when showing the client and swapped for real project
   photography before launch. Wallpaper patterns are vector and are final.
   One plate is still missing: a fourth cushion, "Ivory boucle"
   (`/images/cushion-boucle.webp`) — the image service hit its daily quota.
   Adding it back is just another entry in `CUSHIONS`; the drift arrangement
   wraps to any count.
3. Playwright suite is green on all four projects
   (chromium/firefox/webkit/mobile). Screenshot baselines are per-engine and
   were recorded against the current plates — re-record with
   `npm run test:update` after any imagery change.
4. Initial JS is ~193 kB transferred (gzip, `next start`); the PRD asks for
   <180 kB. Three.js is a separate 179 kB chunk fetched on approach, not at load.
