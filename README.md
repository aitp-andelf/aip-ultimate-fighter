# AIP Ultimate Fighter

2.5D kontorsfightingspel för Aros IT-Partner. Byggt med TypeScript, Three.js, React 19, Colyseus och en deterministisk 60 Hz headless stridsmotor.

## Snabbstart

```bash
# Installera beroenden
pnpm install

# Bygg alla paket
pnpm build

# Kör lokala servrar (webb + server)
pnpm dev
```

Spelet nås via webbläsaren på `http://localhost:5173`.
Colyseus WebSocket-servern körs på `ws://localhost:2567`.

## Spellägen

1. **Lokal 2-Spelare:** Två spelare på samma tangentbord eller med USB-handkontroller.
2. **Spela mot datorn (AI):** Enspelarläge med deterministisk CPU-motståndare.
3. **Online 1v1 (Server):** Auktoritativ Colyseus-server med platsval (P1/P2), FIFO-spelarkö och åskådarläge.
4. **Träningsläge:** Träningsdocka (stå, ducka, blockera, AI), hitbox-visualisering, oändligt liv/super och positionsåterställning.
5. **Character Lab:** 3D-inspektion av alla åtta karaktärer, animationer och framedata.
6. **SharePoint-läge:** Bädda in spelet med `?sharepoint=1` för anpassat gränssnitt och iframe-postMessage integration.

## Karaktärer & Arketyper

Version 1 innehåller åtta fullt spelbara profiler fördelade över fyra arketyper:

| ID | Arketyp | Visningsnamn | Beskrivning |
| --- | --- | --- | --- |
| `zoner-a` | Zoner A | **Patchare** | Lång räckvidd, kabelprojektiler och zoning. |
| `zoner-b` | Zoner B | **Switch** | Rumsavgränsning, paketstorm och brandväggsfällor. |
| `shoto-a` | Shoto A | **Helpdesk** | Balanserad verktygslåda med ticket-fireball och eskalering (anti-air). |
| `shoto-b` | Shoto B | **Sprint** | Snabb rusningsfighter med aggressiva tacklingar och tidsfrister. |
| `grappler-a` | Grappler A | **Kabel** | Tung infrastrukturtekniker med oblockerbara kommandokast och pansar. |
| `grappler-b` | Grappler B | **Rack** | Massiv tank med högsta kastskadan och serverplåtar. |
| `hybrid-a` | Hybrid A | **Mesh** | Luftburen arkitekt med nätverksdyk och svårlästa vinklar. |
| `hybrid-b` | Hybrid B | **Cloud** | Svävande molnfighter med vertikala blixtnedslag och glidattacker. |

## Styrning (Standard)

### Spelare 1 (Tangentbord / Kontroll)
- **W / A / S / D:** Hoppa / Gå bakåt / Ducka / Gå framåt
- **U:** Låg box (LP)
- **I:** Hög box (HP)
- **J:** Låg spark (LK)
- **K:** Hög spark (HK)
- **O:** Special (Special 1 / Special 2 med S)
- **L:** Super (kräver 1000 meter)
- **Mellanslag:** Kast (Throw)

### Spelare 2 (Tangentbord)
- **Piltangenter:** Hoppa / Gå / Ducka
- **Num 4 / 5:** Låg / Hög box
- **Num 1 / 2:** Låg / Hög spark
- **Num 6:** Special
- **Num 3:** Super
- **Num 0:** Kast

Kontroller och volymer kan anpassas via **Inställningar** i spelet.

## Tester

```bash
# Enhetstester (sim, content, contracts)
pnpm test:unit

# Integrationsservertest (Colyseus endpoints)
pnpm test:integration

# Deterministiska bottester (1500 ticks headless strid)
pnpm test:bots

# Samtliga enhets- och integrationstester
pnpm test

# E2E-tester (Playwright med 3 webbläsarkontexter i systemets Chrome)
pnpm test:e2e
```

*Obs: Kör inte `playwright install`. Testerna använder systemets Chrome via `channel: "chrome"`.*

## Importera karaktärer (Character Lab)

```bash
pnpm import-character fixtures/sample_character.json
```

## Arkitektur

- `packages/sim`: Enda stridsauktoriteten. Headless, 60 Hz fixed-point (1 unit = 1000 subunits), deterministisk.
- `packages/contracts`: Protokoll, Zod-scheman, typer och delade ID:n.
- `packages/content`: Karaktärer, movesets, frames och banor.
- `apps/server`: Colyseus-rum, kö/slots, auktoritativ inputbuffring och snapshots.
- `apps/web`: React 19-menyer och Three.js 2.5D-rendering utanför React-state.
- `tools/assets`: Paketvalidering och import för Character Lab.
- `tests/e2e`: Playwright E2E-tester med separata browser contexts.
