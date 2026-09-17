# AIP Ultimate Fighter — Master Implementation Plan

**Version:** 1.0.0 — consolidated draft  
**Prepared:** 17 September 2026  
**Purpose:** one implementation plan combining combat truth, animation repair, character moves, SFX, VFX, network presentation, and acceptance gates.  
**Status:** specification and explicit integration proposals; not implemented, not gameplay-approved, and not a new repository audit.  
**Project:** AIP Ultimate Fighter, the browser-based TypeScript 2.5D fighting game. This is not MAD HOUSE VN.

> Build one trustworthy combat pipeline, prove it with an existing shoto attack and Stinkfiend’s two ballistic throws, then expand the documented roster without weakening the same tests. Input, simulation, collision, animation, VFX, sound, and online presentation must describe the same attack at the same time.

### Navigation

| Section | Subject |
|---|---|
| 0–1 | Authority, source status, conflicts, and explicit consolidation decisions |
| 2–4 | Product/input contract, reported repository map, and reference strategy |
| 5–8 | Clocks, timing, input recognition, collision/data, and animation repair |
| 9–10 | Eight-character move bible and Stinkfiend’s first distinct-mechanics slice |
| 11 | Links, cancels, chains, juggles, throws, damage, meter, routes, and independent oracle |
| 12–15 | Event/network presentation, VFX, sound, and source/licence workflow |
| 16–17 | Combat lab, evidence, acceptance matrix, and mutation tests |
| 18–19 | One delivery sequence, agent continuity, and implementation handover |
| 20 | Source registry, completeness map, and limits of this deliverable |

## 0. Mandate, authority, and source boundaries

### 0.1 Source basis and evidence boundary

This document consolidates exactly two supplied files:

| ID | Supplied source | What it contributes | Evidence limitation |
|---|---|---|---|
| **C** | `COMBAT_TRUTH.md`, version 1.0.0 | Combat rules, precise timing, input arbitration, collision/animation QA, combos, independent tests, continuity | C reports that its repository metadata request returned HTTP 404. It did not inspect the repository. |
| **M** | `AIP_Ultimate_Fighter_Moves_SFX_VFX_Plan.md` | Reported source inventory, eight-character move bible, Stinkfiend slice, event/network design, asset and SFX/VFX workflow | M reports source inspection at commit `84128358ff290848e6d25fa0678530843f4c32e4`, but no build, gameplay session, benchmark, or complete sound audition. |

Both sources are dated 17 September 2026. Their order of preparation is not established. The 404 in C does not establish that M’s pinned inspection is false; M’s inspection does not establish the current repository state or runtime correctness. Gate G0 must inspect the actual checkout and reproduce relevant findings.

Source references such as **C §8** and **M §6** refer to the original section numbers in the supplied files. **[S01]–[S14]** retain C’s external-source registry. They are inherited references, not a claim of fresh verification in this consolidation. Resource descriptions and licence reports in Section 15 are similarly attributed to M; verify the exact items and terms before importing them.

Integration decisions introduced here are labelled **D01–D15**. Additional integration checks are labelled **T16–T23**. They are proposals of this merged plan, not statements that either original source already specified them or that the user has approved new gameplay mechanics.

### 0.2 Authority and change control

The goal is not to make animations look plausible in isolation. It is to make player input, authoritative movement, animation, collision, damage, reactions, and combos agree in the actual match.

The implementation agent must work from this document, versioned move data, and executable tests—not recollection of a conversation. No document guarantees that an agent cannot make mistakes. This specification makes important mistakes observable and prevents unverified work from being silently promoted.

1. The user's explicit requirements govern the product.
2. This versioned specification governs implementation and proposed v0 defaults.
3. Validated, approved move data governs runtime behaviour.
4. Independent test fixtures govern acceptance, not runtime behaviour.
5. Reference-game data supplies evidence and starting points, not automatic balance approval.
6. Existing code, animation duration, generated screenshots, and model opinions are not independent authorities.

A conflict is a defect to report. Do not resolve it by silently changing the document, expected results, timing, damage, reach, or screenshots. A deliberate design change must identify the old value, new value, reason, affected routes, and verification. User-requested changes can supersede this document; preserve the amendment and increment the version.

Use the proposed defaults in this document to keep work moving, but label them **AIP design decisions**, not Street Fighter facts. Missing reference evidence must remain unknown. Continue other unblocked gates; never invent source verification.



For this consolidation, apply the following separation:

- **Shared requirements** remain requirements, including the 2.5D plane, command families, non-generic identities, and simulation-owned outcomes.
- **Core baseline:** retain C’s detailed proposed v0 mechanics unless a named integration decision explicitly says otherwise. These remain proposed AIP rules, not independently measured reference-game facts.
- **Roster/content targets:** retain M’s complete named move concepts, materials, palettes, sounds, and reported file mapping. Concepts do not become executable move data without the missing contracts and tests.
- **Conflicting or advanced mechanics:** retain their design intent, but isolate them behind explicit decisions and feature acceptance. Do not silently implement the easier interpretation.

After adoption, this master is the implementation entry point. Keep both original documents as immutable provenance, not parallel editable rulebooks. Amend this master and versioned move data through a recorded decision. Existing `AGENTS.md` instructions must be merged, not overwritten.

### 0.3 Scope and hard exclusions

Repair and extend the existing TypeScript/Three.js/Colyseus structure reported by M; verify it in G0. Do not replace the engine, migrate networking, redesign the UI, introduce a new framework/monorepo, generate a new roster, or add unrelated mechanics. Prove the existing procedural and imported-animation paths before selecting an asset workflow.

Do not implement a second combat engine in the lab. Do not use animation-end events, wall-clock timeouts, live blended bones, or cosmetic particles to apply hits, finish recovery, or unlock control. Do not hide defects with oversized hitboxes, long crossfades, time-scaling the game, visual effects, or auto-refreshed golden images.

The full content target is the **eight fighters documented in M**, not an assertion that every character from other conversations is covered. Additional characters, lore changes, and new assets require a separate scoped amendment. Preserve current user assets and uncommitted work.

### 0.4 Completion has multiple levels

**Core proof**, **mechanically valid move**, **visually reviewed move**, **playtested fighter**, **online presentation pass**, and **approved release** are different statuses. A successful build or a convincing contact sheet is none of the latter by itself. A draft conflict marked “pending” cannot be reported as a completed feature.

---

## 1. Explicit consolidation decisions and unresolved contracts

The following register makes reconciliation visible. “Proposed baseline” means the chosen implementation proposal in this master, not retroactive user approval. “Content gate” means preserve the concept but do not publish a production move until its material conflict is resolved and documented. G1 records which proposals are adopted; G0 and other independent diagnostics need not wait.

| ID | Difference between sources | Consolidated treatment | Verification / remaining decision |
|---|---|---|---|
| **D01 — Evidence** | C has no repository inspection; M reports a specific inspected commit. | Use M’s paths and observations as **reported historical inventory**. Keep C’s lack of inspection explicit. | G0 compares actual commit, working tree, scripts, dependencies, and runtime behaviour. No claim that this merge audited current code. |
| **D02 — Authority and scope** | C is a constrained core-repair specification; M targets a richer full roster. | **Proposed baseline:** C governs common combat semantics; M supplies roster/presentation targets. Advanced features need explicit extensions, not a generic loophole. | A feature cannot weaken guard, timing, combo, determinism, or geometry tests to fit its theme. |
| **D03 — Button terminology** | M uses “light/heavy variant”; C explicitly preserves the user’s low/high punch/kick names. | Preserve `LP`, `HP`, `LK`, `HK` and low/high wording. Refer to variants by their actual button IDs. Damage/strength and `MID`/`LOW`/`OVERHEAD` are separate properties. | Input labels, move data, training instructions, and guard tests must agree. Legacy light/heavy audio labels describe impact intensity only. |
| **D04 — Input lifetime** | M reports an existing five-tick edge buffer; C proposes four live battle ticks for a recognized action request. These may be different queues. | Do **not** globally replace every 5 with 4. Inventory the old buffer’s clock and purpose. Proposed action requests live on `createdBattleTick … +3`; raw motion history has its own sample clock. | Test first/last valid action requests, expiry, ordinary-normal latency, and hitstop. Record any actual old/new buffer change. |
| **D05 — Facing changes** | M clears unfinished motions on a facing switch; C retains history and resolves it relative to facing at the attack-button edge. | **Proposed baseline:** use C’s explicit policy. M’s clearing policy is retained here as the rejected alternative for this draft, not silently removed. | Cross-up traces, both sides, coincident positions, committed attack-facing, and guard-side evaluation need independent fixtures. Record adoption in G1. |
| **D06 — First slice** | C starts with an existing shoto, preferably Goonström; M starts with Stinkfiend’s two throws. | **Proposed sequencing:** shared timing/input proof → one actual shoto attack → Stinkfiend’s two throws as the first distinct-projectile/presentation slice. No full-roster batch. | G4 proves the real attack; G5 proves both ballistic variants; G6–G8 finish and freeze one full pilot. Prefer available Goonström; log an existing-shoto fallback, rather than creating an asset. |
| **D07 — Signatures** | C specifies grounded held/released signatures with charge cleared on interruption; M includes instant command grabs, placed hazards, and Deep Focus stored enhancement. | **Content gate:** keep the C hold/release controller for the core and a labelled lab action. Preserve every M signature concept, but do not silently turn all signatures into charge attacks or silently drop the hold requirement. | Before production, declare trigger mode, release/rearm, interruption, storage, resource costs, and cancel permissions per signature. Non-hold modes need an explicit amendment. Goonström’s stored post-completion enhancement is not the same state as unfinished charge. |
| **D08 — Grabs and armor** | C’s v0 normal throw rejects airborne/stunned targets and defers command grabs; M includes command grabs, Capitan’s air catch and one-strike armor. | **Content gate:** preserve normal throws unchanged. Command grabs, air catches, and armor are separate explicitly tested move families. A DP input grants no invulnerability. | Specify target states, techability, protection interactions, capture anchors, damage timing, armor windows/count/damage, and strike/throw priority. Never implement the air catch as an ordinary throw that bypasses eligibility. |
| **D09 — Movement, hazards, resources** | C begins with simple actor movement and ordinary projectiles; M adds teleports, pass-through, rebound, nodes, reserve and focus. | **Content gate:** use bounded, versioned extensions. Ekander’s one rebound is **his actor movement**, not permission for a victim wall-bounce/juggle reset. No general teleport/intangibility permission. | Test legal arrival, deterministic separation, no double root motion, explicit pulse intervals/caps, resource transitions and reset. See Section 9.2. |
| **D10 — Freeze and event clocks** | C gives global v0 hitstop; M requires visuals to match authoritative motion and uses generic event “tick”. | **Proposed integration:** C’s global freeze controls fighter/projectile motion; retain input sampling and separate cosmetic aftermath time. Name clocks explicitly in traces/events rather than mixing them. | Charge, trajectory, stun and attached pose freeze together; event IDs deduplicate through correction/reset. Cosmetic RNG cannot affect combat. |
| **D11 — Timing hints** | M’s optional Stinkfiend values say “startup N ticks”; C defines conventional startup with first active at `S−1`. | M’s interpretation is under-specified. Preserve 14/22 startup, one spawn, 20/28 recovery as optional hints, not imported runtime truth. Proposed normalization in Section 10 is labelled as such. | Record whether startup is conventional frame numbering or inactive-tick count before authoring. Test spawn, recovery, hitstop and projectile travel separately. |
| **D12 — Counters, resources and supers** | M asks for counter/armor review; C disables counter-hit/punish-counter bonuses and grants no universal special resource rules. | Core counters are diagnostic only. Extra resource costs never imply a super cinematic. Explicit move kind decides super presentation; a confirmed/caught target is required for follow-up cinematics. | Define any later counter bonus separately. Retain C’s initial meter/scaling and test costs once; resource-bearing specials require their own authored values. |
| **D13 — Companion files** | C refers to a larger bundle with `SOURCES.md`, a reference snapshot, an arithmetic checker and fixtures. Only the two Markdown sources were supplied. | Mark the companion files **not supplied**. Retain C’s arithmetic examples as specifications. Do not claim a checker or reference dataset is included or has passed. | Retrieve/recreate the missing artefacts with honest provenance before relying on them. The checksums in this deliverable cover these documents only. |
| **D14 — Asset rights and performance** | M reports checked licence pages, a Three.js version and budget suggestions, but no benchmarks or full audition. | Retain them as dated source reports and candidate budgets, not fresh verification or a measured pass. Public-repository redistribution is a separate asset field. | Recheck exact licence/download receipts and current pinned dependency compatibility before import; benchmark on the target office computer/browser. |
| **D15 — Delivery order** | C has gates 0–9; M has gates 0–4, with different sequencing. | Section 18 is the **only execution sequence** in this master. Original gates are mapped to it, not left as competing checklists. | Update progress against G0–G11; a partial slice never implies its whole fighter or all eight supers are complete. |

### 1.1 Decisions that remain genuinely unspecified

The sources do not provide a complete production move pack: exact per-move timing/damage/reach/cancel windows; signature trigger compatibility; command-grab/air-catch rules; armor damage policy; node pulse timing/replacement; offensive-reserve capacity and regeneration; focus expiry/spending; teleport/pass-through details; complete super capture/whiff rules; and exact single-button super bindings remain incomplete.

For ordinary missing tuning, the implementation agent may draft explicit **AIP-authored candidate** values and test them under the approved baseline. For a conflict that changes a product requirement or core rule, record an amendment and obtain the required approval; do not infer consent from the fact that the plan was consolidated. Continue unblocked work rather than inventing an approval or endlessly redesigning the system.

---

## 2. Product and control contract

*Source basis: C §1; M §3. Terminology and signature differences are exposed in D03 and D07.*

Preserve 2.5D movement: forward, backward, crouch, jump, and dash. Gameplay occupies a horizontal/vertical fighting plane. 3D depth is presentation unless an explicitly approved move says otherwise.

Preserve the four identifiers `LP`, `HP`, `LK`, `HK`. The user calls these low/high punch/kick. Do not silently redefine them as light/heavy. Each move declares its physical target and blocking rule separately; a head-height punch is not automatically an overhead.

Preserve these command intentions:

| Command | Product meaning |
|---|---|
| QCF + LP or HP | Character-specific forward-quarter-circle special |
| DP + LP or HP | Character-specific dragon-punch-motion special |
| QCB + LK or HK | Character-specific backward-quarter-circle special |
| LP + LK | Throw attempt |
| Hold HP + HK | Character-specific signature/charge action |
| Double QCF or double QCB + assigned attack button | Super; choose one family per character |

The motions are command conventions, not a requirement that every character fire a literal Hadoken or perform an identical uppercut. Preserve character identity and body proportions. Start with one already available shoto-style character, preferably Goonström if present, rather than creating a replacement asset.

### Proposed v0 combat language

Use grounded links, explicit target chains, selected normal-to-special cancels, selected special-to-super cancels, and small, budgeted juggles. Do not add universal free-form chains, air dashes, assists, combo breakers, automatic one-button combo playback, or arbitrary special-to-normal cancels.

Begin with normal-hit and normal-block rules. Counter-hit and punish-counter bonuses are disabled until separately defined and tested. A punish can still be identified diagnostically; it does not imply a bonus. Do not import Drive-dependent routes or timing modifiers into a game without those mechanics.

### 2.1 Content count, roster IDs, and proposed super families

M specifies **three special families with two button variants each, one signature, and one super: eight special-action entries per fighter**. Normals, ordinary throws, movement, guard and reactions are additional. Across the eight documented fighters this is a planning target of 64 special-action entries, not 64 delivered or balanced moves.

| Fighter | Preserve legacy ID | Intended archetype from M | Proposed super family from M |
|---|---|---|---|
| Irstababben | `shoto-a` | Shoto | Double QCF + assigned punch button |
| Capitan | `grappler-a` | Grappler | Double QCB + assigned kick button |
| Femboyfippe | `zoner-a` | Zoner / setup | Double QCF + assigned punch button |
| Babas | `grappler-b` | Zoner | Double QCF + assigned punch button |
| Stinkfiend | `zoner-b` | Shoto / Grappler hybrid | Double QCB + assigned kick button |
| Ekander | `hybrid-a` | Zoner / Grappler hybrid | Double QCB + assigned kick button |
| Goonström | `shoto-b` | Shoto | Double QCF + assigned punch button |
| Bulgarian Copper Thief | `hybrid-b` | Zoner / Shoto hybrid | Double QCF + assigned punch button |

Do not infer play style from an old ID prefix: `grappler-b` is Babas and `zoner-b` is Stinkfiend. The super-family allocation is a proposal; `P`/`K` shorthand does not yet settle whether one or both punch/kick buttons activate it. Choose and test the exact binding in versioned content. `HP+HK` must never trigger both signature and super.

---

## 3. Reported repository starting point and integration map

*Source basis: M §§2, 6, 11–12; C §15. These are source-reported paths, not freshly inspected files.*

### 3.1 What M reports at its pinned commit

| Area | Source finding | Plan |
|---|---|---|
| Inputs | Five-tick button-edge buffer; HP+HK currently triggers super; special and down+special select only two specials. | Add ordered motion recognition and separate signature from super. |
| Content | Existing startup/active/recovery, armor, invulnerability, throw, projectile and zone fields. Character bindings expose special1 and special2. | Extend rather than replace the working data model. |
| Projectiles | Position integrates vx/vy with no gravity or floor collision. | Add ballistic trajectories and ground outcomes. |
| Zones | Overlap can apply a hit every update; no implemented per-target pulse interval. | Add explicit rehit rules before damage-dealing gas or node fields. |
| Rendering | Most projectiles use the same sphere/aura/torus structure, tinted by legacy character ID. Poses often use move-name substring guesses. | Explicit visual types, animation IDs and event-driven effects. |
| Audio | Generic oscillator/noise sounds, synth music and browser speech. | Keep Web Audio, add sampled banks and authored character cues. |
| Online | Snapshots every three ticks OR on event ticks. Projectile snapshots lack move/presentation identity. | Extend payloads and hydration together; preserve event-driven broadcasts. |
| Character assets | A GLTF loader exists, but normal fighter setup currently builds procedural fighters. | Do not assume imported animations are active; prove a single rigged-animation path separately. |

Source files are pinned in the reference section. An observation in this table is not a reproduced runtime bug report.

M additionally reports Three.js `0.180.0` and renderer `WORLD_SCALE = 1/200`. Record and verify these in G0. Do not assume that the same versions, scale or active animation path still apply to the actual checkout.

### 3.2 Existing and proposed runtime locations

#### Existing files to extend

```text
packages/contracts/src/content.ts
  Add explicit family/variant bindings, move kind, movement instructions,
  projectile trajectory and rehit policy, plus presentation references.

packages/sim/src/input/buffer.ts
packages/sim/src/core/engine.ts
  Add motion recognition, deterministic command priority and chord consumption.
  Remove HP+HK -> super conflict.

packages/sim/src/combat/attacks.ts
packages/sim/src/combat/projectiles.ts
packages/sim/src/types.ts
  Add attack events, ballistic entities, beams, ground impacts, resource state,
  body movement tracks and per-target hit latches/rehit intervals.

packages/contracts/src/protocol.ts
apps/server/src/rooms/MatchRoom.ts
  Extend snapshots and events consistently with client hydration.
  Preserve broadcasts on event ticks, not only periodic snapshots.

packages/content/src/characters/*.ts
  Define the new variants explicitly, without move-name substring logic.

apps/web/src/game/renderer.ts
  Delegate semantic cue processing to presentation modules.
  Stop using owner ID alone to select a projectile appearance.

apps/web/src/audio/sound.ts
  Preserve AudioContext/buses; add predecoded sample playback and event routing.
```

#### Proposed new modules (adapt names to code organization)

```text
packages/sim/src/input/motions.ts
packages/sim/src/input/motions.test.ts
packages/sim/src/combat/trajectories.ts
packages/sim/src/combat/trajectories.test.ts
packages/sim/src/combat/hazards.test.ts

apps/web/src/game/presentation/registry.ts
apps/web/src/game/presentation/events.ts
apps/web/src/game/vfx/registry.ts
apps/web/src/game/vfx/pools.ts
apps/web/src/audio/banks.ts

apps/web/public/vfx/
apps/web/public/audio/
assets/licenses/
assets/manifest.json
```

### 3.3 Proposed documentation, lab and test locations

Adapt paths to the existing workspace; do not create a parallel `combat/` engine or reorganize working code just to match the following logical map.

```text
AGENTS.md                                  merge a short master-plan entry point
docs/combat/MASTER_PLAN.md                  this adopted, versioned document
docs/combat/DECISIONS.md                    adopted amendments and open content gates
docs/combat/INVENTORY.md                    actual paths, versions, scripts, active assets
docs/combat/PROGRESS.json                   current gate, evidence, hashes, next action
docs/combat/sources/                        preserved source docs and reference evidence
packages/content/...                       move, presentation and input-route data
packages/sim/...                            the one headless authoritative simulation
apps/web/...                               animation adapter, presentation and combat lab
tests/combat/oracle/                        independent boundary fixtures
tests/combat/scenarios/                     positive/negative input replays
tests/combat/property/                      seeded generated tests and shrunk failures
tests/combat/visual/                        reviewed, pinned-environment captures
tools/combat/                              validation, export and exploit search tools
artifacts/combat/<build-hash>/              produced evidence, never source authority
assets/manifest.json                       item-level asset provenance and redistribution
assets/licenses/                           exact licence receipts
```

Keep the existing package manager and test runner. Before edits, preserve uncommitted work, record the base commit, and identify the actual local/online code paths. Before relying on imported animation, prove one rigged clip in the actual match; a GLTF loader existing in the tree is not proof that normal fighter setup uses it.

---

## 4. Reference strategy: borrow a coherent combat package

*Source basis: C §2; inherited external references are listed in Section 20. D13 records the missing companion evidence.*

Use **Street Fighter 6, with a pinned reference snapshot and a Ryu-like grounded subset**, as the initial timing and move-role reference. This is a reference choice, not a claim that copying part of a commercial game's table recreates its balance.

For a first shoto package, collect the relationships among a fast check, a confirm normal, a longer low poke, an anti-air, a projectile, a travelling ender, and a super. Match move roles before mapping controls. A four-button game cannot blindly preserve a six-button move list.

For every selected reference move, collect, where available:

- Startup convention; all active intervals; recovery on hit, block, and whiff.
- Damage; hit/block advantage; stun or knockdown; multi-hit properties.
- Cancel permissions AND exact windows; hit-only versus block versus whiff conditions.
- Movement, reach, pushback, target posture, invulnerability, and resource requirements.
- Scaling, juggle properties, and the circumstances under which a quoted combo works.

Do not treat a dash length, collision box, or cancel window as known merely because startup and damage are known. Do not import a source's word `High` without mapping its blocking semantics to AIP's explicit enum.

### Evidence workflow

**Discover → identify game build → record evidence → normalize → reproduce source relationships → adapt → validate in AIP → approve.**

Use official character/frame pages and the game's own training tools as preferred evidence. Ultimate Frame Data is useful first-hand measurement and capture material: its author says almost all numerical data was collected by them and all hitbox GIFs were created using a hitbox viewer, while some ancillary information references SuperCombo. Treat those ancillary fields accordingly. [S01–S05]

C reports that its official Capcom frame/manual pages could not be fully opened, and that a companion `reference-snapshot.json` contained a small attributed UFD Ryu extract. **That companion file was not supplied with these two documents.** C describes the extract as page-read evidence, not independently reproduced source-game data or production-approved content, and reports no independently confirmed exact Capcom patch identifier. Do not reconstruct the missing extract from memory or claim to have verified it. [S01–S04]

Store per-field evidence status: `page_read`, `source_game_reproduced`, `adapted_candidate`, or `approved_aip`. Store source URL, retrieval date, source move, build/patch identifier if verified, control mode, hit conditions, and evidence filenames/hashes. Null means unknown; it never means zero, unlimited, or permission granted.

A source website may update after retrieval. Freeze the selected local dataset; do not silently track its latest values. Keep raw source values separate from adapted AIP values. A checksum of normalized JSON is not a checksum of the original website.

### What to preserve when adapting

Preserve purposeful relationships: which check is fast; which button confirms; which poke trades cancel access for risk; which special is unsafe; which ender spends meter for reward. Keep a complete initial package rather than cherry-picking the best property of every character.

Use a consistent position unit and one health scale. Normalize motion/reach only after calibrating fighter height, pushboxes, and camera. Do not normalize every character to identical anatomy. Long limbs, broad bodies, and unusual weapons require matchup tests.

Character flavour can replace the visual delivery of a role without changing the entire combat rulebook. A themed projectile can first inherit the pilot projectile's tested spawn, travel, and end conditions; its changed size/reach must then be tested as a gameplay change.

Do not import commercial meshes, animations, sounds, or whole third-party assets into the shipped game without appropriate permission. Do not assume that a public repository licenses all character packs linked from it.

---

## 5. One simulation, explicit clocks, and exact timing

### 5.1 Simulation ownership and clocks

*Source basis: C §3; D04 and D10.*

Use a fixed 60-Hz input/simulation step. Render independently. Use integer/fixed-point gameplay coordinates, velocities, timers, and damage, with explicit rounding and safe integer bounds. Keep renderer floats, model physics, system time, and unseeded random values out of gameplay decisions.

For v0, use these clocks:

- `sampleTick`: advances every 60-Hz step, including impact pauses; records raw input.
- `battleTick`: advances only when global combat is not frozen.
- `moveTick`: advances with battle ticks while the move owns the fighter, except explicit per-move holds.
- Presentation time: samples combat state; never decides combat outcomes.

**Proposed simplification:** v0 impact hitstop freezes both fighters and gameplay projectiles globally. This is an explicit AIP policy, not an exact SF6 reproduction. Freeze motion, move clocks, stun countdowns, collision progression, and the matching poses together. Continue input sampling and command recognition. Do not repeatedly process a frozen contact. Cosmetic impact effects may continue on presentation time.

Use four live battle ticks as the action-request lifetime, including the recognition tick: valid on `createdBattleTick` through `createdBattleTick + 3`. It does not age during global hitstop. Raw motion recognition still uses sample ticks so an extremely old partial motion cannot remain valid forever. Keep at most one pending request per player, resolving it through documented priority, rather than queuing a whole combo.

Save/restore must include all clocks, freeze counters, input histories, pending requests, move instances, projectiles, hit registries, meter, combo/juggle state, facing history, seeded randomness, and event IDs. GGPO's documented requirements—save state, restore state, and execute a frame without rendering—are a useful architecture test, not a demand to install GGPO or change current networking. [S11]

### 5.2 Timing convention and arithmetic boundaries

*Source basis: C §4; D11 and D13.*

Internally, move ticks are zero-based. A move accepted at battle tick `t` executes its move tick zero at `t`. State expiry and legal input transitions occur before that tick's collision evaluation.

In imported conventional frame data, startup `S` means **the first active frame is display frame S**, not S entirely inactive frames. For one continuous active interval of length `A` and recovery `R`:

```text
firstActiveTick = S - 1
active interval = [S - 1, S - 1 + A)
endExclusive = (S - 1) + A + R
first freely actionable battle tick = startBattleTick + endExclusive
```

Example: S=4, A=3, R=7 gives active move ticks 3, 4, 5; recovery ticks 6 through 12; actionable tick 13. Do not accidentally add another startup tick.

The runtime stores explicit active intervals and `endExclusive`. Startup/active/recovery columns in a report are generated from these tracks, not independently maintained competing values. Multi-hit gaps, movement phases, different whiff recovery, landing, and projectiles need explicit timelines rather than this simplified sum.

#### Stun and advantages

Let a hit resolve at battle tick `c`. A declared stun duration `H` means H future battle ticks after contact are locked. Therefore:

```text
defenderFreeTick = c + 1 + H
advantage = defenderFreeTick - attackerFreeTick
```

At `defenderFreeTick`, the defender can guard or execute a legal action BEFORE collisions. A hit on that tick is not an uninterrupted grounded combo merely because collision processing ran before a status flag was updated.

For a simple first-active hit with equal freeze for both players, no special recovery changes, and no knockdown:

```text
remaining attacker lockout after contact = (A - 1) + R
H = remaining attacker lockout + desired hit advantage
```

Use the equivalent relation for blockstun. These are AIP convention equations, not a universal import rule. Asymmetric pauses, late hits, projectile travel, knockdown, and contact-dependent recovery require scenario measurements. Measured advantages are outputs/fixture expectations, not a second runtime source of truth.

#### Mandatory arithmetic fixture

Synthetic move A: S=5, A=3, R=12, hitstun=20, blockstun=10, starts at tick 0.

```text
A first hits: tick 4
A becomes actionable: tick 19
Defender recovers from hit: tick 25       => A is +6
Defender recovers from block: tick 15     => A is -4

Follow-up B with S=5:
Start at 19 -> first hit 23 -> true grounded link, when in range
Start at 20 -> first hit 24 -> true grounded link, when in range
Start at 21 -> first hit 25 -> defender can block; NOT a combo

After blocking A:
Defender's S=4 response hits at 18 -> punish, when in range
Defender's S=5 response hits at 19 -> A can guard; NOT guaranteed
```

C says a companion bundle contained an independently specified arithmetic oracle. That checker was not supplied here. The examples above are still mandatory specifications: create independent fixtures and port them into the real engine. Passing a standalone arithmetic checker would validate these equations only, not the game.

### 5.3 Tick processing and simultaneous resolution

*Source basis: C §5.*

Use an explicit, tested order, with simultaneous outcomes independent of player slot:

1. Sample both players' raw inputs; clean opposing directions; record direction/facing history.
2. Update command recognizers and pending requests. If globally frozen, update the freeze counter and return without advancing battle simulation.
3. Expire completed moves/stun/landing locks; establish each fighter's legal options and current guard eligibility.
4. Choose legal transitions using requests, resources, cancel rules, and prior contact results. Pay costs exactly once.
5. Apply authored movement, jump integration, landing, stage boundaries, and deterministic pushbox separation for both fighters.
6. Sample authored gameplay collision tracks and attack event tracks at the resulting positions. Build a pre-impact snapshot.
7. Gather all strike/throw/projectile candidates from that snapshot, then resolve as a batch. Do not let P1's state mutation erase an otherwise valid simultaneous P2 hit.
8. Apply resolved damage, reactions, knockback, hitstop, resource changes, and combo state. Save pre-impact evidence as well as post-impact state.
9. Publish deterministic event IDs and a render snapshot. Advance battle/move clocks according to their ownership rules.

A contact-created cancel request cannot retrospectively change the collision that just occurred. Its earliest transition is the next eligible battle tick, after any freeze, provided the source window allows it.

Start with equal-priority strike trades. Resolve simultaneous throws as a tech. A valid strike defeats a simultaneous throw in v0. These are proposed AIP policies; test both player-slot orders. Projectiles need explicit clash/lifetime behaviour; use one ordinary projectile per owner initially and one-for-one clashes unless the move data explicitly defines another rule.

---

## 6. Input recognition, buffering, arbitration, and signatures

*Source basis: C §8; M §3. C’s facing policy is the explicit D05 proposal; it is not presented as consensus between the sources.*

Use raw input edges, not OS key repeat. Provide remappable controls and explicit single-button bindings for the throw/signature chords. Both manual chords and dedicated bindings must produce the same command.

Proposed v0 defaults: history 60 sample ticks; one motion completed within 20 sample ticks; a double motion within 40 sample ticks, with each constituent satisfying the single-motion limit. Adjacent accepted motion tokens may be at most 8 sample ticks apart. Allow repeated held directions; allow at most two intervening neutral samples; reject unrelated directions. Start strict rather than adding undocumented shortcuts.

Canonical sequences relative to the chosen facing are QCF `2,3,6`, DP `6,2,3`, QCB `2,1,4`, double QCF `2,3,6,2,3,6`, double QCB `2,1,4,2,1,4`. Button press must be on or within 3 sample ticks after the final direction. Negative-edge/release specials are disabled, except the explicit signature release action.

Preserve raw world directions AND facing per sample. For v0 motion recognition, evaluate the candidate sequence relative to the fighter's facing at the attack-button edge. This is a deliberate cross-up policy, not an assertion about SF6. Test side switches. Lock action-facing on committed attacks unless a move explicitly tracks the opponent. Movement and guard facing policies must also be recorded.

Opposite direction cleanup: left+right is neutral horizontally; up+down is neutral vertically. Use the same canonical rule for keyboard and controller input.

### Chords

Recognize a manual chord when the second constituent arrives within two sample ticks while the first is held. Delay only a pending ordinary normal that could form the chord until arbitration completes. A dedicated chord binding has no such delay. A recognized chord never also emits its constituent normals.

Do not retroactively cancel an already committed normal to pretend a late chord succeeded. Record and expose chord latency in the input lab. A complete eligible motion-command plus button is not delayed as an ordinary normal; document that it wins over a chord attempted afterward. Same-tick chords have their declared priority.

Priority among simultaneous legal requests: throw chord, signature chord, super, DP, QCF/QCB special, ordinary normal. Per-character mappings resolve QCF/QCB ties explicitly. Evaluate legality/resources before fallback: an unaffordable super may fall back to a matching legal special; record this choice and test it. Never execute two moves from one button edge.

Do not clear all direction history after a special. Super-cancel commands may share recent motion history, but need a new unconsumed attack-button edge. Store consumed edges and pending commands in rollback state.

### Core hold/release signature controller — production effects still gated

Proposed states: entry, hold, release attack, recovery. Initially grounded/neutral entry only; no armor or invulnerability; cannot begin in hitstun/blockstun. Starting from an illegal state does not arm a future automatic charge just because buttons stay held.

Release either button to request release; require both buttons released before rearming. Charge uses battle ticks and freezes with hitstop. Proposed levels are 0 below 30 held battle ticks, 1 at 30–59, 2 at 60 or more, saturating at level 2. Interruption cancels the action and clears stored charge in v0. The animation reflects charge; it does not determine charge.

The signature's actual character effect remains a design slot. Implement the controller with a labelled test action, not an invented production ability. Allow no combo-entry/cancel permissions for it until its move definition is approved.

### 6.1 Integration-specific input checks

M’s reported `HP+HK → super`, two-special bindings, and five-tick edge buffer are migration observations, not alternate final input rules. Introduce tests before changing those bindings. All new commands still pass through the same input controller in normal matches, local tests, online play, and the lab.

The manual/dedicated signature binding must produce the same logical press, hold, and release transitions for a hold/release action. A dedicated binding cannot merely emit a one-shot command and lose release information. This is an explicit integration check proposed here; it is not a new roster ability.

The instant-grab, node/hazard placement and stored-focus concepts in Section 9 remain subject to D07. Do not mark them implemented merely because a generic charged test action works.

---

## 7. Move data, collision geometry, guard, and physical motion

*Source basis: C §6; M §§5–6.*

A production move record must declare:

| Group | Required content |
|---|---|
| Identity | Stable ID, character, version, role, status, provenance |
| Entry | Command, allowed postures, meter/charge requirements |
| Timeline | Active intervals, end-exclusive, whiff/hit/block branches if needed |
| Strikes | Per-hit-group damage, stun, guard class, reaction, knockback, repeat permissions |
| Geometry | Hit/hurt/push tracks in simulation coordinates; allowed target postures |
| Motion | Root/gameplay displacement curve; jump or landing rules |
| Cancels | Explicit destinations, windows, contact conditions, costs |
| Juggle | Launch status, eligibility, budget cost, terminal result |
| Presentation | Rig/clip hashes, phase time map, striking markers, blend restrictions, effects |
| Acceptance | Scenario IDs, independent expected results, visual review evidence |

Use strict schema validation; reject unrecognized properties, missing production fields, invalid ranges, duplicate IDs, missing clips, and references to absent moves. An empty cancel list means no cancels. Unknown data must not silently become permission.

Reference rows with incomplete fields are not executable moves. The content compiler must reject them from a production pack. A deliberate AIP-authored value can fill a gap only with provenance saying it is an AIP decision and with the corresponding tests.

### Guard contract

Use the explicit strike classes `MID`, `LOW`, and `OVERHEAD`. These describe blocking rules, not button names or the height of an animation. Throws use their separate capture rules.

| Defender input/state | MID | LOW | OVERHEAD |
|---|---|---|---|
| Grounded, legal standing back guard | Block | Hit | Block |
| Grounded, legal crouching down-back guard | Block | Block | Hit |
| Neutral, attacking/recovering without guard permission, or airborne | Hit | Hit | Hit |

`Hit` in this table means guard does not prevent a hit; geometry, target posture, invulnerability, and hit-group eligibility must still pass. There is no air guard, automatic neutral guard, or chip damage in initial v0. A blocked attack causes the declared blockstun, not hitstun, and does not enter a damaging combo.

Holding a guard direction is evaluated every sample, including during blockstun. Blockstun prevents ordinary actions but does not freeze the selected high/low guard: follow-up attacks must be checked against the current legal guard choice. Hitstun cannot be guarded until its expiry. On the first free battle tick, guard is available before collision resolution.

Resolve back/down-back relative to the opponent's gameplay side in the same pre-impact snapshot used by collision. When horizontal positions coincide, retain the last nonzero side. Guard facing can therefore update independently of a committed attack's presentation-facing lock. Record the resolved side so cross-ups and player-slot swaps can be replayed identically. Do not determine guard from a 3D mesh's current rotation.

### Geometry principles

Hitboxes deliver an attack. Hurtboxes receive it. Pushboxes separate bodies. Elecbyte's AIR/HitDef documentation is a concrete precedent for frame-specific collision shapes and separately specified hit behaviour; use the idea, not its file format as a forced migration. [S06–S08]

Use authored 2D rectangles/capsules, sampled from the simulation. Use the 3D model's approved fist, foot, or weapon markers to AUTHOR and VERIFY those tracks. Do not let a live blended skeleton, cloth, hair, or mesh bounding box decide combat collision.

Validate both directions with each character's calibrated dimensions. Visual Z movement is not an excuse for a wide miss in the fighting plane. Preserve the user's requirement that a punch's reach be supported by what the player sees.

For fast strikes, an explicitly authored, bounded swept attack volume can represent travel within an active tick. Never sweep backwards through startup to create earlier hits. The reviewed striker path, not an enormous generic rectangle, must justify the swept region. For an initial pilot, prefer clear discrete contact poses where sufficient.

Capture defender geometry from BEFORE applying reaction/knockback. Comparing an attacker with the already displaced defender can falsely report a gap at a valid contact.

### Root motion and footwork

Simulation owns walk speed, dash distance, jumping, lunges, stage clamping, and knockback. Extract useful root displacement from a clip into approved movement data OR strip it and author movement independently. Never apply both.

Crouch collision changes at declared state ticks, not when an animation callback finishes. Jump landing is determined by gameplay position. No double jump or air steering in initial v0 unless existing approved behaviour requires it. Dashes are committed moves; their cancel/guard permissions are explicit.

Document stage-boundary pushback. When the defender cannot move farther into a corner, transfer the defined remaining separation to the attacker where appropriate, rather than allowing corner pressure to erase all separation. Test unequal body sizes and both corners.

### 7.1 Mechanical type is not appearance

M requires separate primitives for straight projectile, ballistic projectile, beam, stationary node/zone, actor movement track, actor teleport, and command grab. These are content/schema capabilities within the same simulation, not new engines.

Author hit-group, rehit, lifetime, resource, target-state, floor/expiry and event behaviour explicitly. A beam’s visible segment and attack shape agree; Ekander’s roll moves his actor instead of a detached orb; Stinkfiend’s object has gravity instead of a recoloured straight projectile. A visual gas cloud is not a damage zone unless its explicit hazard contract is approved.

The common v0 cap of one ordinary projectile per owner does not silently define the separate two-node limit or a junction-box hazard. Each approved entity family must declare its own cap and interactions. Limits, pulses and cleanup belong to serialized simulation state, not to a particle pool.

---

## 8. Animation repair and actual-scene alignment

*Source basis: C §7; M §6. Preserve original assets, body proportions and a candidate/approved distinction.*

Work on one move and its legal transitions at a time. Preserve the original asset, version/hash it, and work on a candidate copy. Do not generate an entire replacement set before proving the pilot pipeline.

**Step A — Diagnose.** Identify whether the defect is rig mapping, weights, pose construction, phase timing, transitions, root movement, collision calibration, or stale presentation. Record exact failing ticks. Do not retime around a broken rig.

**Step B — Establish constraints.** Record the striking limb, target region, startup/active/recovery contract, planted-foot intervals, root displacement, legal predecessor states, and permitted outgoing cancels.

**Step C — Repair key poses.** Build guard/preparation, active strike region, follow-through, and recovery. Coordinate feet, hips, torso, shoulder, elbow, and fist rather than moving only the distal limb. Use different body mechanics for a punch, sweep, rising attack, and throw. Preserve anatomy, scale, outfit, and weapon grip.

**Step D — Retime phases independently.** Shorten an overlong wind-up without erasing the attack's identity. Make striking travel fast where intended. Keep readable follow-through and recovery. Never change the combat timeline merely because the original clip is long.

**Step E — Validate entry and exit.** Enter from idle, forward walk, backward walk, crouch where legal, landing, and legal cancels. Check the final BLENDED pose, not only the raw clip. Establish an outgoing transition for every legal cancel; a move must not return to guard before a legal follow-up can begin.

**Step F — Validate contact in the actual scene.** Use clean and collision-overlay views. Find the earliest true visible contact and compare it with the resolved hit. No effects are permitted to mask the geometry during this pass.

**Step G — Validate full-speed feel.** Only after timing and collision pass, adjust impact presentation, sound, recoil, and limited camera effects. Keep a clean playback as evidence.

**Step H — Freeze the approved result.** Store hashes, reviewed transitions, measurements, and replay inputs. Any later asset or collision change invalidates affected approvals.

A clip may have a cosmetic settling tail AFTER gameplay becomes actionable; UFD explicitly explains this distinction for its SF6 captures. Such a tail must yield immediately to a new legal action. Do not extend recovery to wait for it. [S02]

Three.js provides exact-time mixer sampling, but mixer time is affected by `timeScale`; the adapter must account for this and restore action weights/state. Merely seeking a clip is not a complete replay restore. [S09]

### Proposed initial visual thresholds

These are AIP QA starting tolerances, not published industry standards. Calibrate with one reviewed fighter, then version them; the repair agent cannot enlarge them to make a test pass.

- Root/mesh registration drift: at most 0.5% of calibrated standing height, excluding an explicitly authored local body lean.
- Planted-foot slip: at most 1% of standing height over a declared plant interval; pivots need an explicit pivot annotation.
- Sole penetration below the floor: at most 0.5% of standing height, excluding a reviewed authored squash.
- For a simple fist/foot strike, outward attack-envelope tolerance: at most half the approved striker radius beyond the reviewed striker envelope. Special effects/weapons use their own reviewed envelopes.
- Model scale cannot change between states. A 0.1% numerical tolerance is for computation/export noise, not deliberate resizing.

Do not reduce the entire visual assessment to these numbers. Joint collapse, broken silhouettes, twisted wrists, and poor full-speed rhythm still require a visual reviewer. A model's self-assigned score is not approval.

### 8.1 Explicit animation IDs and attachment sockets

Use explicit animation IDs and marked phases: anticipation, release/first active tick, contact, recovery and return to stance. Bind sockets for hand, pizza-peel tip, eyes, heart module, cable endpoint, pelvis and floor anchor. Display socket markers during development. The presentation may use bones for attachment, but authoritative collision/spawn coordinates remain simulation-defined.

Existing procedural pose substring guesses must not choose an unrelated attack. Free humanoid clips are candidates, not approved animation replacements. Validate one imported clip and one stock procedural move side by side before committing to a different animation path. Use in-place clips when the simulation owns displacement.

An attack is not approved from its raw clip alone. The actual blended entry, active contact pose, interruption, legal cancel and return/settling tail must agree with the authoritative move state. First keep the evidence view free of SFX/VFX distractions; then prove audiovisual synchronization without altering that mechanical result.

---

## 9. Complete proposed roster move bible

*Source basis: M §4, preserved in full below. Named moves, character descriptions and audiovisual directions are source-derived proposals except requirements M explicitly identifies. This consolidation adds no new characters or lore.*

### 9.1 Status of this roster

The designs below are **content targets**, not production move records, verified combos or blanket approval of mechanics. C’s core rules remain in force; D07–D12 identify where an extension or trigger decision is needed. For example, a move called a “launcher” still needs an explicit launch/reaction/juggle contract, and a “confirmed” super still needs a tested capture/connection before its follow-up.

### Irstababben

Legacy ID: `shoto-a`. Intended archetype: Shoto.

Turkish pizzeria-owner protagonist from Irsta. Pizza peel/spade and pineapple-powered Hawaii Blast.

```text
QCF + LP — Hawaii Blast: compact, fast horizontal pineapple blast.
QCF + HP — Hawaii Blast: slower, larger pressure projectile; longer recovery.
DP + LP — Pizza Peel Upper: short, grounded anti-air sweep.
DP + HP — Pizza Peel Upper: committed rising leap; exposed landing.
QCB + LK — Pizzeria Spin: one short peel sweep.
QCB + HK — Pizzeria Spin: advancing two-hit peel sweep.
HP + HK — Oven Burst: hold to heat the peel; release a short-range oven-blast cone. Charging is vulnerable.
Super — Irsta Speciale: peel launcher into a concentrated pizza-oven detonation. Follow-up cinematic only after a confirmed hit.
```

**VFX direction:** Amber, pineapple yellow, mozzarella white. Visible peel arc, wedge-like pineapple silhouettes and oven shimmer. No generic orange sphere as the finished effect.

**SFX direction:** Metal peel swish/clank, short oven rush, a dry sizzle and an original “HAWAII!” bark. Avoid long flame noise drowning out the hit.

### Capitan

Legacy ID: `grappler-a`. Intended archetype: Grappler.

Tall, heavy blue-skinned fighter with black hair/beard, fedora and current zebra singlet. Canonically Irstababben’s Hulk form.

```text
QCF + LP — Blue Bulldozer: short shoulder/belly rush.
QCF + HP — Blue Bulldozer: longer rush, with a defined one-strike armor window; throws still beat it.
DP + LP — Captain’s Catch: close rising forearm anti-air.
DP + HP — Captain’s Catch: catches an airborne opponent and slams them. Whiffs against grounded targets.
QCB + LK — Husky Lariat: stationary arm sweep.
QCB + HK — Husky Lariat: slower advancing lariat.
HP + HK — Fedora Command Grab: close catch, lift and slam; clear whiff recovery.
Super — Hulk Mode: Capitan: confirmed command-grab sequence into a huge leap and body slam. He is already Irstababben’s Hulk form; this does not require inventing a second transformation.
```

**VFX direction:** Cobalt-edged compression arcs, white air displacement and floor dust. Preserve body/hat silhouette. No projectile or permanent magical aura.

**SFX direction:** Shoe scuff, cloth tension, one strong low body impact and a short room/floor rumble. Small hat-flick cue on the grab preparation.

### Femboyfippe

Legacy ID: `zoner-a`. Intended archetype: Zoner / setup.

Feminine but restrained presentation. Terminal heart illness and a conspicuous heart-support machine are central; not a flamboyant pink wizard.

```text
QCF + LP — Cardiac Node: place a close ground node.
QCF + HP — Cardiac Node: place a farther, raised node. Maximum two nodes shared between variants.
DP + LP — Emergency Discharge: narrow upward discharge from the machine.
DP + HP — Emergency Discharge: wider discharge with greater offensive-reserve cost and recovery.
QCB + LK — Lead Sweep: short low sweep with a reinforced cable.
QCB + HK — Lead Sweep: higher, longer anti-air cable sweep; no additional node-moving feature in the first version.
HP + HK — Pacing Field: charge then release a synchronized pulse between deployed nodes; local short pulse when no valid pair exists.
Super — Heart Max / Overdrive: a clearly telegraphed grid sequence followed by visible machine cooldown.
```

**VFX direction:** Clinical cyan/white, restrained warning red, actual cable connections and ECG-shaped paths. Every emission originates at the heart module, a cable or a connected node. No floating decorative heart symbols.

**SFX direction:** Mechanical pump pulse, relay click, capacitor charge, a crisp discharge and a short warning cadence. Cues reflect offensive reserve and move phases, rather than a constant urgent alarm.

### Babas

Legacy ID: `grappler-b`. Intended archetype: Zoner.

Bald, no glasses, former dealer whose eye surgery gave him eye-laser powers. Legacy ID is not his intended archetype.

```text
QCF + LP — LASIK Laser: quick, thin chest-height beam; explicitly duckable.
QCF + HP — LASIK Laser: delayed downward-aimed beam; explicitly a LOW attack.
DP + LP — Retina Lift: diagonal anti-air beam.
DP + HP — Retina Lift: steeper near-vertical beam. Both variants commit their aim before firing.
QCB + LK — Recoil Step: short backward step with a brief covering beam.
QCB + HK — Recoil Step: committed backward hop with a downward shot.
HP + HK — Optical Focus: hold a conspicuous pupil glare, then release a long narrow piercing beam. Vulnerable while charging.
Super — Perfect Vision: a telegraphed twin-beam sweep; not an unavoidable instant screen-wide hit.
```

**VFX direction:** Two pin-sharp white cores from the eyes, thin red fringe, a small surgical-blue pupil glint before release. Beam endpoints and thickness follow the actual attack shape.

**SFX direction:** Lens/relay click, brief rising laser chirp and dry cutting hiss. No machine pump or monitor beeps: those belong to Fippe.

### Stinkfiend

Legacy ID: `zoner-b`. Intended archetype: Shoto / Grappler hybrid.

Chubby, cocky, sneaky close-range fighter using farts and turds. QCF trajectories below are user requirements, not optional recolors.

```text
QCF + LP — Turd Toss: forward low ballistic arc that falls under gravity.
QCF + HP — Turd Toss: upward lob that returns downward after a delay. No homing. First version uses a fixed facing-relative trajectory.
DP + LP — Backdraft: short gas-powered hop with close anti-air coverage.
DP + HP — Backdraft: higher launch with exposed landing recovery.
QCB + LK — Sneak Step: backward movement and a brief gas puff.
QCB + HK — Sneak Step: short close-range pass-through; vulnerable startup and arrival, no general invulnerability.
HP + HK — Silent But Deadly: close command grab into a point-blank fart burst.
Super — Biohazard: successful catch starts a large localized stink explosion.
```

**VFX direction:** An opaque brown turd mesh is the gameplay core. Small olive/yellow-brown wisps, a readable shadow and a clear descending silhouette. Brown impact splat; residue is cosmetic in the first version. No glowing green sphere.

**SFX direction:** Throw plop, a light air sound on descent, wet impact splat and restrained comic fart accents. Separate enemy impact, block and floor impact sounds.

### Ekander

Legacy ID: `hybrid-a`. Intended archetype: Zoner / Grappler hybrid.

Heavy villain whose body creates space through rolling, bouncing and body/butt slams.

```text
QCF + LP — Ekander Roll: short body roll that brakes.
QCF + HP — Ekander Roll: longer committed roll with at most one defined wall rebound.
DP + LP — Belly Bounce: short belly-first upward pop.
DP + HP — Belly Bounce: higher fixed arc into a butt-first landing.
QCB + LK — Rebound: short backward body bounce.
QCB + HK — Rebound: forward body bounce, with a committed landing point.
HP + HK — Sit Down!: close body-weight command slam.
Super — Terminal Velocity: a strongly telegraphed butt slam. Preserve a landing marker and defender counterplay before contact.
```

**VFX direction:** Dust amber, dirty white, floor compression and sequential impact rings. The actor curls and rotates while the simulation moves him. Never substitute an independent purple orb.

**SFX direction:** Rhythmic rolling thuds, shoe squeak, cloth strain, bounce impacts and a short heavy landing boom. Capitan sounds like a single crushing hit; Ekander has a rolling/bouncing rhythm.

### Goonström

Legacy ID: `shoto-b`. Intended archetype: Shoto.

Main antagonist. Hentai enthusiast/gooner with exceptional focus. Express this through original non-explicit adult-anime merchandise and monitor aesthetics, not generic occult glyphs.

```text
QCF + LP — Goon Blast: fast compact dark bolt.
QCF + HP — Goon Blast: slower, denser mass of dark energy and rectangular screen fragments.
DP + LP — Focused Release: sharp close palm anti-air.
DP + HP — Focused Release: taller committed rising burst.
QCB + LK — Tab Shift: retreating slide with rectangular afterimages.
QCB + HK — Tab Shift: advancing palm strike with a tab-like trail; not a teleport.
HP + HK — Deep Focus: hold while exposed to gain one capped stored enhancement for the next Goon Blast. No stacking without limit.
Super — Maximum Goon: brief original non-explicit monitor-wall motif collapsing into a focused dark blast.
```

**VFX direction:** Black/violet/magenta; scanlines, rectangular tabs, original non-explicit adult-anime screen fragments and fan-merch motifs. No borrowed anime footage or generic occult rings.

**SFX direction:** Processed mouse/key clicks, fan ramp, compressed low synth pressure and one hard release snap. No explicit audio or ripped anime samples.

### Bulgarian Copper Thief

Legacy ID: `hybrid-b`. Intended archetype: Zoner / Shoto hybrid.

Intrusive fictional copper/cable thief with short teleport-like movement. Mechanics concern this individual, not nationality.

```text
QCF + LP — Copper Snatch: straight cable whip; not a projectile.
QCF + HP — Copper Snatch: weighted cable-coil throw on a committed arc.
DP + LP — Breaker Pop: close rising tool strike and electrical snap.
DP + HP — Breaker Pop: short upward blink into a strike, with a visible destination cue.
QCB + LK — Unauthorized Entry: short backward blink.
QCB + HK — Unauthorized Entry: capped-range blink behind the opponent with visible arrival cue and punishable recovery.
HP + HK — Grid Theft: drop a stolen junction box that creates one delayed floor-discharge strip.
Super — The Grid Is Mine: a confirmed cable catch into a blink sequence and junction-box burst.
```

**VFX direction:** Copper-orange physical cable, sparse white-blue sparks and a brief broken-light effect. Flicker the backdrop, not fighter visibility or essential attack tells. No portal runes.

**SFX direction:** Cable spool rattle, metal clank, relay clicks, power-cut click and short electrical crack. Teleport arrival has its own readable cue.

### Resource and counterplay rules

Fippe's first version should have a small deterministic offensive-reserve resource, spent on enhanced attacks and recovered during defined safe states. Empty offensive reserve temporarily disables heavy electronic attacks; essential life-support visuals continue. Do not add random heart failures, an unavoidable passive health-drain timer, or simulated medical accuracy. Visible strain, pump cadence and cooldown provide the narrative without making matches arbitrarily unwinnable.

Deep Focus stores only a capped next-blast enhancement. Command grabs need whiff recovery and a defined jump/throw-invulnerability counter. Teleports need capped displacement, legal arrival positions, collision resolution and readable recovery. Body rolls use actor movement, not separate projectile entities. No new DP receives full invulnerability merely because it uses a DP input.

### 9.2 Roster extension checklist — proposed integration requirements

This table exposes missing operational rules without filling them with invented balance values. Implement the mechanics in the same simulation and return them to the normal move-approval pipeline.

| Feature / affected designs | Preserve from the sources | Required contract before production |
|---|---|---|
| Capitan’s `Blue Bulldozer` armor | One-strike armor window; throws beat it | Exact ticks; strike-count depletion; damage/stun/hitstop interaction; multi-hit handling; cue; interruption and reset. |
| Capitan’s `Captain’s Catch` HP | Airborne-only catch into slam; whiff on grounded targets | Target eligibility including juggle state/budget; capture/strike classification; paired anchors; damage events; guard/invulnerability interaction; failure recovery. Normal-throw eligibility must not be weakened. |
| Capitan / Stinkfiend / Ekander grab signatures | Close capture, visible whiff, body-specific paired result | D07 trigger decision; startup/range; jump and throw-invulnerability counters; techability; protection after stun/wake-up; capture timing and terminal result. |
| Fippe’s nodes and `Pacing Field` | Two nodes shared across variants; valid-pair pulse; local fallback; heart-module origin | Placement state; total cap; replacement policy; expiry/destruction; pair selection; deterministic pulse and per-target intervals; fallback geometry; cue cleanup; all phases and resource costs. |
| Fippe’s offensive reserve | Spend on enhanced attacks, recover in defined safe states, keep essential life-support visuals | Capacity, costs, safe states, regeneration rate/timing, empty-reserve legality, cancellation refunds if any, reset/snapshot state. No random heart failure or passive lethal timer. |
| Babas’s laser geometry | LP duckable; HP low; committed anti-air aiming; telegraphed narrow focus beam | Exact start/end/width, aim-commit tick, posture eligibility, repeat groups, obstruction/clash decisions if relevant, clear low/overhead distinction. |
| Stinkfiend’s HP descent | Non-homing arc; descending silhouette; proposed descending-only overhead | Decide rising-phase hit eligibility/guard class, descent threshold at apex, expiry and floor behaviour. “Descending overhead” alone does not specify the upward phase. |
| Stinkfiend’s pass-through | Short range; vulnerable startup and arrival; no blanket invulnerability | Pushbox exception interval; allowed crossings; attack/guard facing after crossing; legal exit; corner behaviour; hurtbox continuity. |
| Ekander’s movement | Actor roll/brake, one actor wall rebound, fixed jumps/landings | Displacement/landing curves, stage collision, rebound limit and reset, landing contact/guard rules, root alignment. No victim wall-bounce or juggle-budget refill implied. |
| Copper Thief’s blinks | Capped distance, visible arrival, punishable recovery | Arrival legality at boundaries/overlap; facing and guard-side update; interval-specific collision; paired strike tick; correction and snapshot identity. |
| Copper Thief’s `Grid Theft` | One delayed floor strip from a junction box | D07 trigger decision; deployment/cap/lifetime; warning time; attack interval; guard and target rules; hit latches/rehit policy; reset. |
| Goonström’s `Deep Focus` | Exposed hold; one capped next-Goon-Blast enhancement | Distinguish charging from completed stored enhancement; release/completion rule; eligible blast variants; spending on start/hit/whiff; interruption/expiry/reset; damage/geometry differences and no stacking. |
| Cinematic / capture supers | Follow-up only after a valid hit or catch; defender counterplay before contact | Exact command button, 3000-meter baseline or approved amendment, target eligibility, failure branch, damage groups, hit-confirm gate, freeze/pose timeline, return/KO and network event cleanup. |

No command-grab or setup concept automatically inherits normal-throw techability, a universal projectile cap, universal invulnerability, or permission to cancel out of recovery. No feature can reuse a visual “recent hit” condition as authoritative state.

---

## 10. First distinct-mechanics slice: Stinkfiend Turd Toss

*Source basis: M §5, staged after the real-attack proof by D06. Only button terminology is normalized in the checklist; optional timing interpretation is exposed below.*

```text
Scope: QCF+LP and QCF+HP only, on the actual combat camera.

1. Ordered motion recognition works facing both directions.
2. LP and HP resolve to distinct stable move IDs. [Terminology normalization: D03.]
3. Projectile is an opaque turd mesh with a matching collision core.
4. Simulation owns initial velocity, gravity, lifetime and floor collision.
5. Spawn coordinates and release pose visibly agree.
6. LP advances forward and falls; HP rises higher and falls later.
7. Neither trajectory tracks the opponent after release.
8. Impact is resolved once: opponent hit, block, ground, or expiry.
9. Hit uses hit SFX/VFX; block uses block SFX/VFX; floor uses splat only.
10. Ground residue is visual only in this slice.
11. Shared concurrency cap: one active turd across LP and HP initially.
12. No off-screen attack without an on-screen descending/landing cue.
13. Release/impact effects execute once per authoritative event.
14. Both local and online clients show the same entity and move profile.
15. Reset, KO and match exit clean up active trails, decals and audio loops.
```

Optional starting values for tuning, not verified balance: LP startup 14 ticks, one spawn frame, recovery 20 ticks; HP startup 22 ticks, one spawn frame, recovery 28 ticks. Projectile travel/lifetime are separate from the active spawn frame. Use deterministic flight parameters chosen against the actual stage scale, not arbitrary real-world metres. The renderer's existing conversion is WORLD_SCALE = 1/200.

Recommended first-pass guard rule: LP is MID; HP becomes OVERHEAD only while descending, with explicit readable descent. This is a proposed balance rule, not a consequence of pressing HP. Test standing/crouching defense and reaction time before approving it.

### 10.1 Timing normalization proposal — not silently imported data

M’s startup wording is ambiguous relative to C’s convention. D11 proposes interpreting the optional values as **conventional startup S** only if this is explicitly adopted in G1/content decisions:

| Variant | Optional S | Spawn event at move tick | Spawn interval | Recovery ticks | First actionable move tick |
|---|---:|---:|---|---|---:|
| LP | 14 | 13 | `[13,14)` | `14 … 33` | 34 |
| HP | 22 | 21 | `[21,22)` | `22 … 49` | 50 |

These rows are a transparent arithmetic adaptation using `endExclusive = (S−1)+1+R`. They are not measured AIP balance or facts about the existing code. If “14 inactive ticks” was intended, the corresponding first spawn/actionable ticks differ; record the intended interpretation rather than adjusting fixtures to fit an accident.

Projectile travel, damage-active periods, descent, lifetime and floor impact continue in entity state independently of the actor’s one spawn event and recovery. Global v0 hitstop pauses both simulation flight and its visible object. Select integer/fixed-point flight parameters against the verified stage scale and camera.

For each isolated collision scenario, prove exactly one correct outcome event and matching hit, block, floor or expiry presentation. Keep residue cosmetic, limit LP/HP to one shared active turd, and preserve move/profile identity after the owner starts a different action.

The sources do not settle simultaneous target/floor contact precedence or every projectile clash/expiry tie. Those exact boundary policies need named fixtures and a recorded decision before approval, not container-iteration-order behaviour.

---

## 11. Combo rules, damage, routes, and independent verification

### 11.1 Links, cancels, target chains, juggles, and normal throws

*Source basis: C §9; advanced grabs remain gated by D08.*

A combo is not a prerecorded animation sequence. It is a sequence of separately entered legal attacks in which each follow-up actually connects while the defender is still in the appropriate hit-imposed vulnerable state.

Never implement a universal “recent hit” timer that increments a combo counter regardless of defender recovery. Never pull the opponent into range to make a named route work. Never inject extra hitstun because the next input resembles a planned combo.

#### Links

A link starts the next move after the previous move has completed its gameplay recovery. For a grounded, in-range follow-up without unusual travel or freezes:

```text
nextContactTick = attackerFreeTick + inputDelayTicks + nextStartup - 1
true link requires nextContactTick < defenderFreeTick
```

Equivalently, a zero-delay link needs next startup no greater than the previous move's measured hit advantage. This is only a timing filter; geometry and the defender's posture must also permit the hit.

A four-tick command lifetime makes early input more forgiving. It does not allow the next attack to start before the attacker is legal or extend the defender's stun. In particular, it must not turn an impossible +3 into a legal link to a five-frame attack.

#### Cancels

A cancel is an explicitly permitted transition before the current move's ordinary recovery ends. It is not a speed multiplier and not an animation crossfade that happens to look like another move.

A cancel edge specifies source move, target move/command class, half-open source move-tick window, required result, posture, resource cost, and any per-sequence limit. Validate entry, exit, and the new move's own startup.

For v0, allow selected normal-to-special edges on hit or block, but not on whiff. Allow selected special-to-super edges on hit only. A permitted cancel does NOT prove the resulting sequence is a true combo: a slow projectile or distant hit can still leave a gap.

Contact-created permission becomes usable only after contact resolution, as defined in Section 5.3. Input received during hitstop may be buffered, but no extra attacks are spawned inside a frozen tick.

#### Target chains

A target chain is an authored normal-to-normal cancel route, not a universal rule that every button can cancel into every stronger button. Start with one two-normal target route per character to make basic confirms accessible.

Each chain edge has the same explicit timing/contact requirements as any cancel. Repeated fast/check attacks require explicit self-chain permission and a finite per-sequence limit; initial self-chain limit is two activations. This does not alter independently legal links, which must be tested for spacing and loops.

The target route is not a button that plays the entire chain. Each move still needs its own fresh input. Do not buffer the entire route in advance.

#### Juggles

Begin with a small point-budget design, rather than importing several incompatible air-combo systems. Elecbyte documents juggle points as an explicit engine mechanism; the AIP numbers here are our own. [S08]

An approved launcher starts an airborne hit-imposed state and grants two follow-up move slots. Only moves explicitly marked as juggle-capable can spend a slot. Spend one slot per newly connecting follow-up move activation, not for every internal hit of a validated multi-hit attack. A launcher cannot refill the budget during the same combo.

The final permitted juggle follow-up must have a reviewed terminal knockdown result. No ground bounce, wall bounce, restand, or off-the-ground hits in the initial package. Airborne hurtbox overlap alone is insufficient: target state, slot availability, and hit-group permissions must all pass.

On landing, transition through the declared knockdown and wake-up states. Do not retain a hidden juggle/combo state after the defender has recovered. Optional later air recovery must have explicit input and timing rules rather than an animation-dependent escape.

#### Throws

Normal throws do not connect to a defender in hitstun, blockstun, airborne state, or existing throw state in v0. Their default result is a terminal paired sequence, not a combo extender. Add a proposed five-battle-tick throw-protection window following hitstun, blockstun, or wake-up: protect the first free tick and the next four battle ticks. Use an eight-sample-tick normal-throw tech window from capture, including the capture sample. Hold global gameplay and the capture pose in a distinct capture-pause state while raw input continues; resolve a valid tech or begin the paired throw when that window closes. This pause is not extra hitstun and is stored separately from impact hitstop.

These values are AIP defaults, not imported reference facts. A normal throw must have a visible whiff and punishable recovery. Success uses paired attacker/victim tracks aligned to actual capture anchors, with bounded adjustments reviewed against each body-size class. Do not teleport the victim across a visible gap. A tech produces no throw damage and resolves symmetrically.

A future command grab is a separate move family with separately approved rules; do not quietly give every throw command-grab properties.

### 11.2 Damage, meter, and infinite-combo safeguards

*Source basis: C §10.*

Use 10,000 baseline health for initial calibration, with character-specific differences deferred. This is an AIP calibration choice. Keep damage integer-valued with an explicit rounding rule.

Proposed combo scaling by connecting move activation:

```text
Activation 1: 100%
Activation 2:  90%
Activation 3:  80%
Activation 4:  70%
Activation 5:  60%
Activation 6:  50%
Activation 7 onward: 40%
```

All internal hits of one activation use its locked scale. A super uses at least 50% of its base per-hit damage. Apply `floor(baseDamage * scaleBasisPoints / 10000)` to each hit, with a minimum of 1 for a declared damaging hit. Do not round UI percentages and feed them back into damage. Hit count and scaling-activation count are different counters.

Use one three-segment meter, represented as 0–3000 integer units, and a 3000-cost super initially. Meter is paid on the legal move transition, once, and refunded only by an explicit rule. One super activation per combo; supers cannot cancel back into ordinary moves. Do not build meter from a whiff. For the pilot, use 100 units to the attacker and 50 to the defender on the first damaging connection of each non-super activation; all internal hits after the first grant zero. Block grants zero initially. Supers grant no meter. These simple values are intentionally provisional AIP rules, not SF6 reproduction.

Damage scaling is NOT an infinite-combo prevention system: a low-damage loop can still imprison the defender. Use finite target-chain permissions, no resource-free cancel cycles, finite juggle slots, spacing/pushback, and negative tests for repeatable grounded links in both corners.

Search the legal transition graph and replay promising paths in the actual headless simulation. Retain useful states by damage, position, meter, and end state. Do not optimize solely for maximum damage: corner carry, knockdown, safety, and resource conservation are separate route objectives.

Initial search budget: 12 move activations or 900 simulation samples per branch, whichever comes first, with fixed seeds and state deduplication. Every found exploit gets a minimal input replay. Separately flag sequences reaching 16 connecting activations without defender recovery as a developer failure. Do not “fix” a loop by silently making the seventeenth visible punch harmless.

A bounded search is not a proof that no infinite exists. Report the bound, scenarios, seeds, and unexplored regions. Any known loop or unexplained long lockout blocks approval. A release build must not turn a debug failure into an invisible rule change.

#### Route design targets, not fake balance proof

For the first package, aim for ordinary practical routes of roughly 2–5 moves and 15–30% baseline health; a full-meter route may reach roughly 30–45%. These are proposed initial design ranges, not copied game statistics or a guarantee of balance. Multi-hit attacks can show more hits without meaningfully longer routes.

Do not automatically buff every route to meet a percentage. Each character needs useful alternatives with differing position, resource cost, and risk. Preserve the distinction between a safe check, a punish, a risky launch, and a resource-heavy conversion.

### 11.3 Required route library

*Source basis: C §11.*

Each character needs the following route TYPES, with actual move IDs selected only after the moves exist and pass their individual tests:

| Route | Intended lesson/purpose | Required evidence |
|---|---|---|
| Accessible confirm | Selected normal → target-chain normal → safe/appropriate special | Fresh input for every move; hit and block versions |
| Low conversion | Low attack → allowed special cancel | Crouch/stand guard tests; tip-range gap test |
| Recovery punish | Confirm normal → legal link → damaging ender | Earliest/latest link inputs; range boundaries |
| Jump-in | Air attack → land → grounded attack → ender | Height sweep; real landing recovery; early-jump-in failure |
| Anti-air | Rising/anti-air attack → terminal result or one approved follow-up | Multiple jump arcs/heights; no unexplained grounded invincibility |
| Meter route | Legal starter → eligible special → super | Meter payment, double-motion recognition, hit-only cancellation |
| Corner alternative | Existing route with a positional benefit | Both corners; no free resets or loops |

At least one practical meterless route must work without a one-tick input miracle or a single lucky spacing. A route can intentionally be corner-only, standing-only, counter-only later, or character-specific, but its description and test fixtures must say so. Do not label conditional routes universal.

Separate a mechanically valid pre-recorded route from a human-usable hit confirm. A test bot that instantly reads a contact flag does not prove a player can react in time. For the accessible route, use a reviewed two-contact sequence or sufficiently sustained confirm opportunity rather than requiring the player to visually confirm one very fast jab. Record the final decision window in sample ticks and playtest it at normal speed. Holding a buffer is not permission for the engine to choose a damaging follow-up automatically.

For each route, store starting separation and velocity, fighter pair, facings, posture, health/meter, stage position, input trace, precise hit times, per-hit damage/scaling, final positions, final state, and the earliest tick on which the defender can guard/action again.

Combo recipes are TEST DATA and training instructions, not a second damage engine. Running a recipe means replaying inputs through the normal input system.

### 11.4 Independent combo oracle and defender behaviours

*Source basis: C §12.*

The combat engine emits a trace; a separate validator reads it. The validator must not simply accept the game's combo counter or call the same combo-classification helper under test.

For every hit after the first, independently establish that the previous hit-imposed state still prevented the relevant defense, that the transition was legal, that contact geometry was valid, and that the target was eligible. End the uninterrupted combo at actual recovery, not because a UI number faded out.

Grounded test defender: take the first intended hit, then choose the correct block direction/height on the first legal tick. It must block a follow-up with a real gap. A jab-mashing dummy is insufficient: its attack may be too slow to exploit a gap that allows blocking.

Add separate defender modes for always-block, crouch-block, jump on first legal tick, throw-tech, reversal on first legal tick when a reversal exists, and scripted punish. Defensive test agents have access to scenario expectations; do not confuse this diagnostic ability with fair human reaction speed.

Airborne sequences require state/juggle checks because an airborne character may be unable to block by design even after hitstun. “The dummy did not block” therefore does not prove an air combo.

#### Required positive and negative pairs

- Legal link at first and last valid ticks; the next tick must fail against immediate guard.
- Correct cancel at first and last valid source ticks; outside the window must be rejected.
- A permitted cancel that leaves a gap must be classified as a gap, not forced into a combo.
- Same sequence on block must follow block-cancel rules and report blockstring gaps.
- Just-in-range hit; just-out-of-range whiff; active volume disabled must make the positive fixture fail.
- Single-hit move stays overlapping for several ticks but damages once.
- Explicit multi-hit move damages only at its approved hit-group events.
- Insufficient meter cannot produce a super; shared motion history cannot reuse a consumed button.
- Changing render frequency cannot change command results, damage, or combo status.
- A target that has recovered but voluntarily stays still starts a NEW combo on the next hit.

### 11.5 Roster-specific routes are earned, not invented

Do not turn the names in Section 9 into asserted working combos before individual moves exist. Map the seven required route types to actual move IDs after their timing, geometry and permissions pass. A command-grab finisher, node pulse, delayed lob or focus-enhanced blast needs explicit target/activation attribution and a replay demonstrating whether a real gap exists.

Store both route utility and constraints: practical confirm, punish, spacing, corner carry, knockdown, resource conservation, and meter conversion. Each route still requires fresh player inputs through the standard recognizer; no cinematic/controller is allowed to auto-complete an ordinary combo.

---

## 12. Simulation events, presentation ownership, and online identity

*Source basis: M §6; C §§3, 5, 13. The clock/event elaborations below are explicit integration proposals.*

Do not implement a second combat engine inside these modules. Separate mechanical primitives from appearance: straight projectile, ballistic projectile, beam, stationary node/zone, actor movement track, actor teleport and command grab. A laser's visual segment and attack shape must agree. A roll's visual body follows the authoritative actor; an animation's root motion must not move the actor twice.

Event payloads should identify match/round, event ID, tick, source, optional target, move ID, attack instance, optional projectile/entity ID, contact position and outcome. Cosmetic random variation uses a separate seed, never combat RNG. Persist projectile move/presentation identity into snapshots; do not reconstruct it from the owner's current move after they have recovered or started another attack.

Emit semantic cues for windup, release, hit, block, armor, ground impact, cancellation and end. One-shots are deduplicated by scoped event ID. Continuous effects belong to a specific attack/entity and are stopped on cancellation, death, reset, despawn or match exit. Avoid repeatedly playing a sound from a render-state condition.

Change the existing assumption that every positive meter cost emits a super event: use explicit move kind. An expensive normal special is not a super cinematic.

### 12.1 Proposed explicit event/clock integration

Retain M’s match/round-scoped event ID, source/target, move ID, activation, optional entity, contact position and outcome. To avoid ambiguous “tick”, record `sampleTick` and `battleTick`, plus relevant source `moveTick`; record pre-impact and post-impact evidence as C requires. Field names are proposed schema additions to map onto the real protocol in G0, not claimed existing APIs.

The event’s identity must not be based on a frame counter in the renderer. The presentation registry maps explicit move/profile and semantic cue to animation/VFX/SFX; it never guesses from a move-name substring or the owner’s current state. A snapshot can restore a projectile after the owner recovered without changing its identity or replaying its release sound.

C’s v0 freeze applies to authoritative actors and projectiles. Attachment motion and the first shown contact pose follow the same state; separately timed aftermath is allowed. Audio/particle variation uses isolated cosmetic randomness. None of it may consume gameplay RNG or alter gameplay hashes.

### 12.2 Network and lifecycle checks begin with the slice

Preserve M’s reported event-tick broadcasts as well as periodic snapshots when extending the existing server/client protocol. Do not replace transport or networking architecture. Update payload creation, types, serialization and client hydration together.

Test correction/replay deduplication, projectile identity after an owner changes moves, release/impact once-only delivery, and continuous-effect ownership. A genuinely corrected state must still render correctly; deduplication must not suppress state corrections. Effects/audio end on cancellation, interruption, despawn, KO, round reset and match exit.

Compare local and authoritative online scenarios with the same inputs and comparable resolved state. Report latency limitations separately. Fixed 60 Hz, local determinism, protocol serialization, and network correctness are separate checks, not synonyms.

---

## 13. VFX production system

*Source basis: M §7; C §§7, 13. Library compatibility and performance remain to be measured in the real checkout.*

The rendering recipe is a solid readable core, a short directional trail, a confirmed impact, then optional flavor. Character palettes are identifiers, not a substitute for different shapes.

Use small meshes for turds, pineapple silhouettes, physical cable coils and nodes. Use strips/quads for beams and ribbons. Use atlas flipbooks for impact/smoke bursts and flat pooled decals for splats. Bake selected CC0 Effekseer effects from the combat viewing angle when practical; do not add a second real-time effect runtime just to play a few impact bursts.

three.quarks is an optional batching/trail layer within the current Three.js renderer. It is not mandatory for the first slice. Test against the repository's pinned Three.js 0.180.0 before adopting it, and record a compatible version rather than claiming it is a proven drop-in.

Pool effect objects and reuse atlas/material resources. Give every emitter a duration, particle cap and owner. Emit by elapsed time or simulation events, not by the number of render frames. Cap decals and trails; particles should not cast shadows. Start with a conservative effect-light budget of one or two transient lights for the whole match, and change it only after measurement. This is a proposed budget, not a measured performance guarantee.

Attack-attached animation/effects use the same hitstop policy as the attack. Projectile visuals must not freeze while an authoritative projectile continues to move. Aftermath smoke may follow a separate cosmetic clock. Reduced effects can remove debris, bloom and camera shake but must preserve telegraphs, projectile cores, arrival markers and ground-danger indicators.

---

## 14. Sound production system

*Source basis: M §8; C §§7, 13. Impact-bank “light/heavy” describes sound intensity, not a redefinition of the player’s low/high buttons.*

Retain Web Audio and layer short samples with selected synth cues. Build a shared bank of clean light/heavy contacts, blocks, armor/counters, throws, landings and whooshes. Then add a small set of character-specific material/charge/release layers. Author two to four subtle variations for frequently repeated impacts; do not randomize important warning rhythms beyond recognition.

```text
MOVE START    -> short identifiable preparation sound
RELEASE       -> movement/weapon/energy cue
TRAVEL/HOLD   -> optional bounded loop owned by the attack/entity
HIT CONFIRMED -> body/material impact + character accent
BLOCK         -> guard cue, not the full body-hit sound
GROUND        -> surface/splat/landing cue, not an enemy-hit sound
CANCEL/END    -> fade owned loops and stop charging effects
```

Use buses for master, impacts, move effects, voices, UI and music. Prefer a few readable layers to many loud ones. Keep the attack tell audible under dialogue and music, and reserve deeper bass/longer tails for the appropriate heavy impacts. Duck music selectively for super callouts, not every jab.

Preload and decode the two selected fighters' critical samples before the round. Unlock the AudioContext from a user gesture. Store source masters losslessly; choose runtime encoding only after testing the actual browsers. For short critical sounds, small WAV files are a valid initial option. Keep browser speech as a fallback/debug feature rather than the final character voice system. Record short original Swedish barks with willing participants, then trim and mix them consistently.

No clipping, no missing first-use sounds, no repeated start cues on consecutive render frames, and no loops left running after reset. A louder synthetic beep is not a substitute for a body impact.

---

## 15. Asset/resource shortlist and provenance workflow

*Source basis: M §9. These are M’s dated resource and licence reports, carried forward without a new web audit or library audition. They are not fresh legal guidance. Before downloading, importing or distributing an item, verify its exact current licence, download-date terms and public-repository rights, and retain the receipt.*

These are tools/libraries and source materials, not a promise that an untouched pack produces a finished fighter. Download only the subset needed for a proof, audition in the mix, then retain the source/licence receipt.

| Resource | Role in this project | Free scope / licence caveat |
|---|---|---|
| Effekseer + its CC0 sample collections | Impact bursts, electrical eruptions, charge/release shapes; bake approved effects to atlases | Use collections explicitly in the CC0 section. The separate OLD samples have different terms. |
| Kenney Particle Pack | Glows, simple sparks and texture primitives | CC0; individual pack is free. |
| Kenney Smoke Particles | Dust for Capitan/Ekander and sparse Stinkfiend haze | CC0; individual pack is free. |
| Kenney Splat Pack | Turd-impact decals | CC0; individual pack is free. |
| Kenney Impact Sounds | Material and contact source layers | 130 files, CC0. Audition and layer; not every impact belongs in a fighting game. |
| Kenney Sci-fi Sounds | Electronic and energy source layers | 70 files, CC0. |
| ChipTone | Custom UI, diagnostic and electronic cues | Free tool; generated sounds are CC0. |
| Sonniss GameAudioGDC | Optional more detailed Foley, machinery, impacts and tails | Free for games under its own EULA, NOT CC0. Keep samples and redesigned derivatives out of the public asset repo. |
| Quaternius Universal Animation Library, Standard | Humanoid locomotion and pose/animation starting points | Standard download is free and CC0; Pro/Source versions are paid. Retargeting and move-specific work remain. |
| three.quarks | Optional batched Three.js particles and trails | MIT runtime library; test pinned Three.js compatibility. This does not license every third-party effect/editor service. |
| Audacity | Record barks, trim, layer and export audio | Free/open-source editing tool. Asset rights still depend on what you put into it. |

### Source-reported Sonniss restriction — reverify before use

M reports GDC licence version 2.0, effective 27 August 2026, as the version it checked on preparation. It allows use in finished games but restricts redistribution of sounds as assets, including edited or redesigned sounds. New downloads use the licence published on the download date, which may differ from an old copy in the ZIP. It also restricts developing/training/enhancing AI technologies with the licensed audio. Default to CC0 sources for committed public assets; consider a private asset/build path or written permission for Sonniss instead of assuming remixing removes the restriction.

### Source URLs

```text
Effekseer:
https://effekseer.github.io/en/
https://effekseer.github.io/en/contribute.html
https://effekseer.github.io/Help_Tool/en/ToolTutorial/01.html

Kenney:
https://kenney.nl/assets/particle-pack
https://kenney.nl/assets/smoke-particles
https://kenney.nl/assets/splat-pack
https://kenney.nl/assets/impact-sounds
https://kenney.nl/assets/sci-fi-sounds

Audio tools and optional source library:
https://sfbgames.itch.io/chiptone
https://www.audacityteam.org/
https://gdc.sonniss.com/
https://sonniss.com/gameaudiogdc/
https://sonniss.com/gdc-bundle-license/

Animation:
https://quaternius.itch.io/universal-animation-library

Three.js VFX library:
https://github.com/Alchemist0823/three.quarks

Web Audio guidance:
https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices
```

Do not use ripped fighting-game hit sounds, anime clips, or ambiguous reuploaded effect packs. Preserve each imported item's source, creator, exact licence, download date, original checksum, edit history and whether public-repository redistribution is permitted. This manifest is separate from the code's own licence.

### 15.1 Proposed admission record

Preserve M’s source/creator/licence/download/checksum/edit history fields. Add an explicit admission state such as `candidate`, `rights_checked`, `tested_in_game`, or `approved_asset` only when evidence supports it. This asset status does not replace C’s move-level mechanical/visual/playtest approval.

An integrity hash proves which file was reviewed, not that it is licensed, visually good, or compatible. Keep code licensing, asset licensing, build redistribution, and permission to use audio in AI systems separate. Do not infer that an editor/tool’s licence grants rights to whatever source material was loaded into it.

---

## 16. Combat lab and evidence capture

*Source basis: C §13; M §11. The lab is a mode of the actual match, not a replacement viewer or separate combat simulation.*

Add a developer-only mode inside the actual match. It uses the existing stage/camera, character renderer, controller, simulation, input recognizer, and collision implementation. A dedicated route or panel is fine; duplicated combat logic is not.

Required controls: scenario reset; pause; one-sample/one-battle-tick stepping; input playback; facings/postures; hit/block modes; resource presets; frame meter; collision overlay; clean view; export evidence.

A proposed browser API is:

```text
resetScenario(scenarioId, seed)
submitRawInput(playerId, input)
stepSamples(count)
readCombatState()
readPreImpactTrace()
readResolvedEvents()
renderExactState()
exportReplay()
```

These names are proposed interfaces, not functions claimed to exist. The lab must await asset readiness, zero pending asynchronous content changes, and then capture an exact rendered state. Use Playwright's clock only where needed to control browser scheduling; its official documentation explains timer installation order and the difference between running time and fast-forwarding timers. Explicit simulation stepping is the primary combat harness. [S10]

### Evidence pack per move/route

Store an overview contact sheet, all contact-adjacent/active frames, transition sheets, 60-Hz clean playback, debug-overlay playback, slowed playback using the exact same frames, raw input trace, pre-impact/post-impact state, metrics, source references, and approval record.

Tile labels: sample tick, battle tick, move tick, animation sample, phase, blend state, facing, hitstop, and event. Camera and scale remain fixed across compared tiles. Include both directions and at least a small/narrow and large/wide opponent where the roster contains them. Never crop/recenter each tile in a way that conceals sliding.

The final rendered pose must be checked, not only the unblended clip or baked collision source. Also test live rendering at 30, 60, 120, and 144 Hz, plus jittered scheduling. A 30-Hz render cannot display every 60-Hz tick; verify internally retained contact poses and synchronized presentation rather than pretending every pose appeared on screen.

Event presentation must use one coherent visual snapshot. Do not show damage and a defender reaction from a newer state with the attacker still visually on an older startup pose. Contact hitstop should hold the relevant contact pose through its first presented impact frame. Deduplicate presentation events across replay/rollback without suppressing corrected state updates.

Playwright warns that screenshots vary with OS, browser, hardware, and other environment settings. Pin the environment for pixel baselines; use numerical assertions for cross-platform gameplay equality. [S12]

### 16.1 Additional audiovisual evidence from M

Every approved move includes a normal-speed gameplay video **with audio**, slow/frame-step review, contact sheet, hitbox/socket overlays, semantic event log, and exact asset manifest. Capture clean and effect-enabled views from the actual combat camera. Record how animation was sourced: stock procedural, imported/retargeted, repaired, or another explicitly reviewed path.

For projectile/setup moves, include trajectory/phase samples and entity IDs. For sound, include event counts and loop ownership before/after repeated use, correction, KO and reset. A contact sheet alone proves neither motion quality nor audio synchronization.

---

## 17. Acceptance matrix, mutation tests, and performance evidence

*Source basis: C §14 and M §11. T01–T15 are retained; T16–T23 below are explicit consolidation checks derived from the combined requirements.*

Each release candidate must pass these classes:

| ID | Gate | Acceptance |
|---|---|---|
| T01 | Tick convention | Exact oracle boundary values reproduced by engine |
| T02 | Active intervals | No damage outside them; expected contacts inside them |
| T03 | Damage identity | Once per hit-group/target/activation unless explicitly configured |
| T04 | Guard | Mid/low/overhead and posture semantics correct |
| T05 | Commands | Both facings, expired inputs, priorities, shared histories, chords |
| T06 | Links/cancels | Positive and negative boundary fixtures pass |
| T07 | Meter/scaling | Integer, deterministic, once-only spending and gains |
| T08 | Juggles/throws | Eligibility, budgets, tech, paired animation, reset rules |
| T09 | Collision calibration | Expected reach and whiffs; no cosmetic geometry authority |
| T10 | Animation | Contact, entry, recovery, root alignment, scale, feet reviewed |
| T11 | Determinism | Identical input/state replays produce matching gameplay hashes |
| T12 | Presentation | Live loop and exact-step lab agree on state/event alignment |
| T13 | Matchups | Required roster shapes/postures/corners exercised |
| T14 | Exploit search | No known infinite or unexplained long lockout in declared search |
| T15 | Regression safety | Earlier approved moves/routes still pass after each change |

Use example tests plus seeded property-based tests for input streams, timing boundaries, facing changes, long overlap, save/restore, and illegal state transitions. fast-check supports reproducible seeds and shrinking failing examples; preserve the shrunk trace as a named regression fixture. [S13]

Prove that the test suite notices deliberate faults. In isolated mutation builds, shift one damaging interval a tick early, disable all hitboxes, duplicate a hit event, inject a long startup crossfade, reverse facing twice, drop buffered input during hitstop, bypass meter cost, and keep the UI combo counter alive after recovery. Each corresponding test must fail. Revert mutations afterward.

Tests whose expected and actual values are both generated by the same flawed function are not independent verification. Maintain a small manually reviewed set of timing/guard/collision fixtures and mutation expectations outside normal automatic baseline regeneration.

### 17.1 Added integration gates

| ID | Integration gate | Acceptance |
|---|---|---|
| **T16** | Variant, entity and event identity | Stable distinct LP/HP IDs; explicit move kind/profile survives snapshots and owner state changes; hit/block/floor/expiry cues route correctly and fire once. |
| **T17** | Projectile/beam/hazard correctness | Fixed-point deterministic trajectories; phase/guard rules; shared caps; floor/expiry ties; geometry-aligned beams; per-target pulse intervals and duplicate-event resistance. |
| **T18** | Signature and advanced-feature boundaries | Adopted trigger mode; release/rearm; resource/storage distinction; no silently enabled command-grab, armor, teleport, reserve or focus semantics. Production candidates with unresolved contracts are rejected. |
| **T19** | Audio and loop lifecycle | Critical samples ready before use; no clipped/missing first cues; hit/block/ground distinguished; repeated render states do not replay sounds; no owned loops survive cancellation/reset/exit. |
| **T20** | Presentation/online hydration | Local and authoritative online state/trajectory samples and event counts agree for tested scenarios; correction neither duplicates one-shots nor drops corrected visible state; existing event broadcasts preserved. |
| **T21** | Bounded rendering and effects | Repeated-use and two-player stress stay within declared particle, decal, entity, audio-voice and memory bounds; reduced effects preserve tells; measured on the intended office machine/browser. |
| **T22** | Asset provenance and compatibility | Exact licence/redistribution receipts, original and derived hashes, compatible pinned libraries and render assets. No public asset with unresolved redistribution rights. |
| **T23** | Coverage and continuity | All declared playable moves/routes link to current evidence and hashes; no old approval survives affected asset/data changes; current progress identifies the exact failed/pending gate. |

### 17.2 Additional proposed mutation checks

In isolated, reverted mutation builds, deliberately strip a projectile’s move/profile ID from a snapshot, replay a release event twice, bypass a shared projectile cap, make a zone hit on every update, leave a charge loop running on reset, emit a super cue for any positive meter cost, and reinterpret HP as overhead globally. Each relevant integration test must fail. These extend C’s mutation requirement; no mutation is a production fix.

### 17.3 Match matrix and documented test scripts

Every move approval includes a normal-speed gameplay video with audio, a slow/frame-step review, a contact sheet, hitbox/socket overlays, an event log and a manifest of exact assets. A contact sheet alone cannot prove motion quality or sound synchronization.

Test near/far, left/right facing, corners, standing/crouching/jumping targets, hit/block/whiff, counter/armor/throw states, cancellation, hitstop, KO/double KO, round reset and match exit. Run repeated-use and two-player stress tests at different render rates; simulation results and cue counts must not change with display FPS.

Compare sampled states/trajectories and sound-event counts between local and authoritative online play. Verify snapshot hydration preserves move/entity IDs. Run an extended repeated-special match and confirm audio voices, particles, decals, entity counts and memory do not grow without bound. Measure on the actual intended office machine/browser; do not declare a frame-rate pass from a source review.

The repository documents these commands; verify the current scripts before running them on a later commit:

```bash
pnpm test:unit
pnpm test:integration
pnpm test:bots
pnpm test:e2e
pnpm build
```

No command above was executed during preparation of this plan. The README notes that E2E uses the system Chrome; do not install another Playwright browser blindly.

A move is approved only when its behavior, animation, hit detection, VFX, SFX and network presentation all agree. Visual polish is not permission to bypass a failed mechanical or timing gate.

Read M’s request to test “counter” states together with D12: core counter/punish labels are diagnostic and confer no bonus until explicitly defined. Armor and command-grab tests apply to the candidate extension suite when those features are present, not permission to enable them in baseline v0.

### 17.4 No evidence laundering

Report separately: source inspection, arithmetic fixture checks, headless-engine results, browser/live-loop tests, visual review, sound audition, target-machine performance, network scenarios, and actual playtesting. Tests not executed are **not run**, not “passed by inspection”. Missing equipment/capability leaves the corresponding status pending while unblocked work continues.

---

## 18. One ordered implementation sequence

*Integration proposal D15, combining C §15 and M §10. These gates replace the two competing execution sequences in this draft; they do not claim either original source already used this order.*

The dependency chain is:

```text
G0 inventory and baseline
 -> G1 contracts, decisions, schemas, reference records
 -> G2 headless timing and independent oracle
 -> G3 input, movement and restore
 -> G4 one complete actual shoto attack
 -> G5 Stinkfiend's two-variant ballistic/presentation slice
 -> G6 representative families and pilot content
 -> G7 pilot combos and exploit tests
 -> G8 pilot audiovisual polish and frozen baseline
 -> G9 staged roster expansion and advanced-feature contracts
 -> G10 complete roster supers, audiovisual pass and coverage
 -> G11 actual-match, online and release acceptance
```

Repository diagnostics, provenance collection and independent unblocked tests may continue when another feature is gated. This is not permission to skip prerequisite engine proof, mass-generate replacement assets, or claim a partial fighter is finished. Network/event/cleanup tests start in G5; they are not postponed until G11. A pilot super is needed in G7; G10 completes and reviews the roster’s supers rather than being the first time any super exists.

### G0 — Inventory, preserve, run, and reproduce

**Work.** Read the actual repository instructions, commit and dirty state; preserve user changes. Map all paths in Section 3 to real files. Verify package manager, scripts, versions, network mode, render loop, simulation clock, move/collision data and active procedural/imported assets. Establish the current baseline. Reproduce one premature hit and one bad transition **only if present** using exact inputs, and investigate M’s reported bindings, projectiles, zones, identity and event issues.

**Outputs.** `INVENTORY.md`, base commit/dirty summary, actual run commands, exact replay/input traces, baseline captures, scoped defects and blockers. Source findings stay labelled “reported” until checked.

**Pass.** Another run can reproduce the recorded baseline and distinguish actual failures from historical observations.

**Failure action.** Fix only the diagnostic/build blocker or report it. Do not invent a layout, defect or successful run. Do not rename legacy IDs or replace the animation path at the same time.

### G1 — Adopt contracts, expose decisions, and define schemas

**Work.** Install the master and merge compact agent instructions. Record D01–D15 dispositions. Define clocks/coordinates/tick order, motion/facing/chord policies, variant bindings, strict move and presentation schemas, event identity, projectile/node/hazard caps, approval states and source provenance. Begin the small pinned SF6/Ryu-role reference package; missing evidence stays unknown. Identify the pilot from existing usable assets.

**Outputs.** `DECISIONS.md`, schemas, convention examples, source records, pilot role mapping, initial source/asset manifests. Mark unresolved roster features as candidates, not production moves.

**Pass.** Schema rejects incomplete/unknown production fields, conflicting command bindings and missing referenced moves/assets. Source-derived facts, AIP defaults and consolidation proposals remain distinguishable. Required source files not supplied are explicitly pending.

**Failure action.** Keep incomplete rows and conflicting features out of the approved pack. Continue the synthetic core proof instead of inventing approvals or source values.

### G2 — Headless timing and independent oracle

**Work.** Adapt the smallest pure path for the two synthetic moves. Port Section 5.2 boundaries with independent expected values. Test active windows, hit/block recovery, guard-before-collision, earliest/latest links, cancel boundaries, trades, normal-throw ties and no double hit. Disable rendering.

**Outputs.** Named oracle/scenario fixtures, state traces, results, mutation failures and reverted mutations.

**Pass.** T01–T04 and relevant T06/T11 boundaries match the independent expectations; deliberate early-hit, disabled-box and duplicate-hit faults are detected.

**Failure action.** Repair tick/order/hit semantics before modifying attack assets or using VFX to judge timing.

### G3 — Input, movement, and complete state restoration

**Work.** Implement/test canonical QCF/DP/QCB/doubles, button-edge consumption, priority/resource fallback, manual and dedicated chords, action-request lifetime, sample-history expiry, both facings, side changes and hitstop. Verify walk, backward walk, crouch, jump, dash, pushboxes, boundaries, facing and state expiry. Remove the signature/super conflict through the tested bindings. Serialize clocks, history, requests and owned gameplay state.

**Outputs.** Input lab display, exported input traces, movement/corner fixtures and save/restore replay hashes.

**Pass.** Exactly the expected move executes per consumed edge; chords do not leak normals; held inputs do not spam; control/reset works; identical restored scenarios agree at different render rates.

**Failure action.** Fix input/control ownership, not compensating pose duration. Do not silently change the facing or buffer decision to make a fixture pass.

### G4 — One complete actual shoto attack

**Work.** Prefer a usable existing Goonström attack as C requests; record an existing-shoto fallback if needed. Replace the synthetic move with real collision, motion, pose mapping, reaction and hitstop in the actual match. Validate the active procedural path; separately prove an imported clip if that path is being considered. Repair one move using Section 8, not a whole animation set.

**Outputs.** Hit/whiff/block replays at range boundaries, clean/overlay captures, real-speed footage, calibrated body/striker dimensions, asset hashes and reviewed entries/exits.

**Pass.** The same move is mechanically correct and visibly contacts at the right place/tick in both directions without effects concealing a gap. Scale, planted feet and root registration are reviewed.

**Failure action.** Classify the defect as rig, pose, timing, blend, root, collision or stale presentation; change only the responsible layer and rerun prior tests.

### G5 — Stinkfiend’s LP/HP ballistic slice end to end

**Work.** Implement Section 10 only: distinct stable move IDs; opaque object; deterministic gravity/trajectory/floor/expiry; shared one-turd cap; correct socket/release; non-homing low arc and high lob; chosen phase/guard rules; separate hit/block/floor cues; cosmetic residue. Wire scoped events, profile-bearing snapshots/hydration, coherent mesh/impact VFX, and two distinct variant sound designs. Preserve event-driven broadcasts.

**Outputs.** Trajectory traces and move-identity snapshots, near/far/standing/crouching/jumping/facing/corner replays, exact outcome counts, clean and audiovisual evidence, local/online comparisons and cleanup counters.

**Pass.** Repeated inputs reproduce flight/results; authoritative entity and visible core agree; every outcome emits the correct event once; no generic green-orb substitute; no lingering damage zone; KO/reset/exit restore expected entity/effect/audio counts.

**Failure action.** Separate simulation trajectory/contact errors from release alignment, hydration, event routing and VFX errors. Do not make residue damaging or alter flight invisibly to rescue an effect.

### G6 — Representative families and the complete pilot move package

**Work.** Prove low kick/sweep, straight projectile, rising/airborne attack, travelling ender, normal paired throw, multi-hit and landing cases. Build the full pilot’s required normal/special roles and authored signature once its effect/trigger contract is adopted. Reuse the proven controller and explicit animation IDs. Add only schema fields demanded by a real approved family.

**Outputs.** Per-family positive/negative fixtures, hit-group tests, throw/landing evidence, complete candidate pilot move records and mechanical status. Pilot signature is not replaced by the generic lab charge action.

**Pass.** Each family has exact hit/block/whiff/recovery behaviour and reviewed geometry/animation, including interruption. The pilot can proceed to all route types without undefined core mechanics.

**Failure action.** Keep unproved families gated. Command grabs and air catches do not bypass ordinary-throw rules merely to finish a checklist.

### G7 — Pilot routes, scaling, meter, and exploit resistance

**Work.** Author explicit chains/cancels and natural links. Implement/test one pilot super and meter route, landing/jump-in links and a budgeted juggle. Produce all seven Section 11.3 route types, including block and near-miss versions. Run the independent immediate-guard/defender oracle, resource/scaling fixtures, seeded properties and bounded exploit search.

**Outputs.** Input-only route fixtures, measured hit times/damage/positions/defender-free tick, meter/scaling traces, reported bounds/seeds and minimal exploit replays.

**Pass.** Legal boundaries connect; the next invalid tick is defended; out-of-range attacks whiff; meter is paid once; actual gaps are labelled gaps; no known loop. At least one practical meterless confirm is not a one-tick or one-spacing miracle.

**Failure action.** Diagnose input, transition permission, timing, geometry and eligibility separately. Never inject hidden hitstun, pull targets into range or make later visible hits harmless to hide a loop.

### G8 — Pilot polish, playtest, and freeze

**Work.** Add final candidate hit/release sounds, bounded VFX, barks/callouts and restrained camera cues to the already proved pilot. Review blended transitions, recovery tails, contact snapshots, all target render rates, normal-match use, actual full-speed human confirms and feel. Rerun every previous gate and Stinkfiend’s slice.

**Outputs.** Frozen pilot evidence pack with commit/content/asset hashes, mechanical results, identified visual/audio reviewer, playtest record and unresolved issues.

**Pass.** Pilot mechanical validity, visual/audio review and playtesting are separately recorded; no known regressions; essential tells survive reduced effects; no false all-good status from compilation.

**Failure action.** Do not broaden the roster while shared timing/presentation is untrustworthy. Missing visual/playtest capability means pending, not a fabricated pass.

### G9 — Staged roster expansion and advanced-feature contracts

**Work.** Expand one fighter/family at a time through the same move-and-route approval process. M’s priorities are retained as content targets: complete Irstababben and Capitan early to prove weapon arcs, actor rushes, anti-airs, one-strike armor and grabs; then Babas beams, Ekander movement/rebound, remaining Stinkfiend, and Copper Thief blinks/strip; then Fippe’s bounded nodes/reserve and Goonström’s capped focus where not already needed for the pilot. Pilot dependencies may be pulled forward explicitly; do not secretly postpone the pilot’s required signature beyond its full-fighter approval.

For each extension, settle Section 9.2 and the relevant D07–D12 item before production. Recalibrate collision/reach and paired throws for preserved anatomy and both directions. Add complete route libraries for approved fighters, not generic copied routes assumed to work.

**Outputs.** Per-character move/route packs, adopted feature decisions, family-specific tests, pairings/body-size evidence, source/asset records and regression results for the original pilot.

**Pass.** No generic orb stands in for a rush/roll/beam/cable; node/zone pulses and caps are deterministic; teleports have legal arrivals; command grabs have explicit counterplay/whiff; no unresolved content contract is hidden in an approved pack.

**Failure action.** Keep failed characters/features out of the approved set and report incomplete roster coverage. Do not weaken common tests or resize characters to make pairings fit.

### G10 — All roster supers and final audiovisual consistency

**Work.** Complete all eight source-proposed supers under their adopted capture/hit-confirm rules and exact command bindings. Finish original barks, banks/mix, distinct material vocabulary, shared impact language, bounded VFX, readable telegraphs, camera response and reduced-effects mode. Recheck all ordinary variants, signatures, normals and routes after final assets change.

**Outputs.** A roster coverage matrix with every action’s definition, provenance, mechanical/visual/audio/playtest/network status and evidence hashes. For the supplied roster, account for all 64 special-action entries as a planning target, plus required normals, throws and movement.

**Pass.** Supers are not unavoidable unconfirmed cinematics; freeze/timing is explicit; opponent response exists before contact where designed; voices do not hide tells; no repeated full-screen flashes; cleanup/budgets/rights checks pass. Any incomplete action is shown as incomplete, not silently removed from the total.

**Failure action.** Fix the failed move/profile or hold its approval. Do not “complete” a unique move by recolouring a generic projectile, replacing its mechanics or dropping it from the roster plan.

### G11 — Actual-match, online, regression, and release handover

**Work.** Exercise local two-player and existing online matches, both slots/facings, all declared roster shapes/postures, both corners, throws/armor where approved, KO/double KO, restart, input focus reset, match exit, and disconnect behaviour if present. Compare replay/serialization and corrected event presentation. Run repeated-special/two-player stress and memory/effect/audio bounds on the intended office machine/browser. Verify and run the actual current test/build scripts.

**Outputs.** Acceptance report across T01–T23, exact environments and results, bounded-search limitations, performance recordings, replay/video links, source/content/asset hashes, known issues and the next incomplete gate if any.

**Pass.** Normal matches use the tested engine/controller/content, no lab-only route is required, no known infinite or major unresolved defect remains, presentation/online/cleanup agree, and production assets have rights evidence. Mechanical tests, visual review, sound review, playtesting and target-machine performance are separately supported.

**Failure action.** Report a blocked or partial release honestly. Preserve the last verified baseline and fix within the existing architecture. Do not declare networking solved by a fixed timestep or the full game validated by an arithmetic test.

### 18.1 Source-gate coverage map

| Original source gate | Covered here |
|---|---|
| C Gate 0 — Inventory and reproduce | G0 |
| C Gate 1 — Contracts and reference package | G1 |
| C Gate 2 — Headless timing and independent oracle | G2 |
| C Gate 3 — Input and basic movement | G3 |
| C Gate 4 — One complete actual attack | G4 |
| C Gate 5 — Representative attack families | G5–G6; advanced families in G9 |
| C Gate 6 — Combo system and reference routes | G7; repeated per fighter in G9 |
| C Gate 7 — Pilot polish and frozen baseline | G8 |
| C Gate 8 — Roster expansion | G9–G10 |
| C Gate 9 — Match integration and network-readiness | Early checks G5/G8; final G11 |
| M Gate 0 — Baseline and controls | G0–G3 |
| M Gate 1 — Stinkfiend’s two throws | G5 |
| M Gate 2 — Two complete fighters | Shared families G6; Irstababben/Capitan coverage G9 |
| M Gate 3 — Remaining mechanical families | G9; explicit pilot dependencies earlier |
| M Gate 4 — Supers and final presentation | Pilot subset G7–G8; complete roster G10–G11 |

---

## 19. Agent continuity, approval, and mandatory handover

*Source basis: C §16; M §11. The records below are proposed integration templates, not reports of completed work.*

At session start, read this document, decisions, progress, and the last failed test. Check current hashes against recorded evidence before resuming. Work on the first incomplete gate; do not start a new architecture because context was lost.

Each bounded change ends with updated progress: gate, base/current commit, dirty diff summary, changed assets/data, executed checks, failures, evidence paths, and next exact action. Progress files report facts; they do not retroactively redefine acceptance.

Approval states: `candidate` → `mechanically_valid` → `visually_reviewed` → `playtested` → `approved`. An agent may record mechanical results with logs. Visual review must identify the reviewed captures. Gameplay feel needs actual play or an explicitly labelled provisional assessment. No blanket “all good” status from a successful build.

Missing visual capability means visual review is pending. Missing source-game access means source reproduction is pending. Neither condition permits a fabricated pass. Continue independent, unblocked work and finish with exact boundaries of what is proven.

### Mandatory final handover for an implementation run

Report what changed, which requirements it addresses, old/new timing and reach where changed, passed tests with counts and environment, failed/pending tests, replay/capture links, source and asset hashes, and the next incomplete gate. Distinguish source data verification, specification arithmetic checks, engine tests, visual review, and playtesting.

**Completion means the actual match behaves correctly under the declared tests and the evidence exists. It does not mean the build compiles or a contact sheet looks convincing.**

### 19.1 Proposed progress record

Use the existing equivalent where one exists. Distinguish document version from implementation state; leave unknowns null instead of fabricating commits, counts or evidence.

```json
{
  "spec": "docs/combat/MASTER_PLAN.md",
  "specVersion": "1.0.0",
  "currentGate": "G0",
  "gateStatus": "not_started",
  "baseCommit": null,
  "currentCommit": null,
  "dirtyStateSummary": null,
  "pilotCharacterId": null,
  "adoptedDecisions": [],
  "pendingContentDecisions": [],
  "changedPaths": [],
  "changedAssetHashes": [],
  "checksExecuted": [],
  "failedChecks": [],
  "pendingChecks": [],
  "evidencePaths": [],
  "lastVerifiedBaseline": null,
  "nextAction": "Inspect the actual checkout and produce the G0 inventory and reproducible baseline."
}
```

### 19.2 Compact agent entry point

Merge this instruction with existing project rules; do not overwrite `AGENTS.md` or overwrite the user’s working tree.

```text
Read docs/combat/MASTER_PLAN.md, DECISIONS.md, INVENTORY.md and PROGRESS.json
before changing AIP Ultimate Fighter. Verify the checkout and evidence hashes.
Use the first incomplete gate G0-G11, not a newly invented execution order.
The master contains core rules, candidate roster designs and pending conflicts;
these are not interchangeable approval states. Preserve low/high button names,
legacy roster IDs, character proportions and the existing engine/network stack.
Use one authoritative simulation in the actual match and lab. Presentation
must never decide hits, damage, control, recovery, trajectories or combos.
Every change needs a scoped defect/requirement, an independent check, relevant
positive and negative fixtures, and evidence. Do not weaken tests, enlarge
hitboxes, add hidden stun, or refresh golden images to manufacture a pass.
Update progress with executed checks, failures, hashes, evidence and the exact
next action. No build-only, screenshot-only or self-scored gameplay approvals.
Missing source access, visual review or playtesting remains pending; continue
other unblocked work. Do not invent passes or implement pending product changes.
```

### 19.3 Required implementation handover structure

```text
SPEC / CHECKOUT
Master version, adopted decisions, base/current commit, dirty-state treatment.

CHANGES
Files/assets/data changed; requirement or reproduced defect addressed;
old/new timing, reach, resource and input behaviour where relevant.

VERIFICATION
Executed command/test, exact environment, counts/results and evidence path.
Separate arithmetic, engine, input, browser, animation, sound, network,
licence/provenance, performance, exploit search and human playtesting.

COVERAGE / APPROVAL
Which move/fighter/route passed which status, with reviewed hashes and captures.
Explicit failed, pending, untested or excluded candidates and reasons.

DELIVERABLES
Replay inputs, event/trajectory traces, clean/overlay/audiovisual footage,
contact sheets, source/asset manifests and last verified baseline.

NEXT ACTION
Current first incomplete gate, the exact next bounded task, and dependencies.
Do not report the whole roster or release complete from one successful slice.
```

---

## 20. Source registry, coverage, and deliverable limits

### 20.1 Combat reference registry inherited from C

C refers to a companion `SOURCES.md` for detailed URLs/access status; that file was not supplied. The identifiers below retain C’s descriptions and limitations. They do not imply that this consolidation retrieved these external pages. All AIP numbers and policies remain proposed design decisions. Recover the exact source records before relying on external claims; do not invent a current URL, build number or compatible tool version.

- S01: Ultimate Frame Data, Ryu — small retrieved data extract.
- S02: Ultimate Frame Data, SF6 index/about — collection provenance and animation recovery-tail note.
- S03: Capcom, Ryu frame data — preferred source; blocked during preparation.
- S04: Capcom, official practice/recording manual — preferred training reference; full retrieval unavailable here.
- S05: WistfulHopes, Hitbox Viewer 1.0 release — creator's reference tooling; current compatibility not established.
- S06: Elecbyte, AIR format — timed elements, collision boxes, frame stepping.
- S07: Elecbyte, State Controller Reference — hit properties, pauses, guard and reaction fields.
- S08: Elecbyte, Tutorial 4 — implemented attack/hitstop/guard/juggle example.
- S09: Three.js, AnimationMixer — exact-time sampling and time scale caveat.
- S10: Playwright, Clock — controlled browser time.
- S11: GGPO, official architecture — deterministic save/restore/frame execution.
- S12: Playwright, Visual comparisons — snapshot behaviour and environment limits.
- S13: fast-check, Why Property-Based Testing — generated cases, shrinking, reproducibility.
- S14: IKEMEN GO, upstream repository — implementation study reference, not a migration instruction.

### 20.2 Repository references inherited from M

M reports inspecting main commit `84128358ff290848e6d25fa0678530843f4c32e4`. These are its pinned references, preserved for inspection and comparison; this merge did not open or test the repository.

- `README.md`: https://github.com/aitp-andelf/aip-ultimate-fighter/blob/84128358ff290848e6d25fa0678530843f4c32e4/README.md
- `apps/web/package.json`: https://github.com/aitp-andelf/aip-ultimate-fighter/blob/84128358ff290848e6d25fa0678530843f4c32e4/apps/web/package.json
- `packages/contracts/src/ids.ts`: https://github.com/aitp-andelf/aip-ultimate-fighter/blob/84128358ff290848e6d25fa0678530843f4c32e4/packages/contracts/src/ids.ts
- `packages/contracts/src/content.ts`: https://github.com/aitp-andelf/aip-ultimate-fighter/blob/84128358ff290848e6d25fa0678530843f4c32e4/packages/contracts/src/content.ts
- `packages/contracts/src/protocol.ts`: https://github.com/aitp-andelf/aip-ultimate-fighter/blob/84128358ff290848e6d25fa0678530843f4c32e4/packages/contracts/src/protocol.ts
- `packages/sim/src/input/buffer.ts`: https://github.com/aitp-andelf/aip-ultimate-fighter/blob/84128358ff290848e6d25fa0678530843f4c32e4/packages/sim/src/input/buffer.ts
- `packages/sim/src/core/engine.ts`: https://github.com/aitp-andelf/aip-ultimate-fighter/blob/84128358ff290848e6d25fa0678530843f4c32e4/packages/sim/src/core/engine.ts
- `packages/sim/src/combat/attacks.ts`: https://github.com/aitp-andelf/aip-ultimate-fighter/blob/84128358ff290848e6d25fa0678530843f4c32e4/packages/sim/src/combat/attacks.ts
- `packages/sim/src/combat/projectiles.ts`: https://github.com/aitp-andelf/aip-ultimate-fighter/blob/84128358ff290848e6d25fa0678530843f4c32e4/packages/sim/src/combat/projectiles.ts
- `packages/sim/src/types.ts`: https://github.com/aitp-andelf/aip-ultimate-fighter/blob/84128358ff290848e6d25fa0678530843f4c32e4/packages/sim/src/types.ts
- `packages/content/src/characters/shoto-a.ts`: https://github.com/aitp-andelf/aip-ultimate-fighter/blob/84128358ff290848e6d25fa0678530843f4c32e4/packages/content/src/characters/shoto-a.ts
- `apps/web/src/game/renderer.ts`: https://github.com/aitp-andelf/aip-ultimate-fighter/blob/84128358ff290848e6d25fa0678530843f4c32e4/apps/web/src/game/renderer.ts
- `apps/web/src/audio/sound.ts`: https://github.com/aitp-andelf/aip-ultimate-fighter/blob/84128358ff290848e6d25fa0678530843f4c32e4/apps/web/src/audio/sound.ts
- `apps/server/src/rooms/MatchRoom.ts`: https://github.com/aitp-andelf/aip-ultimate-fighter/blob/84128358ff290848e6d25fa0678530843f4c32e4/apps/server/src/rooms/MatchRoom.ts

### 20.3 Completeness and provenance map

| Supplied source section | Master location / explicit treatment |
|---|---|
| C §0 — Authority/exclusions | 0–1; 404 inspection limitation preserved as source status |
| C §1 — Product contract | 2 |
| C §2 — Reference strategy | 4; missing companion extract called out |
| C §§3–5 — Clocks/timing/order | 5.1–5.3; arithmetic examples retained |
| C §6 — Move data/guard/geometry/root | 7 |
| C §7 — Animation repair and thresholds | 8 |
| C §8 — Inputs/signature | 6; conflict handling D03–D07 |
| C §§9–12 — Combo/damage/routes/oracle | 11.1–11.4 |
| C §13 — Lab/evidence | 16; event alignment also 12 |
| C §14 — Acceptance/mutations | 17, including all T01–T15 |
| C §15 — Files/gates | 3 and 18; all original gates mapped |
| C §16 — Continuity/handover | 19 |
| C §§17–18 — Registry/bundle limits | 20; referenced but absent bundle components not claimed supplied |
| M §§1–2 — Decision/reported inventory | 0–3; architecture and historical findings retained |
| M §3 — Input/roster binding | 1–2 and 6; conflicting policies explicitly registered |
| M §4 — Roster move bible | 9, all eight source entries and resource/counterplay guidance retained |
| M §5 — Stinkfiend first slice | 10; ambiguous startup interpretation labelled |
| M §6 — Files/events/animation | 3, 7–8 and 12 |
| M §§7–8 — VFX/audio | 13–14 |
| M §9 — Resources/licensing/URLs | 15; attributed dated reports, not new verification |
| M §10 — Delivery gates | 18; all original gates mapped |
| M §11 — QA and scripts | 16–17 and G11 |
| M §12 — Pinned source files | 20.2 |

### 20.4 Supplied versus referenced artefacts

The consolidation inputs are the two Markdown documents only. This output is a master specification with a source-preservation bundle and document-integrity hashes. It does **not** include the separate `SOURCES.md`, `reference-snapshot.json`, portable arithmetic checker, original executable oracle fixtures or original integrity package mentioned by C. They are not silently regenerated as if they had been supplied.

It also does not contain repaired animations, generated character assets, an audited current repository, a tested production move pack, verified working character combos, an implemented lab, a performance benchmark or an approved release. The first implementation deliverable remains **G0: the actual checkout inventory and reproduced baseline**.

### 20.5 Consolidation verification

Document checks may verify that all eight named roster sections, source move names, critical numerical contracts, T01–T15 and the original gate coverage are represented. These are **document completeness checks**, not gameplay or legal/asset-rights tests. The accompanying manifest records exact SHA-256 hashes of the source files and generated master so later edits can be detected.

**Final acceptance principle:** the actual match must behave correctly under the declared tests, retain each character’s mechanics and identity, and have reviewable evidence. The master plan is a means to reach that result, not evidence that the result already exists.


### 20.6 Exact input document hashes

```text
47bd525884c64f13215cd2ddd05a9af01441bb9941396b873464a09b648df97e  COMBAT_TRUTH.md
5c04ce0439669abfd733d7a16577627c87f6cf508f6500aed3f2c96894a2a76c  AIP_Ultimate_Fighter_Moves_SFX_VFX_Plan.md
```
