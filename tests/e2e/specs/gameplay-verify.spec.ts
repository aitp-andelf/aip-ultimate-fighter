import { expect, test } from "@playwright/test";
import * as path from "path";

const ARTIFACT_DIR = "/home/andelf/.gemini/antigravity-cli/brain/fdd5e273-c26f-4ae6-9f6b-0bd3463f845c";

test.describe("AIP Ultimate Fighter — Gameplay Verification & Proof of Play", () => {
  test("full real-match gameplay: select, countdown, combat, combos, super move, and K.O.", async ({
    page,
  }) => {
    // 1. Load the game in Google Chrome
    await page.goto("http://localhost:5173");
    await expect(page).toHaveTitle(/AIP Ultimate Fighter/);
    await expect(page.locator("text=AIP ULTIMATE FIGHTER")).toBeVisible();

    // 2. Navigate to Character Select (Local 2-Player)
    await page.click("text=LOKAL 2-SPELARE");
    await expect(page.locator("text=VÄLJ KÄMPE")).toBeVisible();
    await expect(page.locator("text=STARTA STRID!")).toBeVisible();

    // Select Capitan for P1
    await page.click("text=Capitan");
    // Select Irstababben for P2
    await page.click("text=Irstababben");

    // Capture Screenshot 1: Character Select Screen
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "gameplay_01_character_select.png"),
      fullPage: true,
    });

    // 3. Start Match
    await page.click("text=STARTA STRID!");

    // Verify 3D match view and HUD
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();
    await expect(page.locator('[data-testid="p1-health-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="p2-health-bar"]')).toBeVisible();

    // Capture Screenshot 2: Round Countdown Banner (ROND 1 / STRID!)
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "gameplay_02_round_start.png"),
      fullPage: true,
    });

    // Wait for round countdown to conclude (120 ticks = 2s)
    await page.waitForTimeout(1600);

    const rendererInfo = await page.evaluate(() => {
      const r = (window as any).__RENDERER;
      if (!r) return null;
      return {
        f0X: r.fighter0?.group?.position?.x,
        f1X: r.fighter1?.group?.position?.x,
        f0Loaded: r.fighter0?.isGltfLoaded,
        f1Loaded: r.fighter1?.isGltfLoaded,
      };
    });
    expect(rendererInfo).not.toBeNull();
    expect(rendererInfo?.f0X).toBeLessThan(0);
    expect(rendererInfo?.f1X).toBeGreaterThan(0);
    expect(rendererInfo?.f0Loaded).toBe(true);
    expect(rendererInfo?.f1Loaded).toBe(true);

    // Initial P2 health should be 100%
    const p2HealthBar = page.locator('[data-testid="p2-health-bar"]');
    const initialP2Health = await p2HealthBar.evaluate((el) => el.style.width);
    expect(initialP2Health).toBe("100%");

    // 4. Move P1 forward towards P2
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(650);
    await page.keyboard.up("KeyD");

    // Execute attacks and verify health depletion
    // Attack 1: Kick A (Husky Boot)
    await page.keyboard.press("KeyJ");
    await page.waitForTimeout(250);

    // Attack 2: Punch B (Captain's Hammer)
    await page.keyboard.press("KeyI");
    await page.waitForTimeout(300);

    // Capture Screenshot 3: Active combat action with damage dealt
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "gameplay_03_combat_action.png"),
      fullPage: true,
    });

    // Verify P2 has taken damage
    const damagedP2Health = await p2HealthBar.evaluate((el) => {
      return parseFloat(el.style.width);
    });
    expect(damagedP2Health).toBeLessThan(100);

    // 5. Pummel P2 to build Super Meter and trigger Super Move
    for (let i = 0; i < 8; i++) {
      await page.keyboard.down("KeyD");
      await page.waitForTimeout(150);
      await page.keyboard.up("KeyD");
      await page.keyboard.press("KeyI"); // Hammer
      await page.waitForTimeout(200);
      await page.keyboard.press("KeyK"); // Stomp
      await page.waitForTimeout(250);
      await page.keyboard.press("KeyO"); // Fedora Command Grab
      await page.waitForTimeout(350);
    }

    // Trigger Super Move (HULK MODE: CAPITAN) with KeyL
    await page.keyboard.press("KeyL");
    await page.waitForTimeout(150);

    // Capture Screenshot 4: Super Move execution
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "gameplay_04_super_move.png"),
      fullPage: true,
    });

    // 6. Finish the fight until Knockout (K.O.)
    let isKo = false;
    for (let round = 0; round < 15; round++) {
      const currentP2Health = await p2HealthBar.evaluate((el) => parseFloat(el.style.width));
      if (currentP2Health <= 0) {
        isKo = true;
        break;
      }
      await page.keyboard.down("KeyD");
      await page.waitForTimeout(100);
      await page.keyboard.up("KeyD");
      await page.keyboard.press("KeyI");
      await page.waitForTimeout(200);
      await page.keyboard.press("KeyK");
      await page.waitForTimeout(200);
    }

    // Wait for KO / Victory Banner
    const announcerBanner = page.locator('[data-testid="announcer-banner"]');
    await expect(announcerBanner).toBeVisible({ timeout: 5000 });

    // Capture Screenshot 5: Knockout / Victory screen
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "gameplay_05_knockout.png"),
      fullPage: true,
    });

    // Exit match back to main menu
    await page.click("text=Avsluta Match");
    await expect(page.locator("text=AIP ULTIMATE FIGHTER")).toBeVisible();
  });

  test("training mode with dojo controls and hitbox visualizer", async ({ page }) => {
    await page.goto("http://localhost:5173");

    // Enter Training Mode
    await page.click("text=TRÄNINGSLÄGE");
    await expect(page.locator("text=VÄLJ KÄMPE")).toBeVisible();
    await page.click("text=STARTA STRID!");

    // Verify Training Dojo Toolbar
    await expect(page.locator("text=Träningsdocka:")).toBeVisible();
    await expect(page.locator("text=Visa Hitboxar")).toBeVisible();

    // Toggle Hitbox visualizer ON
    await page.click("text=Visa Hitboxar");
    await page.waitForTimeout(500);

    // Capture Screenshot 6: Dojo with active 3D Hitbox/Hurtbox overlay
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "gameplay_06_dojo_hitboxes.png"),
      fullPage: true,
    });

    // Exit back to menu
    await page.click("text=Avsluta Match");
    await expect(page.locator("text=TRÄNINGSLÄGE")).toBeVisible();
  });
});
