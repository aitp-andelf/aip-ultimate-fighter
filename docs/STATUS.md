# AIP Ultimate Fighter — Aktuellt läge

Datum: 2026-09-16
Status: Aktiv utveckling. Kanoniskt karaktärsgalleri (8 kämpar) med fullständiga unika movesets enligt designmatris, arkadbetonad karaktärsväljare med stat-bars (Power, Speed, Range), differentierade attackposer för Kick A/B och Punch A/B samt unika signatur- och super-VFX implementerade och verifierade.

## Aktuellt läge per modul

- `packages/contracts`: Protokoll, Zod-scheman, ID:n, delade meddelandetyper och utökad `CharacterDef` med tagline, power, speed, range, signature, superName, playstyle och voiceBarks. 3/3 enhetstester passerar. Byggd och typcheckad.
- `packages/content`: 8 kanoniska kämpar fullt konfigurerade med unika namngivna attacker enligt designmatrisen:
  1. **Capitan** (Grappler): Kick A (Husky Boot), Kick B (Blue Thunder Stomp), Punch A (Big Blue Jab), Punch B (Captain's Hammer), Special (Fedora Command Grab), Super (HULK MODE: CAPITAN).
  2. **Irstababben** (Shoto): Kick A (Pizzeria Low Kick), Kick B (Oven Door Kick), Punch A (Owner's Jab), Punch B (Pizza Spade Smash), Special (Hawaii Blast), Super (Irsta Speciale).
  3. **Femboyfippe** (Zoner): Kick A (Soft Step), Kick B (Voltage Heel), Punch A (Precision Tap), Punch B (Defibrillator Palm), Special (Cardiac Grid), Super (OVERDRIVE).
  4. **Babas** (Grappler): Kick A (Street Sweep), Kick B (Post-Op Roundhouse), Punch A (Dealer Jab), Punch B (Bald Headbutt), Special (LASIK Laser), Super (Perfect Vision).
  5. **Stinkfiend** (Zoner): Kick A (Sneaky Shin Kick), Kick B (Stink Stomp), Punch A (Dirty Jab), Punch B (Sweaty Haymaker), Special (Silent But Deadly), Super (BIOHAZARD).
  6. **Ekander** (Hybrid Zoner/Grappler): Kick A (Fat Foot), Kick B (Belly Bounce Kick), Punch A (Meat Jab), Punch B (Heavy Slap), Special (Ekander Roll), Super (TERMINAL VELOCITY).
  7. **Goonström** (Shoto): Kick A (Degenerate Low), Kick B (Focused Axe Kick), Punch A (One-Hand Jab), Punch B (Goon Backhand), Special (Goon Blast), Super (MAXIMUM GOON).
  8. **Bulgarian Copper Thief** (Hybrid Zoner/Shoto): Kick A (Copper Shin), Kick B (Crowbar Kick), Punch A (Grab-and-Go Jab), Punch B (Cable Whip), Special (Unauthorized Entry), Super (THE GRID IS MINE).
  4/4 enhetstester passerar.
- `packages/sim`: 60 Hz fixed-point motor (1000 subunits/unit), deterministisk simuleringsauktoritet, inputbuffert, pushboxar, riktningsblockering, kast/throw tech, projektiler/zoner, hitstop, hitstun, supermätare. 10/10 enhets- och bottester passerar. Byggd och typcheckad.
- `apps/server`: Colyseus 0.16.5 med WebSocket. MatchRoom med 2 aktiva slots, FIFO-kö, åskådare och 60 Hz tick-loop. 2/2 integrationstester passerar. Byggd och typcheckad.
- `apps/web`:
  - **Arkadstyling**: Russo One och Teko typsnitt, polygon-klippta knappar, neonglöd, metalliska färgtoner.
  - **Karaktärsväljare**: Detaljerade kämpekort med Power, Speed, Range visual bars (1-10), signaturanfall, superpayoffs, taglines och arkad-röstbarks.
  - **Matchrendering (Three.js)**: Differentierade attackposer för Kick A (snabb poke), Kick B (hög axe/roundhouse), Punch A (snabb jab), Punch B (tung hammer/smash), kommandokast och super.
  - **Signatur-VFX & Projektiler**: Karaktärsspecifika projektiler och effekter (Irstababbens Hawaii-eldboll, Babas kirurgiska LASIK-laserstråle, Femboyfippes cyan-elektriska nät, Stinkfiends gröna giftmoln, Goonströms mörka magenta-void, Ekanders rullande klot, Bulgarian Copper Thiefs kopparblixtar och Capitans blå markchockvågor).
  - **Character Lab**: 3D-modellinspektion i realtid med animationsbläddrare och dra-och-släpp `.glb`-uppladdning direkt i webbläsaren.
  - **Ljud**: Syntetiserad röstannouncer ("FIGHT!", "K.O.!"), slag- och blockeffekter, BGM.
- `tools/assets`: Character Lab CLI-importör (`pnpm import-character`). 2/2 enhetstester passerar. Byggd och typcheckad.
- `tests/e2e`: 4/4 Playwright-tester passerar i systemets Google Chrome (Lokal match, Träningsläge, Online multiplayer 1v1 med åskådare, SharePoint-läge).

## Verifiering

- `pnpm build`: Bygger alla paket utan fel.
- `pnpm test`: 19/19 enhets- och integrationstester passerar.
- `pnpm test:e2e`: 4/4 webbläsartester passerar i Google Chrome.

## Nästa planerade steg (Scope & Polish)

1. **Fler kämpe-specifika 3D-tillgångar**: Ladda in eller generera ytterligare specialmodeller för de unika kämparna via Character Lab.
2. **Motion inputs**: Utöka sim-bufferten med klassiska rörelsekommandon (kvartscirkel 236, drakstöt 623).
3. **Flera arena-miljöer**: Fler unika AIP-scener med dynamiska bakgrundsanimeringar och interaktiva element.

