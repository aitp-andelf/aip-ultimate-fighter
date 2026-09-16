# Tekniska beslut

Beslut tas här när SPEC lämnar luckor. Ändra inte versionslås utan regressionstest.

## Stack (låst för v1)

| Del | Val | Motivering |
| --- | --- | --- |
| Node | 22 LTS (körning 22.23.2) | Aktuell LTS, uppfyller Vite 7+ |
| Pakethanterare | pnpm 10 workspace + lockfil | SPEC |
| TypeScript | 5.9.x, `strict` | Kompatibel med Colyseus schema-codegen-krav |
| Webb | Vite 7 + React 19 | Vite 8 (Rolldown) är för ny för v1-lås |
| Rendering | three 0.180.x, **inte** R3F | SPEC: animation/strid drivs inte av React |
| Nät | Colyseus 0.16.5 + colyseus.js 0.16 | Stabil Room-API; 0.18 schema() undviks medvetet |
| Validering | zod 3.24 | Moget, Node/browser |
| Enhetstest | vitest 3 | SPEC |
| E2E | Playwright, `channel: "chrome"` | Undviker extra webbläsarnedladdning (disk ~4.6 GB ledigt) |
| Transport | WebSocket via @colyseus/ws-transport | SPEC; inte UDP |

## Simulering

- **Tick:** exakt 60 Hz. Render-delta får inte styra mekanik.
- **Fixed-point:** 1 world unit = 1000 subunits. Alla positioner/hastigheter är `int32`.
- **Avrundning:** heltalsdivision mot noll för hastighetsdämpning; clamp efter addition.
- **Slump:** xorshift32, seedad, state serialiseras.
- **Hash:** FNV-1a 32-bit över kanonisk snapshot (stabil fältordning).
- **Framekonvention:** startup `[0, s)`, active `[s, s+a)`, recovery därefter. Total = s+a+r.
- **Inputbuffert:** 5 ticks. Edge (ny tryckning) vs hold. Key-repeat ignoreras.
- **Input-lead:** 2–8 ticks, väljs från max(RTT) vid rondstart, låses under ronden. Default 3.
- **Sena inputs:** loggas, appliceras **inte** bakåt på servern i v1. Saknad input = föregående hold utan nya kanter.
- **Kast vs slag samma tick:** slag vinner mot kast. Dubbelkast → throw tech (båda recovery).
- **Facing-deadzone:** `|x1-x2| < 80` (0.08 unit) ändrar inte facing.
- **Meter:** 0–1000. Super kostar 1000. Ingen meter på whiff. Chip kan inte KO.
- **Liv:** 1000. Ronder: 99s, först till 2, max 5 spelade ronder.
- **Supermätare vid rond:** nollställs till 0 vid varje ny rond (dokumenterad regel).

## Nät

Colyseus äger rum, slots, kö och transport. `sim` äger striden. Inget Schema-fält är stridsauktoritet — snapshots skickas som validerade binära/JSON-payloads.

## Karaktärer v1

Platshållarnamn, inte medarbetare:

| ID | Arketyp | Visningsnamn |
| --- | --- | --- |
| `zoner-a` | Zoner A | Patchare |
| `zoner-b` | Zoner B | Switch |
| `shoto-a` | Shoto A | Helpdesk |
| `shoto-b` | Shoto B | Sprint |
| `grappler-a` | Grappler A | Kabel |
| `grappler-b` | Grappler B | Rack |
| `hybrid-a` | Hybrid A | Mesh |
| `hybrid-b` | Hybrid B | Cloud |

Modeller i v1 är procedurgenererade humanoider. Character Lab importerar GLB-paket utan motorändring.

## Branding

Aros IT-Partner (aldrig bara "Aros" i UI). Svenska texter. Gästläge för lokal dev. Entra-adapter är gränssnitt, inte låtsas-SSO.
