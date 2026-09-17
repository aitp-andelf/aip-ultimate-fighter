# Handover — 2026-09-17 (eftermiddag)

Repo: `aitp-andelf/aip-ultimate-fighter` (isolerat).  
Branch: **`main` @ `e2f07e7`** — allt relevant arbete är **committat och pushat**. Håll fortsatt arbetet på `main` (användaren vibe-codar och vill inte tappa spår över många brancher). Committa/pusha gärna när en bit är klar, men **fråga innan** om det är oklart.

Lokal checkout: `/home/andelf/AITP/aip-ultimate-fighter` (maskin `aitp-andelf-2m6dg64`).  
Dev: `pnpm dev` → web http://localhost:5173/ · Colyseus http://localhost:2567  
Träning: Irstababben (`shoto-a`) vs Capitan (`grappler-a`). **Inte** Copper Thief för renderer-verifiering.

`docs/STATUS.md` är **fortfarande inaktuell** — lita på koden och den här filen.

---

## Målet (låst)

Street Fighter 2.5D, inte Tekken:

- Sidled stage. Forward = mot motståndaren på X (P1 höger). Backward = **backwalk som fortfarande tittar på motståndaren**.
- Down = duck som **synlig knäböj**, aldrig mesh-squash (`group.scale.y`).
- Up = hopp som stannar i bild.
- Alltid titta på motståndaren.
- Långsam arkadtakt. Gångframes ↔ steg. Attackclip ↔ hit-frames.
- Inga universella powerblasts / projektil-VFX som universal special. Unika melee-specials. Inga arketyp-etiketter i UI (tagline OK).
- Combos, partiklar, grabs, jump kick, duck attacks, dash.
- **Bulgarian Copper Thief (`hybrid-b` / `Xbot.glb`) är LÅST** — rör inte den modellen förrän användaren säger till.
- Hitboxar ska följa visuell pose (crouch vs stand, facing).

---

## HEAD / viktiga commits idag

| Commit | Vad |
|--------|-----|
| `e70f100` | SF 2.5D WIP: facing, crouch kit, authored GLBs, unika specials |
| `ad8b049` → mergad `dc0d9c7` | Starkare walk-arm uncross overlay |
| `c12f2d4` | Upright duck (facing-aware thigh signs + abduct) |
| `0473d4c` | **Benny Blåsfisk** + **Tård** i roster (10 fighters), character select 5×2 |
| `e2f07e7` | **Pose-isolation** för authored overlay + Rig-diag A–D |

Cloud Agents finns **inte** på Cursor-planen — kodarbete körs lokalt på maskinen (eller motsvarande). GitHub är kopplat som `@aitp-andelf`.

---

## Roster (10)

| ID | Namn | Modell | Porträtt |
|----|------|--------|----------|
| `zoner-a` | Femboyfippe | `femboyfippe.glb` | ja |
| `zoner-b` | Stinkfiend | `stinkfiend.glb` | ja |
| `shoto-a` | Irstababben | `irstababben.glb` | ja |
| `shoto-b` | Goonström | `goonstrom.glb` | ja |
| `grappler-a` | Capitan | `capitan.glb` | ja |
| `grappler-b` | Babas | `babas.glb` | ja |
| `hybrid-a` | Ekander | `ekander.glb` | ja |
| `hybrid-b` | Bulgarian Copper Thief | `Xbot.glb` (procedur) | **nej** (bokstavs-fallback) — **LÅST** |
| `benny` | Benny Blåsfisk | `benny.glb` | ja |
| `tard` | Tård | `tard.glb` | ja |

Benny/Tård: Tripo FBX från `~/Downloads/ch/{benny blåsfisk,tård}.zip`, KayKit-clips **retargetade** från `irstababben.glb` via Blender (pose-matrix bake). Källzips ligger kvar i Downloads.

Nytt content: `packages/content/src/characters/{benny,tard}.ts`. Contract-IDs utökade i `packages/contracts/src/ids.ts`.

---

## Renderer — vad som gäller nu

Filer: `apps/web/src/game/renderer.ts`, `apps/web/src/game/authoredOverlay.ts`.

### Rigg / orientering (oförändrade sanningar)

- Bind: Root `X = -90°`. Idle/walk tittar **−Z**; kamera **+Z**.
- **Gör inte:** P2 `scale.x = -1`, `group.scale.y`-duck, sidovy-yaw `±π/2`, authored crouch-clips som duck, `walk_back`-clips (strafe/vänd).
- Orientering: `AUTHORED_FACE_CAMERA` / `AUTHORED_THREE_QUARTER`. P1 `yaw = -π + 0.55`, P2 `yaw = π - 0.55`.
- Backwalk = samma `walk`-clip, **negativ** `timeScale` (+ `setEffectiveTimeScale` om samma action redan spelas).
- Authored modeller laddas om URL **inte** matchar `RobotExpressive|Soldier|Xbot|Michelle`.

### Arm-uncross + duck overlay

- Körs **efter** `mixer.update`, men **före** det återställs `cleanPose` (senaste rena mixer-posen).
- Efter mixern: `captureCleanPose` → sedan overlay **exakt en gång**.
- Detta stoppar ackumulering vid hit-stop (`dt = 0`) där Three.js PropertyMixer kan hoppa över oförändrade kanaler.
- Idle: modest uncross. Walk/backwalk/dash: starkare + R-skev + lite `rotateY`.
- Duck: idle-klipp + procedur-knäböj (facing-aware motsatta thigh `rotateX` + abduct Z). Plant via `hip.position.z` (Root-rum = höjd). Aldrig mesh-squash.
- Regression: `apps/web/src/game/authoredOverlay.test.ts`.

### Rig-diag (träning)

Dropdown **Rig-diag** i training HUD, eller `?rigDiag=C`:

| Läge | Betydelse |
|------|-----------|
| Av / D | Normal: mixer + overlay |
| A | Bind/rest — ingen mixer/overlay |
| B | Ledprobe (böj arm) på bind |
| C | **Bara mixer** — jämför mot D |
| D | Mixer + overlay |

**Nästa visuella steg:** Irstababben, jämför **C vs D** på idle/walk/duck/jab. Om C är OK men D förstör → justera overlay. Om C redan är fel → klipp/retarget (inte mer godtyckliga armvinklar).

---

## Character select

- `CharacterSelect.tsx`: grid **5×2**, större porträttytor, högre P1/P2-banners.
- `FighterPortrait.tsx`: bättre fallback (gradient + initial) när `portraitUrl` saknas.

---

## Vad som återstår (ungefärlig ordning)

1. **Visuell C vs D-verifiering** (Irstababben) efter pose-isolation — bekräfta att armar inte längre “driver” under hit-stop; justera overlay-magnituder vid behov.
2. **Benny/Tård polish** — retarget kan vara skev; porträtt är Blender-renders (bind). Ev. finputs clips eller bättre headshots. Verifiera i träning.
3. **Walk-fot-synk / skating** — `timeScale` från `vx` finns; inte re-verifierat mot varje GLB:s cykellängd (~0.83s Irstababben).
4. **Attack-synk** — `impactAt`/`windupAt` ungefärliga; punch-clips långa (~4s).
5. **Copper Thief-modell** — låst. När OK: ny authored GLB (inte Mixamo Xbot). Moves/hurt finns redan.
6. **Partiklar** — hit-sparks finns; låg prio. Inga eldklot-universalspecials.
7. **`docs/STATUS.md`** — uppdatera bara efter verifiering (ljuger fortfarande).
8. **E2E** — inte körda mot den här branchen/HEAD.

---

## Döda spår (upprepa inte)

| Försök | Varför det dog |
|--------|----------------|
| P2 `scale.x = -1`, samma yaw | Korsade armar + duck-overlay förstör P2 |
| `group.scale.y` som duck | Användaren: inte komprimera |
| Yaw `±π/2` (sidovy) | Idle-guard = korsade armar i profil |
| Hip.z-drop + kraftig calf `rotateX` | Karaktären i golvet |
| Authored `crouch`-clip | Sit / fiske / crawl |
| `walk_back`-clips | Inte backwalk |
| Relativ `rotateX` overlay **utan** restore före mixer | Pose-ackumulering vid hit-stop (`e2f07e7` fixade detta) |
| Cloud Agents på denna Cursor-plan | Kräver Pro — använd lokal maskin |

---

## Verifiera

```bash
pnpm --filter @aipuf/sim test && pnpm --filter @aipuf/content test && pnpm --filter @aipuf/web test
```

Dev: `pnpm dev`. Träning: Visa Hitboxar + Rig-diag C/D.  
Tangentbord P1: WASD, U/I jab/fierce, J/K kicks. Klicka canvas om HUD stjäl fokusus.

Checklist träning:

- [ ] Idle 3/4, armar OK (D); jämför C
- [ ] Gång in + backwalk (ansikte mot P2), ingen bröst-korsning som driver
- [ ] Duck = knäböj, fötter i golv, kortare gröna boxar
- [ ] Hit-stop: pose ska **inte** snurra vidare när tiden står still
- [ ] Benny + Tård syns i select och laddar i match
- [ ] Copper Thief fortfarande procedur/Xbot (orörd)

---

## Arkitektur (kort)

- `packages/sim` — enda stridsauktoriteten, 60 Hz, fixed-point.
- `packages/content` — karaktärer/moves.
- `packages/contracts` — IDs / protokoll.
- `apps/web` — React-menyer; Three.js-match **utanför** React-state.
- Ingen stridslogik i React. Ingen root motion som auktoritet.

Repo-regler: `AGENTS.md`, `docs/SPEC.md`, `docs/DECISIONS.md`.
