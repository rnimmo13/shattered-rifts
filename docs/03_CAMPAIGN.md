# Shattered Rifts: Campaign & Progression

The campaign is a **loop**. Clear all four Realms and the Heart of the Rift, and the Rift tears open
again one **Rift Tier** higher: meaner bosses, new mutators, better loot. Your collection always
carries forward. Players should feel two pulls at once: *"my deck is getting stronger"* and *"the
Rift is getting scarier."*

---

## 1. Structure

```
Sanctum (hub) ──► LOOP at Rift Tier N
                   Act 1  ─ realm A (random from Aurelion / Nexus-9 / Wyldmaw)
                   Act 2  ─ realm B
                   Act 3  ─ realm C
                   Act 4  ─ Umbral Veil (always 4th: the trap realm is the final exam)
                   Finale ─ Vorthax, Heart of the Rift
                 ──► Loop cleared → Tier N+1 unlocked → back to Sanctum
```
- **First loop only:** Act 1 is the realm of the player's chosen starter, as a gentle on-ramp.
- **Playtime targets:** a duel takes 6–10 minutes, an act ~35–45 minutes (≈4–5 fights), and a full
  loop ~3 hours. A player can stop anywhere: the run autosaves after every node.

### 1.1 The Act map
Each Act is a branching node map, Slay-the-Spire style: **7 floors + boss floor**, 2–4 nodes per
floor, with paths that branch and merge. It's generated from the run seed, so it's different every loop.

| Node | Icon | What happens | Placement rules |
|---|---|---|---|
| **Duel** | ⚔ | Regular realm duelist | ~45% of nodes. All of floor 1. |
| **Elite** | 💀 | Tough named duelist. Better reward + a **Boon** | Floors 3–6, max 2 per act, at least one path avoids them |
| **Event** | ❔ | Short story choice with risk/reward | ~20% |
| **Shrine** | ✦ | Restore 1 Resolve **or** Temper a card (see 1.3) | Always on floor 7; ~8% elsewhere |
| **Merchant** | ⚖ | Spend Shards: cards, Boons, card Tempering | ~10%, max 1 per act |
| **Anomaly** | ✷ | A duel under a random Rift rule, double rewards | Tier II+, ~5% |
| **Warden** | 👑 | The realm boss | Floor 8 |

### 1.2 Resolve (run "lives")
Duels always start at full Essence. Run tension comes from **Resolve** instead of carried-over HP,
which suits a card game better.
- Start each loop attempt with **3 Resolve** (2 at Tier VIII+).
- Losing a duel costs 1 Resolve (a Warden or Elite costs 2). You can retry the same node.
- At 0 Resolve the run ends (**Rift Collapse**). **You keep every card, Shard and XP you earned.** Tier
  progress isn't lost; you just restart the current tier's loop from Act 1. *(Pillar: always
  progress.)*

### 1.3 Your deck during a run
- Pick a 30-card deck from your collection at the start of a loop.
- **Edit your deck freely between nodes.** New cards are added to the collection instantly. Finding
  a card and slotting it in right away is a core joy.
- **Tempering** (run-only upgrades from Shrines/Merchants/Events): a specific card copy gets one of
  *+1/+1*, *−1 cost*, *gain Shield* (units) or *+1 to its main number* (spells/traps) for the rest of this loop.
  Tempered cards get a glowing ember frame edge.
- **Boons** (run-only passives, max 5, chosen 1-of-3 after Elites and from some events) give each run
  its own identity. See §4.

### 1.4 Quick Resolve (respecting time on repeat loops)
On any tier **below your highest cleared tier**, regular ⚔ Duel nodes offer **Quick Resolve**: skip the
duel, auto-win, get Shards only (no card pick). Elites and Wardens always have to be played.

---

## 2. Rift Tiers (difficulty that changes how the game plays)

Each tier keeps every previous tier's mutators. A tier must feel *different*, not just bigger.

| Tier | New mutator | New reward |
|---|---|---|
| **I** | Base game | — |
| **II** | Enemy duelists +5 Essence. **Anomaly** nodes appear. | Shards ×1.25 |
| **III** | Wardens gain a **second Omen**. | **Foil** finishes can drop (5%) |
| **IV** | **Veteran decks:** enemy commons are upgraded to rares. | Shards ×1.5, Epic odds ↑ |
| **V** | Elites start each duel with a random Boon. | Elite rewards offer 1-of-4 |
| **VI** | Wardens gain **Phase 2** at half Essence. | **Rift-Touched** alt-art can drop (2%) |
| **VII** | Every enemy starts with a random Trap from its realm set. | Shards ×2.0 |
| **VIII** | You start with 2 Resolve. Omens can be **veiled** (show "?" until the turn before). | Legendary odds ↑, Warden 2nd signature roll |
| **IX** | Enemies start with +1 max Aether. | Shards ×2.5 |
| **X** | **"Shattered":** Vorthax gains Phase 3. Merchant prices +25%. | **Prismatic** finish (1%), title *Riftbreaker*, animated card back |
| **XI+** | **Endless:** each tier adds +3 enemy Essence and one random stacking mutator from the pool (§2.1). | Shards +0.25× per tier. Leaderboard (Steam) |

### 2.1 Endless mutator pool (XI+)
*Fortified* (Wardens +10 Essence) · *Ambushers* (enemies get 1 extra set Trap) · *Aether Surge* (enemy
temp +1 Aether on turn 3) · *Thick Hide* (enemy units +0/+1) · *Hexed* (a **Rift Curse** card, 0-cost
dead draw, is shuffled into your deck) · *Rift Storm* (every 4th turn a random neutral spell is cast for
the enemy) · *Scarcity* (Shrine options −1) · *Swift Foes* (enemy commons gain Blitz on turn 1–3) ·
*Iron Will* (enemy Guardians gain Shield) · *Oblivion* (your Void is banished at the start of each of your
turns, which turns off Echo).

### 2.2 Tier selection
In the Sanctum, the player can start a loop at any tier up to **highest cleared + 1**. Lower tiers are
good for farming specific Warden drops or testing a deck.

---

## 3. Wardens (bosses)

Rules every Warden follows:
- **Signature mechanic:** always on, and printed on the boss's portrait panel.
- **Omens:** telegraphed powers with visible countdowns ("Orbital Strike in 2"). **Omens never lie.**
  At Tier VIII+ they may be *veiled* ("?") until one turn before.
- **Voice:** 6–10 short lines (intro, trap sprung, low health, phase change, victory, defeat).
  Lines appear as speech bubbles. Keep them short and full of character.
- **Drops:** a pool of 3–5 **signature cards** that can't be crafted. **First clear on each tier**
  guarantees one you don't own yet (if any are left).

### 3.1 Seraphine, the Gilded Warden (Aurelion)
- **Essence:** 35 · **Deck:** Shield-stacking knights, Smite, Divine Rebuke, Final Judgment.
- **Signature, Sanctified Ground:** the first unit she summons each turn gains **Shield**.
- **Omen, Judgment Bell** (every 3rd turn, 1-turn warning): destroy the player's highest-Power unit.
- **Omen 2 (III+), Choir of Dawn:** heal 5 and give her units +0/+2.
- **Phase 2 (VI+), Ascension:** at 17 Essence she summons **Aurumclaw** for free and heals 8.
- **Drops:** AUR-09 **Aurumclaw, Dawn Dragon** (L) · **Seraphine's Oath** (E Relic: your Shielded units
  have +1 Power) · **Bell of Judgment** (R Trap, 3: Trigger: When an enemy unit with 5+ Power attacks.
  Destroy it.) · **Gilded Halberdier** (R Unit 3, 3/3: When its Shield pops, deal 2 damage to the source.)
- **Lines:** *"Kneel, Riftwalker. The light is patient."* · *"A trap? How… uncivilised."* · *"The bell
  tolls for you."* · (defeat) *"The dawn… was never mine to keep."*
- **Arena:** cathedral nave, sunbeams through broken stained glass, floating gold motes.

### 3.2 KR-0N "Kron", Foundry Overseer (Nexus-9)
- **Essence:** 35 · **Deck:** Drones, Assemble, Countermeasure Grid, EMP.
- **Signature, Production Line:** at the end of each of its turns, summon a 1/1 Drone (if it has < 5 units).
- **Omen, Orbital Strike** (2-turn countdown): deal 4 damage to each of the player's units.
- **Omen 2 (III+), Firewall:** destroy the player's most recently set card.
- **Phase 2 (VI+), Core Exposed:** its Constructs gain **Ward**, and Kron gets +1 max Aether.
- **Drops:** NEX-07 **CALYX** (L) · **Kron's Assembly Arm** (E Relic: whenever you Assemble, draw a
  card) · **Override Virus** (R Spell 3: take control of an enemy Construct until end of turn; it gains
  Blitz) · **Orbital Uplink** (R Trap 3: Trigger: When an enemy unit costing 5+ is summoned. Deal 5 damage to it.)
- **Lines:** *"UNREGISTERED ENTITY. COMMENCING DISASSEMBLY."* · *"COUNTERMEASURE ENGAGED."* ·
  *"ERROR. ERROR. RECALCULATING—"*
- **Arena:** a conveyor-belt factory floor, robotic arms in the background, warning strobes.

### 3.3 Gorrmaw, the Hunger Below (Wyldmaw)
- **Essence:** 40 · **Deck:** Devour, Packhounds, Bone Pit, Broodmother.
- **Signature, Insatiable:** whenever *any* unit dies, Gorrmaw gains 1 **Hunger** (shown as teeth on its
  portrait). At 5 it summons a 6/6 **Maw Spawn** and resets.
- **Omen, The Ground Trembles** (1-turn warning): next turn its units have **Blitz** and **Pierce**.
- **Omen 2 (III+), Regurgitate:** returns its 2 highest-cost dead units from its Void to the field as
  2/2s.
- **Phase 2 (VI+), Feeding Frenzy:** its units get +1/+1 whenever a unit dies.
- **Drops:** WYL-07 **Thal'gor, the Worldeater** (L) · **The Hunger Below** (E Spell 5: Destroy a unit.
  Your units gain +X/+X where X is its Power) · **Maw Spawn Egg** (R Relic: Charges 3; when a friendly
  unit dies, remove a charge; at 0, summon a 6/6 Maw Spawn) · **Gorrmaw's Tooth** (R Relic: your Devour
  bonuses are +1/+1 higher).
- **Lines:** (no words, just growls rendered as glyph text) *"GRRRHHH—"* · *(the screen shakes with its
  laugh)*. Its portrait's eyes track your cursor.
- **Arena:** the inside of a giant ribcage in a jungle, bioluminescent spores.

### 3.4 Nyxara, the Veiled Matriarch (Umbral Veil)
- **Essence:** 40 · **Deck:** heavy traps, Ambush units, Mindrot, Hungering Dark.
- **Signature, Web of Snares:** starts the duel with 2 random Umbral Traps set. Her first Trap each
  turn costs 0.
- **Omen, She Whispers…:** marks one of her set cards with an eye. It *is* a trap, and it *will* trigger
  on your next attack. Do you attack into it, bait it, or Shatter it?
- **Omen 2 (III+), Unmasking:** reveals your hand to her for one turn and discards your highest-cost card.
- **Phase 2 (VI+), Unveiled:** all her Ambush units flip, and she sets 2 new Traps.
- **Drops:** UMB-07 **Mor'vael, Queen of Snares** (L) · **Nyxara's Web** (E Trap 3: Trigger: When an
  enemy attacks. Negate it. Set this card again instead of sending it to the Void (once per game).) ·
  **Whisper Net** (R Trap 2: Trigger: When an enemy casts a spell. They discard a random card.) ·
  **Faceless Courtier** (R Unit 2, 2/2, Ambush. Flip: look at the enemy's hand.)
- **Lines:** *"Step carefully, little walker."* · *"Ah. There it is."* (trap sprung) · *"You saw the web…
  and walked in anyway."*
- **Arena:** a moonlit ballroom where the guests are shadows. Mirrors show the wrong reflections.

### 3.5 Finale: Vorthax, Heart of the Rift
- **Essence:** 50 · **Deck:** the best cards of all four realms. It changes between loops (seeded).
- **Signature, Shifting Rift:** every 2 turns his Rift card changes to another realm's Rift (the next
  one is shown).
- **Omen, Collapse** (3-turn countdown): deals 8 damage to you, reduced by 1 for each unit you control.
- **Phase 2, The Shattering** (at 25 Essence, all tiers): destroys every backrow card on both sides,
  then draws 3.
- **Phase 3 (X+), Prismatic Core:** immune to spells for 2 turns. Units only.
- **Drops:** NEU-10 **Prism, Heart of Shards** (Mythic), **guaranteed on the first loop clear**. That's
  the biggest reward moment in the game. Later clears: Rift Cache ×2 + cosmetic chance.
- **Lines:** *"Every world you saved… I was standing in it."* · *"Again. Again. Again."* (on Tier II+
  intro) · (defeat) *"I'll mend. You won't."*
- **Arena:** a void with floating fragments of all four arenas, orbiting a fractured crystal heart.

### 3.6 Elites (2 per realm) and regular duelists
| Realm | Elite 1 | Elite 2 | Regular duelists |
|---|---|---|---|
| Aurelion | **Templar-Commander Aldric**: Guardian wall, Banner | **High Inquisitor Maelis**: spell negation | Squire Recruit · Bell Cleric · Wandering Knight |
| Nexus-9 | **Hive-7**: endless Drones | **Ghostwire**: a hacker cell that destroys your set cards | Line Technician · Patrol Unit 44 · Scrap Collector |
| Wyldmaw | **Packmother Ruhn**: Packhound swarm | **The Bloated One**: Devour + Idol | Raptor Pack · Spitter Nest · Feral Riftling |
| Umbral | **The Lamplighter**: Ambush units | **Choir of Silence**: discard and theft | Hooded Acolyte · Whisperer · Lost Courtier |

Each has a 30-card deck list in `packages/content/enemies/` (to be authored by the dev agent from these
themes, using realm + neutral cards) and a personality weight set for the AI.

---

## 4. Boons (run-only passives)
Choose 1 of 3 after Elites and from some events. Max 5 per run. Examples for launch (aim for 20):

| Boon | Effect |
|---|---|
| Ember Heart | Start each duel with +1 max Aether. |
| Trapsmith's Kit | Your first Trap each duel costs 0. |
| Second Wind | Once per duel, when you'd drop below 10 Essence, heal 8. |
| Rift Tutor | Your opening hand always contains a card costing 2 or less. |
| Shard Magnet | +30% Shards this run. |
| Echoing Grimoire | The first spell you cast each duel is cast twice. |
| Iron Vanguard | Your first unit each duel gains Guardian and Shield. |
| Hungry Grimoire | Whenever you Devour, gain 1 temporary Aether. |
| Patient Hunter | Held Aether carries over: unspent Aether at end of the opponent's turn gives +1 Aether next turn (max +2). |
| Cartographer | See one extra floor of the map ahead and reroll one node per act. |
| Warden's Bane | Deal 5 damage to Wardens at the start of the duel. |
| Resonant Soul | Your Resonance starts at 1 each turn. |

## 5. Events (examples; aim for ~15 at launch)
- **The Weeping Statue:** *Pray* (Temper a random card) · *Take its tears* (+60 Shards, lose 1 Resolve
  in the next duel if you lose) · *Leave*.
- **Rift Merchant's Wager:** bet 50 Shards on a coin flip shown as a mini card reveal.
- **Lost Riftwalker:** duel a ghost using a copy of *your own deck*. Win: Boon.
- **Forbidden Grimoire:** add a random Epic to your collection, but a Rift Curse goes into your
  deck this loop.
- **The Cartographer's Cache:** choose 1 of 3 Rift-Touched card *previews*. You get the normal version
  now and unlock the alt-art if you clear this loop.

---

## 6. Rewards & economy

### 6.1 Per node
| Node | Card reward | Shards (Tier I) | Other |
|---|---|---|---|
| Duel | Pick 1 of 3 (realm + neutral pool) | 20–30 | |
| Elite | Pick 1 of 3, +1 rarity tier chance | 50–70 | Boon (1 of 3) |
| Anomaly | Pick 1 of 3 ×2 | 60 | |
| Warden | Signature card (rules in §3) + **Rift Cache** (3 cards, ≥1 Rare+) | 150 | Starter unlock (first clear) |
| Vorthax | Mythic (first clear) / 2 Rift Caches | 300 | Tier unlock, loop stats screen |
| Quick Resolve | — | 50% of normal | |

Shards scale with the tier multiplier in §2.

### 6.2 Rarity odds per card slot
| Tier | Common | Rare | Epic | Legendary |
|---|---|---|---|---|
| I–II | 70% | 25% | 4.5% | 0.5% |
| III–IV | 60% | 30% | 8% | 2% |
| V–VI | 50% | 33% | 13% | 4% |
| VII–IX | 42% | 35% | 17% | 6% |
| X+ | 35% | 35% | 22% | 8% |

**Bad-luck protection:** if no Legendary has dropped in 40 card slots, the next Rare+ slot is a Legendary.

**Finishes** (cosmetic, applied to the dropped card): Foil (Tier III+: 5%, +1% per tier, max 12%) ·
Rift-Touched alt-art (VI+: 2% → 5%) · Prismatic (X+: 1%). Finishes stack separately in the collection.

### 6.3 Duplicates and crafting
- Copies beyond the deck limit (3, or 1 for Legendary/Mythic) auto-convert to Shards:
  C 10 · R 25 · E 100 · L 400.
- **Rift Forge** (Sanctum): craft any collectible card you've **seen** (dropped or faced) for
  C 40 · R 100 · E 400 · L 1600. Signature (boss) cards and Mythics **can't be crafted**.
- Shards are earn-only. They're never sold.

### 6.4 Long-term progression (cosmetic)
**Riftwalker Rank** (XP from every duel, win or lose) unlocks portraits, card backs, board skins
and titles. Each Warden has a **mastery track** (wins per tier) that unlocks its themed card back.

---

## 7. The Sanctum (hub screen)
- **Rift Gate:** start or continue a loop, choose a tier.
- **Grimoire:** collection + deckbuilder (filters by realm, cost, type, keyword; deck curve chart).
- **Rift Forge:** crafting.
- **Hall of Wardens:** boss bestiary (lore, drops collected, mastery).
- **Codex:** keyword glossary, rules, tutorial replays.
- **Support & Roadmap:** Ko-fi, the roadmap, supporter perks (see `06_WEB_PLATFORM.md`).
- **Settings:** animation speed, auto-pass, audio, accessibility, save export/import.

## 8. Onboarding (first 20 minutes)
1. Cold open: a scripted tutorial duel with a pre-set board that teaches attack → summon → a Trap
   **sprung on the player** (the Gotcha, taught by suffering it) → setting your own Trap and springing it.
2. Pick a starter Grimoire (with a short animated preview of each realm's signature combo).
3. Act 1, floor 1: the first duel uses an easy personality. Tooltips appear contextually the first time
   each keyword shows up (max one per turn).
4. The first card reward is guaranteed to be a Rare that synergises with the starter.
