# AIP Ultimate Fighter — Aktuellt läge

Datum: 2026-09-16
Status: Version 1 färdigställd och fullständigt verifierad.

## Modulstatus

- `packages/contracts`: Färdig och verifierad. Protokoll, Zod-scheman, ID:n och delade meddelandetyper. 3/3 enhetstester passerar. Byggd och typcheckad.
- `packages/content`: Färdig och verifierad. Samtliga 8 karaktärsprofiler implementerade (Patchare, Switch, Helpdesk, Sprint, Kabel, Rack, Mesh, Cloud) med 4 banor (Serverhallen, Fikarummet, Kontorslandskapet, Konferensrummet). 4/4 enhetstester passerar. Byggd och typcheckad.
- `packages/sim`: Färdig och verifierad. Enda stridsauktoriteten. 60 Hz fixed-point (1000 subunits/unit), deterministisk motor, FNV-1a 32-bit state-hash, inputbuffert, pushbox-krock/väggar, riktningsblockering (hög/låg/overhead), kast/throw tech, projektiler/zoner, hitstop, hitstun, blockstun, wakeup-odödlighet, supermätare (nollställs vid ny rond), chip damage som ej kan KO:a, och bot-AI controller. 10/10 enhets- och bottester passerar. Byggd och typcheckad.
- `apps/server`: Färdig och verifierad. Colyseus 0.16.5 med WebSocket-transport. MatchRoom hanterar 2 aktiva slots (P1/P2), FIFO-kö, åskådare, återanslutningsgrace, auktoritativa inputs och snapshots via 60 Hz tick-loop. Endpoints `/health` och `/api/info` aktiva. 2/2 integrationstester passerar. Byggd och typcheckad.
- `apps/web`: Färdig och verifierad. React 19 menyer och Three.js 2.5D-matchrendering utanför React-state. Procedurgenererade 3D-karaktärsmodeller med poser för alla stridstillstånd, 2D-parallaxbakgrunder, självförsörjande Web Audio-syntes för SFX och BGM, HUD (liv, super, combo, rond, timer), menyer för Lokal 2-Spelare, Dator (AI), Online 1v1, Träningsläge, Character Lab, Inställningar och SharePoint-läge (?sharepoint=1). Byggd felfritt med Vite 7.
- `tools/assets`: Färdig och verifierad. Character Lab paketvalidering och importverktyg via CLI (`pnpm import-character`). 2/2 enhetstester passerar. Byggd och typcheckad.
- `tests/e2e`: Färdig och verifierad. Playwright-tester körda i systemets Chrome (`channel: "chrome"`) med tre browser contexts (P1, P2 och Spectator). 4/4 tester passerar (lokal match, träningsläge, online multiplayer 1v1 + åskådare, SharePoint-embed).

## Verifiering

- `pnpm build`: Grönt (alla 8 paket byggda).
- `pnpm typecheck`: Grönt (alla 7 TypeScript-paket utan fel).
- `pnpm test:unit`: 17 tester gröna.
- `pnpm test:integration`: 2 tester gröna.
- `pnpm test:bots`: 2 långkörande bot-matcher (1500 ticks) gröna och deterministiska.
- `pnpm test:e2e`: 4 webbläsartester gröna.
- `pnpm import-character fixtures/sample_character.json`: Validerar och importerar korrekt.

## Blockeringar

Inga. Samtliga delmål och DoD-krav för Version 1 är uppfyllda.
