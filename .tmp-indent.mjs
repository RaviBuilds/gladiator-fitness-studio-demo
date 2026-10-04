import { createRequire } from "node:module";
const require = createRequire("C:\\Users\\PC\\AppData\\Local\\npm-cache\\_npx\\6bcb61ec6d5aea22\\");
const { chromium } = require("playwright");
const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});
for (const [w, h] of [[390, 844], [768, 1024], [1280, 800], [1440, 900]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForSelector(".factory-hero-back-word");
  const r = await page.evaluate(() =>
    [...document.querySelectorAll(".factory-hero-back-word + .factory-hero-back-word")].map(
      (e) => `${e.textContent}: margin-left=${getComputedStyle(e).marginLeft} display=${getComputedStyle(e).display}`
    )
  );
  console.log(w, h, JSON.stringify(r));
  await page.close();
}
await browser.close();
