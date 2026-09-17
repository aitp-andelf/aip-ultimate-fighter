# Handover — 2026-09-17

Repo: `aip-ultimate-fighter` (isolerat). Branch: `main`, **ocommittat arbete**. Committa inte utan att användaren ber om det.

`docs/STATUS.md` är **inaktuell** och ljuger på flera punkter (universella powerblasts, procedur-anatomi som sanning, Copper Thief som färdig modell). Lita på koden.

## Målet (låst av användaren)

Street Fighter 2.5D, inte Tekken:

- Sidled stage. Forward = mot motståndaren på X (P1 höger). Backward = **backwalk som fortfarande tittar på motståndaren**, inte vända ryggen och gå iväg.
- Down = duck som **syns som knäböj**, inte squasha/komprimera meshen.
- Up = hopp som inte lämnar rutan.
- Alltid titta på motståndaren.
- Långsam arkadtakt. Gångframes matchade mot steg. Attackclip synkade mot hit-frames.
- Inga universella powerblasts. Unika specials. Inga shoto/grappler/zoner/hybrid-**etiketter i UI**.
- Combos, partiklar, grabs, jump kick, duck attacks, dash.
- **Bulgarian Copper Thief är låst** tills användaren fixar något — rör inte den modellen.
- Hitboxar ska följa visuell pose (särskilt crouch vs stand, facing-speglade world boxes).

## Vad som är gjort i trädet (ocommittat)

### Content / sim

- Alla 8 har långsammare `walkSpeed` (4–7), `jumpVy` ~45–54, gravity default 4.
- `crouchKit` (`clp/clk/chp/chk`) + `air_punch`. Inga `projectile:` på moves (content-test assertar det).
- Unika melee-specials (Hawaii-spade, Goon Rush, Cardiac Tap, zon-moln, Fedora-grab, Clinic Lock, Ekander roll, Copper crowbar-data).
- Dash double-tap, crouch normals, air punch vs kick i `packages/sim/src/core/engine.ts`.
- Crouch hurt kortare än stand. HIGH-hp sitter **ovanför** crouch-top så de whiffar rumsligt. MID träffar fortfarande duck.
- `getHurtboxes` / `getPushbox` använder crouch även under `lowPose`-attacker.
- Debug-boxar i renderer ritas från samma sim-funktioner.
- UI: arketyp-badges borttagna, tagline används.

### Renderer (det som var kaputt)

Fil: `apps/web/src/game/renderer.ts`.

**Riggfakta (mätt på `irstababben.glb`, samma pipeline på de andra authored GLB):**

- Bind: Root `X = -90°`. Bind-pose tittar ungefär **+Z**. Idle/walk-clipsen vrider kroppen så de tittar **−Z**.
- Kamera sitter på **+Z**.
- Sidovy (`yaw ≈ −π/2`) gör att idle-guarden ser ut som korsade armar över silhuetten. **Gör inte om det.**
- `scale.x = -1` på P2 (sprite-spegling) + bone-overlay = pretzel / karaktären försvinner i golvet. **Gör inte om det.**
- `group.scale.y`-squash som duck: användaren sa nej. **Gör inte om det.**
- Authored crouch-clips är sit/fish/crawl, inte fighting squat. Duck = overlay på **idle** efter `mixer.update`.

**Nuvarande orientering (korrekt riktning):**

- Ingen negativ scale.
- P1: `yaw = -π + 0.55` (titta mot kamera, ~30° mot motståndaren / +X).
- P2: `yaw =  π - 0.55` (samma 3/4, mot −X).
- Victory: `yaw = π` (mot kamera).
- Konstantar: `AUTHORED_FACE_CAMERA`, `AUTHORED_THREE_QUARTER`.

**Backwalk:** samma `walk`-clip, **negativ** `timeScale`. Aldrig `walk_back` (det är strafe/smyg). Om samma action-objekt byter fram/bak: `setEffectiveTimeScale` även när clipet redan spelas.

**Arm-uncross:** retargeten slår båda händerna över bröstet i idle/walk. Efter mixern, om inte attack: `L/R_Upperarm.rotateX(-0.52)` och `L/R_Forearm.rotateX(-0.35)`. Idle ser OK ut. Walk svingar fortfarande den ena armen mer — det sitter i clippet.

**Duck:** lår `rotateX(-0.79 * d)`, sedan plant via `hip.position.z -= clamp(minFootY / authoredScale)`. Hip local Z är world-up (Root X-90). Ingen mesh-squash. Båda sidor syns i träning; P1 lutar lite i squatten.

**Authored modeller** laddas bara om URL inte matchar `RobotExpressive|Soldier|Xbot|Michelle`. Copper Thief (`/models/Xbot.glb`) = procedur-fallback medvetet.

### GLB / portraits (untracked)

`apps/web/public/models/{irstababben,capitan,babas,ekander,femboyfippe,goonstrom,stinkfiend}.glb` + portraits. Copper Thief har **ingen** authored GLB i den listan.

## Vad som återstår (i ungefärlig ordning)

1. **Walk-armar.** Idle är OK; gångclippet korsar fortfarande. Antingen starkare/skevt-per-state overlay, eller riktig retarget av walk (asset, inte squasha).
2. **Duck-silhouette.** Synlig knäböj, men P1 kan luta. Finjustera lårtecken/mängd per rigg. Rör inte hip.z som “världsupp” utan att mäta idle-axlar — idle Hip Y är world-up, men **position.z på Hip är i Root-rum och är fortfarande höjd**.
3. **Copper Thief-modell.** Låst. När användaren säger till: ny GLB, inte Mixamo Xbot. Data (moves/hurt) finns redan.
4. **Walk-fot-synk / skating.** `timeScale` från `vx * WORLD_SCALE * 60` finns; inte re-verifierat mot varje GLB:s cykellängd (~0.83s på Irstababben).
5. **Attack-synk.** `impactAt`/`windupAt` mot startup finns; punch-clips är långa (~4s). Synk är ungefärlig.
6. **Partiklar.** Hit-sparks finns. Inte prioriterat. Inga eldklot som universell special.
7. **STATUS.md** ljuger (projektil-VFX-text, “10/10 sim tests” — sim har fler tester nu). Uppdatera bara efter verifiering.
8. **E2E** inte körda mot den här branchen. `docs/STATUS.md` 6/6 är gammalt.

## Så du inte upprepar döda spår

| Försök | Varför det dog |
|---|---|
| P2 `scale.x = -1`, samma yaw | Korsade armar + duck-overlay förstör P2 |
| `group.scale.y` som duck | Användaren: inte komprimera modellen |
| Motsatt yaw `±π/2` (sidovy) | Idle-guard = korsade armar i profil |
| Hip.z-drop + kraftig calf `rotateX` | Karaktären försvinner i golvet |
| Spela authored `crouch`-clip | Sit / fiske / crawl |
| `walk_back`-clips | Inte backwalk, de vänder / strafar |

## Verifiera

```
pnpm --filter @aipuf/sim test && pnpm --filter @aipuf/content test
```

Dev: `pnpm dev` (web 5173 eller 5174 om 5173 är upptagen, Colyseus 2567). Träning: Irstababben vs Capitan. Inte Copper Thief.

Tangentbord (P1): WASD rörelse, U/I jab/fierce, J/K kicks. HUD stjäl ibland fokus — klicka canvas. Playwright: `dispatchEvent`/`page.keyboard` med `KeyD` osv.

Träning: Visa Hitboxar. Kolla idle 3/4, gång in, backwalk (ansikte mot P2), duck (kortare gröna boxar, knäböj, fötter i golvet), hopp i bild, HIGH mot duckande dummy.

## Arkitektur (kort)

- `packages/sim` — enda stridsauktoriteten, 60 Hz, fixed-point.
- `packages/content` — karaktärer/moves, inte motor.
- `apps/web` — React-menyer, Three.js-match **utanför** React-state.
- Ingen stridslogik i React. Ingen root motion som auktoritet.

Repo-regler: `AGENTS.md`, `docs/SPEC.md`, `docs/DECISIONS.md`.
