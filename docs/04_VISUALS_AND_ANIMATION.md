# Shattered Rifts: Visual Design & Animation Spec

> **Implementation status (2026-10-22):** the browser UI follows Robert's art-direction brief (DECISIONS #67–70): a PixiJS
> battlefield + web-element hand/HUD, tokens in `apps/web/src/design/tokens.ts`, built in five reviewed phases. Where this
> document and a later decision differ (e.g. the board is a perspective arena, not a flat top-down grid), the decision wins.

**Art direction in one line:** painted illustrations inside crisp, code-built frames, on a dark board
lit by glowing rifts. The frames, UI, icons and all effects are made in code (SVG + PixiJS shaders), so
they stay sharp at every size, are fully animatable, and stay consistent. Only the illustrations are
images (AI-generated; see `05_ART_PIPELINE.md`).

Signature motif: **shattering.** Things don't just die, they *break into shards of light* that
fly toward the Void. Rifts are **glowing cracks** that run through frames, the board and the UI.
Reuse this motif everywhere: it's the game's visual identity.

---

## 1. Typography
All fonts are SIL Open Font License (free for commercial/Steam use). Bundle them locally; never hot-link.

| Use | Font | Notes |
|---|---|---|
| Card names, titles, banners | **Cinzel** (700/900) | Small caps feel; auto-shrink 52→34 px on cards |
| Rules text, UI | **Source Sans 3** (400/600/700) | Keywords in 700 |
| Numbers on cards/tokens | **Bebas Neue** | Heavy stroke: 6 px dark outline + 2 px inner light rim |
| Flavor text | **Cormorant Garamond** italic | |
| Nexus-9 accents (optional) | **Share Tech Mono** | Only in Nexus type lines and HUD flourishes |

---

## 2. The card frame

### 2.1 Canonical layout (750 × 1050 px, 5:7 ratio, poker size)
All positions are in canonical pixels. Render at canonical size into a cached texture, then scale.

```
 ┌───────────────────────────────────────────────┐  corner radius 36
 │(◆)  NAME BANNER (x150 y30 w560 h80)            │  ◆ cost gem centre (92,92) Ø120 (overlaps corner)
 │ ┌───────────────────────────────────────────┐ │
 │ │                                           │ │
 │ │   ART WINDOW  x48 y110 w654 h490 (4:3)    │ │
 │ │                                           │ │
 │ └───────────────────────────────────────────┘ │
 │  TYPE LINE x60 y612 w630 h52   [realm sigil]  │  "Unit — Human Knight"
 │ ┌───────────────────────────────────────────┐ │
 │ │ RULES TEXT x60 y672 w630 h270             │ │  30 px, auto-fit to 22 px minimum
 │ │ ───── divider ─────                       │ │
 │ │ flavor (italic 24 px)                     │ │
 │ └───────────────────────────────────────────┘ │
 │ (⚔ P)            ◇ rarity            (🛡 G)    │  power (96,972) Ø120 · rarity (375,990) · guard (654,972) Ø120
 │   CORE · 010/074 · AI-assisted art            │  collector line, 16 px, y 1022
 └───────────────────────────────────────────────┘
```

**Layer order (bottom → top):** 1) realm background texture → 2) art (masked to the window shape) →
3) art vignette (inner shadow 24 px) → 4) frame body (realm SVG) → 5) text box plate → 6) name
banner → 7) cost gem → 8) stat badges → 9) rarity gem → 10) text → 11) finish overlays (foil,
rift-touched) → 12) state overlays (playable glow, selected, disabled).

### 2.2 Type variations
| Type | Differences from the Unit layout |
|---|---|
| **Unit** | As above. |
| **Spell** | No stat badges. Text box extends to y 1000. Art window has a faint **rune-circle vignette** in the realm colour. **Swift** spells get a lightning-notch cut in the top-right of the frame plus a ⚡ in the type line. |
| **Trap** | **Inverted frame:** realm colours darkened 35%, with a hazard-chevron inner border (8 px) in the realm accent. A diagonal **"TRAP" ribbon** sits across the art's top-right corner. The first line of the text box is a highlighted **Trigger bar** (`⚠ TRIGGER: When an enemy attacks.`) on a darker plate with an accent left edge. Art: the trap's moment of springing. |
| **Relic** | Circular **medallion** art window (Ø470, centred at y 355) set into a rectangular frame body. A **charge-pip row** sits under the art (filled pips = remaining charges). |
| **Rift** | Art is **full-bleed** behind the whole frame (landscape crop). The frame becomes thin, the text box is 85% opaque glass, and a "RIFT" ribbon runs at the top. On the board, a Rift renders as an environment, not a card (see §6.7). |
| **Token** | Simplified frame with a dashed inner border, no flavor, "TOKEN" in the collector line, and a greyed rarity gem. |

### 2.3 Realm frame motifs (each an SVG component in code)
| Realm | Frame body | Art window | Cost gem | Text box | Name banner |
|---|---|---|---|---|---|
| **Aurelion** | Gilded filigree on ivory marble, with a sun crest at top centre | Arched top (semicircle crown) | 12-ray **sunburst** with a gold bezel | Ivory marble with faint grey veining | Royal blue enamel with gold piping |
| **Nexus-9** | Gunmetal plates, **45° chamfered corners** (40 px cuts), etched circuit traces | HUD **corner brackets** instead of a full border | **Hexagonal** cyan crystal | Dark glass, 4% scanlines, faint grid | Black plate with a cyan edge light and a warning-orange tick |
| **Wyldmaw** | Bone and sinew, asymmetric **claw notches** on the left edge, tooth row along the art top | Irregular, organic edge mask | Cracked **fang-socket orb**, red glow inside | Stretched-hide parchment with a stitched border | Leather strap with bone studs |
| **Umbral** | Smoke-wisp edges, thorny vines, an **eye** at top centre (it blinks on Rare+) | Gothic pointed arch | **Crescent moon** orb, violet | Deep violet with silver filigree text rules | Tattered velvet ribbon |
| **Neutral** | Obsidian slab with a diagonal **prismatic crack** across the frame | Plain bevel | Raw uncut crystal | Smoked glass | Obsidian plate |

### 2.4 Rarity treatments (stack under finishes)
| Rarity | Gem | Idle effect on the card (hand / inspect) |
|---|---|---|
| Common | Silver circle | None. Clean. |
| Rare | Sapphire diamond | A light sheen sweeps across the name banner every 8 s (600 ms sweep). |
| Epic | Amethyst diamond | A **glint runner** travels around the frame edge every 6 s (1.2 s lap), plus a slow 4 s art colour breathe (±4% brightness). |
| Legendary | Amber star | **Art parallax** (2 layers from a depth map, ±6 px with pointer/tilt), embers rising from the bottom frame edge (6–10 alive), and a gold rim light. |
| Mythic | Prismatic star | A full holographic **prism shader** on the frame; the **art breaks the frame** (the subject masked to extend 40 px over the top border); a unique 3 s idle loop. |

### 2.5 Finishes (cosmetic drops)
- **Foil:** a holographic diffraction gradient over the whole card, keyed to the card's tilt angle
  (pointer position or device tilt), plus a sparse sparkle noise layer. Blend: screen at 35%.
- **Rift-Touched:** alternate art plus **glowing rift cracks** running through the frame (an animated
  emissive seam, slow 3 s pulse). Cracks follow the frame's own geometry.
- **Prismatic:** foil + Rift-Touched + an animated rainbow frame + shard particles orbiting the card
  in inspect view.

### 2.6 Readability rules (non-negotiable)
- Rules text ≥ 22 canonical px. Contrast ≥ WCAG AA (4.5:1) on every realm text box.
- Keywords are **bold** with a 20 px inline icon before them. Hovering a keyword (inspect view) shows its reminder text.
- Numbers changed from base show **green** (higher) or **red** (lower/damaged) everywhere: card, token, tooltip.
- The cost gem number turns green when cost is reduced and red when increased; the original cost appears struck-through, small, beside it.
- A card that is **playable now** gets a soft realm-coloured outer glow in hand (2 s breathe). A
  **Resonance-live** card adds a rune ring flicker on its Resonance keyword.

### 2.7 Card sizes in UI (reference resolution 1920×1080, scales with viewport)
| Context | Size (px) | Scale of canonical |
|---|---|---|
| Hand | 180 × 252 | 0.24 |
| Hand hover | 262 × 367 | 0.35 |
| Inspect (hover 400 ms or right-click) | 450 × 630 | 0.6, shown on the right side panel with keyword tooltips |
| Fullscreen inspect | 600 × 840 | 0.8, with tilt-to-cursor 3D (±10°) for foils |
| Backrow card | 104 × 146 | 0.139 |
| Chain-link thumbnail | 72 × 100 | 0.096 |
| Board **unit token** | 132 × 168 | Separate component (§3) |

---

## 3. Board unit tokens
On the board, units are **tokens**, not full cards: readable at a glance, with full text one hover away.

- **Shape:** rounded rectangle 132 × 168, with a 6 px realm-coloured rim (Aurelion gold, Nexus cyan,
  Wyldmaw crimson, Umbral violet, Neutral prismatic).
- **Portrait:** the card art cropped 4:5 around `art.focal` (the focal point from the art manifest).
- **Power** orb bottom-left (Ø44, sword glyph behind the number); **Guard** orb bottom-right (Ø44, shield glyph).
  Damaged Guard shows red, with a thin red **damage bar** under the token.
- **Keyword icon strip** along the top edge: up to 4 icons at 22 px, overflow shown as "+n".
- **Status overlays:**

| Status | Visual |
|---|---|
| Ready to attack | A green-gold ground ring under the token, 1.6 s breathe |
| Arriving (summoning-sick) | 25% desaturated + a small hourglass icon. Ring absent |
| Exhausted (already attacked) | 15% darker. Ring absent |
| **Shield** | A translucent golden **bubble dome** with a slow rotating hex shimmer |
| **Guardian** | A heavy stone/metal border variant + a shield icon. A slight 4 px lift so it reads "in front" |
| **Ward** | A rotating hex-rune ring around the token (8 s/rev), cyan-white |
| **Veiled** | Token at 55% alpha + an animated smoke-noise shader on the edges; the enemy sees it blurred |
| **Stunned** | Chains crossing the token + 3 small stars orbiting (1.2 s/rev); greyed ring |
| **Corrode** | Green-black drips sliding down the rim; a stack count badge |
| **Lifebind** | A red heartbeat pulse in the rim (1 s cycle) |
| **Pierce / Blitz** | Static icons in the strip only (no overlay) |
| Marked (boss) | Boss-coloured target reticle slowly rotating |

- **Face-down Ambush unit:** the player's chosen **card back** rendered as a token, with a "?" sigil
  that pulses faintly every 5 s. The owner sees a small corner peek of the real card.
- **Hover:** token lifts 6 px, scale 1.06 (120 ms, `back.out(2)`), and the inspect panel shows the full card.

---

## 4. Board layout (1920 × 1080 reference)
```
┌───────────────────────────────────────────────────────────────────────────────┐
│ [Enemy portrait + Essence orb + held Mana + Resonance ring]   [Omens]  [⚙]  │ y 0–150
│            [ backrow ▢ ▢ ▢ ▢ ]      [Rift ▭]                    [deck][void]   │ y 150–300
│            [ unit row  ▣ ▣ ▣ ▣ ▣ ]                                             │ y 300–480
│ [log ◂]  ═════════════════ RIFT LINE (glowing crack) ═══════════  [CHAIN ▸]    │ y 480–600
│            [ unit row  ▣ ▣ ▣ ▣ ▣ ]                              [END TURN]     │ y 600–780
│            [ backrow ▢ ▢ ▢ ▢ ]      [Rift ▭]                    [deck][void]   │ y 780–900
│ [Your portrait/Essence/Resonance]    [  H A N D  (fan)  ]    [Mana ◆◆◆◇◇]   │ y 880–1080
└───────────────────────────────────────────────────────────────────────────────┘
```
- The **Rift line** across the middle is a living crack: it pulses with the active player's realm colour
  and flares when chains resolve.
- **Chain panel** (right, slides in when a chain exists, 260 px wide): links stacked bottom-up and numbered.
- **Log** (left, collapsed by default): a text log of every event, hoverable to highlight the cards involved.
- **Hand fan:** arc radius 1400 px, max spread 60°, card overlap adaptive (1–9 cards).
- The **Arena background** (boss/realm specific) sits behind the board at 40% brightness with slow ambient
  motion (motes, steam, spores). It must never compete with the board: keep it low contrast, with a 12 px blur at the edges.

---

## 5. Animation system principles
1. **The engine resolves instantly; the presentation plays it back.** The engine emits an ordered list
   of `GameEvent`s per action. The `AnimationDirector` turns each event into a GSAP timeline segment
   and plays them in sequence, with defined overlaps. Gameplay state is never driven by animations.
2. **Anticipation → action → follow-through**, on every meaningful motion. Big impacts get **hitstop**
   (a short freeze).
3. **Speed setting `S`**: 1× (default), 1.5×, 2×, 4×, and **Instant** (all motion skipped; 80 ms fades only).
   All durations below are at 1× and get divided by S.
4. **Click/Space to hurry:** completes the current segment instantly and plays the rest at 4×.
5. **Input is never blocked longer than needed.** The player can hover/inspect during animations.
   Actions queue only when the response window opens.
6. **Overlap rules:** independent events on different objects (e.g. 3 Drones summoned) **stagger by
   90 ms** instead of playing in sequence. Causal events (damage → death) are sequential.
7. **Max queued latency:** if the queue holds > 3 s of animation (big board wipes), compress
   non-key segments (staggers 90 → 40 ms, particles halved).
8. **Easing vocabulary** (GSAP names): `power2.out` (default move), `power3.in` (lunges), `back.out(1.7)`
   (pops), `expo.out` (snaps), `sine.inOut` (idles), `elastic.out(1, 0.5)` (rare, for big rewards).

---

## 6. Animation catalog
Durations at 1×. "VFX" refers to presets in §7; "SFX" names map to audio files (§9).

### 6.1 Hand and card handling
| Event | Duration | Beats | VFX / SFX |
|---|---|---|---|
| **Draw** | 380 ms | Card leaves the deck face-down, travels a bezier arc (control point 180 px above) to its hand slot; rotateY 180→0 at 45–75% of travel; hand re-fans (200 ms, `power2.out`) as it arrives | faint trail · `card_draw` |
| **Draw (burned, hand full)** | 600 ms | Flies to the hand area, flips face-up, **hovers 250 ms**, then burns: a dissolve shader with an ember edge, ash particles drift to the Void | embers · `card_burn` |
| **Mulligan** | 500 ms | Chosen cards slide back into the deck with a shuffle wiggle; new cards draw with 90 ms stagger | `card_shuffle` |
| **Hand hover** | 120 ms in / 160 ms out | Lift 40 px, scale to 0.35, rotate to 0°, neighbours spread ±30 px; z-top | `card_hover` (very soft, randomised pitch ±5%) |
| **Drag** | continuous | Card follows the pointer with lerp 0.35/frame; tilt = velocity × 0.04 (clamped ±12°); valid drop zones pulse their outline; the hand closes the gap (200 ms) | `card_pickup` |
| **Invalid drop** | 260 ms | Springs back to the hand slot (`back.out(1.4)`), small horizontal shake (3× 6 px) | `ui_deny` |
| **Play commit** | 140 ms | Scale 1.0 → 1.08 → 1.0 punch at the drop point; cost gem flashes; Mana crystals drain (see 6.6) | `card_commit` |
| **Discard (by effect)** | 450 ms | Card lifts out of the hand, shakes, tears diagonally (2-piece mask split), pieces fade to the Void | `card_tear` |

### 6.2 Summons
**Generic summon** (870 ms total), then the realm overlay plays on top:
1. **Arrive** (0–300 ms): the card shrinks from play position to the slot, morphing card→token
   (cross-fade at 50%), `power2.in`.
2. **Impact** (300 ms): token lands with squash (scaleY 0.85, scaleX 1.1 for 60 ms) → stretch back
   (`back.out(2)`, 160 ms). **Ground ring shockwave** (Ø0→160 px, alpha 0.8→0, 350 ms). 10 dust motes.
   Camera trauma 0.15.
3. **Settle** (460–870 ms): token idle begins, keyword strip icons pop in one by one (60 ms stagger,
   `back.out(2)`), and Arriving desaturation fades in.

| Realm overlay | Visual | SFX |
|---|---|---|
| **Aurelion** | A golden **light pillar** from above (beam width 90 px, 180 ms in, 250 ms out), 8 feathers drifting down, the token's rim flashes white→gold | `summon_aurelion` (choir chime + metal) |
| **Nexus-9** | **Hologram build:** the token materialises bottom-up as a cyan wireframe (scanline sweep 400 ms), then fills solid; 12 sparks; a brief glitch offset (2 frames, 4 px) | `summon_nexus` (servo + digital chirp) |
| **Wyldmaw** | **Ground burst:** cracks spread from the slot (radial crack decal, 200 ms), the token erupts from below (starts 40 px low) with extra squash, 14 red spores, rocks thrown | `summon_wyldmaw` (roar + earth crunch) |
| **Umbral** | **Smoke coalesce:** a violet smoke cloud converges inward (reverse dissolve, 450 ms), two eyes glint in the smoke before the token resolves, a short whisper | `summon_umbral` (whisper + reverse cymbal) |
| **Neutral** | **Shard assembly:** 8 crystal shards fly in from the edges and snap together into the token, with a prismatic flash | `summon_neutral` (glass chime) |

| Special summon | Duration | Beats |
|---|---|---|
| **Token summon** (Drone, Larva) | 420 ms | Mini version of the realm overlay; multiple tokens stagger 90 ms |
| **Legendary entrance** | 1,800 ms (skippable after 400 ms) | The board dims to 40% (200 ms) → the full card appears centre at scale 0.8 with art parallax drift → name banner slides in from the left with a title stinger → 300 ms hold → the card **slams** down to its slot (`power3.in`, 220 ms) → big shockwave (Ø0→420 px) + camera trauma 0.5 + 80 ms hitstop + realm overlay at 1.5× scale. **The cinematic plays only the first time a given Legendary is summoned in a duel;** later summons use the generic animation at 1.3× scale. |
| **Mythic entrance** | 2,600 ms (skippable after 600 ms) | As Legendary, plus: the screen edges **fracture** (cracks drawn from the corners inward with prismatic light leaking through, 500 ms), the music ducks −12 dB, a unique stinger plays, and the subject breaks out of the frame (pop-out mask) before the slam |
| **Ambush set** | 420 ms | The card flips face-down mid-flight, slides into the unit slot, lands with a soft thud; a "?" sigil fades in |
| **Ambush flip** | 520 ms | The face-down token **stands up** (rotateX 0 → −70°, 140 ms) → snaps around (rotateY 180→0, 200 ms, `back.out(2.2)`) → realm overlay at 0.6×; the "Flip:" effect then plays as its own segment |
| **Evolve** | 1,100 ms | The token **cocoons**: a wrapping realm-coloured light envelope (300 ms) → it pulses 3 times, speeding up (400 ms) → bursts (shockwave + 20 shards) → the new token is revealed with a scale overshoot (1.25 → 1, `elastic.out(1, 0.6)`) |
| **Assemble** | 900 ms | The target Construct dissolves into a stream of cyan particles that pour into the summoned unit (bezier stream, 450 ms); the summoned unit's stats tick up number by number (each +1 is a 40 ms tick with a click) |
| **Devour** | 1,000 ms | The devourer **lunges** at the victim (half a lunge, 180 ms) → a jaw-snap overlay (two arcs closing, 120 ms) → the victim **shatters inward** (shards fly *into* the devourer instead of outward) → the devourer pulses red, scale 1.12 → 1, and its stats tick up | 
| **Take control** | 1,000 ms | A violet tether line shoots from the source to the target (200 ms) → the target is dragged along a curved path across the Rift line into your empty slot (500 ms, `power2.inOut`) → its rim recolours to the new owner's realm colour (200 ms) |

### 6.3 Combat
| Event | Duration | Beats | VFX / SFX |
|---|---|---|---|
| **Attack declare** | 200 ms | The attacker lifts 10 px, and an aiming **arrow** (curved, realm colour, animated dashes) extends to the target; the target's rim flashes | `attack_declare` |
| **Response window during an attack** | — | The attacker **holds its anticipation pose** (pulled back 18 px, scale 1.05, slight tremble) for as long as the window is open | heartbeat low-pass on music |
| **Lunge** | 180 ms | `power3.in` toward the target, stops at 30% overlap; motion streaks behind | `whoosh` |
| **Impact** | 70 ms hitstop | Everything freezes; the target flashes white (2 frames); a radial impact star forms; camera trauma = 0.1 + 0.03 × damage (max 0.6) | `hit_light` (≤3 dmg) / `hit_heavy` (4–7) / `hit_massive` (8+) |
| **Damage numbers** | 750 ms | Pop at the impact point: scale 0 → 1.4 → 1 (150 ms), float up 48 px with slight random x drift, fade out over the last 300 ms. Red for damage, green "+n" for heal, blue "BLOCKED" when a Shield absorbs | — |
| **Return** | 220 ms | The attacker returns to its slot, `power2.out`; exhausted dim fades in | — |
| **Shield pop** | 300 ms | The bubble dome cracks (crack lines, 80 ms) → shatters into 12 golden hex fragments that fly out and fade | `shield_break` (glass) |
| **Unit destroyed (Shatter)** | 800 ms | **The signature death.** The token freezes 80 ms → crack lines draw across it (120 ms) → it splits into 6–10 precomputed Voronoi shards that fly outward with spin and gravity (420 ms), fading → one **soul wisp** (realm colour) arcs to the owner's Void pile (400 ms, overlapping the shards) → the Void pile pulses | `shatter` + realm tail (`death_aurelion` bell / `death_nexus` power-down / `death_wyldmaw` howl / `death_umbral` sigh) |
| **Pierce overflow** | +300 ms | After the impact, a bolt continues *through* the target to the enemy portrait; the Essence hit plays | `pierce` |
| **Riftwalker hit** | 450 ms | The portrait recoils (rotate −4°, x −12 px, back in 300 ms); the Essence orb cracks (crack decal intensity ∝ missing Essence); a red vignette pulse (280 ms, max 18% alpha); trauma 0.3 | `player_hurt` |
| **Lifebind heal** | 500 ms | Red-gold motes stream from the damage point to your Essence orb; the orb fills with a liquid wobble | `heal` |
| **Lethal blow** | 1,600 ms | **Slow-mo:** the last 600 ms of the final hit at 0.25× speed, music cuts, the portrait shatters (big version: 24 shards) → white flash (reduced-motion: fade) → Victory/Defeat screen | `lethal` stinger |

### 6.4 Spells
| Event | Duration | Beats |
|---|---|---|
| **Cast staging** | 300 ms | The card flies to the **staging point** (left of centre, scale 0.4) and lingers there, so the opponent always sees what was cast. It shows a rune circle spinning behind it |
| **Targeting** | — | A curved arrow from the staged card to the chosen target, reusing the attack arrow in a spell style (dotted, glyph-tipped) |
| **Resolve** | per effect | The effect VFX plays (table below) |
| **Dispose** | 400 ms | The card **dissolves** (noise-threshold shader with a realm-coloured burning edge) and its wisp goes to the Void |

**Effect VFX library** (each effect op has one default animation; cards may override with a named preset):
| Effect op | Default animation (duration) |
|---|---|
| damage | A projectile from source to target in the realm style (Aurelion: a spear of light / Nexus: a laser line / Wyldmaw: an acid glob / Umbral: a shadow lash / Neutral: a crystal shard), 260 ms flight + impact |
| heal | Motes rise from beneath the target plus a soft green glow, 450 ms |
| buff | An upward chevron burst plus stat numbers ticking up with a scale pulse, 400 ms |
| debuff / Corrode | Downward chevrons and drips; numbers tick down red, 400 ms |
| stun | Chains slam across the token from both sides (clank), stars begin orbiting, 400 ms |
| destroy (by effect) | A realm-specific strike (a holy blade drops, an orbital laser, giant jaws, a shadow hand clenches), then Shatter |
| returnToHand | The token lifts, flips back into a card, and flies back to its owner's hand (rewind feel, a reverse whoosh), 500 ms |
| grant keyword | The keyword icon flies in and lands in the token strip, with a status overlay fade-in, 300 ms |
| draw | Standard draw, 90 ms stagger |
| discardRandom | The enemy's hand card backs shuffle; one is pulled out and torn, 500 ms |
| gainMana | Crystal shards fly into the Mana bar and new crystals form (temporary ones are hollow-outlined and glow), 400 ms |
| summon (token) | Token summon |
| negate | See 6.5 |
| scry | Top cards fan out at the deck (only the owner sees faces); choice UI |

### 6.5 Traps and the Chain (the "Gotcha"; polish these the most)
| Event | Duration | Beats | VFX / SFX |
|---|---|---|---|
| **Set trap** | 350 ms | The card flies to the backrow, flipping face-down mid-flight (rotateY 0→180), lands with a soft thud and a small dust puff | `trap_set` (muffled thunk) |
| **Set-card idle tell** | loop | A faint realm-neutral rune glows on the card back every 4 s (so the owner can't be fingerprinted by colour). The **owner** sees a tiny corner peek of the face | — |
| **Response window opens (you can respond)** | 200 ms | Time *seems* to slow: board desaturates 20%, music low-passes; your **eligible** cards (set traps, Swift spells in hand, Quick abilities) rise and glow with a pulsing outline; a **"Respond?"** bar appears above the hand with a **Pass** button (Space) and, in PvP, a timer ring | `window_open` (tension swell) |
| **Response window (you can't respond)** | 0 ms | Auto-pass, no UI. A small "…" appears over the opponent while the AI "thinks" (300–900 ms, personality-based, so traps don't feel instant and robotic) | — |
| **TRAP SPRING** | 650 ms | 1) The set card **stands up** (rotateX 0 → −70°, 120 ms, `power2.out`) → 2) **snaps** face-up (rotateY 180→0, 200 ms, `back.out(2.4)`) → 3) **hazard flash:** a screen-edge border in the trap's realm colour (2 pulses, 120 ms each, ≤ 25% alpha) → 4) a **"TRAP!" stamp** slams over the card (scale 2.2 → 1, 160 ms, `expo.out`) with a chain-link icon → 5) whatever triggered it stays **frozen mid-motion** (e.g. the lunging attacker is held at its pose) until the chain resolves | `trap_spring` (metallic snap + bass hit), music stab |
| **Chain link added** | 260 ms | The source card's thumbnail slides from its position into the Chain panel, landing on top of the stack with a number badge (1, 2, 3…); a glowing **rift tether** links it to the link below (the tether thickens with chain length); the panel's background crack widens slightly with each link | `chain_link` (rising pitch per link: +1 semitone each) |
| **Chain resolve (per link, top-down)** | 300 ms + effect | The top link pulses (scale 1.15) → its thumbnail flies to its effect origin → the effect plays → the thumbnail **shatters** in the panel and the tether to the link below snaps | `chain_resolve` (descending pitch) |
| **Negate** | 500 ms | The negated link gets **cracked**: crack lines across the thumbnail, a desaturate to grey, and a red diagonal **"NEGATED"** stamp; when its turn comes it resolves as nothing (crumbles to dust instead of shattering) | `negate` (glass crunch + reverse) |
| **Fizzle** | 300 ms | The link greys out, wobbles, and puffs away like smoke with a "fizzle" text | `fizzle` |
| **Big chain (≥ 4 links)** | — | The Rift line across the board flares brighter with each link; at 4+ links the camera pulls back slightly (scale 0.97) so the panel and the board are both clearly visible. This should feel like a **moment** | music layer: `chain_tension` |

### 6.6 Turn flow and resources
| Event | Duration | Beats |
|---|---|---|
| **Turn start banner** | 700 ms (300 ms at 2×+) | "YOUR TURN" / "ENEMY TURN" sweeps across the Rift line (a light streak leads the text), the Rift line recolours to the active player's realm |
| **Mana refill** | 50 ms stagger per crystal | Crystals light left→right with rising chime pitch; a new max crystal "grows" (scale 0→1 with `back.out(2)`) |
| **Mana spend** | 60 ms stagger | Crystals drain right→left with a crack flicker |
| **Held Mana (opponent's turn)** | loop | Unspent crystals glow with a slow pulse; the opponent sees the count clearly (this is part of the bluffing game) |
| **Resonance tick** | 250 ms | A rune segment lights on the ring around your portrait; at thresholds (2/3/4/5) the whole ring **ignites** (flare + tone step up a fifth), and cards whose Resonance bonus just turned live flash once in hand |
| **End turn button** | states | *Has actions:* calm. *No actions left:* gently pulses ("you're done"). *Attacks left unused:* shows a small sword badge; optional "confirm end turn" setting |

### 6.7 Relics and Rifts
| Event | Duration | Beats |
|---|---|---|
| **Relic placed** | 450 ms | The card spins in, lands face-up in the backrow, and the medallion art glows; charge pips pop in one by one |
| **Relic triggers** | 250 ms | The relic pulses and a thin light line connects it to what it affected |
| **Charge spent** | 200 ms | A pip cracks and goes dark |
| **Relic breaks** | 600 ms | Spiderweb cracks, then a Shatter with metal shards |
| **Rift played** | 1,200 ms | **Environment transition:** the card flies to the Rift slot, then its art **bleeds out** onto your half of the board as an ambient overlay (12% opacity, slow motion: sunbeams / scrolling circuitry / swaying vines / drifting fog). The Rift line takes on the Rift's colour on your side |
| **Rift replaced** | 800 ms | The old environment cracks and falls away like broken glass while the new one bleeds in |

### 6.8 Bosses
| Event | Duration | Beats |
|---|---|---|
| **Boss intro** | 3,000 ms (skippable) | Arena fades in → the boss portrait slides in large with its name + title (Cinzel 900, letter-spacing animates wide→normal) → the signature mechanic card flips in beneath → the first dialogue line plays as a speech bubble → the portrait shrinks into the enemy portrait slot |
| **Omen telegraph** | 500 ms + persistent | An omen icon appears in the Omens tray (top right) with a **countdown number**; it glows a little brighter each turn; on its final turn it shakes and the board edge gets a subtle warning tint in the boss's colour |
| **Omen fires** | 1,000–1,600 ms | A bespoke animation per omen (e.g. Judgment Bell: a giant translucent bell swings down and tolls, a shockwave rolls across your units, the highest-Power unit shatters) |
| **Phase change** | 2,000 ms | The boss portrait cracks, the screen shakes (trauma 0.7), the arena changes (lights shift, background elements break), a new title card appears ("ASCENSION"), and the music swaps to its phase-2 layer |
| **Dialogue bubble** | 2,500 ms | A comic-style bubble from the portrait; typewriter text at 40 chars/s; it never blocks input |
| **Boss defeated** | 2,400 ms | Lethal slow-mo → the portrait shatters (32 shards) → the arena drains of colour and crumbles → a "WARDEN DEFEATED" banner → straight to the reward reveal |

### 6.9 Meta screens
| Event | Duration | Beats |
|---|---|---|
| **Card reward (pick 1 of 3)** | ~1,500 ms | Three face-down cards deal in (120 ms stagger). **Rarity tells before the flip:** Rare cards wobble slightly; Epic cards wobble and leak purple light at the edges; Legendary cards **shake hard and leak gold light**, and the background dims. Click to flip (or "flip all"): Common = clean flip; Rare = blue sparkle burst; Epic = purple burst + chime; **Legendary = the card rises, a gold pillar of light, 300 ms of slow-mo, a choir stinger, `elastic.out` settle**; Mythic = the screen fractures, prismatic light, and a unique stinger. A foil shimmer pass plays on any foil card after its flip |
| **Rift Cache open** | 2,000 ms | A crystal geode hovers and cracks with each click (3 clicks; crack light colour = best rarity inside) → it bursts into 3 cards dealt in a fan |
| **Map travel** | 600 ms | A glowing path draws from the current node to the chosen node, and the player marker (a small lantern) floats along it |
| **Node hover** | 120 ms | The node lifts and shows a tooltip; Elite/Warden nodes show their portrait |
| **Tier Up ceremony** | 4,000 ms | After the loop is cleared: the Rift heals (cracks seal across the whole screen) → a beat of silence → it **re-tears** with a new crack colour for the next tier → "RIFT TIER IV" stamp → new mutators slide in as cards → new rewards preview |
| **Craft** | 1,200 ms | Shards spiral into the forge, the card silhouette forms in light, and it flashes into the full card |

---

## 7. VFX library (reusable presets)
Implement as pooled PixiJS particle presets plus a handful of shaders. Hard cap: **600 live particles**.

| Preset | Description |
|---|---|
| `shockwave` | An expanding ring (ring texture, scale + alpha), parameterised colour/radius/duration |
| `dust` | 6–14 soft motes, short life, slight upward drift |
| `sparks` | Additive streaks with gravity, 200–400 ms life |
| `embers` | Slow-rising orange motes with flicker |
| `shards` | Voronoi-split sprite pieces of the source texture (precompute 3 Voronoi patterns per token size, picked randomly) |
| `smoke` | Noise-textured sprites with rotation, scale-up and fade |
| `holyBeam` | A vertical gradient quad with additive blend + a scrolling noise mask |
| `scanBuild` | A shader: reveal a sprite bottom-up with a bright scanline and wireframe edge |
| `spores` | Crimson/green floating motes with sine drift |
| `runeCircle` | A rotating SVG rune ring, additive, pulses |
| `lightningArc` | A procedural jagged polyline that regenerates every 40 ms, for Nexus/Blitz flourishes |
| `featherFall` | Sprite feathers with a pendulum sway |

**Shaders:** `dissolve` (noise threshold + coloured edge glow) · `foil` (angle-keyed diffraction) ·
`prism` (Mythic frame) · `smokeEdge` (Veiled/Umbral edge distortion) · `desaturate` · `riftSeam`
(emissive animated crack) · `chromaticPulse` (≤ 2 px RGB split, Mythic/lethal only).

---

## 8. Camera and screen feel
- **Trauma-based shake:** trauma ∈ [0, 1]; offset = maxOffset × trauma², rotation = maxRot × trauma².
  maxOffset 14 px, maxRot 0.6°, decay 1.6/s, Perlin noise at 18 Hz. Events *add* trauma (clamped).
- **Hitstop:** 50 ms (light), 70 ms (normal), 110 ms (heavy/legendary).
- **Zoom punch:** scale 1 → 1.02 → 1 over 160 ms for Legendary slams, lethal hits and phase changes.
- **Slow-mo:** global timescale 0.25 for lethal blows; 0.5 for Legendary reward reveals.

## 9. Audio direction
- **SFX** are short, punchy and layered (a body + a realm "tail"). Randomise pitch ±4% and pick from 2–3
  variants per sound so nothing repeats robotically. Naming: `category_name_variant.ogg`.
- **Music:** one track per realm + Sanctum + map + each Warden + finale. Every combat track has 3
  stems: *calm* (early turns), *tension* (chain ≥ 3 or Essence < 10), *climax* (boss phase 2 / lethal on board).
  Crossfade stems over 1.5 s.
- **Ducking:** Legendary/Mythic stingers and boss lines duck music −9 dB for their duration.
- **Mix targets:** SFX peaks −6 dBFS, music around −18 LUFS, voice/stingers on top.

## 10. Settings & accessibility
- **Animation speed** 1×/1.5×/2×/4×/Instant. **Auto-pass:** *Smart* (default: only stop when I have
  a legal response) / *Always stop* / *Never stop on my turn*.
- **Reduced motion:** no shake, no hitstop, no parallax, no slow-mo; movements become 150 ms
  fades/slides; particles at 25%.
- **Photosensitivity:** never more than 3 flashes/second; full-screen flashes capped at 25% alpha; no
  saturated red full-screen flashes. A "No flashes" toggle replaces flashes with outline pulses.
- **Colour-blind support:** every realm and status has a **unique icon shape**, never colour alone.
  Optional patterns on realm rims.
- **Text size:** 100% / 115% / 130% (the inspect panel grows; the cards themselves don't).
- **Confirmations:** optional "confirm end turn with attacks remaining" and "confirm targeting my own
  unit with removal".

## 11. Performance budget
- 60 fps at 1080p on integrated laptop GPUs; 30 fps minimum on low-end Chromebooks (auto-lower particles).
- Card faces are rendered once to cached `RenderTexture`s (keyed by card + finish + state variant) and
  re-rendered only when displayed numbers change.
- One texture atlas per realm for frame parts; card art lazy-loaded (WebP), with a low-res blur
  placeholder until it arrives.
- Particle and shard sprites are pooled. Don't allocate in the render loop.
