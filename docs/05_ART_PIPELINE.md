# Shattered Rifts: AI Art Pipeline & Style Bible

Card illustrations are **AI-generated**. Frames, UI, icons and effects are code (see `04_…`).
The #1 risk with AI art is **inconsistency** (a set that looks like 74 different games). This doc exists to
prevent that.

---

## 1. Rules
1. **One model, one version, for the whole Core Set.** Record it in `art/manifest.json`. Changing
   models mid-set = regenerate the set.
2. **Generate realm "anchor" images first** (3–5 per realm). Approve them, then use them as a
   style reference for every card in that realm.
3. **Never** use living artists' names, studio names, or copyrighted characters/franchises in
   prompts. Never "in the style of [anything owned]".
4. Check that the generator's licence allows **commercial use** for the account tier used.
5. **Steam disclosure:** Steam requires declaring AI-generated content in the Content Survey
   ("pre-generated" content). Do it honestly, and keep the manifest as a record.
6. Cards carry an "AI-assisted art" line in the collector text. The roadmap includes "commission hero
   art for Legendaries/Mythics" as a funding goal: be transparent about it.
7. A human (Robert) approves every image against the checklist in §6 before it's marked `approved`.

## 2. Global style (shared by all cards)
```
GLOBAL STYLE: dark fantasy trading card illustration, painterly digital painting with visible
brush texture, dramatic rim lighting from upper left, deep shadows with rich saturated accent
colours, cinematic composition, single clear subject with a strong readable silhouette, subject in
the centre 60% of the frame, simple atmospheric background, high detail on the subject, soft
detail in the background
NEGATIVE: text, letters, numbers, watermark, signature, logo, card frame, border, UI, multiple
subjects competing, cropped head, extra limbs, deformed hands, blurry subject, flat lighting,
photograph, 3D render look, anime style, chibi
```

### Realm style modifiers
| Realm | Add to prompt | Palette words | Lighting |
|---|---|---|---|
| **Aurelion** | "high fantasy, gilded armour, white marble, heraldic banners, sacred atmosphere" | gold, ivory, royal blue | warm golden key light, god-rays |
| **Nexus-9** | "industrial science fiction, worn gunmetal machinery, holographic interfaces, factory haze" | cyan, steel grey, black, warning orange accents | cold cyan key + orange practical lights |
| **Wyldmaw** | "primal monster jungle, bone and sinew, bioluminescent fungi, feral energy" | crimson, bone white, moss green | low red underlight, mist |
| **Umbral** | "eldritch gothic, shadows and smoke, moonlit, masks and veils, unsettling elegance" | violet, near-black, spectral teal | cold moonlight + teal glow, heavy shadows |
| **Neutral** | "otherworldly rift-space, floating crystal shards, cracked reality, prismatic light leaks" | obsidian, prismatic seams | light leaking through cracks |

### Composition by card type
| Type | Composition |
|---|---|
| Unit | Character/creature, 3/4 view, mid-action, full head and upper body visible; the **face/head is the focal point** (used for the token crop) |
| Spell | The magic *in the moment of effect*: hands casting, the bolt landing, the environment reacting |
| Trap | **The moment the trap springs, from the victim's point of view.** This is the game's art "voice" for traps: menacing and surprising |
| Relic | An object still-life on a dark plinth or in hands, softly glowing, centred, for the circular medallion crop |
| Rift | A **wide landscape panorama**, generated 16:9 and cropped. An establishing shot of the realm |
| Token | A simple iconic creature, centred, generous margins |
| Boss portrait | A frontal, imposing bust, eyes toward the viewer, 1:1, with room for UI on the sides |
| Arena | A 16:9 environment, low contrast, centre kept darker/empty (the board sits on top) |

### Prompt template
```
[SUBJECT], [ACTION/POSE], [SETTING], [REALM MODIFIER], [GLOBAL STYLE] --ar 4:3
```
Generate at ≥ 1536×1152 (Rifts and arenas at 2048×1152), then export as described in §4.

## 3. Post-processing (makes AI art look like one set)
- Run every approved image through `tools/art/grade.ts`: apply the realm **LUT** (colour grade),
  normalise exposure, add a subtle shared film grain (2%), and sharpen the focal area.
- Set the **focal point** (x, y in 0–1) in the manifest. Tokens crop 4:5 around it, and Legendary
  parallax uses it.
- **Legendary/Mythic:** generate a **depth map** offline (any monocular depth model) → `{ID}@depth.png`
  for 2-layer parallax. For Mythic pop-out, hand-mask the subject → `{ID}@mask.png`.

## 4. Files
```
apps/web/public/art/cards/{ID}.webp          1024×768, quality 85
apps/web/public/art/cards/{ID}@thumb.webp    256×192 (hand, tokens, chain)
apps/web/public/art/cards/{ID}@depth.png     optional, Legendary+
apps/web/public/art/bosses/{bossId}.webp     1024×1024
apps/web/public/art/arenas/{arenaId}.webp    1920×1080
art/manifest.json                            source of truth (not shipped)
```
```jsonc
// art/manifest.json entry
{ "id": "AUR-05", "prompt": "...", "negative": "...", "model": "…", "seed": 12345,
  "created": "2026-11-02", "approved": true, "focal": [0.52, 0.31], "notes": "regen 3x for hands" }
```
**Until art exists**, the game renders a **procedural placeholder**: a realm gradient, a large tribe
glyph silhouette, the card name in the art window at 10% opacity, and a subtle animated rift crack. It
should look intentional, so the game is playable and presentable before any art is generated.

## 5. Card art briefs (Core Set)
One line per card: subject → key visual idea. Combine with the realm modifier and global style.

**Aurelion**
- AUR-01 Gilded Squire: a young squire in oversized gilded armour, raising a battered tower shield, determined.
- AUR-02 Lightbearer Acolyte: a robed acolyte cupping a floating sphere of sunlight, light spilling over a knight's shoulder.
- AUR-03 Cleric of the Ninth Bell: an elderly cleric ringing a small bronze bell, golden sound-ripples healing a wounded soldier.
- AUR-04 Bastion Sentinel: a towering knight in full plate planted behind a wall-like shield, cracked marble steps.
- AUR-05 Dawnlance Cavalier: a mounted knight charging with a glowing lance at sunrise, dust and banners.
- AUR-06 Oathsworn Paladin: a paladin kneeling with a sword planted, a translucent golden shield-dome forming around allies.
- AUR-07 Sunwing Griffin: a griffin with gold-tipped feathers diving out of the sun, talons forward.
- AUR-08 Archmagister Velle: a stern elder mage woman with floating open tomes orbiting her, sigils of light.
- AUR-09 Aurumclaw, Dawn Dragon: a colossal gold-and-ivory dragon rising over a cathedral, wings spread like a sunrise.
- AUR-10 Smite: a spear of holy light striking down on a charging beast, ground cracking.
- AUR-11 Benediction: a gauntleted hand blessing a kneeling warrior, gold light flowing into their armour.
- AUR-12 Final Judgment: a giant spectral sword of light descending from clouds onto a battlefield.
- AUR-13 Aegis of the Warden *(trap, victim POV)*: a blade striking a sudden hexagonal golden barrier that wasn't there a moment ago.
- AUR-14 Divine Rebuke *(trap, victim POV)*: a caster's spell shattering mid-air against a blazing sigil.
- AUR-15 Banner of the Ninth Dawn: a tattered gold-and-blue war banner on a lance, glowing threads.
- AUR-16 The Gilded Citadel *(rift, wide)*: a white-and-gold citadel on cliffs above clouds, sun shafts, a crack of rift light across the sky.

**Nexus-9**
- NEX-01 Patrol Drone: a small spherical drone with a single cyan eye, a smaller drone detaching from it.
- NEX-02 Field Technician: an engineer in a worn exosuit welding a drone, sparks, visor reflecting cyan.
- NEX-03 Sentry Turret: a squat automated turret with a glowing barrel, scanning beam, catwalk setting.
- NEX-04 Enforcer Mk.II: a bipedal security robot with magnetic clamps for attaching modules, strobe light.
- NEX-05 Netrunner Ix: a hooded hacker with a cybernetic eye, holographic code wrapping their fingers.
- NEX-06 Warframe "Bastion": a massive bipedal mech with a shield-arm, pilot cockpit glowing, smoke.
- NEX-07 CALYX, Ascended Intelligence: an abstract luminous AI face formed of a million floating hexagons inside a cathedral-sized server core.
- NEX-08 Overcharge: a robot arm crackling with overloaded energy, plating glowing white-hot.
- NEX-09 Swarm Protocol: a cloud of hundreds of tiny drones pouring out of a hangar door.
- NEX-10 EMP Burst: a blue-white electromagnetic shockwave rolling across a factory floor, lights dying.
- NEX-11 Recompile: a robot dissolving into data cubes being pulled back into a holographic schematic.
- NEX-12 Countermeasure Grid *(trap, victim POV)*: a grid of red laser lines snapping on around an arriving creature.
- NEX-13 Lockdown Protocol *(trap, victim POV)*: steel clamps and energy shackles erupting from the floor around the viewer's legs.
- NEX-14 Mana Reactor: a compact glowing reactor core in a containment cage, cyan plasma.
- NEX-15 Foundry Nexus-9 *(rift, wide)*: a planet-sized factory under a dead black sun, endless conveyor belts, smokestacks, a rift tear.
- NEX-16 Salvage Bot: a scrappy little robot with mismatched parts carrying a bigger robot's head.

**Wyldmaw**
- WYL-01 Gnashling: a small toothy critter, all mouth, grinning, on a mossy root.
- WYL-02 Rift Raptor: a sleek raptor with crimson-striped hide mid-leap through ferns.
- WYL-03 Acid Spitter: a lizard-beast spitting a glowing green acid arc, plants melting.
- WYL-04 Ravenous Packhound: a pack of hyena-wolves, one in front snarling, eyes glowing red in the mist.
- WYL-05 Maw Brute: a hulking gorilla-like beast with a mouth splitting its chest open.
- WYL-06 Broodmother Vexa: a giant insect queen on a nest of glowing eggs, larvae crawling.
- WYL-07 Thal'gor, the Worldeater: a kaiju rising from a jungle, jaws wide enough to swallow the horizon.
- WYL-08 Blood Frenzy: a beast's eyes turning blood-red, veins glowing, muscles bulging, mid-roar.
- WYL-09 Primal Feast: a firelit feast where a beast devours prey, shadows of the pack around it (not gory: silhouettes).
- WYL-10 Roar of the Maw: a beast's roar visible as a red shockwave flattening the jungle.
- WYL-11 Bone Pit *(trap, victim POV)*: the ground collapsing into a pit lined with sharpened bones, looking down.
- WYL-12 Lurker in the Brush *(trap, victim POV)*: glowing eyes and jaws exploding out of tall grass straight at the viewer.
- WYL-13 Idol of Endless Hunger: a totem of stacked skulls with glowing jaws, offerings at its base.
- WYL-14 The Gnawing Wilds *(rift, wide)*: a vast jungle growing inside the ribcage of a dead colossal beast, spores, red light.
- WYL-15 Carrion Picker: a vulture-like reptile perched on bones, wings spread.
- WYL-16 Ironhide Charger: a rhino-beast with stone-like armoured plates, charging, dust.

**Umbral Veil**
- UMB-01 Veilshade: a faceless shadow figure half-emerged from a wall, one hand reaching.
- UMB-02 Whisper Acolyte: a masked cultist whispering into a lantern that holds a trapped spirit.
- UMB-03 Gloomstalker: a lithe shadow assassin barely visible in smoke, only blades and eyes catching light.
- UMB-04 Seer of Hollow Eyes: a blindfolded seer with eyes painted on the blindfold, three tarot-like cards floating.
- UMB-05 Hollow Lurcher: a long-limbed thing unfolding from a cramped wardrobe.
- UMB-06 The Puppeteer: an elegant masked figure with strings of shadow attached to a struggling knight.
- UMB-07 Mor'vael, Queen of Snares: a regal veiled queen on a throne of webs, every thread ending in a hidden snare.
- UMB-08 Mindrot: a figure clutching their head as violet tendrils pull memories out as glowing cards.
- UMB-09 Draw the Veil: a curtain of shadow sweeping across a battlefield, a figure vanishing behind it.
- UMB-10 Shadow Coil *(trap, victim POV)*: shadow serpents coiling around the viewer's sword arm.
- UMB-11 Mirror of Malice *(trap, victim POV)*: a spell bouncing off an ornate mirror back toward its caster.
- UMB-12 Snare Cascade *(trap, victim POV)*: a chain reaction of shadow snares snapping shut one after another.
- UMB-13 Hungering Dark *(trap, victim POV)*: the floor turning into an abyss with grasping hands, a hungry mouth in the dark.
- UMB-14 Lantern of Lost Names: an old lantern with whispering faces swirling inside the glass.
- UMB-15 The Hollow Veil *(rift, wide)*: a moonlit gothic city of spires where streets fold into shadow, fog, a violet rift.
- UMB-16 Whispered Bargain: two hands shaking over a candle, one hand made of smoke.

**Neutral**
- NEU-01 Rift Wanderer: a cloaked traveller with a lantern stepping through a crack in reality.
- NEU-02 Echo Wisp: a small luminous spirit leaving a trail of afterimages of itself.
- NEU-03 Shardstone Golem: a golem of obsidian and crystal shards, glowing seams.
- NEU-04 Riftborn Colossus: a giant elemental made of floating fragments from four worlds.
- NEU-05 Tear in the Rift: hands tearing open a glowing seam in the air, prismatic light pouring out.
- NEU-06 Shatter: a crystal hammer striking a glowing sigil, the sigil exploding into shards.
- NEU-07 Rift Bolt: a jagged prismatic bolt arcing out of a crack in the sky.
- NEU-08 Null Field *(trap, victim POV)*: a spell unravelling into grey static as it enters a dome of silence.
- NEU-09 Riftwalker's Codex: an ancient book with pages made of thin crystal, map lines glowing.
- NEU-10 Prism, Heart of Shards: a colossal crystalline being, its heart a prism splitting light into the four realm colours.

**Tokens:** Drone (a tiny cyan-eyed sphere drone) · Larva (a glowing grub with tiny mandibles) · Lurker
(a jungle ambush predator, all teeth and stripes) · Rift Ravager (the Rift Raptor grown huge, rift-cracks glowing on its hide).

**Boss portraits:** Seraphine (a winged armoured woman with a halo of broken gold, serene and severe) ·
Kron (a towering industrial overseer robot with a single red optic in a cathedral of machinery) ·
Gorrmaw (an enormous many-toothed maw rising from a pit, multiple eyes) · Nyxara (a veiled queen whose veil
is spiderweb, faceless darkness under it, an elegant hand raised) · Vorthax (a humanoid silhouette made of
a fractured crystal heart, with fragments of all four realms orbiting).

**Boss signature cards** (from `03_CAMPAIGN.md`): Seraphine's Oath, Bell of Judgment, Gilded Halberdier,
Kron's Assembly Arm, Override Virus, Orbital Uplink, The Hunger Below, Maw Spawn Egg, Gorrmaw's Tooth,
Nyxara's Web, Whisper Net, Faceless Courtier. Write briefs alongside their card stats when they're authored.

**Arenas:** the cathedral nave (Seraphine) · the conveyor foundry (Kron) · the ribcage jungle (Gorrmaw) · the
shadow ballroom (Nyxara) · the orbiting fragments void (Vorthax) · a neutral Sanctum hub (a cozy floating
library-observatory between worlds).

**Card backs:** the default "Riftwalker" back (an obsidian slab with a prismatic crack forming a sigil), designed
in code (SVG), plus later cosmetic variants.

## 6. Approval checklist (every image)
- [ ] Subject readable as a **132×168 token** (squint test at thumbnail size)
- [ ] Matches the realm palette and lighting; sits well next to the anchor images
- [ ] No text, glyph-like gibberish, watermarks or signatures
- [ ] Hands, faces and anatomy acceptable at inspect size
- [ ] Focal point set; important content inside the safe area (8% margins)
- [ ] Trap art is from the victim's POV; spell art shows the moment of effect
- [ ] Nothing resembles an existing franchise character or logo
