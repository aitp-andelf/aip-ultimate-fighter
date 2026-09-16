import { expect, test } from "@playwright/test";

test.describe("AIP Ultimate Fighter — Local Match Flow", () => {
  test("loads main menu and navigates to character select", async ({ page }) => {
    await page.goto("http://localhost:5173");

    // Check title and branding
    await expect(page).toHaveTitle(/AIP Ultimate Fighter/);
    await expect(page.locator("text=AROS IT-PARTNER").first()).toBeVisible();
    await expect(page.locator("text=AIP ULTIMATE FIGHTER")).toBeVisible();

    // Click Local 2-Player
    await page.click("text=LOKAL 2-SPELARE");

    // Verify character select screen
    await expect(page.locator("text=VÄLJ KÄMPE")).toBeVisible();
    await expect(page.locator("text=STARTA STRID!")).toBeVisible();

    // Verify all 8 character profiles are visible
    const names = ["Patchare", "Switch", "Helpdesk", "Sprint", "Kabel", "Rack", "Mesh", "Cloud"];
    for (const name of names) {
      await expect(page.locator(`text=${name}`).first()).toBeVisible();
    }

    // Start match
    await page.click("text=STARTA STRID!");

    // Verify HUD in match
    await expect(page.locator("text=Rond 1").first()).toBeVisible();
    await expect(page.locator("text=SUPER").first()).toBeVisible();

    // Verify 3D canvas exists
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();

    // Wait 2 seconds for countdown to finish and strid to begin
    await page.waitForTimeout(2200);

    // Simulate P1 attack (KeyU for LP)
    await page.keyboard.press("KeyU");
    await page.waitForTimeout(300);

    // Exit match back to menu
    await page.click("text=Avsluta Match");
    await expect(page.locator("text=LOKAL 2-SPELARE")).toBeVisible();
  });

  test("training mode loads with training toolbar and allows dummy control", async ({ page }) => {
    await page.goto("http://localhost:5173");

    // Click Träningsläge
    await page.click("text=TRÄNINGSLÄGE");
    await expect(page.locator("text=VÄLJ KÄMPE")).toBeVisible();

    // Start training match
    await page.click("text=STARTA STRID!");

    // Verify training toolbar
    await expect(page.locator("text=Träningsdocka:")).toBeVisible();
    await expect(page.locator("text=Visa Hitboxar")).toBeVisible();
    await expect(page.locator("text=Oändligt Liv")).toBeVisible();

    // Toggle hitboxes
    await page.click("text=Visa Hitboxar");

    // Exit
    await page.click("text=Avsluta Match");
    await expect(page.locator("text=TRÄNINGSLÄGE")).toBeVisible();
  });
});
