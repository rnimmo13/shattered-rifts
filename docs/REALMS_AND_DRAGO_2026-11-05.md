# Eleven realms and Drago — 2026-11-05

Local 0.209.0 / rules 86. Implementation authorized; release not approved.

New runs save a shuffled permutation of eleven distinct worlds and one realm-native Warden per world. Four existing shared realms retain both possible Wardens. Cindervault, Thalassar, Vespera and the Hourglass Expanse add four new Wardens, twelve ordinary unit definitions and eight Elites. All regular fights, Elites and event ambushes use the tier’s realm; card/class homelands and acquisition probabilities are unchanged. The Far Rifts remains the Regent’s distinct broken realm. The Midden stays outside the eleven-Warden route. More realms can exist in the world.

Tier XII is the First Ruin, Drago’s completely conquered and nearly consumed homeland. Five native dragon Wardens, separately shuffled, precede Drago. Six fights replace twelve; three upgrade/remove-only shrines after fights 2, 4 and 5 replace five after 2/4/6/8/10. Each choice upgrades or removes one card, without healing. Warden Gifts drop 11 → 5, guaranteed finale Max HP growth +55 → +25; automatic Warden recovery/Resolve/rewards remain, with existing Fraying Ward. Final boss still completes immediately without payout. There are seventeen boss encounters across a new run instead of twenty-three. Enemy HP/damage tier multipliers, Omens, class starting stats and Arena balance are unchanged by this realm work.

Valerion → Drago is a display rename. Internal vorthax IDs, raw replay titles and action logs remain. Archived Campaign fight titles render Drago only when the setup contains the final boss; Arena player names are untouched. Published historical patch notes stay historical.

## Existing saves

Keep already-generated maps, selected nodes, pending rewards and current battle checkpoints. New maps generated after advancement use the selected old Warden’s realm but keep the old saved Warden order; they do not promise eleven unique worlds retroactively. Future ungenerated finales use the five native dragons. Already-generated twelve-fight legacy finales keep all fights and five shrines. A cleared pre-twelve-tier legacy route moves into the native finale. New-route realm/boss selections are validated together on load.

## Authored NPC values

Values below are base definitions before existing tier/Omen/phase and Might/Exposed modifiers. Moves repeat in the listed order. Damage hits are separate hits. Status amounts follow existing keyword duration/decay rules. Summoned Rift Shards use their existing definition. These are initial authored values, not measured class-parity results.

### Cinder Soldier

Base HP: 42. Ashen Cut: 1 × 8 damage to its target. Ember Guard: 7 Barrier to self; 1 × 5 damage to its target.

### Kiln Wisp

Base HP: 32. Furnace Spark: 1 × 6 damage to its target; 1 Seared to its target. Heat Veil: 7 Barrier to self.

### Ash Collector

Base HP: 40. Gather Embers: 1 Might to self; 5 Barrier to self. Scatter Ash: 1 × 7 damage to its target.

### Cinder Marshal

Base HP: 120. Rally the Ash: 2 Might to self; 10 Barrier to self. Furnace Cleave: 1 × 18 damage to all opponents. Brand: 1 × 13 damage to its target; 2 Seared to its target.

### Walking Kiln

Base HP: 128. Stoke: 18 Barrier to self. Kiln Blast: 2 × 9 damage to its target. Vent: 1 × 13 damage to all opponents; 1 Exposed to self.

### The Ashbound Colossus

Base HP: 210. Stoke the Heart: 24 Barrier to self; 2 Might to self. Ashen March: 1 × 16 damage to all opponents. Furnace Rupture: 1 × 27 damage to its target; 2 Exposed to self.

### Pearl Crab

Base HP: 42. Pearl Shell: 8 Barrier to self. Tidal Claw: 1 × 8 damage to its target.

### Tide Sprite

Base HP: 32. Surge: 1 × 6 damage to its target. Living Tide: heal 5 HP to all allies.

### Reef Stalker

Base HP: 38. Reef Bite: 2 × 4 damage to its target. Dive: 5 Barrier to self; 1 × 5 damage to its target.

### Mirror Ray

Base HP: 116. Mirror Tide: 5 Reflect to self; 10 Barrier to self. Ray Sweep: 1 × 16 damage to all opponents. Breaking Wave: 1 × 20 damage to its target; 1 Exposed to self.

### Deep Watcher

Base HP: 126. Abyssal Gaze: 1 Faltering to its target; 1 × 11 damage to its target. Many Arms: 3 × 6 damage to its target.

### The Pearlbound Sovereign

Base HP: 210. Crown of Mirrors: 24 Barrier to self; 7 Reflect to self. Royal Tide: 1 × 18 damage to all opponents. The Ebb: 1 × 23 damage to its target; 2 Exposed to self.

### Dream Moth

Base HP: 32. Dream Dust: 1 × 5 damage to its target; 1 Faltering to its target. Flutter: 1 × 8 damage to its target.

### Hollow Sleeper

Base HP: 44. Sleepwalk: 8 Barrier to self. Waking Blow: 1 × 10 damage to its target.

### Memory Thief

Base HP: 36. Forgotten Cut: 1 × 8 damage to its target. Borrow a Memory: add 1 Static to the opponent’s fight discard pile.

### Nightmare Loom

Base HP: 118. Weave a Nightmare: add 2 Static to the opponent’s fight discard pile; 10 Barrier to self. Dream Snare: 1 × 17 damage to its target; 1 Faltering to its target.

### Dream Custodian

Base HP: 124. Hush: 1 × 12 damage to its target; 1 Faltering to its target. Guard the Dream: 15 Barrier to self. Wake: 2 × 9 damage to its target.

### The Dreaming Monarch

Base HP: 215. The Sleeping Court: add 2 Static to the opponent’s fight discard pile; 18 Barrier to self. Royal Hush: 1 × 17 damage to its target; 1 Faltering to its target. Wake the World: 1 × 25 damage to its target; 1 Exposed to self.

### Sand Sentinel

Base HP: 46. Sandstone Strike: 1 × 9 damage to its target. Dune Guard: 8 Barrier to self.

### Glass Scorpion

Base HP: 34. Glass Sting: 1 × 5 damage to its target; 2 Seared to its target. Scissor Claw: 1 × 8 damage to its target.

### Dune Scribe

Base HP: 36. Erase: 1 × 7 damage to its target. Inscribe: 1 Might to all allies.

### Bronze Sphinx

Base HP: 124. Ancient Riddle: 12 Barrier to self; 1 Exposed to its target. Sunlit Pounce: 3 × 7 damage to its target.

### Hourglass Giant

Base HP: 136. Gather the Sands: 2 Might to self; 10 Barrier to self. Falling Age: 1 × 21 damage to its target.

### The Sandbound Chronicler

Base HP: 220. Measure the Age: 2 Might to self; 16 Barrier to self. Erosion: 1 × 15 damage to its target; 1 Brittle to its target. Three Ages: 3 × 7 damage to its target. Turn the Hourglass: 1 × 26 damage to its target; 1 Exposed to self.

### Pyrewing, the Cinder Tyrant

Base HP: 225. Gather the Pyre: 20 Barrier to self; 2 Might to self. Worldfire Breath: 1 × 19 damage to all opponents; 3 Seared to its target. Cinder Talons: 2 × 12 damage to its target; 1 Exposed to self.

### Nacreth, the Glassscale

Base HP: 230. Mirror Scales: 28 Barrier to self; 8 Reflect to self. Glassfall: 3 × 8 damage to its target. Fractured Breath: 1 × 24 damage to its target; 2 Exposed to self.

### Morvane, the Hollow Maw

Base HP: 230. Brood of Ruin: summon one Rift Shard; summon one Rift Shard. Hollow Maw: 1 × 23 damage to its target. Devour the Brood: devour surviving friendly Rift Shards; heal 1% Max HP and gain 1 Might per shard; if none, 2 Exposed to self. Leader: its death ends surviving summons.

### Aethrion, the Storm-Crowned

Base HP: 220. Storm Crown: 2 Might to self; 16 Barrier to self. Crown of Bolts: 4 × 7 damage to its target. Thunderwake: 1 × 18 damage to all opponents; 1 Exposed to self.

### Xalvorr, the Last Eclipse

Base HP: 240. Last Eclipse: 20 Barrier to self; 1 Brittle to its target. Eclipse Talons: 2 × 11 damage to its target. Endless Night: 1 × 26 damage to its target; 1 Exposed to its target; 1 Exposed to self.

## Evidence and limits

The retained Golemancer and Assassin Campaign snapshots/final-fight trace are observations of older routes, not independent matches or complete reward histories. No new-realm real-player outcome sample or representative current Arena dataset is available. This pass runs deterministic content, move-cycle, route, save/migration and UI checks only; no balance simulations. All thirty Ascendancies, ten starting classes and mixed engines remain unmeasured for the new encounters. Test I–III starter survival against every newly possible Warden; IV–VII setup/recovery; VIII–X encounter counters; XI–XII loss of six Gifts and two refinement opportunities, entry deck quality, HP, retry/rebuild capacity and the final pre-Drago cleanup. Compare opening, turns 6–10 and beyond ten own turns without claiming equal raw damage or human parity. Arena has no new opponents/rules from this content expansion; the separately approved Recall revision still applies to both modes.

## Art

Nine new Warden cutouts: apps/web/public/art/figures/{ashbound-colossus,pearlbound-sovereign,dreaming-monarch,sandbound-chronicler,pyrewing,nacreth,morvane,aethrion,xalvorr}.png. Built-in image generation; exact prompt set in art-prompts/0.209-wardens.json. Ordinary inhabitants alias existing painted figures and have distinct procedural fallbacks. Existing arena layers are reused by theme, including a shared First Ruin arena for the five native dragons and Drago. No new environment paintings are claimed. Alpha bounds and a visual contact sheet were checked.

## Local verification

- Full Vitest suite: 3,942 tests in192 files pass, including route uniqueness/native boss selection, realm-pure fights/ambushes, rewards/refinement/save-resume, legacy map/fight preservation, content validation, all nine authored boss move cycles and presentation-only Drago aliasing. These are deterministic fixtures, not measured playtests.
- Workspace type-check and web/desktop-shell builds checked. ESLint has zero errors and the two existing Fast Refresh warnings in PileArt.tsx/MapInk.tsx. No native release package or publication performed.
- Isolated Electron UI smoke at1366×768,390×844 and320×740: realm/finale maps, long Hourglass title and selected Warden, three shrines,13 lore worlds and native dragon battle. Screenshots inspected; new long battle titles now fit between controls/timer instead of overlapping desktop buttons. Fixture server blocks external network/account writes. Screenshots remain under ignored .wrangler/realm209-ui/.
- Asset manifest changes limited to nine registrations; generated art alpha/contact sheet inspected. Raw image generation prompts retained in docs/art-prompts/0.209-wardens.json.
- Previous Recall/shard snapshots remain unchanged; new realm assessment appends all30 Ascendancies/ten starts/three mixed-engine rows. No balance simulations, new human outcomes, commit, push or deployment.
