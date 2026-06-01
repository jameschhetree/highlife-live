const { chromium } = require("/opt/homebrew/lib/node_modules/playwright");

const BASE = "https://highlife-records.vercel.app";
const SCREENSHOTS_DIR = "/Users/james/.playwright-mcp";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // 1. Screenshot home hero
  console.log("Taking home hero screenshot...");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: `${SCREENSHOTS_DIR}/highlife-home-hero.png`,
    fullPage: false,
  });
  console.log("Home hero screenshot saved.");

  // 2. Screenshot roster
  console.log("Taking roster screenshot...");
  await page.goto(`${BASE}/roster`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: `${SCREENSHOTS_DIR}/highlife-roster.png`,
    fullPage: false,
  });
  console.log("Roster screenshot saved.");

  // 3. Login flow + portal screenshot
  console.log("Testing login flow...");
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Fill login
  await page.fill('input[id="email"]', "demo@demo.com");
  await page.fill('input[id="password"]', "demo");
  await page.click('button[type="submit"]');

  // Wait for navigation to portal
  await page.waitForURL("**/portal", { timeout: 10000 });
  await page.waitForTimeout(2000);

  // Verify portal content
  const welcomeText = await page.textContent("h1");
  console.log(`Portal heading: ${welcomeText}`);

  if (welcomeText && welcomeText.includes("Welcome back")) {
    console.log("LOGIN TEST: PASSED - Landed on portal with welcome message");
  } else {
    console.log("LOGIN TEST: FAILED - Did not find welcome message");
  }

  // Check for booking status cards
  const bodyText = await page.textContent("body");
  if (bodyText && bodyText.includes("HL-1021")) {
    console.log("DASHBOARD DATA: PASSED - Found booking request #HL-1021");
  }
  if (bodyText && bodyText.includes("HL-1022")) {
    console.log("DASHBOARD DATA: PASSED - Found booking request #HL-1022");
  }
  if (bodyText && bodyText.includes("HL-1023")) {
    console.log("DASHBOARD DATA: PASSED - Found booking request #HL-1023");
  }

  await page.screenshot({
    path: `${SCREENSHOTS_DIR}/highlife-portal.png`,
    fullPage: false,
  });
  console.log("Portal screenshot saved.");

  await browser.close();
  console.log("\nAll verifications complete.");
}

run().catch((e) => {
  console.error("Verification failed:", e);
  process.exit(1);
});
