// End-to-end journeys against the real built app and the real dataset.
const { test, expect } = require("@playwright/test");

const consoleErrors = (page) => {
  const errs = [];
  page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  page.on("pageerror", (e) => errs.push(String(e)));
  return errs;
};

async function onboard(page, { age = "23", gender = "MALE", state = "MH" } = {}) {
  await page.goto("#/mera-haq/start");
  await page.getByLabel("Age").fill(age);
  if (gender) await page.getByLabel("Gender").selectOption(gender);
  await page.getByLabel("State / Union Territory").selectOption(state);
  await page.getByRole("button", { name: "Show my schemes" }).click();
  await expect(page).toHaveURL(/#\/mera-haq\/eligible$/);
  await expect(page.getByRole("heading", { level: 1, name: "My eligible schemes" })).toBeVisible();
}

async function openNav(page, name) {
  const menu = page.getByRole("button", { name: "Open navigation menu" });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: new RegExp("^" + name) }).click();
}

test("Flow 1: landing loads with navigation, no console errors, no broken images", async ({ page }) => {
  const errs = consoleErrors(page);
  await page.goto("");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Find government schemes");
  await expect(page.getByText(/Current dataset: \d+ schemes/)).toBeVisible();
  const broken = await page.evaluate(() => [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).length);
  expect(broken).toBe(0);
  await openNav(page, "Schemes");
  await expect(page).toHaveURL(/#\/schemes$/);
  await page.getByRole("link", { name: "Open Mera Haq" }).click();
  await expect(page).toHaveURL(/#\/mera-haq$/);
  expect(errs).toEqual([]);
});

test("Flow 2: onboarding validates and creates a profile", async ({ page }) => {
  await page.goto("#/mera-haq/start");
  await page.getByRole("button", { name: "Show my schemes" }).click();
  await expect(page.getByText("Please correct the highlighted fields.")).toBeVisible();
  await expect(page.getByText("Enter your age.")).toBeVisible();
  await page.getByLabel("Age").fill("150");
  await page.getByRole("button", { name: "Show my schemes" }).click();
  await expect(page.getByText("Enter an age between 0 and 120.")).toBeVisible();
  await expect(page).toHaveURL(/start$/);
  await onboard(page);
  await expect(page.getByText("Results for 23 years · Male · Maharashtra")).toBeVisible();
});

test("Flows 3-6: discover, open scheme, enrich, save, saved list", async ({ page }) => {
  await onboard(page);
  const cards = page.locator("article.scheme-card");
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThanOrEqual(10);
  expect(await cards.count()).toBeLessThanOrEqual(20);

  // Search + filter + pagination on Find Schemes, state kept in the URL
  await openNav(page, "Find Schemes");
  await expect(page.getByRole("status").filter({ hasText: "found" })).toContainText(/\d+ schemes found/);
  await page.locator("#find-q").fill("pension");
  await expect(page).toHaveURL(/q=pension/);
  await expect(page.getByRole("heading", { name: "Atal Pension Yojana (APY)" })).toBeVisible();
  await page.locator("#find-q").fill("zzzz-no-such-scheme");
  await expect(page.getByText("No schemes match these filters")).toBeVisible();
  await page.getByRole("button", { name: "Clear all filters" }).click();
  await page.getByLabel("Government").selectOption("STATE");
  await expect(page).toHaveURL(/level=STATE/);
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page).toHaveURL(/page=2/);
  await page.goBack();
  await expect(page).not.toHaveURL(/page=2/);

  // Scheme detail with explanation, sources and enrichment
  await page.goto("#/mera-haq/scheme/mh-government-of-india-post-matric-scholarship");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Post-Matric Scholarship");
  await expect(page.getByRole("heading", { name: "Official sources" })).toBeVisible();
  await expect(page.getByText(/quoted statements found in the source text/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "We need more information" })).toBeVisible();
  await page.getByLabel(/I agree to answer optional sensitive questions/).check();
  await page.getByLabel("Annual family income (₹)").fill("250000");
  await page.locator("select[id$='-socialCategory']").selectOption("SC");
  await page.getByRole("button", { name: "Save answers" }).click();
  await expect(page.locator(".explanation")).toContainText("Likely eligible");
  // Preserves earlier answers
  await page.goto("#/mera-haq/profile");
  await expect(page.getByLabel("Age")).toHaveValue("23");
  await expect(page.getByLabel("Annual family income (₹)")).toHaveValue("250000");

  // Save + saved list + remove
  await page.goto("#/mera-haq/scheme/apy");
  await page.getByRole("button", { name: /Save scheme/ }).click();
  await openNav(page, "Saved Schemes");
  await expect(page.getByRole("heading", { name: "Atal Pension Yojana (APY)" })).toBeVisible();
  await page.getByRole("button", { name: "Remove Atal Pension Yojana (APY) from saved schemes" }).click();
  await expect(page.getByText("No saved schemes yet")).toBeVisible();
});

test("Income one rupee above ceiling flips result to not eligible", async ({ page }) => {
  await onboard(page);
  await page.goto("#/mera-haq/profile");
  await page.getByLabel(/I agree to answer optional sensitive questions/).check();
  await page.getByLabel("Annual family income (₹)").fill("250001");
  await page.locator("select[id$='-socialCategory']").selectOption("SC");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Profile saved" })).toHaveCount(1);
  await page.goto("#/mera-haq/scheme/mh-government-of-india-post-matric-scholarship");
  await expect(page.locator(".explanation")).toContainText("Not eligible");
  await expect(page.getByRole("heading", { name: /Conditions not met \(1\)/ })).toBeVisible();
});

test("Flow 7: documents checklist ticks persist across reload when remembering", async ({ page }) => {
  await page.goto("#/mera-haq/start");
  await page.getByLabel(/Remember my answers on this device/).check();
  await page.getByLabel("Age").fill("30");
  await page.getByLabel("State / Union Territory").selectOption("MH");
  await page.getByRole("button", { name: "Show my schemes" }).click();
  await page.goto("#/mera-haq/documents?scheme=pmuy-ujjwala");
  const first = page.getByRole("checkbox").first();
  await first.check();
  await expect(page.getByText("1 / 4 ready")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("checkbox").first()).toBeChecked();
  const stored = await page.evaluate(() => localStorage.getItem("merahaq.v3"));
  expect(stored).not.toMatch(/aadhaar|\d{12}/i);
});

test("Flow 8: apply hand-off shows official destination and opens it safely", async ({ page, context }) => {
  await onboard(page);
  await page.goto("#/mera-haq/scheme/pm-vishwakarma");
  await page.getByRole("button", { name: "Apply on official site" }).click();
  const dialog = page.getByRole("dialog", { name: "You are leaving Mera Haq" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("https://pmvishwakarma.gov.in/");
  await expect(dialog).toContainText("does not submit applications");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  // Offline scheme: no application URL, so the official information page is offered instead
  await page.goto("#/mera-haq/scheme/pmjjby");
  await expect(page.getByRole("button", { name: "Apply on official site" })).toHaveCount(0);
  await page.getByRole("button", { name: "Open official information page" }).click();
  await expect(page.getByRole("dialog")).toContainText("financialservices.gov.in");
  // Block the real network: assert the popup targets the official URL with no opener
  await context.route("https://financialservices.gov.in/**", (r) => r.fulfill({ status: 200, body: "stub" }));
  const [popup] = await Promise.all([context.waitForEvent("page"), page.getByRole("button", { name: /Continue to/ }).click()]);
  await expect.poll(() => popup.url()).toContain("financialservices.gov.in");
  expect(await popup.evaluate(() => window.opener)).toBeNull();
});

test("Flow 9: back/forward, direct URL access, refresh, legacy redirects", async ({ page }) => {
  await onboard(page);
  await page.goto("#/mera-haq/find");
  await page.goto("#/mera-haq/scheme/apy");
  await page.goBack();
  await expect(page).toHaveURL(/#\/mera-haq\/find$/);
  await page.goForward();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Atal Pension Yojana (APY)");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Atal Pension Yojana (APY)");
  // Legacy prototype routes are replaced (not stacked) in history
  await page.goto("#/mera-haq/opportunities/apy/eligibility");
  await expect(page).toHaveURL(/#\/mera-haq\/scheme\/apy$/);
  await page.goto("#/mera-haq/matching");
  await expect(page).toHaveURL(/#\/mera-haq\/eligible$/);
  // Path-based deep link falls back to index.html (SPA fallback on dev server)
  const res = await page.goto("mera-haq/find");
  expect(res.status()).toBe(200);
});

test("Flow 10: empty, invalid and error states", async ({ page }) => {
  await page.goto("#/does-not-exist");
  await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  await page.goto("#/mera-haq/scheme/not-a-real-scheme");
  await expect(page.getByRole("heading", { level: 1, name: "Scheme not found" })).toBeVisible();
  await page.goto("#/mera-haq/scheme/%3Cscript%3Ealert(1)%3C%2Fscript%3E");
  await expect(page.getByRole("heading", { level: 1, name: "Scheme not found" })).toBeVisible();
  await page.goto("#/mera-haq/saved");
  await expect(page.getByText("No saved schemes yet")).toBeVisible();
  await page.goto("#/mera-haq/eligible");
  await expect(page.getByText("Start with three quick questions")).toBeVisible();
  // API unavailable
  await page.route("**/data/schemes.json", (r) => r.fulfill({ status: 503, body: "down" }));
  await page.goto("#/mera-haq/find");
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("HTTP 503");
  await page.unroute("**/data/schemes.json");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("status").filter({ hasText: "found" })).toBeVisible();
});

test("Random input: hostile values are rejected or rendered inert", async ({ page }) => {
  const errs = consoleErrors(page);
  await page.goto("#/mera-haq/start");
  for (const bad of ["-5", "0.5", "abc", "1e3", "<img src=x onerror=alert(1)>", "' OR 1=1 --"]) {
    await page.getByLabel("Age").fill(bad);
    await page.getByRole("button", { name: "Show my schemes" }).click();
    await expect(page).toHaveURL(/start$/);
  }
  await page.getByLabel("Age").fill("0");
  await page.getByLabel("State / Union Territory").selectOption("LD");
  await page.getByLabel("What should we call you?").fill("<script>alert('x')</script>नेहा");
  await page.getByRole("button", { name: "Show my schemes" }).click();
  await expect(page).toHaveURL(/eligible$/);
  expect(await page.locator("script:not([src])").count()).toBe(0);
  await page.goto("#/mera-haq/find?q=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E&page=-99&cat=<b>");
  await expect(page.getByText(/schemes? found/)).toBeVisible();
  expect(await page.locator("img[src=x]").count()).toBe(0);
  // Tampered storage is re-validated on load
  await page.evaluate(() => sessionStorage.setItem("merahaq.v3", JSON.stringify({ profile: { age: 999, state: "<x>", gender: "ROBOT" }, onboarded: true, saved: ["../../etc", "apy"] })));
  await page.reload();
  await page.goto("#/mera-haq/profile");
  await expect(page.getByLabel("Age")).toHaveValue("");
  expect(errs).toEqual([]);
});

test("Accessibility basics: skip link, labelled controls, dialog focus", async ({ page }) => {
  await page.goto("#/mera-haq/start");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
  const unlabeled = await page.evaluate(() => [...document.querySelectorAll("input,select")].filter((el) => !(el.labels && el.labels.length) && !el.getAttribute("aria-label")).length);
  expect(unlabeled).toBe(0);
  await onboard(page);
  await page.goto("#/mera-haq/help");
  await page.getByRole("button", { name: "Delete all my data" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Tab");
  const inDialog = await page.evaluate(() => !!document.activeElement.closest('[role="dialog"]'));
  expect(inDialog).toBe(true);
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Find government schemes");
});
