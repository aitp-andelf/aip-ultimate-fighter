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
  - **Anatomisk 3D-Kämperendering & Kinematik (Three.js)**:
    - Äkta anatomiska proportioner med V-formad bröstkorg, magrutor, axel-deltoider, knäskydd och knutna stridsnävar med tummar.
    - Markfasta stridsstövlar med gummisulor och tåhättor som är matematiskt kalibrerade med sub-millimeterkontakt mot arenagolvet (`y = 0`).
    - 2.5D Street Fighter-stridsställning med 3/4 arkadperspektiv (bröst, emblem och ansiktsprofil vinklade 18-20° mot kameran/spelaren).
    - Autentiska kämpe-tillbehör för alla 8 karaktärer: Capitans marinblå fedora med guldspänne och grappler-axelskydd, Irstababbens kockmössa, förkläde och träpizzaspade, Femboyfippes defibrillator-paddar och EKG-diod, Babas LASIK-lasrar och solglasögon, Stinkfiends gasmask och giftgaskärl, Ekanders kraftlyftarbälte, Goonströms skuggkåpa, och Copper Thiefs kopparlindor och kofot.
    - Realistisk knockdown/K.O.-fysik där utslagna kämpar faller baklänges och landar utsträckta på rygg på mattan.
    - Vändning mot spelaren/kameran vid seger med höjd vinnarnäve.
  - **HUD-layout**: Rättad layout där "Avsluta Match" placerats i nedre högra hörnet för att garantera noll överlappning mot Spelare 2:s namn och porträtt.
  - **Turnégolv & Belysning**: Högupplöst reflekterande arenagolv med Aros IT-Partner-emblem, rutmönster, neongränser för arenaväggarna och dynamisk spotlight.
  - **Signatur-VFX & Projektiler**: Karaktärsspecifika projektiler och effekter (Irstababbens Hawaii-eldboll, Babas kirurgiska LASIK-laserstråle, Femboyfippes cyan-elektriska nät, Stinkfiends gröna giftmoln, Goonströms mörka magenta-void, Ekanders rullande klot, Bulgarian Copper Thiefs kopparblixtar och Capitans blå markchockvågor).
  - **Character Lab**: 3D-modellinspektion i realtid med animationsbläddrare och dra-och-släpp `.glb`-uppladdning direkt i webbläsaren.
  - **Ljud**: Syntetiserad röstannouncer ("FIGHT!", "K.O.!"), slag- och blockeffekter, BGM.
- `tools/assets`: Character Lab CLI-importör (`pnpm import-character`). 2/2 enhetstester passerar. Byggd och typcheckad.
- `tests/e2e`: 6/6 Playwright-tester passerar i systemets Google Chrome:
  1. Full gameplay verification: val av kämpar, nedräkning, förflyttning, slag/sparkar, skador/hälsoavdrag, super meters, superangrepp och K.O.-seger.
  2. Träningsläge med dojo-kontroller och 3D-hitboxvisualiserare.
  3. Lokal 2-spelarmatch med kämpeval och HUD.
  4. Träningsläge dummy-kontroller.
  5. Online 1v1 multiplayer via Colyseus-server med åskådare.
  6. SharePoint-läge med ?sharepoint=1 inbäddning.

## Verifiering

- `pnpm build`: Bygger alla 6 paket utan fel.
- `pnpm test`: 19/19 enhets- och integrationstester passerar.
- `pnpm test:e2e`: 6/6 webbläsartester passerar i Google Chrome.
- **Skärmdumpar fångade som bevis**:
  - `gameplay_01_character_select.png`: Galleri med alla 8 unika kämpar, stats och signaturdrag.
  - `gameplay_02_round_start.png`: Matchstart med 3D-arenagolv, "STRID!"-announcer och fullstora kämpar i profil.
  - `gameplay_03_combat_action.png`: Aktiv strid, träffar, slag/spark-animering och minskande livmätare.
  - `gameplay_04_super_move.png`: Super meter-laddning och super move payoff.
  - `gameplay_05_knockout.png`: Knockout, motståndare utslagen, segerannouncer "SPELARE 1 VINNER!".
  - `gameplay_06_dojo_hitboxes.png`: Dojoläge med 3D-hitboxar och hurtboxar i exakt kämpeproportion.

## Nästa planerade steg (Scope & Polish)

1. **Fler kämpe-specifika 3D-tillgångar**: Ladda in eller generera ytterligare specialmodeller för de unika kämparna via Character Lab.
2. **Motion inputs**: Utöka sim-bufferten med klassiska rörelsekommandon (kvartscirkel 236, drakstöt 623).
3. **Flera arena-miljöer**: Fler unika AIP-scener med dynamiska bakgrundsanimeringar och interaktiva element.

