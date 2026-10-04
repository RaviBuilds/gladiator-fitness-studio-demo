import { createRequire } from "node:module";
const require = createRequire("C:\\Users\\PC\\AppData\\Local\\npm-cache\\_npx\\6bcb61ec6d5aea22\\");
const { chromium } = require("playwright");
const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
page.on("response", (r) => r.status() >= 400 && console.log(r.status(), r.url().slice(0, 200)));
await page.goto("http://localhost:3100/", { waitUntil: "networkidle" });
console.log(await page.evaluate(() => [...document.styleSheets].map((s) => s.href + " rules=" + (() => { try { return s.cssRules.length } catch { return "x" } })())));
await browser.close();
