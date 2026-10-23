# Shattered Rifts: Campaign, Runs & Seasons

The campaign is a **run**, in the style of Slay the Spire. Pick a character, start with a small Grimoire, and grow
it one choice at a time across **five stages**. Clear all five and you face the real decision of the game:
**Bank** the deck for PvP, or **Continue** one Rift Tier deeper for better rewards, knowing that if you fall, the
deck falls with you.

Players should feel three pulls: *"this deck is becoming mine"*, *"one more loop and it'll be perfect"*, and
*"...is it worth the risk?"*

> Decision log for this design: `docs/DECISIONS.md` §"Campaign & PvP model".

---

## 1. Characters

> **Combat v2 update:** there are now eight Riftwalkers with three-lane card pools; see `09_ROSTER.md` (the table below is the original four).

Each realm has one Riftwalker. A character sets your **starter Grimoire**, your **card pool** (their realm + Neutral),
and a **Sigil**: a starting passive that gives every run an identity from turn 1. *(Names are placeholders.)*

| Character | Realm | Who they are | Sigil (passive, every duel) | Playstyle |
|---|---|---|---|---|
| **Ser Maren Ashcourt**, the Last Oath | ☀ Aurelion | The last knight of an order that died in the Sundering. Dry, stubborn, kind | **Oathbound:** your first unit each duel gains **Shield** | Sturdy midrange: shields, Guardians, punishing attackers |
| **Rivet** | ⚙ Nexus-9 | A maintenance drone that woke up and built itself friends. Endlessly curious | **Spare Parts:** start each duel with a 1/1 **Drone** | Go wide, Assemble big, burst turns |
| **Kesh the Unfed** | 🦴 Wyldmaw | Raised by a beast pack and fed on whatever fell. Few words, all teeth | **Pack Hunger:** the first time you Devour each duel, draw a card | Aggro, sacrifice for value, snowball |
| **Vesper Nightlace** *(unlock: defeat Nyxara once)* | 👁 Umbral | A masked thief who robbed the Hollow Court and is still being hunted | **Sleight:** at the start of each duel, set a random Trap from your deck | Traps, ambushes, bluffing with held Mana |

- **Card pool:** reward offers come from your realm + Neutral. About **1 in 10 offers is "Rift-crossed"** (from another
  realm, marked with a rift seam), and Warden signature cards come from the boss's realm. That's how cross-realm decks happen.
- **Starter Grimoires** (20 cards, Commons only) are listed in `02_CARDS.md §5`.
- **Character mastery** (permanent): wins with a character unlock *more cards into that character's pool* (sidegrades
  and new archetypes, never stronger versions), plus portraits, card backs and voice lines.

## 2. Run structure

> **Update (DECISIONS #108):** a run now opens by choosing one of two starting decks (a kit), then meets The Threshold.
>
> **Update (DECISIONS #106):** every run opens on **The Threshold** (3 blessings and 1 bargain), and every stage and new loop opens on a **Waymark** (a rest, two blessings, sometimes a bargain), before the map appears.

```
Choose character ──► RUN at Rift Tier I (fresh 20-card starter, 2 Resolve on Normal: see DIFFICULTY)
   Stage 1 ─ realm A  (first run: the character's own realm)
   Stage 2 ─ realm B
   Stage 3 ─ realm C      (A–C: Aurelion / Nexus-9 / Wyldmaw in seeded order)
   Stage 4 ─ Umbral Veil  (always 4th: the trap realm is the final exam)
   Stage 5 ─ Vorthax, Heart of the Rift
──► LOOP CLEARED: choose
      BANK      → the deck goes to your Vault (5 slots) and the run ends. Eligible for PvP.
      CONTINUE  → Tier +1, +1 Resolve (max 3), keep deck & Boons, Stage 1 again (harder, better loot)
   Resolve reaches 0 at any point → RIFT COLLAPSE: the run and its deck are lost.
```

### 2.1 Stage map
Each of Stages 1–4 is a short branching node map: **5 floors + the Warden**, 2–3 nodes per floor, paths that branch
and merge, generated from the run seed. Stage 5 is a single floor (Shrine or Merchant, player's choice) and then Vorthax.

| Node | Icon | What happens | Placement rules |
|---|---|---|---|
| **Duel** | ⚔ | A regular realm duelist (12–15 Essence, ~4 min) | All of floor 1; ~40% of other nodes |
| **Elite** | 💀 | A tough named duelist (full Essence). Better card pick + a **Boon** | Floors 3–4, max 1 per stage, and at least one path avoids it |
| **Event** | ❔ | Short story choice with risk/reward | ~25% |
| **Shrine** | ✦ | Restore 1 Resolve **or** Temper a card **or** remove a card | Always on floor 5 |
| **Merchant** | ⚖ | Spend Shards: cards, Boons, removal, Tempering | ~10%, max 1 per stage |
| **Anomaly** | ✷ | A duel under a random Rift rule, double rewards | Tier II+, ~5% |
| **Warden** | 👑 | The realm boss | After floor 5 |

**Pacing target:** ~2–3 duels + 2 non-combat nodes + Warden per stage, about 18–20 minutes. A full loop takes
**60–90 minutes**. The run autosaves after every node, so a player can stop anywhere.

### 2.2 Resolve (run lives)
Duels always start at full Essence. Run tension comes from **Resolve**:
- A run starts with **2 Resolve** on Normal (Easy 5, Hard 1; DECISIONS #118). A lost duel costs 1, a lost Elite or Warden costs 2, so one lost Elite or Warden ends a Normal run.
- Losing a duel costs 1 (an Elite or Warden costs 2). You **retry the same node** with a fresh shuffle.
- Clearing a loop and choosing Continue restores **+1 Resolve** (max 3). From Tier VIII on, it restores 0.
- At 0 Resolve: **Rift Collapse**. The run deck is lost. You still keep XP, mastery progress, cosmetics found and
  cards discovered (see §6).

### 2.3 Your deck during a run
- **Card reward** after every duel: pick 1 of 3, **or skip** (skipping is a real choice: thin, focused decks are strong).
- **Deck rules always apply:** min 20 cards, max 3 copies (Legendary/Mythic max 1 each), at most 2 Legendary+Mythic
  in total. Removal can't take a deck below 20.
- **Tempering** (from Shrines, Merchants, Events, Warden's Gift): a specific copy gets one of *+1/+1*, *−1 cost*,
  *gain Shield* (units) or *+1 to its main number* (spells/traps). Tempered cards get a glowing ember frame edge.
  **Max 5 Tempered cards per deck.** Re-Tempering a sixth means removing a Temper from another card.
- **Boons** (run passives, max 5): from Elites, Events, Merchants and the Warden's Gift. They last for the whole run,
  across loops. **Boons never go into PvP.** A banked deck is cards + Tempers + the character's Sigil only.
- **Shards** are the run currency for Merchants. They're earned in duels and events and **reset when the run ends**.

### 2.4 Warden's Gift (the unique reward after each boss)
After each Warden, pick **1 of 3** (1 of 4 from Tier V), one offer from each category:
1. **Signature card:** one of that Warden's signature cards (§4).
2. **Boon:** a run passive, weighted toward the Warden's theme.
3. **Deck surgery:** remove up to 2 cards, *or* transform 1 card into a random card of a higher rarity, *or* Temper 2 cards.

## 3. Rift Tiers (the push-your-luck ladder)

Tier = how many loops this run has cleared, plus 1. **Every new run starts at Tier I.** Each tier keeps the
previous tiers' mutators.

| Tier | New mutator | New reward |
|---|---|---|
| **I** | Base game | — |
| **II** | Enemies +3 Essence (Wardens +5). **Anomaly** nodes appear | Shards ×1.25 |
| **III** | Wardens gain a **second Omen** | **Foil** finishes can drop (5%) |
| **IV** | **Veteran decks:** enemy Commons are upgraded to Rares | Card rewards offer **1 of 4** |
| **V** | Elites start each duel with a random Boon | Warden's Gift offers 1 of 4 |
| **VI** | Wardens gain **Phase 2** at half Essence | **Rift-Touched** alt-art can drop (2%) |
| **VII** | Every enemy starts with a random Trap from its realm set | One free **reroll** per card reward |
| **VIII** | Omens can be **veiled** ("?") until the turn before. Loop clears restore no Resolve | Shrines offer **two** of their three options |
| **IX** | Enemies start with +1 max Mana | Shards ×2.0 |
| **X** | **"Shattered":** Vorthax gains Phase 3. Merchant prices +25% | **Prismatic** finish (1%), title *Riftbreaker* |
| **XI+** | **Endless:** each tier adds +3 enemy Essence and one random stacking mutator (§3.1) | Deck badge shows the tier; cosmetic flair per tier |

**Design rule (power plateau):** deeper tiers mostly buy *choice* (more options, rerolls, removal, Tempering) and
*cosmetics*, not raw power. A deck banked after one clear has to be able to beat a deck that looped five times. The
deep deck should be more *refined*, not out of reach. If simulations show tier advantage is too high, cut
rewards before adding brackets.

### 3.1 Endless mutator pool (XI+)
*Fortified* (Wardens +10 Essence) · *Ambushers* (enemies get 1 extra set Trap) · *Mana Surge* (enemy temp +1
Mana on turn 3) · *Thick Hide* (enemy units +0/+1) · *Hexed* (a **Rift Curse** card, a 0-cost dead draw, is shuffled
into your deck for that duel) · *Rift Storm* (every 4th turn a random Neutral spell is cast for the enemy) · *Scarcity*
(Shrine options −1) · *Swift Foes* (enemy Commons gain Blitz on turns 1–3) · *Iron Will* (enemy Guardians gain Shield)
· *Oblivion* (your Void is banished at the start of each of your turns, which turns off Echo).

---

## 4. Wardens (bosses)

Rules every Warden follows:
- **Signature mechanic:** always on, and printed on the boss's portrait panel.
- **Omens:** telegraphed powers with visible countdowns ("Orbital Strike in 2"). **Omens never lie.**
  From Tier VIII they may be *veiled* ("?") until one turn before.
- **Voice:** 6–10 short lines (intro, trap sprung, low health, phase change, victory, defeat).
  Lines appear as speech bubbles. Keep them short and full of character.
- **Signature cards:** 3–5 per Warden, offered through the **Warden's Gift**. They're budgeted at the normal rarity
  premium (sidegrades with personality, not power spikes).

### 4.1 Seraphine, the Gilded Warden (Aurelion)
- **Essence:** 35 · **Deck:** Shield-stacking knights, Smite, Divine Rebuke, Final Judgment.
- **Signature, Sanctified Ground:** the first unit she summons each turn gains **Shield**.
- **Omen, Judgment Bell** (every 3rd turn, 1-turn warning): destroy the player's highest-Power unit.
- **Omen 2 (III+), Choir of Dawn:** heal 5 and give her units +0/+2.
- **Phase 2 (VI+), Ascension:** at 17 Essence she summons **Aurumclaw** for free and heals 8.
- **Signature cards:** AUR-09 **Aurumclaw, Dawn Dragon** (L) · **Seraphine's Oath** (E Relic: your Shielded units
  have +1 Power) · **Bell of Judgment** (R Trap, 3: Trigger: When an enemy unit with 5+ Power attacks.
  Destroy it.) · **Gilded Halberdier** (R Unit 3, 3/3: When its Shield pops, deal 2 damage to the source.)
- **Lines:** *"Kneel, Riftwalker. The light is patient."* · *"A trap? How… uncivilised."* · *"The bell
  tolls for you."* · (defeat) *"The dawn… was never mine to keep."*
- **Arena:** cathedral nave, sunbeams through broken stained glass, floating gold motes.

### 4.2 KR-0N "Kron", Foundry Overseer (Nexus-9)
- **Essence:** 35 · **Deck:** Drones, Assemble, Countermeasure Grid, EMP.
- **Signature, Production Line:** at the end of each of its turns, summon a 1/1 Drone (if it has < 5 units).
- **Omen, Orbital Strike** (2-turn countdown): deal 4 damage to each of the player's units.
- **Omen 2 (III+), Firewall:** destroy the player's most recently set card.
- **Phase 2 (VI+), Core Exposed:** its Constructs gain **Ward**, and Kron gets +1 max Mana.
- **Signature cards:** NEX-07 **CALYX** (L) · **Kron's Assembly Arm** (E Relic: whenever you Assemble, draw a
  card) · **Override Virus** (R Spell 3: take control of an enemy Construct until end of turn; it gains
  Blitz) · **Orbital Uplink** (R Trap 3: Trigger: When an enemy unit costing 5+ is summoned. Deal 5 damage to it.)
- **Lines:** *"UNREGISTERED ENTITY. COMMENCING DISASSEMBLY."* · *"COUNTERMEASURE ENGAGED."* ·
  *"ERROR. ERROR. RECALCULATING—"*
- **Arena:** a conveyor-belt factory floor, robotic arms in the background, warning strobes.

### 4.3 Gorrmaw, the Hunger Below (Wyldmaw)
- **Essence:** 40 · **Deck:** Devour, Packhounds, Bone Pit, Broodmother.
- **Signature, Insatiable:** whenever *any* unit dies, Gorrmaw gains 1 **Hunger** (shown as teeth on its
  portrait). At 5 it summons a 6/6 **Maw Spawn** and resets.
- **Omen, The Ground Trembles** (1-turn warning): next turn its units have **Blitz** and **Pierce**.
- **Omen 2 (III+), Regurgitate:** returns its 2 highest-cost dead units from its Void to the field as 2/2s.
- **Phase 2 (VI+), Feeding Frenzy:** its units get +1/+1 whenever a unit dies.
- **Signature cards:** WYL-07 **Thal'gor, the Worldeater** (L) · **The Hunger Below** (E Spell 5: Destroy a unit.
  Your units gain +X/+X where X is its Power) · **Maw Spawn Egg** (R Relic: Charges 3; when a friendly
  unit dies, remove a charge; at 0, summon a 6/6 Maw Spawn) · **Gorrmaw's Tooth** (R Relic: your Devour
  bonuses are +1/+1 higher).
- **Lines:** (no words, just growls rendered as glyph text) *"GRRRHHH—"* · *(the screen shakes with its
  laugh)*. Its portrait's eyes track your cursor.
- **Arena:** the inside of a giant ribcage in a jungle, bioluminescent spores.

### 4.4 Nyxara, the Veiled Matriarch (Umbral Veil)
- **Essence:** 40 · **Deck:** heavy traps, Ambush units, Mindrot, Hungering Dark.
- **Signature, Web of Snares:** starts the duel with 2 random Umbral Traps set. Her first Trap each
  turn costs 0.
- **Omen, She Whispers…:** marks one of her set cards with an eye. It *is* a trap, and it *will* trigger
  on your next attack. Do you attack into it, bait it, or Shatter it?
- **Omen 2 (III+), Unmasking:** reveals your hand to her for one turn and discards your highest-cost card.
- **Phase 2 (VI+), Unveiled:** all her Ambush units flip, and she sets 2 new Traps.
- **Signature cards:** UMB-07 **Mor'vael, Queen of Snares** (L) · **Nyxara's Web** (E Trap 3: Trigger: When an
  enemy attacks. Negate it. Set this card again instead of sending it to the Void (once per game).) ·
  **Whisper Net** (R Trap 2: Trigger: When an enemy casts a spell. They discard a random card.) ·
  **Faceless Courtier** (R Unit 2, 2/2, Ambush. Flip: look at the enemy's hand.)
- **First defeat** unlocks **Vesper Nightlace** permanently.
- **Lines:** *"Step carefully, little walker."* · *"Ah. There it is."* (trap sprung) · *"You saw the web…
  and walked in anyway."*
- **Arena:** a moonlit ballroom where the guests are shadows. Mirrors show the wrong reflections.

### 4.5 Stage 5: Vorthax, Heart of the Rift
- **Essence:** 50 · **Deck:** the best cards of all four realms. It changes between loops (seeded).
- **Signature, Shifting Rift:** every 2 turns his Rift card changes to another realm's Rift (the next
  one is shown).
- **Omen, Collapse** (3-turn countdown): deals 8 damage to you, reduced by 1 for each unit you control.
- **Phase 2, The Shattering** (at 25 Essence, all tiers): destroys every backrow card on both sides,
  then draws 3.
- **Phase 3 (X+), Prismatic Core:** immune to spells for 2 turns. Units only.
- **Warden's Gift:** the signature slot is NEU-10 **Prism, Heart of Shards** (Mythic).
- **Lines:** *"Every world you saved… I was standing in it."* · *"Again. Again. Again."* (on Tier II+
  intro) · (defeat) *"I'll mend. You won't."*
- **Arena:** a void with floating fragments of all four arenas, orbiting a fractured crystal heart.

### 4.6 Elites (2 per realm) and regular duelists
| Realm | Elite 1 | Elite 2 | Regular duelists |
|---|---|---|---|
| Aurelion | **Templar-Commander Aldric**: Guardian wall, Banner | **High Inquisitor Maelis**: spell negation | Squire Recruit · Bell Cleric · Wandering Knight |
| Nexus-9 | **Hive-7**: endless Drones | **Ghostwire**: a hacker cell that destroys your set cards | Line Technician · Patrol Unit 44 · Scrap Collector |
| Wyldmaw | **Packmother Ruhn**: Packhound swarm | **The Bloated One**: Devour + Idol | Raptor Pack · Spitter Nest · Feral Riftling |
| Umbral | **The Lamplighter**: Ambush units | **Choir of Silence**: discard and theft | Hooded Acolyte · Whisperer · Lost Courtier |

Each has a deck list in `packages/content/enemies/` (regular duelists: ~20 cards and 12–15 Essence; Elites: 30 cards).
Decks use realm + Neutral cards. Each enemy also has an AI personality weight set.

---

## 5. Boons and Events

### 5.1 Boons (run-only passives, never in PvP)
Choose 1 of 3 after Elites, from some Events, in Merchants and in the Warden's Gift. Max 5 per run. Aim for 20 at launch.

| Boon | Effect |
|---|---|
| Ember Heart | Start each duel with +1 max Mana. |
| Trapsmith's Kit | Your first Trap each duel costs 0. |
| Second Wind | Once per duel, when you'd drop below 10 Essence, heal 8. |
| Rift Tutor | Your opening hand always contains a card costing 2 or less. |
| Shard Magnet | +30% Shards this run. |
| Echoing Grimoire | The first spell you cast each duel is cast twice. |
| Iron Vanguard | Your first unit each duel gains Guardian and Shield. |
| Hungry Grimoire | Whenever you Devour, gain 1 temporary Mana. |
| Patient Hunter | Unspent Mana at the end of the opponent's turn gives +1 Mana next turn (max +2). |
| Cartographer | See the whole stage map and reroll one node per stage. |
| Warden's Bane | Deal 5 damage to Wardens at the start of the duel. |
| Resonant Soul | Your Resonance starts at 1 each turn. |

### 5.2 Events (examples; aim for ~15 at launch)
- **The Weeping Statue:** *Pray* (Temper a random card) · *Take its tears* (+60 Shards, but your next duel loss costs
  1 extra Resolve) · *Leave*.
- **Rift Merchant's Wager:** bet 50 Shards on a coin flip shown as a mini card reveal.
- **Lost Riftwalker:** duel a ghost using a copy of *your own deck*. Win: Boon.
- **Forbidden Grimoire:** add a random Epic to your deck, but a Rift Curse is added too (counts toward deck size).
- **The Cartographer's Cache:** choose 1 of 3 Rift-Touched cards. Add the normal version now, and the alt-art
  finish unlocks permanently if you clear this loop.
- **The Rift Echo** *(online)*: duel another player's ghost deck. Win: pick 1 of 3 cards from *their* deck.

---

## 6. Rewards & permanent progression

**Decks are seasonal. Progress is permanent.**

### 6.1 Per node (in-run)
| Node | Card reward | Shards (Tier I) | Other |
|---|---|---|---|
| Duel | Pick 1 of 3 (or skip) | 15–25 | |
| Elite | Pick 1 of 3, +1 rarity tier chance | 40–60 | Boon (1 of 3) |
| Anomaly | Pick 1 of 3 ×2 | 50 | |
| Warden | **Warden's Gift** (§2.4) | 100 | Character unlock (Nyxara, first time) |
| Vorthax | **Warden's Gift** with Prism | 150 | Bank / Continue choice |

### 6.2 Rarity odds per card offer
| Tier | Common | Rare | Epic | Legendary |
|---|---|---|---|---|
| I–II | 70% | 25% | 4.5% | 0.5% |
| III–IV | 62% | 29% | 7% | 2% |
| V–VI | 55% | 32% | 10% | 3% |
| VII–IX | 50% | 33% | 13% | 4% |
| X+ | 45% | 35% | 15% | 5% |

Rarity is a *flavour and build-around* signal, not a power ladder (`02_CARDS.md §3`: Rare = +1 stat point). These
odds rise slowly on purpose (power plateau, §3).

**Finishes** (cosmetic): Foil (Tier III+: 5%, +1% per tier, max 12%) · Rift-Touched alt-art (VI+: 2% → 5%) ·
Prismatic (X+: 1%). **A finish you find unlocks permanently** for that card. You can apply it to that card in any
future deck.

### 6.3 Permanent (never wiped)
- **Characters** and **character mastery** (pool unlocks, portraits, card backs, voice lines).
- **Codex:** every card you've discovered, with lore. Every finish you've found.
- **Riftwalker Rank** (XP from every duel, win or lose): portraits, card backs, board skins, titles.
- **Warden mastery** (wins per tier): a themed card back per Warden.
- **Records:** highest tier per character, fastest clear, and the **Hall of Fame**: a read-only snapshot of every
  deck you entered in a tournament, with its record. You can view it or replay it against the AI.

## 7. The Vault & Seasons (PvP-facing; full PvP rules in `01_GAME_DESIGN.md §6`)
- **Vault:** 5 deck slots. Banking into a full Vault asks which deck to replace.
- **Season = 1 week.** The Vault is wiped Monday 00:00 UTC. Runs in progress carry over.
- **PvP unlocks** after your first loop clear (your first Bank, or your first Continue).
- **Casual** (all week): live matchmaking, plus **ghost matches** against other players' Vault decks played by the AI.
- **Weekend Rift Tournament** (Fri 18:00 – Sun 23:59 UTC): register one Vault deck (it's locked for the weekend), and
  play matches any time in the window. Standings are by record.
- **Weekly leaderboard:** score = **live wins + ghost wins** (wins your ghost earns while you're offline). Opponent
  deck tiers are shown. Weighting comes later.

## 8. The Sanctum (hub screen)
- **Rift Gate:** start or continue a run, pick a character.
- **Vault:** your 5 banked decks (view, rename, register for the tournament).
- **Arena:** casual PvP, ghost matches, tournament, leaderboard.
- **Hall of Wardens:** boss bestiary (lore, signature cards seen, mastery).
- **Codex:** cards discovered, keyword glossary, rules, tutorial replays. **Hall of Fame.**
- **Support & Roadmap:** the roadmap and (at public launch) Ko-fi (see `06_WEB_PLATFORM.md`).
- **Settings:** animation speed, auto-pass, audio, accessibility, save export/import.

## 9. Onboarding (first 20 minutes)
1. Cold open: a scripted tutorial duel with a pre-set board that teaches attack → summon → a Trap
   **sprung on the player** (the Gotcha, taught by suffering it) → setting your own Trap and springing it.
2. Pick a character (Maren, Rivet or Kesh), with a short animated preview of their Sigil and signature combo.
3. Stage 1, floor 1: the first duel uses an easy personality. Tooltips appear contextually the first time
   each keyword shows up (max one per turn).
4. The first card reward is guaranteed to include a Rare that synergises with the character.
5. The Bank / Continue choice gets a one-time explainer the first time it appears.

## Ancestral cards

A twelve-card classless set (rarity `ancestral`, jade frame): powerful, one copy per deck, never in ordinary reward rolls. Offered by the Ancestors' Offering event, the Warden's Gift (sometimes), the merchant (rarely, 240 shards) and the "Call on the Ancestors" bargain. See DECISIONS #119.
