import { chromium } from "@playwright/test";
const out = process.argv[2];
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 412, height: 800 }, deviceScaleFactor: 2 });
await page.goto("http://localhost:3001", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const start = await page.evaluate(() => {
  const el = document.querySelector('[data-section="wallpaper"]');
  return Math.round((el.closest(".pin-spacer") ?? el).getBoundingClientRect().top + window.scrollY);
});
await page.evaluate((y) => window.scrollTo(0, y), start + 1200);
await page.waitForTimeout(1900);
await page.screenshot({ path: `${out}/w-mobile.png` });
console.log("captured");
await b.close();
