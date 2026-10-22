# Shattered Rifts: Cards

Rules live in `01_GAME_DESIGN.md`, visuals in `04_VISUALS_AND_ANIMATION.md`, art in `05_ART_PIPELINE.md`.
This doc covers the realms, card anatomy and data, the balance budget, the **Core Set (74 cards + 5
tokens)** and the character starters.

---

## 1. The Realms

Each realm has a clear identity: what it does well, what it is bad at, and a signature combo.
Weaknesses matter as much as strengths.

### ☀ Aurelion: The Gilded Reach (high fantasy)
Knights, clerics, griffins, dragons. A sun-bleached kingdom of marble and gold.
- **Does well:** Shield, Guardian, healing, buffs, efficient removal of attackers (Smite).
- **Bad at:** card draw, dealing with wide boards, getting around Veiled units.
- **Signature combo:** go wide with Shielded units → **Oathsworn Paladin** at Resonance 3 → stack
  Shields → **Aurumclaw** Ascends for free by destroying two Shielded units.
- **Trap style:** protective wards and spell negation.
- **Palette:** gold `#D4A84B`, ivory `#F4ECD8`, royal blue `#1E3A6E`.

### ⚙ Nexus-9: The Iron Foundry (sci-fi)
Drones, mechs, hackers and an awakened AI. A planet-sized factory under a dead star.
- **Does well:** going wide with Drone tokens, Assemble into big Constructs, **trap removal**
  (Netrunner, EMP), temporary Aether.
- **Bad at:** healing, single big threats it can't Stun, losing its board to sweepers.
- **Signature combo:** Swarm Protocol at Resonance 3 → Blitz Drones → **Enforcer** Assembles a
  Drone → **Overcharge** → swing.
- **Trap style:** countermeasures that punish summons and lock down attackers.
- **Palette:** cyan `#2EE6F0`, steel `#5B6B7A`, void black `#0D1117`, warning orange `#FF8A3D`.

### 🦴 Wyldmaw: The Gnawing Wilds (monsters)
Beasts, kaiju, insect broods. A jungle that eats its own.
- **Does well:** aggression, Devour (sacrifice for power), Evolve, Pierce, value from deaths.
- **Bad at:** **protecting** its units, answering Relics, and long games.
- **Signature combo:** chump units die → **Idol of Endless Hunger** and **Carrion Picker** grow →
  **Primal Feast** draws cards off your own deaths → **Thal'gor** Ascends and wipes the board.
- **Trap style:** snares and ambush predators that punish attacks and summons.
- **Palette:** crimson `#B3202A`, bone `#E8DCC2`, moss `#4F5D2F`.

### 👁 Umbral Veil: The Hollow Court (eldritch / shadow), unlocked by defeating Nyxara (Stage 4)
Shades, cultists and a queen who never shows her face. A city made of whispers.
- **Does well:** **traps** (the trap realm), Ambush units, discard, stealing units, chain combos.
- **Bad at:** raw stats, fighting big units head-on, and anything that removes its backrow.
- **Signature combo:** set three traps → **Snare Cascade** chains off another trap → **Mor'vael**
  turns every trap into card draw and burn.
- **Palette:** violet `#7B4BC9`, abyss `#1A1024`, spectral teal `#8FF5E0`.

### ◈ Neutral: Rift cards
Shard-stuff from between worlds. They fill gaps in any deck: cheap removal, backrow answers,
utility. **Palette:** obsidian `#22242B` with a prismatic seam (`#FF4FD8 → #4FC3FF → #7CFF6B`).

### Matchup wheel (soft, not absolute)
Aurelion's Shields blunt **Wyldmaw**'s early aggression. Wyldmaw's Pierce and devour-growth overrun
**Nexus**'s small Drones. Nexus's trap removal dismantles **Umbral**. Umbral's attack-punishing traps
and theft beat **Aurelion**'s attack-dependent plans.

---

## 2. Card anatomy (data)

```ts
type Realm = 'aurelion' | 'nexus' | 'wyldmaw' | 'umbral' | 'neutral';
type CardType = 'unit' | 'spell' | 'trap' | 'relic' | 'rift' | 'token';
type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

interface CardDef {
  id: string;               // 'AUR-10'. Stable forever: saves reference it.
  name: string;
  realm: Realm;
  type: CardType;
  rarity: Rarity;
  cost: number;             // Aether. Traps: activation cost.
  power?: number;           // units only
  guard?: number;           // units only
  tribes?: string[];        // 'Human', 'Knight', 'Construct', 'Drone', 'Beast', 'Shade'...
  keywords?: Keyword[];     // see 01_GAME_DESIGN §3.8
  params?: { overclock?: number; echo?: number; charges?: number; ambush?: true };
  ascend?: AscendCost;      // alternative cost
  abilities: Ability[];     // machine-readable behaviour (effect DSL below)
  text: string;             // player-facing rules text (authored; must match abilities)
  flavor?: string;          // ≤ 18 words, italic
  art: { file?: string; prompt: string; focal?: [number, number] };
  collectible: boolean;     // false for tokens
  source?: 'starter' | 'pool' | `boss:${string}`;  // boss: = only drops from that boss
}
```

### 2.1 Effect DSL (summary)
Card behaviour is **data**, interpreted by the engine. A new card should almost never need new
engine code. If it does, add a new generic `op` and test it, never a card-specific hack.

```ts
type Ability =
  | { kind: 'onResolve' | 'onSummon' | 'onDeath' | 'onFlip' | 'onDevoured' | 'startOfTurn' | 'endOfTurn';
      effects: Effect[]; resonance?: { n: number; effects: Effect[] }; optional?: boolean }
  | { kind: 'whenever'; event: EventFilter; effects: Effect[]; oncePerTurn?: boolean }   // passive trigger
  | { kind: 'trigger'; event: EventFilter; effects: Effect[] }                            // traps
  | { kind: 'activated'; quick?: boolean; cost: number; oncePerTurn?: boolean; effects: Effect[] }
  | { kind: 'static'; modifier: StaticModifier };                                         // auras, cost changes

type Effect =
  | { op: 'damage' | 'heal'; target: Target; amount: number | ValueExpr }
  | { op: 'destroy' | 'banish' | 'returnToHand' | 'stun' | 'corrode' | 'takeControl'; target: Target }
  | { op: 'buff'; target: Target; power?: number; guard?: number; duration: 'turn' | 'permanent' }
  | { op: 'grant'; target: Target; keyword: Keyword; duration: 'turn' | 'permanent' }
  | { op: 'summon'; card: string; count: number; side?: 'friendly' | 'enemy' }
  | { op: 'draw' | 'discardRandom' | 'scry' | 'gainAether'; player: 'self' | 'enemy'; amount: number }
  | { op: 'negate'; link: 'trigger' }               // the link that opened the window
  | { op: 'fight'; a: Target; b: Target }            // deal Power to each other, no attack
  | { op: 'transform'; target: Target; into: string }
  | { op: 'setFrom'; zone: 'hand' | 'deckTopN'; n?: number; filter?: Filter; free: true }
  | { op: 'copySpell'; which: 'lastCast' | 'eachDifferentInVoid' }
  | { op: 'conditional'; if: Condition; then: Effect[]; else?: Effect[] };

type Target = {
  pick: 'chosen' | 'random' | 'all' | 'self' | 'eventSource' | 'eventTarget' | 'riftwalker';
  side?: 'friendly' | 'enemy' | 'any';
  zone?: 'units' | 'backrow' | 'setCards' | 'relics';
  filter?: Filter;     // { type, tribe, maxCost, minPower, maxGuard, keyword, damaged, notSelf }
  count?: number;
};
type EventFilter = { type: 'attackDeclared' | 'unitSummoned' | 'spellCast' | 'trapActivated'
  | 'unitDied' | 'devoured' | 'swiftCast' | 'targeted'; side: 'friendly' | 'enemy' | 'any';
  filter?: Filter };
```

#### Worked examples (canonical: copy these patterns)
```jsonc
// AUR-10 Smite: Swift. Deal 3 damage to a unit. If it's attacking, deal 5 instead.
{ "keywords": ["swift"], "abilities": [{ "kind": "onResolve", "effects": [
  { "op": "conditional", "if": { "targetIsAttacking": true },
    "then": [{ "op": "damage", "target": { "pick": "chosen", "zone": "units" }, "amount": 5 }],
    "else": [{ "op": "damage", "target": { "pick": "chosen", "zone": "units" }, "amount": 3 }] }]}]}
// Spells use "onResolve". Units use "onSummon".

// WYL-11 Bone Pit: Trigger: When an enemy attacks. Destroy the attacker if its Guard is 3 or less.
{ "abilities": [{ "kind": "trigger", "event": { "type": "attackDeclared", "side": "enemy" },
  "effects": [{ "op": "conditional", "if": { "eventSource": { "maxGuard": 3 } },
                "then": [{ "op": "destroy", "target": { "pick": "eventSource" } }] }] }] }

// WYL-05 Maw Brute: Devour: gain +3/+3.
{ "keywords": ["devour"], "abilities": [{ "kind": "onSummon", "optional": true, "effects": [
  { "op": "destroy", "target": { "pick": "chosen", "side": "friendly", "zone": "units", "filter": { "notSelf": true } } },
  { "op": "buff", "target": { "pick": "self" }, "power": 3, "guard": 3, "duration": "permanent" }]}]}
// Devour = optional onSummon whose first effect is the sacrifice. If the sacrifice can't happen, the bonus doesn't either.

// UMB-12 Snare Cascade: Trigger: When you activate another Trap. Deal 2 damage to the enemy Riftwalker and draw a card.
{ "abilities": [{ "kind": "trigger", "event": { "type": "trapActivated", "side": "friendly" },
  "effects": [{ "op": "damage", "target": { "pick": "riftwalker", "side": "enemy" }, "amount": 2 },
              { "op": "draw", "player": "self", "amount": 1 }] }] }
```

### 2.2 Text ↔ data consistency
`text` is hand-written for quality, but a test (`content.test.ts`) checks that every keyword in
`keywords` appears in `text`, every number in `text` appears somewhere in the ability data, and every
`**Card Name**` reference resolves to a real card ID.

---

## 3. Balance budget

**Vanilla stats:** Power + Guard = **2 × cost + 1**.

| Cost | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Stat points | 3 | 5 | 7 | 9 | 11 | 13 | 15 | 17 | 19 | 21 |

**Keyword and effect prices** (in stat points):

| Thing | Price | Thing | Price |
|---|---|---|---|
| Guardian | 1 | Shield (on self) | 2 |
| Blitz | 1 (costs 1–3), 2 (4+) | Ward | 1 |
| Pierce | 1 | Lifebind | 2 |
| Veiled | 2 | Ambush (+ flip effect) | 1 + effect |
| Draw a card | 3 | 1/1 token | 2 |
| 1 damage (targeted) | 1.5 | Stun target | 2 |
| "Can't attack" | −3 | Drawback at end of turn | −1 to −2 |

**Rarity premium:** Common = on budget (±1). Rare = +1. Epic = +2. Legendary = +3 and a
build-around effect. Mythic = rule-bending, with a real deckbuilding cost.

**Spells and traps:** benchmark against removal. "Deal 3 to a unit" = 2 Aether. "Destroy a unit" =
5 Aether, or 3–4 with a condition. Traps cost about **1 less** than the equivalent spell, because they
need setup, are visible as "something," and can be baited. **Hard negate** is ≥ 3 Aether.

**Simulation gate:** before a card ships, bot-vs-bot simulation (1,000 games, mirrored decks, ±
the card) must not move the win rate more than ±6% for Commons and ±10% for Legendaries. See the tech doc.

**Rarity mix per realm (16 cards):** about 8 Common, 5 Rare, 2 Epic, 1 Legendary. Mythics are global
(1 in the Core Set).

---

## 4. Core Set: 74 cards + 5 tokens

Format: **Unit** stats are Power/Guard. Keywords are bold in text. `src:` marks restricted sources.

### ☀ Aurelion (16)
| ID | Name | Cost | Type / Stats | Rarity | Rules text |
|---|---|---|---|---|---|
| AUR-01 | Gilded Squire | 1 | Unit — Human Knight · 1/2 | C | **Guardian**. |
| AUR-02 | Lightbearer Acolyte | 2 | Unit — Human Cleric · 2/2 | C | When summoned: give another friendly unit **Shield**. |
| AUR-03 | Cleric of the Ninth Bell | 2 | Unit — Human Cleric · 1/3 | C | At the end of your turn: restore 2 Guard to a damaged friendly unit. |
| AUR-04 | Bastion Sentinel | 3 | Unit — Human Knight · 2/5 | C | **Guardian**. |
| AUR-05 | Dawnlance Cavalier | 3 | Unit — Human Knight · 3/3 | C | **Blitz**. |
| AUR-06 | Oathsworn Paladin | 4 | Unit — Human Knight · 3/5 | R | **Shield**. When summoned: **Resonance 3:** give your other units +1/+1. |
| AUR-07 | Sunwing Griffin | 4 | Unit — Beast · 4/3 | R | **Blitz**. **Pierce**. |
| AUR-08 | Archmagister Velle | 5 | Unit — Human Mage · 3/4 | E | Your spells cost 1 less. When summoned: add a random Aurelion spell to your hand. |
| AUR-09 | Aurumclaw, Dawn Dragon | 8 | Unit — Dragon · 7/7 | L | **Lifebind**. **Ascend:** destroy two friendly Shielded units. When summoned: give all other friendly units **Shield**. `src: boss:seraphine` |
| AUR-10 | Smite | 2 | Spell | C | **Swift**. Deal 3 damage to a unit. If it's attacking, deal 5 instead. |
| AUR-11 | Benediction | 3 | Spell | C | Give a unit +2/+2 and **Shield**. |
| AUR-12 | Final Judgment | 6 | Spell | E | Destroy all units with 4 or more Power. |
| AUR-13 | Aegis of the Warden | 1 | Trap | C | Trigger: When an enemy attacks one of your units. Give that unit **Shield** and +0/+2 this turn. |
| AUR-14 | Divine Rebuke | 4 | Trap | R | Trigger: When an enemy casts a spell. **Negate** it. Draw a card. |
| AUR-15 | Banner of the Ninth Dawn | 3 | Relic | R | **Charges 3**. Your units have +1 Power. Whenever a friendly unit dies, remove a charge. |
| AUR-16 | Rift: The Gilded Citadel | 2 | Rift | R | At the start of your turn: give a random friendly unit without Shield **Shield**. |

### ⚙ Nexus-9 (16)
| ID | Name | Cost | Type / Stats | Rarity | Rules text |
|---|---|---|---|---|---|
| NEX-01 | Patrol Drone | 1 | Unit — Construct Drone · 1/1 | C | When summoned: summon a 1/1 **Drone**. |
| NEX-02 | Field Technician | 2 | Unit — Human Engineer · 2/2 | C | **Overclock 1:** when summoned, give a friendly Construct +2 Power. |
| NEX-03 | Sentry Turret | 2 | Unit — Construct · 0/4 | C | **Guardian**. Can't attack. At the end of your turn: deal 1 damage to a random enemy unit. |
| NEX-04 | Enforcer Mk.II | 3 | Unit — Construct · 3/3 | C | **Assemble**. |
| NEX-05 | Netrunner Ix | 3 | Unit — Human Hacker · 2/3 | R | When summoned: look at the enemy's set cards. You may destroy one that costs 3 or less. |
| NEX-06 | Warframe "Bastion" | 6 | Unit — Construct Mech · 5/7 | E | **Guardian**. **Assemble**. Damage dealt to this is reduced by 1. |
| NEX-07 | CALYX, Ascended Intelligence | 7 | Unit — Construct AI · 5/5 | L | Your Constructs have **Ward**. When summoned: cast a copy of the last spell you cast this game (choose new targets). `src: boss:kron` |
| NEX-08 | Overcharge | 1 | Spell | C | **Swift**. Give a Construct +3 Power this turn. At the end of turn, it takes 1 damage. |
| NEX-09 | Swarm Protocol | 3 | Spell | C | Summon three 1/1 **Drones**. **Resonance 3:** they have **Blitz**. |
| NEX-10 | EMP Burst | 4 | Spell | R | **Stun** all enemy units. Destroy all enemy Relics that cost 3 or less. |
| NEX-11 | Recompile | 2 | Spell | C | Return a friendly unit to your hand. Draw a card. |
| NEX-12 | Countermeasure Grid | 2 | Trap | C | Trigger: When an enemy unit is summoned. Deal 3 damage to it. |
| NEX-13 | Lockdown Protocol | 3 | Trap | R | Trigger: When an enemy attacks. **Negate** the attack and **Stun** the attacker. |
| NEX-14 | Aether Reactor | 2 | Relic | R | **Charges 3**. At the start of your turn: gain 1 temporary Aether and remove a charge. |
| NEX-15 | Rift: Foundry Nexus-9 | 2 | Rift | R | Your first Construct each turn costs 1 less. |
| NEX-16 | Salvage Bot | 2 | Unit — Construct · 2/1 | C | When this dies: draw a card. |

### 🦴 Wyldmaw (16)
| ID | Name | Cost | Type / Stats | Rarity | Rules text |
|---|---|---|---|---|---|
| WYL-01 | Gnashling | 1 | Unit — Beast · 2/1 | C | When this is Devoured, the devourer gets an extra +1/+1. |
| WYL-02 | Rift Raptor | 2 | Unit — Beast · 3/2 | C | **Evolve:** after this destroys an enemy unit in combat, transform into **Rift Ravager**. |
| WYL-03 | Acid Spitter | 2 | Unit — Beast · 2/2 | C | When summoned: **Corrode** an enemy unit. |
| WYL-04 | Ravenous Packhound | 3 | Unit — Beast · 2/3 | C | Has +1 Power for each other friendly Beast. |
| WYL-05 | Maw Brute | 4 | Unit — Beast · 4/4 | C | **Devour:** gain +3/+3. |
| WYL-06 | Broodmother Vexa | 5 | Unit — Beast Insect · 3/5 | E | At the end of your turn: summon a 1/1 **Larva**. Whenever you Devour, summon a **Larva**. |
| WYL-07 | Thal'gor, the Worldeater | 9 | Unit — Kaiju · 8/8 | L | **Ascend:** destroy three friendly units. When summoned: destroy all other units. Gain +1/+1 for each unit destroyed this way. `src: boss:gorrmaw` |
| WYL-08 | Blood Frenzy | 2 | Spell | C | Give a friendly unit +3 Power and **Blitz** this turn. |
| WYL-09 | Primal Feast | 1 | Spell | C | Destroy a friendly unit. Draw 2 cards. |
| WYL-10 | Roar of the Maw | 4 | Spell | R | Your units get +2/+1 this turn. **Resonance 3:** they also gain **Pierce** this turn. |
| WYL-11 | Bone Pit | 2 | Trap | C | Trigger: When an enemy attacks. Destroy the attacker if its Guard is 3 or less. |
| WYL-12 | Lurker in the Brush | 3 | Trap | R | Trigger: When an enemy unit is summoned. Summon a 4/3 **Lurker**. It fights the summoned unit. |
| WYL-13 | Idol of Endless Hunger | 3 | Relic | R | Whenever a friendly unit dies: give a random friendly unit +1/+1. |
| WYL-14 | Rift: The Gnawing Wilds | 2 | Rift | R | Once per turn, whenever you Devour: draw a card. |
| WYL-15 | Carrion Picker | 3 | Unit — Beast · 3/3 | C | Whenever another friendly unit dies: gain +1 Power. |
| WYL-16 | Ironhide Charger | 5 | Unit — Beast · 5/5 | C | **Guardian**. When this is Devoured, the devourer gains **Guardian**. |

### 👁 Umbral Veil (16)
| ID | Name | Cost | Type / Stats | Rarity | Rules text |
|---|---|---|---|---|---|
| UMB-01 | Veilshade | 1 | Unit — Shade · 1/2 | C | **Ambush**. Flip: **Stun** an enemy unit. |
| UMB-02 | Whisper Acolyte | 2 | Unit — Human Cultist · 1/3 | C | Your Traps cost 1 less to activate. |
| UMB-03 | Gloomstalker | 3 | Unit — Shade · 3/3 | C | **Veiled**. |
| UMB-04 | Seer of Hollow Eyes | 3 | Unit — Human Cultist · 2/3 | R | When summoned: look at the top 3 cards of your deck. You may set a Trap from among them. Put the rest on the bottom. |
| UMB-05 | Hollow Lurcher | 4 | Unit — Shade · 2/5 | C | **Ambush**. Flip: deal 3 damage to an enemy unit. |
| UMB-06 | The Puppeteer | 6 | Unit — Shade Lord · 4/5 | E | When summoned: take control of an enemy unit that costs 3 or less. It's Arriving. |
| UMB-07 | Mor'vael, Queen of Snares | 7 | Unit — Shade Queen · 5/6 | L | Your Traps can be activated the turn they're set. Whenever one of your Traps resolves: draw a card and deal 2 damage to the enemy Riftwalker. `src: boss:nyxara` |
| UMB-08 | Mindrot | 2 | Spell | C | The enemy discards a random card. **Resonance 3:** two cards instead. |
| UMB-09 | Draw the Veil | 3 | Spell | R | **Swift**. Return a unit to its owner's hand. Then you may set a Trap from your hand. |
| UMB-10 | Shadow Coil | 1 | Trap | C | Trigger: When an enemy attacks. The attacker gets −3 Power this turn. |
| UMB-11 | Mirror of Malice | 2 | Trap | R | Trigger: When an enemy spell targets one of your units. Change its target to a random enemy unit. If none, **Negate** it. |
| UMB-12 | Snare Cascade | 2 | Trap | R | Trigger: When you activate another Trap. Deal 2 damage to the enemy Riftwalker and draw a card. |
| UMB-13 | Hungering Dark | 4 | Trap | E | Trigger: When an enemy attacks. Destroy the attacker, then destroy all enemy units with the same name. |
| UMB-14 | Lantern of Lost Names | 2 | Relic | R | Your set cards can't be destroyed or revealed by enemy effects. |
| UMB-15 | Rift: The Hollow Veil | 2 | Rift | R | Your backrow has 5 slots. The first Trap you activate each turn costs 1 less. |
| UMB-16 | Whispered Bargain | 1 | Spell | C | Draw 2 cards. Then put a card from your hand on top of your deck. |

### ◈ Neutral (10)
| ID | Name | Cost | Type / Stats | Rarity | Rules text |
|---|---|---|---|---|---|
| NEU-01 | Rift Wanderer | 1 | Unit — Wanderer · 1/2 | C | When summoned: **Scry 1**. |
| NEU-02 | Echo Wisp | 2 | Unit — Spirit · 2/2 | C | **Echo 3**. |
| NEU-03 | Shardstone Golem | 5 | Unit — Construct Elemental · 4/6 | C | **Guardian**. |
| NEU-04 | Riftborn Colossus | 7 | Unit — Elemental · 7/8 | R | Costs 1 less for each card in your backrow. |
| NEU-05 | Tear in the Rift | 0 | Spell | R | Gain 2 temporary Aether. **Resonance 4:** gain 3 instead. |
| NEU-06 | Shatter | 2 | Spell | C | **Swift**. Destroy a Relic or a set card. |
| NEU-07 | Rift Bolt | 1 | Spell | C | **Swift**. Deal 2 damage to a unit. |
| NEU-08 | Null Field | 3 | Trap | R | Trigger: When an enemy activates a Trap or casts a Swift spell. **Negate** it. |
| NEU-09 | Riftwalker's Codex | 1 | Relic | C | **Charges 2**. At the start of your turn: if you have 3 or fewer cards in hand, draw a card and remove a charge. |
| NEU-10 | Prism, Heart of Shards | 10 | Unit — Elemental · 8/8 | **Mythic** | Costs 1 less for each different card type in your Void. When summoned: cast a copy of each different Spell in your Void (random targets). `src: boss:vorthax` |

### Tokens (not collectible)
| ID | Name | Stats | Text | Made by |
|---|---|---|---|---|
| TOK-SPARK | Rift Spark | Spell · 0 | **Swift**. Gain 1 temporary Aether. | Given to the second player |
| TOK-DRONE | Drone | Construct Drone · 1/1 | | NEX-01, NEX-09 |
| TOK-LARVA | Larva | Beast Insect · 1/1 | | WYL-06 |
| TOK-LURKER | Lurker | Beast · 4/3 | | WYL-12 |
| TOK-RAVAGER | Rift Ravager | Beast · 5/4 | **Pierce**. | WYL-02 (Evolve) |

### Boss-only "Warden's Bane" cards (designed later, one per boss)
Every boss also has 3–5 **signature cards** in its drop pool: the Legendaries above, plus Rare/Epic cards
designed alongside each boss (see `03_CAMPAIGN.md`). Signature cards are only offered through
the Warden's Gift, which keeps boss fights meaningful on every loop.

---

## 5. Character starters (20 cards each, Commons only)

Each run starts from the character's starter (see `03_CAMPAIGN.md §1`). They're deliberately plain, so run picks
define the deck. Maren, Rivet and Kesh are available from the start. Vesper unlocks by defeating Nyxara once.

**Ser Maren Ashcourt — Oath of Dawn (Aurelion):** shields and a sturdy midrange
Gilded Squire ×3, Lightbearer Acolyte ×2, Cleric of the Ninth Bell ×2, Bastion Sentinel ×2,
Dawnlance Cavalier ×2, Smite ×2, Benediction ×1, Aegis of the Warden ×2, Rift Wanderer ×2, Rift Bolt ×2 → **20**

**Rivet — Iron Protocol (Nexus-9):** go wide, then go big
Patrol Drone ×3, Field Technician ×2, Sentry Turret ×2, Enforcer Mk.II ×2, Salvage Bot ×2,
Overcharge ×2, Swarm Protocol ×1, Recompile ×1, Countermeasure Grid ×2, Rift Wanderer ×1, Rift Bolt ×2 → **20**

**Kesh the Unfed — Hunger Unleashed (Wyldmaw):** aggressive Devour
Gnashling ×3, Rift Raptor ×2, Acid Spitter ×2, Ravenous Packhound ×2, Maw Brute ×2,
Carrion Picker ×1, Ironhide Charger ×1, Blood Frenzy ×2, Primal Feast ×1, Bone Pit ×2, Rift Bolt ×2 → **20**

**Vesper Nightlace — Veil of Snares (Umbral, unlocked):** traps and ambushes
Veilshade ×3, Whisper Acolyte ×2, Gloomstalker ×2, Hollow Lurcher ×2, Mindrot ×1,
Whispered Bargain ×2, Shadow Coil ×3, Rift Wanderer ×1, Rift Bolt ×2, Shatter ×1, Shardstone Golem ×1 → **20**

### 5.1 Character Sigils (data: non-card passives with `duelStart` / `whenever` abilities)
| ID | Character | Sigil |
|---|---|---|
| SIG-MAREN | Ser Maren Ashcourt | **Oathbound:** your first unit each duel gains **Shield** |
| SIG-RIVET | Rivet | **Spare Parts:** start each duel with a 1/1 **Drone** |
| SIG-KESH | Kesh the Unfed | **Pack Hunger:** the first time you Devour each duel, draw a card |
| SIG-VESPER | Vesper Nightlace | **Sleight:** at the start of each duel, set a random Trap from your deck |

### 5.2 Pool size note
16 cards per realm + 10 Neutral is enough for the beta, but thin for Slay-the-Spire-style replayability. Target
**~35–40 per realm** by Steam Early Access, mostly added through character-mastery unlocks (`03_CAMPAIGN.md §1`).

---

## 6. Expansion plan (for the roadmap)
- **Set 2: "Ashen Necropolis"** (undead realm: graveyard recursion, Echo-heavy).
- **Set 3: "Tidebreak"** (deep-sea realm: bounce, Veiled leviathans).
- Each set: 1 new realm (16), +4 cards per existing realm, 2 Mythics, 1 new keyword max.
- Target: ~150 cards for Steam Early Access, ~250 by 1.0.
