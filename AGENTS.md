# AIP Ultimate Fighter — arbetsregler

Detta repo är **isolerat**. Rör inte andra projekt, hemligheter, betalda tjänster eller medarbetarbilder.

## Sanning

- `docs/SPEC.md` är uppdragsbeskrivningen.
- `docs/STATUS.md` är aktuellt läge (aldrig löften).
- `docs/DECISIONS.md` är låsta tekniska val.
- Dokumentation ersätter inte kod. Bocka inte av utan verifiering.

## Arkitektur (kort)

- `packages/sim` — enda stridsauktoriteten. Headless, 60 Hz, fixed-point, deterministisk.
- `packages/contracts` — protokoll, Zod-scheman, ID:n.
- `packages/content` — karaktärer, movesets, stages. Inte motor.
- `apps/server` — Colyseus-rum, slots, kö, auktoritativa inputs/snapshots.
- `apps/web` — menyer i React, matchrendering i Three.js utanför React-state.
- `tools/assets` — Character Lab-import och paketvalidering.
- `tests/e2e` — Playwright med tre browser contexts.

Ingen stridslogik i React. Ingen root motion som auktoritet. Ingen andra kopia av motorn.

## Kommandon

Se README.md. Kör inte `playwright install` — använd systemets Chrome (`channel: "chrome"`).

## Fasdisciplin

Kritiskt grundfel stoppar nästa fas. Parallellisera inte omskrivning av sim-kontraktet.
