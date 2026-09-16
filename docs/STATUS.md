# AIP Ultimate Fighter — Aktuellt läge

Datum: 2026-09-16
Status: Aktiv utveckling. Riggade 3D-modeller, 4 arenabakgrunder och stridseffekter är implementerade och testade mot E2E och enhetstester.

## Aktuellt läge per modul

- `packages/contracts`: Protokoll, Zod-scheman, ID:n och delade meddelandetyper. 3/3 enhetstester passerar. Byggd och typcheckad.
- `packages/content`: 8 definierade karaktärer och 4 banor med movesets och framedata. 4/4 enhetstester passerar. Byggd och typcheckad.
- `packages/sim`: 60 Hz fixed-point motor (1000 subunits/unit), deterministisk simuleringsauktoritet, inputbuffert, pushboxar, riktningsblockering, kast/throw tech, projektiler/zoner, hitstop, hitstun, supermätare. 10/10 enhets- och bottester passerar. Byggd och typcheckad.
- `apps/server`: Colyseus 0.16.5 med WebSocket. MatchRoom med 2 aktiva slots, FIFO-kö, åskådare och 60 Hz tick-loop. 2/2 integrationstester passerar. Byggd och typcheckad.
- `apps/web`: React 19 och Three.js 2.5D-matchrendering. Riggade 3D GLTF-modeller (`RobotExpressive.glb`, `Xbot.glb`, `Soldier.glb`, `Michelle.glb`) med `AnimationMixer` synkade mot simuleringslägen. 4 genererade arenabakgrunder med reflekterande golv, dynamiskt arenagolvljus och svävande partiklar. Tvådelade livmätare med eftersläpande röd skademätare, karaktärsporträtt, skärmskak, hit-stop och gnistpartiklar. Web Audio SFX och BGM. Byggd felfritt med Vite 7.
- `tools/assets`: Character Lab CLI-importör (`pnpm import-character`). 2/2 enhetstester passerar. Byggd och typcheckad.
- `tests/e2e`: 4/4 Playwright-tester passerar i systemets Google Chrome (Lokal match, Träningsläge, Online multiplayer 1v1 med åskådare, SharePoint-läge).

## Verifiering

- `pnpm build`: Bygger alla paket utan fel.
- `pnpm typecheck`: Typcheckar alla paket utan fel.
- `pnpm test`: 19/19 enhets- och integrationstester passerar.
- `pnpm test:e2e`: 4/4 webbläsartester passerar i Google Chrome.

## Identifierade områden för vidare fördjupning (Scope & Polish)

1. **Röstutrop (Announcer)**: Införa syntetiserat eller talsyntes-announcer ("Round 1... Fight!", "K.O.!", "Counter Hit!") för äkta arkadkänsla.
2. **Webb-baserad 3D-modelluppladdning i Character Lab**: Möjliggöra att dra och släppa egna `.glb`-filer direkt i webbläsaren för inspektion och applicering på kämpar.
3. **Fler attackspecifika animationer**: Ytterligare differentiering mellan lätta/tunga slag, sparkar, svep och kast.
4. **Motion Inputs i bufferten**: Stöd för klassiska fighting game inputs (kvartscirkel framåt 236, DP 623).
