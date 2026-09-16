import { expect, test } from "@playwright/test";

test.describe("AIP Ultimate Fighter — SharePoint Embed Mode", () => {
  test("adapts UI and shows SharePoint integrated badge when ?sharepoint=1 is present", async ({
    page,
  }) => {
    await page.goto("http://localhost:5173?sharepoint=1");

    await expect(page.locator("text=SharePoint Integrerad")).toBeVisible();
    await expect(page.locator("text=AROS IT-PARTNER").first()).toBeVisible();
    await expect(page.locator("text=AIP ULTIMATE FIGHTER")).toBeVisible();

    // Verify game starts smoothly inside SharePoint mode
    await page.click("text=LOKAL 2-SPELARE");
    await expect(page.locator("text=VÄLJ KÄMPE")).toBeVisible();
    await page.click("text=STARTA STRID!");
    await expect(page.locator("canvas")).toBeVisible();
  });
});
