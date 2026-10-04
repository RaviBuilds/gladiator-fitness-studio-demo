import { createRequire } from "node:module";
const require = createRequire("C:\\Users\\PC\\AppData\\Local\\npm-cache\\_npx\\6bcb61ec6d5aea22\\");
const { chromium } = require("playwright");

const tag = process.argv[2] || "x";
const sizes = (process.argv[3] || "390x844,375x667,430x932,360x740,768x1024,1440x900")
  .split(",")
  .map((s) => s.split("x").map(Number));
const slides = (process.argv[4] || "2").split(",").map(Number);
const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});
for (const [w, h] of sizes) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  for (const slide of slides) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('[role="tab"]').nth(slide - 1).click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1800);
    await page.screenshot({ path: `.tmp-${tag}-${w}x${h}-s${slide}.png` });
    const m = await page.evaluate(() =>
      [...document.querySelectorAll(".factory-hero-type")]
        .filter((e) => {
          const r = e.getBoundingClientRect();
          return r.width > 0 && getComputedStyle(e).position === "absolute" && !e.closest(".sr-only") && e.offsetParent !== null && getComputedStyle(e.closest("[data-active], .factory-hero-stage") || e).visibility !== "hidden";
        })
        .map((e) => {
          const r = e.getBoundingClientRect();
          return `${e.textContent} x=${r.left.toFixed(0)}-${r.right.toFixed(0)} y=${r.top.toFixed(0)}-${r.bottom.toFixed(0)} op=${getComputedStyle(e).opacity}`;
        })
    );
    console.log(w, h, "slide", slide, JSON.stringify(m));
  }
  await page.close();
}
await browser.close();

