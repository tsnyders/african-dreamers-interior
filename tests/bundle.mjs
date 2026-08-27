import { chromium } from "@playwright/test";

// What the browser actually downloads. The Turbopack build summary prints no
// First Load JS figure, and the PRD's budget is about bytes, so measure them.
// Reports parsed (uncompressed) and transferred (compressed) size — the second
// is what a visitor waits for.
const url = process.argv[2] ?? "http://localhost:3100";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

let phase = "initial";
const seen = [];
page.on("response", async (res) => {
  if (res.request().resourceType() !== "script") return;
  try {
    const raw = (await res.body()).length;
    const sizes = await res.request().sizes();
    seen.push({
      name: new URL(res.url()).pathname.split("/").pop(),
      raw,
      wire: sizes.responseBodySize || raw,
      phase,
    });
  } catch {}
});

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);

phase = "on approach to the WebGL section";
await page.evaluate(() => window.scrollTo(0, 4200));
await page.waitForTimeout(3500);

const kb = (n) => `${(n / 1024).toFixed(1)} kB`;
for (const name of ["initial", "on approach to the WebGL section"]) {
  const g = seen.filter((s) => s.phase === name);
  const raw = g.reduce((a, s) => a + s.raw, 0);
  const wire = g.reduce((a, s) => a + s.wire, 0);
  console.log(`— ${name}: ${g.length} files — ${kb(raw)} parsed, ${kb(wire)} transferred`);
  for (const s of g.sort((a, b) => b.raw - a.raw)) {
    console.log(`    ${kb(s.raw).padStart(10)} parsed  ${kb(s.wire).padStart(10)} wire   ${s.name}`);
  }
}
await browser.close();
