# AIP Ultimate Fighter — Moves, SFX and VFX implementation plan

Prepared: 17 September 2026

Repository: https://github.com/aitp-andelf/aip-ultimate-fighter

Inspected main commit: `84128358ff290848e6d25fa0678530843f4c32e4`

Status: planning document based on source inspection. No repository files were changed. No build, game session, performance benchmark or complete sound-library audition was performed. Resource pages and licence terms were checked; suitability still needs the in-game acceptance gates below. New move names and mechanics are proposed design unless explicitly identified as user requirements.

## 1. Decision

Keep the TypeScript/Three.js/Colyseus architecture and headless 60 Hz combat authority. Replace generic projectile presentation with real mechanical types and explicit per-move presentation profiles. The first complete implementation slice is Stinkfiend's low forward throw and high falling throw, not all eight characters at once.

Gameplay owns movement, collisions, timing, armor, invulnerability, resources, trajectories and hit outcomes. Animation, VFX and audio describe that state and never decide whether an attack hit.

## 2. Verified starting point

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

## 3. Input contract

```text
QCF = down, down-forward, forward
DP  = forward, down, down-forward
QCB = down, down-back, back

QCF + LP / HP   = special family 1, light / heavy variant
DP  + LP / HP   = special family 2, light / heavy variant
QCB + LK / HK   = special family 3, light / heavy variant
HP + HK         = unique signature; hold/release only for specified moves
LP + LK         = normal throw
Double QCF + P  = forward-motion super, for assigned characters
Double QCB + K  = backward-motion super, for assigned characters

Never bind HP+HK to BOTH signature and super.
Strength and guard category are independent. HP does not imply overhead.
Six command variants + one signature + one super = eight special actions per fighter.
Normals, throws and movement states are additional.
```

Proposed super-input allocation: double QCF+P for Irstababben, Femboyfippe, Babas, Goonström and Copper Thief; double QCB+K for Capitan, Stinkfiend and Ekander. This allocation is a design proposal, not a claim about existing code.

Motion-history length and the existing action buffer must be separate configuration values. Store raw direction samples and facing. For the first version, clear unfinished motions when facing changes, and lock attack facing when a command is accepted; cover this rule in tests. Resolve double motions, chords, DP/QCF ambiguity and normal fallbacks with a documented deterministic priority. Consume every button edge used by a chord; held buttons must not repeatedly execute a move.

Preserve legacy roster IDs during the first pass. In particular, `grappler-b` is Babas and `zoner-b` is Stinkfiend; their intended fighting styles must not be inferred from those prefixes.

## 4. Proposed roster move bible

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

## 5. First complete slice: Stinkfiend Turd Toss

```text
Scope: QCF+LP and QCF+HP only, on the actual combat camera.

1. Ordered motion recognition works facing both directions.
2. Light and heavy resolve to distinct stable move IDs.
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

## 6. Simulation and presentation contract

### Existing files to extend

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

### Proposed new modules (adapt names to code organization)

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

Do not implement a second combat engine inside these modules. Separate mechanical primitives from appearance: straight projectile, ballistic projectile, beam, stationary node/zone, actor movement track, actor teleport and command grab. A laser's visual segment and attack shape must agree. A roll's visual body follows the authoritative actor; an animation's root motion must not move the actor twice.

Event payloads should identify match/round, event ID, tick, source, optional target, move ID, attack instance, optional projectile/entity ID, contact position and outcome. Cosmetic random variation uses a separate seed, never combat RNG. Persist projectile move/presentation identity into snapshots; do not reconstruct it from the owner's current move after they have recovered or started another attack.

Emit semantic cues for windup, release, hit, block, armor, ground impact, cancellation and end. One-shots are deduplicated by scoped event ID. Continuous effects belong to a specific attack/entity and are stopped on cancellation, death, reset, despawn or match exit. Avoid repeatedly playing a sound from a render-state condition.

Change the existing assumption that every positive meter cost emits a super event: use explicit move kind. An expensive normal special is not a super cinematic.

### Animation alignment

Use explicit animation IDs and marked phases: anticipation, release/first active tick, contact, recovery and return to stance. Bind sockets for hand, pizza-peel tip, eyes, heart module, cable endpoint, pelvis and floor anchor. Display socket markers during development. The presentation may use bones for attachment, but authoritative collision/spawn coordinates remain simulation-defined.

Existing procedural pose substring guesses must not choose an unrelated attack. Free humanoid clips are candidates, not approved animation replacements. Validate one imported clip and one stock procedural move side by side before committing to a different animation path. Use in-place clips when the simulation owns displacement.

## 7. VFX production system

The rendering recipe is a solid readable core, a short directional trail, a confirmed impact, then optional flavor. Character palettes are identifiers, not a substitute for different shapes.

Use small meshes for turds, pineapple silhouettes, physical cable coils and nodes. Use strips/quads for beams and ribbons. Use atlas flipbooks for impact/smoke bursts and flat pooled decals for splats. Bake selected CC0 Effekseer effects from the combat viewing angle when practical; do not add a second real-time effect runtime just to play a few impact bursts.

three.quarks is an optional batching/trail layer within the current Three.js renderer. It is not mandatory for the first slice. Test against the repository's pinned Three.js 0.180.0 before adopting it, and record a compatible version rather than claiming it is a proven drop-in.

Pool effect objects and reuse atlas/material resources. Give every emitter a duration, particle cap and owner. Emit by elapsed time or simulation events, not by the number of render frames. Cap decals and trails; particles should not cast shadows. Start with a conservative effect-light budget of one or two transient lights for the whole match, and change it only after measurement. This is a proposed budget, not a measured performance guarantee.

Attack-attached animation/effects use the same hitstop policy as the attack. Projectile visuals must not freeze while an authoritative projectile continues to move. Aftermath smoke may follow a separate cosmetic clock. Reduced effects can remove debris, bloom and camera shake but must preserve telegraphs, projectile cores, arrival markers and ground-danger indicators.

## 8. Sound production system

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

## 9. Verified free resource shortlist

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

### Sonniss-specific restriction for this public project

The currently published GDC licence is version 2.0, effective 27 August 2026. It allows use in finished games but restricts redistribution of sounds as assets, including edited or redesigned sounds. New downloads use the licence published on the download date, which may differ from an old copy in the ZIP. It also restricts developing/training/enhancing AI technologies with the licensed audio. Default to CC0 sources for committed public assets; consider a private asset/build path or written permission for Sonniss instead of assuming remixing removes the restriction.

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

## 10. Ordered delivery gates

### Gate 0 — Baseline and controls

Record the working commit and current test outputs. Inventory current asset/procedural paths. Add input tests before replacing bindings. Do not rename legacy IDs or swap the animation system at the same time.

Pass: both facing directions recognize all commands; signature never becomes super; a throw chord never leaks into a normal; repeated held input does not spam; existing tests have no unexplained regression.

### Gate 1 — Stinkfiend's two throws

Complete the slice in section 5, with real gravity, proper event identity, two distinct sounds and coherent mesh/impact effects. No lingering damage zone yet.

Pass: repeated identical inputs give identical trajectories and hit results; local and online agree; each impact emits exactly one correct event; animations release the object at the right place and tick; cleanup returns to the expected baseline.

### Gate 2 — Two complete fighters

Complete Irstababben and Capitan's command variants and signatures. These prove projectiles, weapon arcs, actor rushes, anti-airs, armor and grabs. Keep super cinematics minimal until these are playable and punishable.

Pass: no generic-orb substitute for a body attack; no invisible extended hitboxes; complete hit/block/whiff/recovery review; resources and cancels are explicit and tested.

### Gate 3 — Remaining mechanical families

Add Babas beams, Ekander's actor rolls/rebounds, the remainder of Stinkfiend, and Copper Thief's teleports/strip hazard. Then add Fippe's bounded two-node/reserve system and Goonström's capped focus state.

Pass: beam shapes match guard rules; legal capped teleport arrivals; one allowed roll rebound; hazards respect per-target intervals; no permanent setups or duplicate pulses after snapshots/reset.

### Gate 4 — Supers and final presentation

Complete the eight supers, recorded barks, sound mixing, shared impact language and restrained camera response. Cinematics never grant an unconfirmed hit. Slow down or constrain shots only when combat rules explicitly support that state.

Pass: readable opponent response before activation/contact where intended; audio ducking and loop cleanup work; no repeated full-screen flash effects; reduced-effects mode retains essential tells.

## 11. Acceptance and QA evidence

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

## 12. Pinned repository references

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
