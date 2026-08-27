import { expect, test, type Page } from "@playwright/test";

/**
 * The PRD's typographic scale. These are the same numbers `styles/_mixins.scss`
 * writes, and this table is the reason nothing may restate tracking or
 * line-height inline: if a component overrides one, this suite says so.
 *
 * Sizes are asserted as ratios of the element's own font-size rather than in
 * pixels, so the clamp() ramp stays free to move between breakpoints while the
 * relationships the PRD specifies hold everywhere.
 */
const TYPE_SCALE = [
  { role: "hero", selector: "h1", tracking: 0.25, lineHeight: 1.2, weight: 300, upper: true },
  { role: "section", selector: "h2", tracking: 0.2, lineHeight: 1.3, weight: 400, upper: true },
  { role: "card", selector: "h3", tracking: 0.15, lineHeight: 1.4, weight: 500, upper: true },
];

/**
 * Scroll, then wait for the scrubbed timelines to actually stop moving.
 *
 * GSAP scrubs with a ~1s catch-up, so sampling too early reads a half-played
 * frame. A fixed timeout is the obvious fix and it is flaky: under parallel
 * load across four browser projects the catch-up takes longer, which surfaced
 * as an intermittent screenshot diff on WebKit. Poll the animated transforms
 * instead and carry on once two consecutive reads agree.
 */
async function scrollTo(page: Page, y: number) {
  await page.evaluate((to) => window.scrollTo(0, to), y);
  // Floor before polling: ScrollTrigger has not started the scrub tween on the
  // frame the scroll lands, so an immediate stability check reads the same
  // pre-animation values twice and returns before anything has moved.
  await page.waitForTimeout(700);
  await page
    .waitForFunction(
      () => {
        const w = window as unknown as { __prev?: string; __same?: number };
        const now = [
          ...document.querySelectorAll(
            "[data-curtain], [data-mask], .pin-spacer > section",
          ),
        ]
          .map(
            (el) =>
              getComputedStyle(el).transform +
              (el.getAttribute("transform") ?? ""),
          )
          .join("|");
        w.__same = now === w.__prev ? (w.__same ?? 0) + 1 : 0;
        w.__prev = now;
        return (w.__same ?? 0) >= 3;
      },
      undefined,
      { timeout: 8000, polling: 200 },
    )
    .catch(() => {
      // Fall through to the assertion, which reports the actual problem far
      // better than a wait-for timeout would.
    });
}

/**
 * Where a section starts in the document. A pinned section is wrapped in a
 * `.pin-spacer`, so the spacer — not the section — is what occupies the page.
 *
 * Keyed on `data-section`, never on a spacer's index: PatioTrack deliberately
 * does not pin below 960px, so the indices shift between breakpoints and any
 * positional lookup silently reads the wrong section on mobile.
 */
async function sectionStart(page: Page, name: string) {
  return page.evaluate((key) => {
    const el = document.querySelector(`[data-section="${key}"]`);
    if (!el) throw new Error(`no section marked ${key}`);
    const box = el.closest(".pin-spacer") ?? el;
    return Math.round(box.getBoundingClientRect().top + window.scrollY);
  }, name);
}

async function pinnedSections(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll("[data-section]")]
      .filter((el) => el.closest(".pin-spacer"))
      .map((el) => el.getAttribute("data-section")),
  );
}

/**
 * Vertical scale of each wallpaper mask.
 *
 * Read from the SVG transform list, not from `getComputedStyle().transform`:
 * WebKit reports computed transform as "none" on SVG elements even while GSAP
 * has an animated matrix on the attribute, so the computed-style route silently
 * reads every mask as fully unrolled there.
 */
async function maskScales(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll<SVGGraphicsElement>("[data-mask]")].map(
      (el) => el.transform.baseVal.consolidate()?.matrix.d ?? 1,
    ),
  );
}

async function settle(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
}

test.describe("African Dreamers flagship — motion", () => {
  test("curtain hero opens across its pinned scroll", async ({ page }) => {
    await settle(page);

    const panels = page.locator("[data-curtain]");
    await expect(panels).toHaveCount(2);

    const offset = async (i: number) =>
      panels.nth(i).evaluate((el) => {
        const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
        return m.m41;
      });

    // Closed: both panels meet at the seam.
    expect(Math.abs(await offset(0))).toBeLessThan(2);
    expect(Math.abs(await offset(1))).toBeLessThan(2);
    await expect(page).toHaveScreenshot("curtain-hero-closed.png", {
      maxDiffPixelRatio: 0.01,
    });

    // Open: each panel has travelled a full half-viewport outward.
    await scrollTo(page, 1400);
    const half = page.viewportSize()!.width / 2;
    expect(await offset(0)).toBeLessThan(-half * 0.95);
    expect(await offset(1)).toBeGreaterThan(half * 0.95);
    await expect(page).toHaveScreenshot("curtain-hero-opened.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("every pinned section pins at the top of the viewport", async ({
    page,
  }) => {
    await settle(page);

    const pinned = await pinnedSections(page);

    // The hero, the flooring swapper and the wallpaper wall pin at every width.
    // The patio rail pins only where there is room for a horizontal track —
    // below 960px it stays an ordinary swipeable row on purpose.
    expect(pinned).toEqual(
      expect.arrayContaining(["hero", "flooring", "wallpaper"]),
    );
    const wide = page.viewportSize()!.width >= 960;
    expect(pinned.includes("patio"), "patio rail pins only on wide viewports")
      .toBe(wide);

    for (const name of pinned) {
      const start = await sectionStart(page, name!);
      // Park a little way into the pin, clear of both edges.
      await scrollTo(page, start + 300);
      const top = await page.evaluate(
        (key) =>
          Math.round(
            document
              .querySelector(`[data-section="${key}"]`)!
              .getBoundingClientRect().top,
          ),
        name,
      );
      expect(top, `${name} should be held at the viewport top`).toBeLessThanOrEqual(2);
    }
  });

  test("flooring swapper renders a WebGL floor plane", async ({ page }) => {
    await settle(page);

    const canvas = page.locator("canvas");
    await expect(canvas).toHaveCount(1);

    // The canvas is a replaced element: if its width is ever left to `auto` it
    // silently falls back to an intrinsic 300x150 box instead of filling.
    const box = await canvas.boundingBox();
    expect(box!.width).toBeGreaterThan(page.viewportSize()!.width * 0.7);

    const context = await canvas.evaluate(
      (el: HTMLCanvasElement) => !!(el.getContext("webgl2") || el.getContext("webgl")),
    );
    expect(context).toBe(true);

    // Scrubbing past the midpoint hands the comparison to the next laminate.
    const active = () =>
      page.locator("[data-swatch][data-active='true']").first().textContent();

    const spacer = await sectionStart(page, "flooring");
    await scrollTo(page, spacer + 200);
    const first = await active();
    await scrollTo(page, spacer + 1500);
    expect(await active()).not.toBe(first);
  });

  test("wallpaper masks unroll to full height", async ({ page }) => {
    await settle(page);

    const spacer = await sectionStart(page, "wallpaper");

    await scrollTo(page, spacer + 40);
    expect(Math.max(...(await maskScales(page)))).toBeLessThan(0.5);

    await scrollTo(page, spacer + 1300);
    for (const scale of await maskScales(page)) expect(scale).toBeGreaterThan(0.95);
  });
});

test.describe("African Dreamers flagship — typography", () => {
  test("headings match the PRD type scale", async ({ page }) => {
    await settle(page);

    for (const spec of TYPE_SCALE) {
      const el = page.locator(spec.selector).first();
      await expect(el).toBeVisible();

      const computed = await el.evaluate((node) => {
        const s = getComputedStyle(node);
        return {
          fontSize: parseFloat(s.fontSize),
          letterSpacing: parseFloat(s.letterSpacing),
          lineHeight: parseFloat(s.lineHeight),
          fontWeight: s.fontWeight,
          textTransform: s.textTransform,
          fontFamily: s.fontFamily,
        };
      });

      expect(computed.fontFamily, `${spec.role} uses Montserrat`).toContain(
        "Montserrat",
      );
      expect(
        computed.letterSpacing / computed.fontSize,
        `${spec.role} tracking`,
      ).toBeCloseTo(spec.tracking, 2);
      expect(
        computed.lineHeight / computed.fontSize,
        `${spec.role} line-height`,
      ).toBeCloseTo(spec.lineHeight, 1);
      expect(computed.fontWeight, `${spec.role} weight`).toBe(
        String(spec.weight),
      );
      if (spec.upper) expect(computed.textTransform).toBe("uppercase");
    }
  });

  test("body copy holds the editorial measure", async ({ page }) => {
    await settle(page);

    const computed = await page
      .locator("main p")
      .nth(0)
      .evaluate((node) => {
        const s = getComputedStyle(node);
        return {
          fontSize: parseFloat(s.fontSize),
          lineHeight: parseFloat(s.lineHeight),
          fontWeight: s.fontWeight,
        };
      });

    expect(computed.lineHeight / computed.fontSize).toBeCloseTo(1.8, 1);
    expect(computed.fontWeight).toBe("300");
  });
});

test.describe("African Dreamers flagship — reduced motion", () => {
  test("all content is legible without playing any scroll timeline", async ({
    page,
  }) => {
    // Emulated before navigation: every section reads the preference once, in
    // a gsap.matchMedia branch that runs on mount.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await settle(page);

    // Curtains are opened outright rather than left covering the hero.
    const panels = page.locator("[data-curtain]");
    const left = await panels
      .nth(0)
      .evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41);
    expect(left).toBeLessThan(-1);

    // Split headings still resolve to visible text.
    for (const selector of ["h1", "h2"]) {
      const el = page.locator(selector).first();
      await expect(el).toBeVisible();
      expect((await el.textContent())?.trim().length).toBeGreaterThan(0);
    }

    // Wallpaper is printed, not left blank.
    for (const scale of await maskScales(page)) expect(scale).toBeGreaterThan(0.95);
  });
});
