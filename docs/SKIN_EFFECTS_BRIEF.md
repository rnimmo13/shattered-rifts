# Shattered Rifts: skin effects brief

What each skin's effects should be, so a paid skin feels premium next to the free base look. Written 2026-11-13 for the
agent building the game. Read `docs\ANIMATED_CHARACTER_GUIDELINES.md` first: sections 7 to 9 are the rules this follows.

This is a design brief, not a specification of code. Nothing here changes the rules of the game: effects are cosmetic.

## Where things stand

- Four skins are live: `knight-demon-knight`, `spellblade-nova-ronin`, `engineer-arc-welder`, `assassin-rogue-tailor`.
- Each one's only effect is an attack kind and tint, set by `if` lines in `apps\web\src\fight\FightView.tsx`
  (`demonKnight`, `novaRonin`, `arcWelder`, `rogueTailor`).
- Six more skins have ChatGPT prompts written (`assets-src\heroes-pose-sheets\CHATGPT_SKINS_BATCH_2.md`) and no art yet.
- Skins are free for now; the Store is planned.

## What to build, in order

1. **One effects table per skin** in place of the `if` lines: each skin's attack kind, tint, hit effect, idle ambience,
   power-up effect, death effect and sounds, looked up by skin id. Adding a skin then means adding a row.
2. **The four live skins' effects** from the table below. These need no new art.
3. **A `fidget` clip:** played once every 6 to 10 seconds between idle loops, at a random interval so two characters do
   not fidget in step. Never during an attack, hit, power-up or death. The live skins' fidget sheets are requested in
   `assets-src\heroes-pose-sheets\CHATGPT_LIVE_SKIN_REVISIONS.md`.
4. **Props with their own loops:** a prop sheet placed on an anchor point of the character and animated out of step
   with the body. Needed for the Bone Puppeteer's puppet, the Ash Falconer's phoenix and the High Roller's chips and
   dice. The Shaman's spirit hawk is the nearest thing in the game today.
5. **A Store preview** that plays idle, then the attack with its effects, in the skin box.
6. **The opponent's skin shown in the Arena**, ghosts included.

Show each step working on screen before moving to the next. The session that shipped the Demon Knight never saw him on
screen.

## The effects

Each skin keeps one signature colour through everything. "Idle" effects must be light: a few particles, never a storm.

### Live skins (no new art needed)

| Skin | Colour | Idle | Attack and hit | Power-up | Death |
|---|---|---|---|---|---|
| **Demon Knight** | Red on black `#ff354b` | The red cracks on his arm pulse slowly; the shadow tendrils behind him curl and drift | The slash leaves a red-black crescent; the hit throws dark embers | The tendrils flare out into ragged wings of shadow | He dissolves into black smoke that is drawn into the sword |
| **Nova Ronin** | Violet `#b46bff` | Violet sparks crawl along the katana; star motes drift up from the blade | A thin cut line hangs in the air, then the enemy flashes a beat later | A ring of stars bursts outward from the blade | He fades into drifting star motes |
| **Arc Welder** | Electric blue `#4fc3ff` with orange sparks | The gauntlet cell flickers; the wasp drone bobs and leaves a short light trail | A crackling arc from the drone with orange welding sparks; the hit leaves a glowing scorch that cools | The drone circles her, drawing a ring of sparks | The gauntlet overloads, arcs and goes dark |
| **Rogue Tailor** | Amber gold `#eab06d` | A gold thread drifts and curls from the needle | The stab stitches a gold seam across the enemy, which snaps on the hit | Ribbons and thread spiral up around her | She unravels into loose thread |

**Arc Welder recolour.** Her glow was purple, the same as Nova Ronin's. Recoloured copies of her two game sheets, with
the gauntlet cell, hip canister and drone stinger in electric blue, are in
`assets-src\heroes-pose-sheets\engineer-arc-welder\recolour-electric-blue` (`atlas0.webp`, `atlas1.webp`, same size and
layout as the live ones, plus the script that made them). Swap them into
`apps\web\public\art\heroes-sheets\skins\engineer-arc-welder` and change her attack tint from `#c477ff` to `#4fc3ff`.
Her rubber hose stays dark purple. Check her on screen after the swap: a few edge pixels of the old purple may remain.

**Demon Knight: two premium effects on top of the table.** Robert really likes how he came out, so his art does not
change. Add:

- **Blood-fed blade:** each hit he lands makes the red line on his sword burn brighter and the red cracks on his arm
  glow a little further up, in three steps, fading back over the next two turns. He visibly powers up as a fight goes on.
- **Shadow reap:** when his slash kills an enemy, the enemy's shadow is torn off and pulled into the sword along his
  tendrils, with a short red flash on the blade.

### New skins (after their art exists)

| Skin | Colour | Idle | Attack and hit | Power-up | Death |
|---|---|---|---|---|---|
| **Moonshine Marshal** | Blue alcohol flame | The still bubbles and vents blue vapour; its gauge pulses | Blue flame on the muzzle flash; the hammer leaves a burning star brand | She breathes a blue fireball upward | The still bursts in a puff of blue flame |
| **Tempest Sage** | Gold-white lightning | Her markings (arms, hands, forehead, collarbones, neck, midriff, feet) follow her stance. Serene: a cool pale-blue glow with a slow pulse, storm cloud drifts round her feet. Fury: they burn red-gold and flicker, static crackles over her arms. Radiant: they blaze white-gold, the forehead mark flares, a lightning halo behind her head. No stance: a faint resting glow | A lightning ring on each punch; in Fury a thunderclap with a small screen shake | Lightning strikes her raised fist | The charge grounds out through the floor |
| **Bone Puppeteer** | Bone white and rose pink | The puppet hangs on glowing strings and dances | The puppet lunges at the enemy on its strings and claws | Puppet silhouettes rise from the ground behind her | The strings snap; she and the puppet collapse |
| **Ash Falconer** | Fire orange | The phoenix preens and stretches on her glove; embers drift up | The phoenix swoops with a fire trail; the hit bursts into feathers of flame | The phoenix circles overhead in a ring of fire | It burns to ash, then rises again beside her |
| **Glacier Lancer** | Ice cyan | Breath mist, slow snowfall, a cold shimmer on the blade | Frost shards burst on the stab; the enemy frosts over briefly | An ice-crystal crown forms around him | He freezes over and the ice shatters |
| **High Roller** | Teal neon and gold | Chips and dice orbit her and flip; neon runs along her outfit; her trap box sits beside her while a trap is set, eyes peeking from under the lid, and springs open when one goes off | The thrown card bursts into dice and coins | A slot reel spins behind her and lands on a jackpot | Her cards scatter and flutter down |

**Tempest Sage: a set for each stance (new to build).** Robert (2026-11-13): each Monk stance has its own animations.
Besides her main set (faint cyan markings, also the Store look), she has a Serene, a Fury and a Radiant set, each with
its own ready stance, idle, fidget, attack, hit and power-up, the markings painted in the stance's colour (pale blue,
red-gold, white-gold). The fall and death are shared from the main set. Files: `<clip><Stance>` sheets
(`monk-tempest-sage_hd_attackFury_01.png`, `idleSerene`, `hitRadiant`...) and `monk-tempest-sage_reference_<stance>.png`.
To build: the packer packs the three stance sets as extra clips (or extra manifests) of her model, and the battle
screen picks the set from the hero's `calm` / `wrath` / `radiant` status, switching at the next idle loop when the
stance changes and loading all four sets with her (about three times one skin's size). The hit clip comes from the
stance set; a killing blow plays the shared death.

### Signature moments

On top of the five effects in the tables, every skin gets one effect that reacts to how the fight is going. These are
what make a skin feel alive, not only decorated. All are cosmetic and need no new art. The Demon Knight's two are
described above.

| Skin | Signature moment |
|---|---|
| **Nova Ronin** | Constellation: each hit in a turn leaves a star hanging in the air; when the turn ends the stars join into a line and fade. More hits, bigger constellation. |
| **Arc Welder** | Overclock: each time the drone fires in the same turn its arc grows brighter and louder; on a kill it does a victory loop and sparks rain down. |
| **Rogue Tailor** | Stitched up: every hit leaves a gold stitch on the enemy; on a kill the stitches pull tight and tie off in a bow. |
| **Moonshine Marshal** | Proof rising: each power-up raises the still's gauge and the size of her blue flame for the rest of the fight; on a kill she blows the smoke off her barrels. |
| **Tempest Sage** | Combo: back-to-back hits in a turn build crackling charge up her arms; the third and later punches land with a bigger thunderclap. |
| **Bone Puppeteer** | Curtain call: on a kill the puppet skips over to the fallen enemy and takes a bow. |
| **Ash Falconer** | Rekindle: on a kill the phoenix flares to twice its size for a moment and returns to her glove trailing embers. |
| **Glacier Lancer** | Deep freeze: each hit builds more frost on the enemy; a kill shatters it into shards. |
| **High Roller** | Full house: each suit she shows in a turn lights one neon suit sign above her; a Full Trick sets all four flashing and showers coins. |

### Sound

Each skin gets its own attack sound and hit sound. Until they exist, reuse the Riftwalker's own and note it as missing.

## Things to keep

- Effects are drawn by the game. The pose sheets have none baked in, by rule.
- Effects must not hide the enemy's intent, health or status icons, and must respect the Low and Medium graphics
  settings: on Low, keep the attack and hit effects and drop the idle ambience.
- A skin never changes its Riftwalker's size on screen or the timing of its attack.
- Never empty `SKINS`, and keep `ANIMATED_SKINS` as the gate for what is shown.

## Kickoff prompt for the agent

```
Read docs\ANIMATED_CHARACTER_GUIDELINES.md and docs\SKIN_EFFECTS_BRIEF.md.

Do step 1 and step 2 of "What to build, in order": move the four live skins' attack settings out of the if lines in
FightView.tsx into one per-skin effects table, then build the four live skins' effects from the table in the brief.
Start with ONE skin, the Demon Knight, including his two premium effects (blood-fed blade and shadow reap), and show
it to me running on screen before doing the other three. Then swap in the Arc Welder's recoloured sheets.

No rules changes. Do not push or deploy until I approve.
```
