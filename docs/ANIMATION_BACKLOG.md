# Animation backlog: premium Wardens and card casts (internal)

**Status:** planned, not started. Written 2026-11-12 at Robert's request: "every boss should have interesting animations that gamers will
find premium/polished/exceptional and unique", and cast animations "like a fireball that actually flies to the enemy and hits it with a
burn, or electric shocks that go to enemies and chain", especially for rare cards, special tokens and scaling cards. **Not for the
current pass.** If nothing here has started by 2026-11-14, remind Robert it is waiting.

Two pieces of work, each with its prompts below, ready to paste:

- **A. The Wardens and Drago:** each gets several drawn signature attacks, an entrance, a hit and a death of its own, instead of one
  generic attack.
- **B. Card casts:** effects that travel from the caster to the target and land, rather than one painted picture playing on a spot.

## Where things stand (2026-11-12)

- **Enemies, Wardens included:** 157 creatures have pose-sheet animations built (`assets-src/units-pose-sheets`, see
  `RESUME_UNITS_BUILD.md`), but not wired into the game yet. Only heroes are animated in battle. Each creature has one attack: 8 drawn
  poses over two 4-pose sheets, plus hit/death. Its effects are generic, picked by attack kind (lunge, claw, slash, smash, shoot, cast).
  So the dragons all lunge, and the casters all throw the same orb.
- **Heroes:** redrawn in HD with 10-pose attacks (`assets-src/heroes-pose-sheets`, `make_hd_recipes.py`, DECISIONS #759). That set-up
  (3 poses per 1536x1024 image, ready stance at the left) is the model for the Warden redraws below.
- **Card effects:** 287 rare and uncommon cards have a painted 6-frame effect (`public/art/fx/rare|uncommon`, `docs/rare-fx-prompts.md`,
  `uncommon-fx-prompts.md`), played on one spot by `fight/fxPlayer.ts`. The drawn attack effects (arcs, tracers, orbs, rings) live in
  `fight/attackFx.ts`. Nothing travels from caster to target, and nothing chains between targets.
- Nine of the Wardens, those of worlds 8-12 (Ashbound Colossus, Pearlbound Sovereign, Dreaming Monarch, Sandbound Chronicler, the five First Ruin
  dragons) are being redrawn in the cartoon style now (`CHATGPT_RESTYLE.md`). Do the Warden work after that lands, from the restyled
  references.

## A. Wardens and Drago: premium signature animations

### The bar

- **Moves:** 3 signature moves per Warden (4 for Drago), each a full drawn sequence of about 8-10 poses (anticipation, wind-up peak,
  release, contact, follow-through, recovery), plus:
  - an **entrance** when the fight opens (rises, lands, unfurls);
  - a **phase or enrage** pose for Wardens with a phase rule;
  - a **heavy-hit stagger** distinct from small hits;
  - a **death** that suits the creature: shatters, dissolves, collapses into its element. Not the generic fall.
- **Each move uses the whole body and the creature's own idea.** A dragon breathes, beats its wings to make a gale, dives from above,
  sweeps its tail, spits a projectile. It does not just claw again. Read the Warden's rule (`WORLD_RULES`) and build a move around it,
  so the animation teaches the mechanic.
- **The telegraph reads:** each move's wind-up is held long enough, and is distinct enough, that a player learns to recognise it. That
  fits the intents.
- **Effects are part of the move:** breath cones, shockwaves, falling debris, screen shake and hit-stop, a projectile that travels. They
  are drawn by the game, not painted into the sheets (the sheets stay clean, as now).
- **Which move plays:** the game picks the move by the intent being carried out (attack, multi-hit, debuff, summon, buff). This needs a
  small presentation map, Warden move to intent kind, in the web app. Nothing in the engine (golden rule 2).

### First ideas per Warden (to refine with Robert; check each against the Warden's rule)

| Warden | Realm | Signature move ideas |
|---|---|---|
| Seraphine, the Gilded Warden | Aurelion | Sun-spear thrown from on high; wings flare into a blinding dawn burst; dive-smash that leaves a halo crater |
| The Hollow Benediction | Aurelion | Censer swing trailing hollow light; a hymn that rings bells overhead; an empty-robed lunge that passes through the target |
| KR-0N "Kron" | Nexus-9 | Piston fist with a steam blast; arm swaps to a rivet gun burst; furnace-chest vent that sprays sparks |
| Mother of Static | Nexus-9 | Arcing lightning web that chains; a broadcast pulse ring; drones peel off her body and dive |
| Gorrmaw, the Hunger Below | Wyldmaw | Bursts up from below in a ring of jaws; tongue lash that drags; a swallowing gulp |
| The Upside-Down Stag | Wyldmaw | Antler sweep along the ceiling line; hooves stamp the sky and thorns rain down; a charge that flips gravity for a beat |
| Nyxara, the Veiled Matriarch | Umbral Veil | Veil cast that splits her into illusions, one of which strikes; mask-thrown daggers; a curtain-drop ambush |
| The Applause Below | Umbral Veil | Stage trapdoor snaps open; a bow, then a thrown bouquet of knives; spotlight beam that stuns |
| The Mourning Tide | Gloomfen | A wave of the drowned rises and crashes; lantern souls fired in a volley; a grasping swamp pull |
| Queen of the Unmade | Hollow Crown | Falling-star rain; crown shards orbiting then launched; she unmakes a slice of the board (an erase sweep) |
| Event Horizon Regent | Far Rifts | Gravity well that pulls the target in; the light bends around a lensing beam; a collapse pulse |
| The Ashbound Colossus | Cindervault | Furnace-belly ember blast; the ground cracks into lava lines; an ash-avalanche fist |
| The Pearlbound Sovereign | Thalassar | Mirror-tide reflection strike; pearl bombardment; a reef-coral spear rising from below |
| The Dreaming Monarch | Vespera | Dream bubble that bursts into a nightmare creature; stolen-memory shards; a lullaby wave that blurs |
| The Sandbound Chronicler | Hourglass Expanse | Sand-scroll lash; an hourglass flip (time rewinds the target's last move); twin-sun beams crossing |
| Pyrewing, the Cinder Tyrant | First Ruin | Fire breath cone; a wing-beat gale of embers; sky dive with an impact firestorm |
| Nacreth, the Glassscale | First Ruin | Glass-shard breath that refracts into several beams; a scale-shed volley; a crystal tail sweep |
| Morvane, the Hollow Maw | First Ruin | Void inhale that drags; spits a bile orb that bursts; a jaw slam from above |
| Aethrion, the Storm-Crowned | First Ruin | Lightning breath that chains; a crown-of-storms call that strikes from the sky; a thunder wing clap shockwave |
| Xalvorr, the Last Eclipse | First Ruin | Eclipse beam (the screen darkens, a ring of light); shadow-wing envelop; a corona flare burst |
| Drago, Heart of the Rift | Final | 4 moves, one per incarnation's theme, plus the rift itself tearing behind him; an entrance and a death that end the campaign |

### Prompt A1: ChatGPT, Warden signature-move pose sheets (one Warden at a time)

Fill in the angle brackets, attach the Warden's current reference picture (after the restyle for worlds 8-12), and use the same image
format as the hero HD redraw so the existing pipeline takes it (`make_hd_recipes.py` / `build_units.py` can be extended).

```
I'm making 2D game sprites at high resolution for a boss in my card game. The attached picture is <NAME>, <ONE-LINE LOOK AND REALM>.
Using this creature EXACTLY as designed (same shape, colours, proportions and bold-outline cartoon style), draw its signature
animations as separate images, one after another.

Rules for all images:
- Landscape, 1536 x 1024 pixels. Exactly THREE full-body poses in one row: the READY STANCE on the left (identical in every image),
  then the two named poses in order, each centred in its third.
- Draw it BIG: the ready stance about 700 pixels tall (or wide, for a long creature), feet on the same ground line in every image.
- Plain solid bright green background, exactly #00FF00. Nothing touches or is cut off by the edges; clear space between poses.
- Every pose faces right. Draw only the creature: NO fire, breath, beams, sparks, glows, motion lines, dust or shadows (the game draws
  every effect). Parts that glow in the design stay exactly as they are.
- The poses of a move are consecutive moments of ONE continuous movement, each a small even step on from the last.
- No text, labels, borders or grid lines.

MOVE 1, <MOVE NAME>: <one sentence: what the move is and what the game will draw with it, e.g. "fire breath: the game draws the flame
cone from the open jaws">. 10 poses: (1) settling in, (2) anticipation <...>, (3) coiling, (4) wind-up peak <...>, (5) release <...>,
(6) mid-strike, (7) contact / full extension <...>, (8) follow-through <...>, (9) recovery, (10) settling back.
Save as <id>_boss_m1_01.png ... <id>_boss_m1_05.png (two poses each).

MOVE 2 and MOVE 3: the same, saved as <id>_boss_m2_NN.png and <id>_boss_m3_NN.png.

ENTRANCE: 4 poses, from <how it arrives: dropping from the sky / rising from the ground / unfurling> to the ready stance.
Save as <id>_boss_entrance_01.png and _02.png.

HEAVY HIT: 4 poses: impact, stagger back, catching itself, recovering. Save as <id>_boss_heavyhit_01.png and _02.png.

DEATH: 6 poses ending in its final state: <how this one dies: collapses into ash / shatters into glass / dissolves into the tide>.
Draw the pieces it breaks into as part of the creature, touching it. Save as <id>_boss_death_01.png ... _03.png.

Save every image as a PNG in this folder, with exactly these names:
D:\Code\ShatteredRifts\assets-src\units-pose-sheets\<group>\<id>
```

### Prompt A2: Claude/Codex, building and wiring the Warden moves

```
Read docs/ANIMATION_BACKLOG.md part A and assets-src/units-pose-sheets/RESUME_UNITS_BUILD.md. ChatGPT has drawn signature-move
sheets for <WARDENS> (<id>_boss_*.png, 3 poses per image, ready stance left, same format as the hero HD redraw). Build them into the
Warden's animation with the pose pipeline: one clip per move (moveN), an entrance, a heavyhit and a death clip, each with its hit/land
events, and the move's own effects drawn by the game (breath cones, chained lightning, falling debris, shockwaves, projectiles that
travel to the target). Effects are game-side, not baked into the frames, and must follow the speed, reduced-effects and Low
graphics settings. Pick the move from the intent being carried out through a presentation-only map in apps/web (nothing in the engine;
cards and enemies stay data). Keep pack sizes in check: the idle-first packing and the Medium/High sets of DECISIONS #759 apply. Review
every move frame by frame, then record a DECISIONS entry. Do not push or release without Robert's approval.
```

## B. Card casts that travel, land and leave their mark

### The bar

- **The effect travels.** A cast leaves the caster, travels to its target on a readable path, and lands with an impact that applies its
  status visibly (the burn catches, the shock crackles on, the Bleed opens). Examples:
  - a fireball arcs over and bursts into flame on the target;
  - lightning jumps target to target for chain effects, in the order the engine resolves them;
  - frost shards fan out to every enemy;
  - daggers fly in a spread;
  - a heal is a ribbon of light from the caster to the ally;
  - a summon tears a small rift open where the unit appears.
- **The moment lines up.** The board already fires each blow's moment on its own timer (golden rule 4: gameplay never waits on
  animation). The travel time is folded into that moment. Damage numbers and status icons appear at impact, not at cast.
- **A tier of polish by rarity:**
  - *Rare cards, special tokens and scaling cards* each get a bespoke cast. A scaling card shows its scale: a fireball that grows with
    the Burn stacks, a chain that gets one more jump per charge, a strike that glows hotter per copy played.
  - *Uncommons* get a travelling version of their painted effect.
  - *Commons* use shared casts by element (fire, frost, storm, shadow, holy, nature, blood, arcane, physical).
- **Built from parts:** a cast is a projectile loop (4-6 frames, painted), a trail (drawn), an impact burst (6 frames, painted) and a
  status stamp (the existing `debuff-*`/`tick-*` strips). Elements reuse parts; bespoke rares get their own.
- **It honours the settings.** Reduced effects shows the impact only. Low graphics shows the impact as one still frame. Reduced motion
  skips the travel. Cap how many play at once (as `fxPlayer` does).

### Prompt B1: ChatGPT, projectile and impact strips (one batch per element or per bespoke card)

```
I'm making 2D game effect sprites for a card game with a bold, bright, painterly-cartoon fantasy look. Make <ELEMENT / CARD NAME>
effects as separate images, each on a plain solid black background (#000000) so it can be blended additively:

1. PROJECTILE LOOP: one row of 6 frames, 256x256 px each (1536x256 in all), of <a fireball / a ball of crackling lightning / a frost
   shard> flying to the RIGHT, centred in each frame, a seamless loop (frame 6 leads back into frame 1). The trail is short; the game
   draws the long trail.
2. IMPACT: one row of 6 frames, 384x384 px each (2304x384), the <fireball bursting into flame / lightning striking and crackling out>:
   (1) first contact flash, (2) peak burst, (3)-(5) spreading and breaking up, (6) last embers, almost gone.
3. <Only for chain effects> ARC: one row of 4 frames, 512x128 px each, a jagged lightning bolt running left to right edge to edge,
   different each frame (the game stretches it between targets).

Bright saturated colours, a clear readable silhouette at small size, no text, no frame borders, nothing cut off at the frame edges.
Save as PNG files named <id>_projectile.png, <id>_impact.png, <id>_arc.png in:
D:\Code\ShatteredRifts\assets-src\fx-casts\<id>
```

### Prompt B2: Claude/Codex, the cast system

```
Read docs/ANIMATION_BACKLOG.md part B, docs/04_VISUALS_AND_ANIMATION.md, apps/web/src/fight/fxPlayer.ts, fxMoments.ts, attackFx.ts
and Fighters.ts. Build travelling card casts: a presentation-only map from card id (and, for shared casts, the card's element/tags)
to a cast (projectile strip, trail colour, path: straight/arc/fan/chain, impact strip, status stamp), played from the caster to the
target(s) in the order the engine's events resolve, with the moment (damage number, status icon) at impact. Chain effects jump target
to target. Scaling cards scale their cast by the value that grows (size, jump count, intensity). Start with the shared element casts
and a first batch of bespoke rares (<LIST>), using the strips in assets-src/fx-casts once packed into public/art/fx/casts. Follow the
speed, reduced-effects, Low graphics and reduced-motion settings, cap concurrent casts, never make gameplay wait, and add tests that
every mapped card has its strips. Record a DECISIONS entry. Do not push or release without Robert's approval.
```

### First candidates for bespoke casts (to pick with Robert)

- **Rares:** start with the cards played most per class (the balance export, `docs/BALANCE.md`), one or two per class.
- **Scaling cards:** cards whose value grows over the fight. Examples: Gathering Storm, Thunder Memory, Death Grip (Commands played),
  Slow Murder, Rending Fury, Final Reckoning, Bloodstorm and the X-cost cards.
- **Special tokens:** Flame Echo, Sleeve Knives, Ashes, totems commanded (Hawk's Dive, Bear, Thunderbird), the Necromancer's death
  bursts, Shatter and Fracture (these already have painted strips; give them a travelling stage).
