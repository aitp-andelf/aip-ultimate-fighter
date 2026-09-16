import fs from "node:fs";
import path from "node:path";
import { validateCharacterPackage, type CharacterPackageManifest } from "./validator.ts";

function runCli(): void {
  const args = process.argv.slice(2);
  const manifestPath = args[0];

  if (!manifestPath) {
    console.log("AIP Ultimate Fighter — Character Lab Importer");
    console.log("Användning: pnpm import-character <sökväg-till-manifest.json>");
    console.log("Validerar paket och importerar karaktär utan motorändring.");
    process.exit(0);
  }

  let resolved = path.resolve(process.cwd(), manifestPath);
  if (!fs.existsSync(resolved)) {
    // Try relative to workspace root
    const rootResolved = path.resolve(process.cwd(), "../..", manifestPath);
    if (fs.existsSync(rootResolved)) {
      resolved = rootResolved;
    } else {
      console.error(`Fel: Filen '${manifestPath}' hittades inte.`);
      process.exit(1);
    }
  }

  try {
    const raw = fs.readFileSync(resolved, "utf-8");
    const manifest = JSON.parse(raw) as CharacterPackageManifest;

    console.log(`Validerar karaktärspaket: ${manifest.name ?? "Okänd"} (${manifest.id ?? "Inget ID"})...`);
    const result = validateCharacterPackage(manifest);

    if (result.warnings.length > 0) {
      console.warn("Varningar:");
      for (const w of result.warnings) {
        console.warn(` - ${w}`);
      }
    }

    if (!result.valid) {
      console.error("Validering MISSLYCKADES:");
      for (const e of result.errors) {
        console.error(` ✗ ${e}`);
      }
      process.exit(1);
    }

    console.log(`✓ Karaktärspaket för '${manifest.name}' är godkänt för Character Lab!`);
  } catch (err: any) {
    console.error(`Fel vid inläsning: ${err.message}`);
    process.exit(1);
  }
}

runCli();
