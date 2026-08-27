# African Dreamers Interior

**Live:** https://african-dreamers-interior.vercel.app

An animated flagship landing page for an interior design studio — a scroll-driven
narrative in ivory stone and Montserrat, built to the studio's PRD.

```bash
npm run dev      # http://localhost:3000
npm run build
npm start
npm test         # Playwright: motion, typography, visual regression
```

## The page

A theatrical curtain reveal opens onto four interaction modules, then a contact
band:

| Section | What drives it |
|---|---|
| **Curtain hero** | Pinned; two ivory panels split outward on `xPercent` while the content settles from a slight pull-back. |
| **Patio design styles** | Pinned horizontal rail. Three planes — rail, photograph, caption — move at different rates for depth. Reverts to a swipeable row below 960px. |
| **Laminated flooring** | The one WebGL module. A GLSL divider sweeps twice across a floor plane: oak → walnut → micro-cement, under identical ambient light. |
| **Upholstery in motion** | GSAP `Observer` reads scroll *velocity* and pushes each cushion with `quickTo`; they settle back when scrolling slows. |
| **Pattern, unrolled** | Three SVG masks unroll on `scaleY` with a stagger, printing vector wallpaper tiles onto a drawn wall as a light sweep crosses. |

Everything honours `prefers-reduced-motion`: timelines are skipped and each
section is set to its end state rather than left blank.

## Editing content

`lib/site.ts` is the single source of truth for every string, image path and
swatch on the site. Nothing is written into JSX.

> **This is a mockup.** Contact details are `TODO_` sentinels, and every
> photograph is AI-generated placeholder imagery — not the studio's own work.
> Both must be replaced before launch. `TESTIMONIALS` is deliberately empty and
> renders a labelled empty state; no client feedback is invented.
> See `CLAUDE.md` for the full outstanding list.

## Design system

Tokens are in `styles/_variables.scss`, the typographic scale in
`styles/_mixins.scss` — and only there. The Playwright suite asserts computed
tracking, line-height and weight against the PRD's table, so a component that
restates them inline fails the build.

| | Weight | Size | Tracking | Line height |
|---|---|---|---|---|
| `hero-title` | 300 | 2.5 → 4.5rem | 0.25em | 1.2 |
| `section-header` | 400 | 1.8 → 3.0rem | 0.20em | 1.3 |
| `card-title` | 500 | 1.2 → 1.5rem | 0.15em | 1.4 |
| `body-editorial` | 300 | 0.95 → 1.125rem | 0.05em | 1.8 |
| `caption` | 400 | 0.70 → 0.75rem | 0.30em | 1.5 |

Surfaces are ivory stone `#FDFBF7` and warm ceramic `#F4F0EA`, with structure
carried by hairline rules rather than shadows or gradients.

## Testing

```bash
npm test                        # 28 tests across chromium, firefox, webkit, mobile
npx playwright test --project=chromium
npm run test:update             # re-record screenshot baselines
node tests/bundle.mjs http://localhost:3000   # measured JS weight
```

Baselines are per-engine and were recorded against the placeholder plates;
re-record them when real photography lands.

`tests/drive.mjs`, `probe.mjs`, `mobile.mjs` and `bundle.mjs` are scratch drivers
for looking at the live page, not part of the suite.

## Performance

Measured against a production build (`next start`, gzip):

| | Measured | PRD target |
|---|---|---|
| Initial JS, transferred | ~193 kB | < 180 kB |
| Initial JS, parsed | ~609 kB | — |
| Three.js chunk | 179 kB, fetched on approach | not at load |

The initial figure is Next 16 + React 19 + four GSAP plugins; it is over the
PRD's budget by about 7%, and the framework baseline is most of it. Three.js is
genuinely deferred — an `IntersectionObserver` with two viewports of lead time
starts the import, while the section's pin is still built at mount so the
document height never changes mid-scroll.
