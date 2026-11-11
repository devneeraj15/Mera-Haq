// Captures POC screenshots for the pitch deck (light theme, 1600x1000).
// Usage: node scripts/screenshots.mjs <outDir>   (dev server must be running on :4173)
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const out = process.argv[2] || "screenshots";
mkdirSync(out, { recursive: true });
const base = "http://127.0.0.1:4173/";
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || "chrome" });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, colorScheme: "light" });
const shot = async (name) => { await page.waitForTimeout(300); await page.screenshot({ path: `${out}/${name}.png` }); console.log(name); };

await page.goto(base + "#/mera-haq/start");
await page.getByLabel("Age").fill("22");
await page.getByLabel("Gender").selectOption("MALE");
await page.getByLabel("State / Union Territory").selectOption("MH");
await shot("01-onboarding");
await page.getByRole("button", { name: "Show my schemes" }).click();
await page.waitForSelector("article.scheme-card");
await shot("02-results");

await page.goto(base + "#/mera-haq/scheme/mh-government-of-india-post-matric-scholarship");
await page.getByLabel(/I agree to answer optional sensitive questions/).check();
await page.getByLabel("Annual family income (₹)").fill("200000");
await page.locator("select[id$='-socialCategory']").selectOption("SC");
await page.locator("select[id$='-studentLevel']").selectOption("UNDERGRADUATE");
await page.getByRole("button", { name: "Save answers" }).click();
await page.locator("details.evidence").first().evaluate((d) => { d.open = true; });
await page.evaluate(() => { const el = document.querySelector("#elig-h").closest("section"); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 76); });
await shot("03-explained-result");

await page.getByRole("button", { name: "Apply on official site" }).click();
await shot("04-handoff");
await page.keyboard.press("Escape");

await page.goto(base + "#/mera-haq/developers");
await page.getByText(/API version/).waitFor();
await shot("05-open-api");

await page.goto(base + "#/mera-haq/impact");
await page.getByRole("button", { name: /Use CAG voted totals/ }).click();
await page.locator("#imp-model").scrollIntoViewIfNeeded();
await page.evaluate(() => window.scrollBy(0, 380));
await shot("06-impact");
await browser.close();
