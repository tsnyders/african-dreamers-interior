import { chromium } from "@playwright/test";
const out = process.argv[2];
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3001", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const start = await page.evaluate(() => {
  const el = document.querySelector('[data-section="flooring"]');
  return Math.round((el.closest(".pin-spacer") ?? el).getBoundingClientRect().top + window.scrollY);
});
// mid of the first transition => walnut fully across the left, oak right
await page.evaluate((y) => window.scrollTo(0, y), start + 900);
await page.waitForTimeout(2000);
const stage = await page.locator('[data-section="flooring"] canvas').boundingBox();
await page.screenshot({ path: `${out}/stage-now.png`, clip: stage });
console.log(JSON.stringify({ stage }, null, 2));
await b.close();
