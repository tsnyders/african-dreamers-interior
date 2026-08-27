import { chromium } from "@playwright/test";

// Scratch driver: scrolls the live page and captures named frames so the
// scroll modules can be checked visually, not just asserted structurally.
// Usage: node tests/drive.mjs <outDir> [url] [stops]
//   stops: comma-separated "name:scrollY" pairs

const out = process.argv[2];
const url = process.argv[3] ?? "http://localhost:3001";
const stops = (process.argv[4] ?? "top:0")
  .split(",")
  .map((s) => s.split(":"))
  .map(([name, y]) => [name, Number(y)]);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

for (const [name, y] of stops) {
  await page.evaluate((to) => window.scrollTo(0, to), y);
  // scrub: 1 means the timeline takes ~1s to catch up to a jumped scroll
  // position. Shooting earlier captures a half-finished frame.
  await page.waitForTimeout(1900);
  await page.screenshot({ path: `${out}/${name}.png` });
}

const state = await page.evaluate(() => ({
  scrollHeight: document.documentElement.scrollHeight,
  headings: [...document.querySelectorAll("h1,h2,h3")].map((h) => ({
    tag: h.tagName,
    text: h.textContent.trim().slice(0, 40),
    visibility: getComputedStyle(h).visibility,
  })),
}));
console.log(JSON.stringify({ state, errors }, null, 2));
await browser.close();
