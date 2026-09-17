# AIP Ultimate Fighter — Combat Source of Truth

**Version:** 1.0.0  
**Prepared:** 17 September 2026  
**Status:** implementation specification; NOT an implementation or a gameplay approval  
**Scope:** repair and validate the existing browser-based, TypeScript, 2.5D fighting game with animated 3D characters. This is not MAD HOUSE VN.

## 0. Read this before changing anything

The goal is not to make animations look plausible in isolation. It is to make player input, authoritative movement, animation, collision, damage, reactions, and combos agree in the actual match.

The implementation agent must work from this document, versioned move data, and executable tests—not recollection of a conversation. No document guarantees that an agent cannot make mistakes. This specification makes important mistakes observable and prevents unverified work from being silently promoted.

### Authority and change control

1. The user's explicit requirements govern the product.
2. This versioned specification governs implementation and proposed v0 defaults.
3. Validated, approved move data governs runtime behaviour.
4. Independent test fixtures govern acceptance, not runtime behaviour.
5. Reference-game data supplies evidence and starting points, not automatic balance approval.
6. Existing code, animation duration, generated screenshots, and model opinions are not independent authorities.

A conflict is a defect to report. Do not resolve it by silently changing the document, expected results, timing, damage, reach, or screenshots. A deliberate design change must identify the old value, new value, reason, affected routes, and verification. User-requested changes can supersede this document; preserve the amendment and increment the version.

Use the proposed defaults in this document to keep work moving, but label them **AIP design decisions**, not Street Fighter facts. Missing reference evidence must remain unknown. Continue other unblocked gates; never invent source verification.

### Hard exclusions

Do not replace the game engine, migrate networking, generate a new roster, redesign the UI, or add unrelated mechanics as part of this repair. Do not implement separate combat logic in the lab. Do not use animation-end events or wall-clock timeouts to apply hits, unlock control, or finish recovery. Do not hide defects with large hitboxes, effects, long crossfades, time-scaling the entire game, or automatically refreshed golden images.

The repository metadata request for `aitp-andelf/aip-ultimate-fighter` returned HTTP 404 during preparation. Existing source paths, dependencies, and implementation details were not inspected. File paths below are proposed logical locations. First map them to the actual repository; do not reorganize working code just to match a diagram.

## 1. Product contract

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

## 2. Reference strategy: borrow a coherent package

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

During this preparation, the official Capcom frame/manual pages could not be fully opened. The included `reference-snapshot.json` therefore contains only a small, explicitly attributed extract from the reachable UFD Ryu page. It is **page-read evidence, not independently reproduced game data and not production-approved move content**. No exact current Capcom patch identifier was independently confirmed. [S01–S04]

Store per-field evidence status: `page_read`, `source_game_reproduced`, `adapted_candidate`, or `approved_aip`. Store source URL, retrieval date, source move, build/patch identifier if verified, control mode, hit conditions, and evidence filenames/hashes. Null means unknown; it never means zero, unlimited, or permission granted.

A source website may update after retrieval. Freeze the selected local dataset; do not silently track its latest values. Keep raw source values separate from adapted AIP values. A checksum of normalized JSON is not a checksum of the original website.

### What to preserve when adapting

Preserve purposeful relationships: which check is fast; which button confirms; which poke trades cancel access for risk; which special is unsafe; which ender spends meter for reward. Keep a complete initial package rather than cherry-picking the best property of every character.

Use a consistent position unit and one health scale. Normalize motion/reach only after calibrating fighter height, pushboxes, and camera. Do not normalize every character to identical anatomy. Long limbs, broad bodies, and unusual weapons require matchup tests.

Character flavour can replace the visual delivery of a role without changing the entire combat rulebook. A themed projectile can first inherit the pilot projectile's tested spawn, travel, and end conditions; its changed size/reach must then be tested as a gameplay change.

Do not import commercial meshes, animations, sounds, or whole third-party assets into the shipped game without appropriate permission. Do not assume that a public repository licenses all character packs linked from it.

## 3. One simulation; explicit clocks

Use a fixed 60-Hz input/simulation step. Render independently. Use integer/fixed-point gameplay coordinates, velocities, timers, and damage, with explicit rounding and safe integer bounds. Keep renderer floats, model physics, system time, and unseeded random values out of gameplay decisions.

For v0, use these clocks:

- `sampleTick`: advances every 60-Hz step, including impact pauses; records raw input.
- `battleTick`: advances only when global combat is not frozen.
- `moveTick`: advances with battle ticks while the move owns the fighter, except explicit per-move holds.
- Presentation time: samples combat state; never decides combat outcomes.

**Proposed simplification:** v0 impact hitstop freezes both fighters and gameplay projectiles globally. This is an explicit AIP policy, not an exact SF6 reproduction. Freeze motion, move clocks, stun countdowns, collision progression, and the matching poses together. Continue input sampling and command recognition. Do not repeatedly process a frozen contact. Cosmetic impact effects may continue on presentation time.

Use four live battle ticks as the action-request lifetime, including the recognition tick: valid on `createdBattleTick` through `createdBattleTick + 3`. It does not age during global hitstop. Raw motion recognition still uses sample ticks so an extremely old partial motion cannot remain valid forever. Keep at most one pending request per player, resolving it through documented priority, rather than queuing a whole combo.

Save/restore must include all clocks, freeze counters, input histories, pending requests, move instances, projectiles, hit registries, meter, combo/juggle state, facing history, seeded randomness, and event IDs. GGPO's documented requirements—save state, restore state, and execute a frame without rendering—are a useful architecture test, not a demand to install GGPO or change current networking. [S11]

## 4. Timing convention: remove the off-by-one ambiguity

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

### Stun and advantages

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

### Mandatory arithmetic fixture

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

The bundle includes a small independently specified arithmetic oracle for these cases. Passing it validates the specification's arithmetic only. Port the same boundary fixtures into the real engine; do not claim the game passed because the Python checker passed.

## 5. Tick processing order

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

## 6. Move data, animation data, and collision data

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

## 7. Animation repair recipe

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

## 8. Input recognition and arbitration

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

### Signature action

Proposed states: entry, hold, release attack, recovery. Initially grounded/neutral entry only; no armor or invulnerability; cannot begin in hitstun/blockstun. Starting from an illegal state does not arm a future automatic charge just because buttons stay held.

Release either button to request release; require both buttons released before rearming. Charge uses battle ticks and freezes with hitstop. Proposed levels are 0 below 30 held battle ticks, 1 at 30–59, 2 at 60 or more, saturating at level 2. Interruption cancels the action and clears stored charge in v0. The animation reflects charge; it does not determine charge.

The signature's actual character effect remains a design slot. Implement the controller with a labelled test action, not an invented production ability. Allow no combo-entry/cancel permissions for it until its move definition is approved.

## 9. Combos: explicit permissions plus actual consequences

A combo is not a prerecorded animation sequence. It is a sequence of separately entered legal attacks in which each follow-up actually connects while the defender is still in the appropriate hit-imposed vulnerable state.

Never implement a universal “recent hit” timer that increments a combo counter regardless of defender recovery. Never pull the opponent into range to make a named route work. Never inject extra hitstun because the next input resembles a planned combo.

### Links

A link starts the next move after the previous move has completed its gameplay recovery. For a grounded, in-range follow-up without unusual travel or freezes:

```text
nextContactTick = attackerFreeTick + inputDelayTicks + nextStartup - 1
true link requires nextContactTick < defenderFreeTick
```

Equivalently, a zero-delay link needs next startup no greater than the previous move's measured hit advantage. This is only a timing filter; geometry and the defender's posture must also permit the hit.

A four-tick command lifetime makes early input more forgiving. It does not allow the next attack to start before the attacker is legal or extend the defender's stun. In particular, it must not turn an impossible +3 into a legal link to a five-frame attack.

### Cancels

A cancel is an explicitly permitted transition before the current move's ordinary recovery ends. It is not a speed multiplier and not an animation crossfade that happens to look like another move.

A cancel edge specifies source move, target move/command class, half-open source move-tick window, required result, posture, resource cost, and any per-sequence limit. Validate entry, exit, and the new move's own startup.

For v0, allow selected normal-to-special edges on hit or block, but not on whiff. Allow selected special-to-super edges on hit only. A permitted cancel does NOT prove the resulting sequence is a true combo: a slow projectile or distant hit can still leave a gap.

Contact-created permission becomes usable only after contact resolution, as defined in Section 5. Input received during hitstop may be buffered, but no extra attacks are spawned inside a frozen tick.

### Target chains

A target chain is an authored normal-to-normal cancel route, not a universal rule that every button can cancel into every stronger button. Start with one two-normal target route per character to make basic confirms accessible.

Each chain edge has the same explicit timing/contact requirements as any cancel. Repeated fast/check attacks require explicit self-chain permission and a finite per-sequence limit; initial self-chain limit is two activations. This does not alter independently legal links, which must be tested for spacing and loops.

The target route is not a button that plays the entire chain. Each move still needs its own fresh input. Do not buffer the entire route in advance.

### Juggles

Begin with a small point-budget design, rather than importing several incompatible air-combo systems. Elecbyte documents juggle points as an explicit engine mechanism; the AIP numbers here are our own. [S08]

An approved launcher starts an airborne hit-imposed state and grants two follow-up move slots. Only moves explicitly marked as juggle-capable can spend a slot. Spend one slot per newly connecting follow-up move activation, not for every internal hit of a validated multi-hit attack. A launcher cannot refill the budget during the same combo.

The final permitted juggle follow-up must have a reviewed terminal knockdown result. No ground bounce, wall bounce, restand, or off-the-ground hits in the initial package. Airborne hurtbox overlap alone is insufficient: target state, slot availability, and hit-group permissions must all pass.

On landing, transition through the declared knockdown and wake-up states. Do not retain a hidden juggle/combo state after the defender has recovered. Optional later air recovery must have explicit input and timing rules rather than an animation-dependent escape.

### Throws

Normal throws do not connect to a defender in hitstun, blockstun, airborne state, or existing throw state in v0. Their default result is a terminal paired sequence, not a combo extender. Add a proposed five-battle-tick throw-protection window following hitstun, blockstun, or wake-up: protect the first free tick and the next four battle ticks. Use an eight-sample-tick normal-throw tech window from capture, including the capture sample. Hold global gameplay and the capture pose in a distinct capture-pause state while raw input continues; resolve a valid tech or begin the paired throw when that window closes. This pause is not extra hitstun and is stored separately from impact hitstop.

These values are AIP defaults, not imported reference facts. A normal throw must have a visible whiff and punishable recovery. Success uses paired attacker/victim tracks aligned to actual capture anchors, with bounded adjustments reviewed against each body-size class. Do not teleport the victim across a visible gap. A tech produces no throw damage and resolves symmetrically.

A future command grab is a separate move family with separately approved rules; do not quietly give every throw command-grab properties.

## 10. Damage, meter, and infinite-combo safeguards

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

### Route design targets, not fake balance proof

For the first package, aim for ordinary practical routes of roughly 2–5 moves and 15–30% baseline health; a full-meter route may reach roughly 30–45%. These are proposed initial design ranges, not copied game statistics or a guarantee of balance. Multi-hit attacks can show more hits without meaningfully longer routes.

Do not automatically buff every route to meet a percentage. Each character needs useful alternatives with differing position, resource cost, and risk. Preserve the distinction between a safe check, a punish, a risky launch, and a resource-heavy conversion.

## 11. Required combo library

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

## 12. Independent combo oracle and defender behaviours

The combat engine emits a trace; a separate validator reads it. The validator must not simply accept the game's combo counter or call the same combo-classification helper under test.

For every hit after the first, independently establish that the previous hit-imposed state still prevented the relevant defense, that the transition was legal, that contact geometry was valid, and that the target was eligible. End the uninterrupted combo at actual recovery, not because a UI number faded out.

Grounded test defender: take the first intended hit, then choose the correct block direction/height on the first legal tick. It must block a follow-up with a real gap. A jab-mashing dummy is insufficient: its attack may be too slow to exploit a gap that allows blocking.

Add separate defender modes for always-block, crouch-block, jump on first legal tick, throw-tech, reversal on first legal tick when a reversal exists, and scripted punish. Defensive test agents have access to scenario expectations; do not confuse this diagnostic ability with fair human reaction speed.

Airborne sequences require state/juggle checks because an airborne character may be unable to block by design even after hitstun. “The dummy did not block” therefore does not prove an air combo.

### Required positive and negative pairs

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

## 13. Combat lab: same engine, controllable evidence

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

## 14. Acceptance matrix and mutation tests

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

## 15. Implementation gates and proposed files

Adapt these names to the actual stack after Gate 0. Keep an existing test runner/package manager where suitable. Do not introduce a monorepo, change frameworks, or upgrade unrelated dependencies merely to match these names.

```text
AGENTS.md                          short binding entry point; merge existing rules
 docs/combat/COMBAT_TRUTH.md        this versioned specification
 docs/combat/DECISIONS.md           explicit amendments and reasons
 docs/combat/INVENTORY.md           actual paths, build commands, assets, defects
 docs/combat/PROGRESS.json          next gate, blockers, hashes, evidence
 docs/combat/sources/               reference records and normalized extracts
 combat/content/moves/             strict move data (or existing equivalent)
 combat/content/routes/            input-driven route fixtures
 combat/input/                     recognizer and arbitration
 combat/sim/                       authoritative timing, movement, contact
 combat/presentation/              animation adapter and event presentation
 combat/lab/                       developer UI and capture adapter
 tests/combat/oracle/               independent boundary fixtures
 tests/combat/scenarios/            positive and negative match fixtures
 tests/combat/property/             seeded generated tests
 tests/combat/visual/               approved capture fixtures
 tools/combat/                     validation/export/search commands
 artifacts/combat/<build-hash>/     generated evidence; not new source authority
```

### Gate 0 — Inventory and reproduce

Read the actual repository, existing instructions, dependency versions, run commands, state controller, move tables, collision, and animation code. Preserve uncommitted user work. Record the base commit and dirty state. Start the current build; reproduce one premature hit and one poor transition if present. Do not claim a defect without evidence.

**Done:** path map, reproducible inputs, baseline capture, and a scoped defect list. **Failure action:** fix only the diagnostic/build blocker or report it; do not invent a current source layout.

### Gate 1 — Contracts and reference package

Install the document and compact agent rules without discarding existing instructions. Define schemas, statuses, coordinate conventions, exact tick order, input defaults, and a small reference import with provenance. Map reference roles to existing AIP moves.

**Done:** schema rejects incomplete production content; conventions have explicit examples; proposed defaults are visibly distinct from measured game facts. **Failure action:** keep uncertain rows as candidates, not runtime content.

### Gate 2 — Headless timing and independent oracle

Implement or adapt the smallest pure simulation path needed for two synthetic moves. Port the arithmetic cases; verify hit, block, link boundaries, cancel boundaries, simultaneous trades, and no double-hit. Keep all renders disabled.

**Done:** independent fixtures and the first mutations pass/fail as expected. **Failure action:** fix tick semantics before touching animation assets.

### Gate 3 — Input and basic movement

Implement the declared commands, chords, buffering, facings, action eligibility, walk/crouch/jump/dash, pushboxes, corners, and state restoration. Add debug input display and trace export.

**Done:** controlled traces produce exactly the expected moves and movement under both facings; save/replay matches. **Failure action:** correct input/control ownership, not a compensating animation.

### Gate 4 — One complete actual attack

Replace a synthetic attack with one real existing character move. Author collision, motion, pose-time map, reactions, and hitstop in the actual scene. Reproduce hit/whiff/block across reach boundaries and both facings.

**Done:** one attack has mechanical proof plus reviewed real-speed contact. **Failure action:** classify the failure using Section 7 and change only the responsible layer.

### Gate 5 — Representative attack families

Prove a kick/low, projectile, rising/airborne move, travelling ender, and throw. Add the multi-hit and landing cases. Do not yet produce every character's full set.

**Done:** each new family has its own positive/negative and visual evidence. **Failure action:** extend the schema only for an actual missing requirement, not speculative complexity.

### Gate 6 — Combo system and reference routes

Add explicit target/cancel edges and natural links. Verify meter/scaling, jump-in landing, short juggle, and super routes. Run the independent defender oracle and initial exploit search.

**Done:** the pilot has reproducible route types from Section 11, with reported conditions and failing near-misses. **Failure action:** diagnose input, permission, timing, geometry, or target eligibility separately. Never add invisible stun to force a named route.

### Gate 7 — Pilot polish and frozen baseline

Review blended transitions, full-speed feel, recovery tails, sound/impact synchronization, live rendering rates, and normal-match behaviour. Re-run every previous gate and freeze a pilot evidence pack.

**Done:** the pilot is mechanically valid, visually reviewed, and playtested. These are three separate statuses. **Failure action:** do not expand the roster until the shared pipeline is trustworthy.

### Gate 8 — Roster expansion using the same process

Adapt one additional character at a time. Preserve its proportions and themed roles. Recalibrate reach, collision, and throw pairings. Reuse rules and tooling, not blind per-bone transforms or character-size assumptions.

**Done:** all declared playable characters have their required moves/routes and matchup evidence; shared changes do not break the pilot. **Failure action:** keep failing characters/moves out of the approved pack rather than weakening shared tests.

### Gate 9 — Match integration and network-readiness

Verify local two-player matches, round restart, KO cleanup, tab focus/input reset, disconnect behaviour if present, serialization, deterministic replay, and corrected event presentation. Exercise existing network mode without replacing its transport. Record latency-specific limitations separately from offline correctness.

**Done:** actual game matches use the tested content/controller and no lab-only behaviour is required. A fixed timestep alone is not proof of network determinism. [S11]

## 16. Agent continuity and approval records

At session start, read this document, decisions, progress, and the last failed test. Check current hashes against recorded evidence before resuming. Work on the first incomplete gate; do not start a new architecture because context was lost.

Each bounded change ends with updated progress: gate, base/current commit, dirty diff summary, changed assets/data, executed checks, failures, evidence paths, and next exact action. Progress files report facts; they do not retroactively redefine acceptance.

Approval states: `candidate` → `mechanically_valid` → `visually_reviewed` → `playtested` → `approved`. An agent may record mechanical results with logs. Visual review must identify the reviewed captures. Gameplay feel needs actual play or an explicitly labelled provisional assessment. No blanket “all good” status from a successful build.

Missing visual capability means visual review is pending. Missing source-game access means source reproduction is pending. Neither condition permits a fabricated pass. Continue independent, unblocked work and finish with exact boundaries of what is proven.

### Mandatory final handover for an implementation run

Report what changed, which requirements it addresses, old/new timing and reach where changed, passed tests with counts and environment, failed/pending tests, replay/capture links, source and asset hashes, and the next incomplete gate. Distinguish source data verification, specification arithmetic checks, engine tests, visual review, and playtesting.

**Completion means the actual match behaves correctly under the declared tests and the evidence exists. It does not mean the build compiles or a contact sheet looks convincing.**

## 17. Source registry

Detailed URLs and access status are in `SOURCES.md`. Citations here identify evidence for external mechanisms; all AIP numbers and policies are explicitly our proposed design decisions.

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

## 18. What this bundle has and has not proven

This bundle provides a plan, proposed rules, a small attributed reference extract, arithmetic fixtures, a portable arithmetic checker, and integrity hashes. It does not contain repaired animations, a complete game-compatible move pack, an implemented combat lab, verified game combos, or a repository audit. The included verifier checks the bundle and synthetic equations only.

The first deliverable from the coding agent must therefore be the real Gate 0 inventory and baseline reproduction—not an assertion that this document already validated the game.
