import { chromium } from "@playwright/test";
const out = process.argv[2];
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 412, height: 800 }, deviceScaleFactor: 2 });
await page.goto("http://localhost:3001", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
for (const key of ["flooring", "wallpaper"]) {
  const start = await page.evaluate((k) => {
    const el = document.querySelector(`[data-section="${k}"]`);
    return Math.round((el.closest(".pin-spacer") ?? el).getBoundingClientRect().top + window.scrollY);
  }, key);
  for (const [label, off] of [["a", 150], ["b", 900]]) {
    await page.evaluate((y) => window.scrollTo(0, y), start + off);
    await page.waitForTimeout(1600);
    await page.screenshot({ path: `${out}/m2-${key}-${label}.png` });
  }
}
await b.close();
console.log("captured");
