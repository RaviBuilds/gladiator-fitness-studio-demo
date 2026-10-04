import { createRequire } from "node:module";
const require = createRequire("C:\\Users\\PC\\AppData\\Local\\npm-cache\\_npx\\6bcb61ec6d5aea22\\");
const { chromium } = require("playwright");
const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});
for (const [w, h] of [[390, 844], [485, 800], [360, 740]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.locator('[role="tab"]').nth(0).click();
  await page.waitForTimeout(1500);
  // Measure visible ink rows of the three words by rendering each word's
  // text into a canvas with the same computed font and reading glyph bounds.
  const r = await page.evaluate(() => {
    const els = [...document.querySelectorAll(".factory-hero-type")].slice(0, 2);
    const out = [];
    const ctx = document.createElement("canvas").getContext("2d");
    for (const el of els) {
      const cs = getComputedStyle(el);
      ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const lines = el.querySelectorAll(".factory-hero-back-word").length
        ? [...el.querySelectorAll(".factory-hero-back-word")]
        : [el];
      for (const line of lines) {
        const rect = line.getBoundingClientRect();
        const m = ctx.measureText(line.textContent.toUpperCase());
        // Baseline position inside a line box: CSS centres the font's
        // (ascent+descent) content area in the line box.
        const fs = parseFloat(cs.fontSize);
        const lh = parseFloat(cs.lineHeight);
        const asc = m.fontBoundingBoxAscent, desc = m.fontBoundingBoxDescent;
        const baseline = rect.top + (lh - (asc + desc)) / 2 + asc;
        out.push({
          word: line.textContent,
          inkTop: +(baseline - m.actualBoundingBoxAscent).toFixed(1),
          inkBottom: +(baseline + m.actualBoundingBoxDescent).toFixed(1),
          fs,
        });
      }
    }
    return out;
  });
  const gaps = r.slice(1).map((x, i) => +(x.inkTop - r[i].inkBottom).toFixed(1));
  console.log(w, h, JSON.stringify(r.map((x) => `${x.word} ${x.inkTop}-${x.inkBottom}`)), "gaps:", gaps);
  await page.screenshot({ path: `.tmp-s1d-${w}x${h}.png` });
  await page.close();
}
await browser.close();
