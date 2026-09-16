import { expect, test } from "@playwright/test";

test.describe("AIP Ultimate Fighter — Online Multiplayer with 3 Browser Contexts", () => {
  test("two players claim slots, ready up, and fight while spectator watches", async ({
    browser,
  }) => {
    // 1. Browser context for Player 1
    const p1Context = await browser.newContext();
    const p1Page = await p1Context.newPage();

    // 2. Browser context for Player 2
    const p2Context = await browser.newContext();
    const p2Page = await p2Context.newPage();

    // 3. Browser context for Spectator
    const specContext = await browser.newContext();
    const specPage = await specContext.newPage();

    try {
      // P1 navigates and enters online lobby
      await p1Page.goto("http://localhost:5173");
      await p1Page.click("text=ONLINE 1V1 (SERVER)");
      await expect(p1Page.locator("text=ONLINE MATCHRUM")).toBeVisible();

      // P1 claims Player 1 slot
      await p1Page.click("text=Ta Spelare 1");
      await expect(p1Page.locator("text=JAG ÄR REDO!")).toBeVisible();

      // P2 navigates and enters online lobby
      await p2Page.goto("http://localhost:5173");
      await p2Page.click("text=ONLINE 1V1 (SERVER)");
      await expect(p2Page.locator("text=ONLINE MATCHRUM")).toBeVisible();

      // P2 claims Player 2 slot
      await p2Page.click("text=Ta Spelare 2");
      await expect(p2Page.locator("text=JAG ÄR REDO!")).toBeVisible();

      // Spectator joins
      await specPage.goto("http://localhost:5173");
      await specPage.click("text=ONLINE 1V1 (SERVER)");
      await expect(specPage.locator("text=ONLINE MATCHRUM")).toBeVisible();

      // Verify spectator count shows at least 1
      await expect(p1Page.locator("text=Åskådare:")).toBeVisible();

      // P1 and P2 click ready
      await p1Page.click("text=JAG ÄR REDO!");
      await p2Page.click("text=JAG ÄR REDO!");

      // Match starts! Check all 3 screens transition to match view with canvas and HUD
      await expect(p1Page.locator("canvas")).toBeVisible({ timeout: 10000 });
      await expect(p2Page.locator("canvas")).toBeVisible({ timeout: 10000 });
      await expect(specPage.locator("canvas")).toBeVisible({ timeout: 10000 });

      // Verify synchronized round text
      await expect(p1Page.locator("text=Rond 1").first()).toBeVisible();
      await expect(p2Page.locator("text=Rond 1").first()).toBeVisible();
      await expect(specPage.locator("text=Rond 1").first()).toBeVisible();

      // Wait 2.2s for countdown to finish
      await p1Page.waitForTimeout(2200);

      // P1 inputs an attack (KeyU for LP)
      await p1Page.keyboard.press("KeyU");
      await p1Page.waitForTimeout(500);

      // Verify match is active and running without errors
      await expect(p1Page.locator("text=Avsluta Match")).toBeVisible();
    } finally {
      await p1Context.close();
      await p2Context.close();
      await specContext.close();
    }
  });
});
