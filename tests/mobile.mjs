import { chromium, devices } from "@playwright/test";
const out = process.argv[2];
const url = process.argv[3];
const browser = await chromium.launch();
const page = await browser.newPage({ ...devices["Pixel 7"] });
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const stops = [["m-hero", 0], ["m-patio", 2200], ["m-floor", 3600], ["m-cushion", 5600], ["m-wall", 6600]];
for (const [name, y] of stops) {
  await page.evaluate((t) => window.scrollTo(0, t), y);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${out}/${name}.png` });
}
console.log(JSON.stringify(await page.evaluate(() => ({
  scrollHeight: document.documentElement.scrollHeight,
  bodyOverflowsX: document.documentElement.scrollWidth > window.innerWidth,
  scrollWidth: document.documentElement.scrollWidth,
  innerWidth: window.innerWidth,
})), null, 2));
await browser.close();
