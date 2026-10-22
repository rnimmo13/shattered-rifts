# Shattered Rifts: Core Game Design

*Working title. Deep, combo-heavy, trap-driven card dueling across shattered worlds.*
Web campaign first (free, donation-funded) → Steam full game ($7.99–$9.99) with PvP.

---

## 1. Premise
The Prime World broke in an event called **the Sundering**. Its pieces became **Realms**, each a
world with its own laws, now stitched together by unstable **Rifts**. Creatures, machines and
magic bleed between them.

You are a **Riftwalker**, one of the few who can travel the Rifts and **bind** what you defeat
into your **Grimoire** (your deck). Each Realm is ruled by a **Warden** who guards a shard of the
Prime World. Defeat them, take their power, and walk deeper. And every time you seal the Rift, it
tears open again, worse than before.

## 2. Player experience pillars (what players should feel)
These come first. When a design question is unclear, pick the option that best serves them.

1. **The Gotcha.** Traps and chains create reversals players remember and retell. Every duel
   should have at least a couple of "oh no" and "oh YES" moments. The chain UI makes these
   readable, so they feel earned rather than random.
2. **Combos you discover, not memorize.** Synergies (Resonance, Devour, Assemble, trap chains) light up
   in the UI when available. A new player stumbles into a combo by turn 3, and an expert builds
   a deck around one.
3. **Readable at a glance.** Board units are compact tokens with icons, not walls of text. Full
   card text is one hover away. Icons and colours carry state (Shielded, Stunned, Veiled...).
4. **Respect the player's time.** Regular duels take ~4 minutes, Wardens and PvP 6–12, and a full
   campaign loop 60–90 minutes. Animation speed controls and smart auto-pass throughout.
5. **Decks are seasonal, progress is permanent.** A run deck can be lost (that's the risk you chose), and
   Vault decks are wiped weekly. Characters, unlocks, cosmetics, finishes, ranks and the Hall of Fame
   are never taken away.
6. **Bosses with personality.** Every boss has a voice (taunts, reactions), a signature mechanic,
   and visible **Omens** that telegraph their powers, so players outplay bosses instead of being
   ambushed by hidden rules.
7. **Deck-building joy.** Every pick shapes a deck that is yours. Reward reveals, rarity tells, foils
   and alternate art. Finding a Legendary should feel like an event. Finishes unlock permanently.
8. **Fair forever.** No pay-to-win in the web version or on Steam. Money only buys the game,
   cosmetics, or supporter perks.
9. **Any deck can win.** A deck banked after one clear must be able to beat a deck that looped five
   times. Depth buys refinement and choice, not unbeatable power (`03_CAMPAIGN.md §3`).

## 3. Duel rules

### 3.1 Setup
| Rule | Value |
|---|---|
| Starting **Essence** (life) | 30 (bosses vary) |
| Deck size | Minimum 20, no maximum (run starters are 20) |
| Copies | Max 3 of a card; Legendary and Mythic max 1 each, and at most 2 Legendary+Mythic in total |
| Opening hand | 5 cards each, with one **mulligan**: choose any number to shuffle back and redraw |
| First player | Skips their first draw |
| Second player | Gets **Rift Spark** in hand (a non-collectible 0-cost Swift spell: gain 1 temporary Aether) |
| Hand limit | 9: extra draws are **burned** (sent to the Void, revealed) |
| Empty deck | Each draw from an empty deck deals **Fatigue** damage: 1, then 2, then 3... |

### 3.2 Zones
- **Deck**, **Hand**
- **Unit row**: 5 slots. Units are face-up, or face-down if set with Ambush.
- **Backrow**: 4 slots. Traps (face-down) and Relics (face-up).
- **Rift slot**: 1 slot, holding your active Rift card (a field effect). A new one replaces the old.
- **Void**: graveyard, public and ordered.
- **Beyond**: exiled cards, public and gone for good.

### 3.3 Resources
**Aether** is the only mana:
- Max Aether starts at 1 and grows by 1 at the start of each of your turns, up to 10.
- At the start of your turn, Aether refills to max.
- **Unspent Aether is held through the opponent's turn.** It's the only way to pay for traps and
  Swift spells when it isn't your turn. Held Aether is visible to the opponent, which creates bluffing:
  *"they held 3 Aether... what's set back there?"* Held Aether is lost when your next turn starts
  and you refill.
- *Temporary Aether* (from effects) can exceed max and disappears at end of turn.

**Resonance** is the combo counter:
- Each player's Resonance counts the cards they **played or activated this turn**: cards played from
  hand, trap activations, Swift spells and activated abilities, including on the opponent's turn.
  **Setting** a Trap or an Ambush unit does *not* count. (Otherwise free sets would make Resonance free.)
- Both players' Resonance resets to 0 at the start of every turn.
- Cards with **Resonance N:** get a bonus if your Resonance is ≥ N when they resolve. The card
  itself counts.
- The UI shows Resonance as a rune ring around your portrait that ignites at 2/3/4/5, and cards in
  hand whose bonus is live glow.

### 3.4 Turn structure
1. **Dawn**: max Aether +1, refill Aether, draw 1, resolve "start of turn" effects, reset Resonance.
2. **Main**: in any order, as many times as you can afford:
   - play a Unit (summon) or a Spell
   - **set** a Trap face-down (costs 0; pay its cost later when it activates)
   - play a Relic, play a Rift
   - set an **Ambush** unit face-down (1 Aether)
   - attack with each ready unit (once per unit per turn)
   - activate abilities
3. **Dusk**: resolve "end of turn" effects, temporary buffs expire, then the turn passes.

Units can't attack on the turn they're summoned (they're **Arriving**) unless they have **Blitz**.

### 3.5 Combat
1. **Declare**: choose a ready unit and a target: an enemy unit, or the enemy Riftwalker. If the
   enemy has any face-up unit with **Guardian**, you must target a Guardian.
2. **Respond**: the attack becomes Chain Link 1, and a response window opens (see §3.6). This is
   where traps spring.
3. **Resolve**: if the attack wasn't negated and both units are still on the field, they deal damage
   equal to their **Power** to each other at the same time. An attack on the Riftwalker deals
   Power to Essence.
4. Units at **0 Guard** are destroyed. They **shatter** and go to the Void. Damage on units **persists**
   between turns until healed.
5. Attacking a **face-down Ambush unit** flips it first: its Flip effect resolves, then combat continues
   against its real stats.

### 3.6 The Chain (responses and traps)
This is the heart of the game's depth. Rules are strict so the engine and the player always agree.

- **Fast cards** can be used when a response window is open: Swift spells, traps (set since at
  least your previous turn), and abilities marked ⚡ **Quick**.
- **A response window opens** after: a Spell is cast, an attack is declared, a unit is summoned (its
  "When summoned" effect becomes a link), a Trap or Quick ability is activated, or a Relic or Rift is
  played.
- **Priority** alternates, starting with the player who did *not* create the newest link. Each player
  may add **one** link or pass. When both players pass in a row, the **top link resolves**. Then the
  window reopens on the remaining chain, starting with the non-owner of the new top link.
- **Links resolve last-in, first-out.** If a link's targets are gone when it resolves, it **fizzles**
  (its cost is still paid).
- A Trap's **Trigger** condition must match the event that opened the current window
  (e.g. "When an enemy attacks" only in the window opened by an enemy attack declaration, at any
  depth of that chain).
- **Negate** cancels a link: it stays on the chain, does nothing, and goes to the Void.
- **Passive triggers** ("Whenever a unit dies...", "At end of turn...") are *not* chain links. They
  queue and resolve right after the current link finishes, in turn order (active player's first),
  and can't be responded to individually. This keeps chains readable.
- **Summoning itself can't be negated** unless a card says so. The unit lands, then its summon
  effect goes on the chain.
- A chain has no length limit, but every link costs Aether, which is the natural limit.

#### Example chain
1. On your turn, **Dawnlance Cavalier** (3/3) attacks the enemy Riftwalker. → **Link 1: Attack**.
2. The opponent has 2 held Aether and springs **Bone Pit** ("Trigger: When an enemy attacks. Destroy
   the attacker if its Guard is 3 or less"). → **Link 2**.
3. You set **Null Field** last turn ("Trigger: When an enemy activates a Trap or Swift spell. Negate
   it"). You pay 3 Aether. → **Link 3**.
4. The opponent has no Aether left and passes, then you pass.
5. Resolution, top-down: Link 3 negates Bone Pit → Link 2 does nothing → Link 1: the Cavalier hits
   for 3.

The UI only highlights *legal* responses, which is how players learn trigger rules without reading this section.

### 3.7 Card types
| Type | Where it goes | How it's used |
|---|---|---|
| **Unit** | Unit row | Has Power and Guard. Summon effects, passives, abilities. |
| **Spell** | Cast, then Void | One-shot. **Swift** spells can be cast in response windows. |
| **Trap** | Backrow, face-down | Set for 0. Activate from a later turn when its Trigger matches, paying its cost from held Aether. Then Void. |
| **Relic** | Backrow, face-up | Persistent effect. Many have **Charges**: when they hit 0, the relic breaks. |
| **Rift** | Rift slot | Field card, one per player, with a realm-flavoured rule tweak. |
| **Token** | Unit row | Created by effects (Drones, Larvae). Never in decks. Shatters into nothing. |

### 3.8 Keywords (complete list for launch)
Keep this list short. A new keyword must earn its place.

| Keyword | Rules |
|---|---|
| **Guardian** | Enemies must attack a Guardian if able (face-up Guardians only). |
| **Blitz** | Can attack the turn it's summoned. |
| **Shield** | Prevents the next instance of damage to this unit, then pops. |
| **Ward** | The first enemy effect that targets this each turn is negated. |
| **Pierce** | Excess combat damage to a unit carries over to the enemy Riftwalker. |
| **Lifebind** | Damage this deals also restores that much of your Essence. |
| **Veiled** | Can't be targeted or attacked until it attacks or deals damage. |
| **Stun** | A stunned unit can't attack or use abilities during its controller's next turn. |
| **Corrode** | At the start of its controller's turn, this unit loses 1 Power (to a minimum of 0). |
| **Ambush** | Can be set face-down in a unit slot for 1 Aether. Flips for free when attacked, or you may flip it during your Main on a later turn by paying its cost − 1; then its **Flip:** effect triggers. Flipping doesn't count as a summon. |
| **Devour** | When summoned, you may destroy another friendly unit. If you do, the bonus listed applies. Devouring counts as the destroyed unit dying. |
| **Evolve** | Transforms into the named card when the condition is met. Keeps damage and buffs, resets Arriving. |
| **Assemble** | When summoned, you may merge it with a friendly Construct: the target leaves (it doesn't die) and this gains its Power, Guard and keywords. |
| **Overclock N** | Optional extra cost N when played. If paid, the Overclock bonus applies. |
| **Resonance N:** | Bonus if your Resonance ≥ N on resolution. |
| **Echo N** | After this is in your Void, you may cast it from there for N Aether. Then it goes Beyond. |
| **Ascend:** | Alternative cost: instead of paying Aether, satisfy the listed sacrifice. |
| **Scry N** | Look at your top N cards and put any on the bottom, rest on top in any order. |
| **Swift** | (Spells) Can be cast in response windows, on either player's turn. |
| **⚡ Quick** | (Abilities) Can be activated in response windows. |
| **Negate** | Cancel a chain link (see §3.6). |
| **Charges N** | (Relics) Starts with N charges; breaks at 0. |

**Statuses** shown as icons on tokens: Shielded, Stunned, Corroded (with stack count), Veiled,
Warded, Arriving, Marked (boss mechanics).

### 3.9 Templating rules (card text)
Consistent wording is what makes a deep game learnable.

- `When summoned:`, `Flip:`, `Trigger: When ...`, `Whenever ...`, `At the start of your turn:`,
  `At the end of your turn:`, `⚡ Quick, N Aether:`, `Once per turn:`.
- Unit stats are written **Power/Guard**, e.g. "a 3/2 Drone".
- "Destroy" triggers death effects. "Banish" sends a card Beyond with no death trigger. "Return"
  sends to hand.
- "**Fights**": two units deal damage equal to their Power to each other at the same time. It isn't an
  attack (it doesn't trigger "When an enemy attacks" and doesn't use the unit's attack).
- Numbers are always digits. Card names inside text are **bold**.
- Max ~35 words of rules text. If more is needed, the design is too complex: split the effect.

## 4. Design guardrails for balance
- **Vanilla stat budget:** Power + Guard = 2 × cost + 1 (a 3-cost vanilla is 3/4 or 4/3).
  Keywords and effects are paid for out of that budget (see `02_CARDS.md`).
- **Card advantage is precious:** "draw 2" costs a real price.
- **Hard negation** (Negate) is rare and costs ≥ 3, so chains stay possible to overcome.
- **No infinite loops:** the engine caps chain depth at 64 and the trigger queue at 256 per action.
  A test must fail if any card combination hits the cap.
- **Turn-1 kills or locks are bugs.**
- **Every trap needs counterplay:** information (held Aether is visible), backrow removal (Shatter,
  Netrunner), or ways to bait it out.

## 5. AI opponents
The engine is deterministic and fast to clone, so the AI can **simulate before it acts**:
- Enumerate legal actions → simulate each 1–2 plies ahead with fast heuristics → score the board →
  pick the best, with a personality bias.
- **Personalities** are weight sets: aggression, trap-happiness, value-hoarding, risk. Each enemy
  and boss has one. Bosses add **scripted Omens** on top.
- **Difficulty** comes from search depth, mistake rate and deck quality, not cheating. The AI never
  sees your hand or face-down cards. It infers from held Aether the way a human would.
- Response windows: the AI responds with probability weighted by personality and value, and always
  takes "lethal-prevention" responses.

## 6. PvP (friends beta on the web first, then Steam)
PvP is where run-built decks meet. Season structure: `03_CAMPAIGN.md §7`.

- **Entry:** PvP unlocks after your first campaign loop clear. You play with decks from your **Vault**
  (5 slots, wiped weekly).
- **What carries into PvP:** the deck's cards, its Tempers (max 5), and the character's Sigil. **Boons
  never carry.** Deck rules (§3.1) apply.
- **Modes:**
  - **Casual** (all week): live matchmaking when someone is queued.
  - **Ghost matches** (all week): fight another player's Vault deck played by the AI. Wins and
    losses count for both sides, and the ghost's owner earns *ghost wins* while offline.
  - **Weekend Rift Tournament** (Fri 18:00 – Sun 23:59 UTC): one registered, locked deck, matches any time in
    the window, standings by record, cosmetic prizes and a Hall of Fame entry.
- **Leaderboard:** weekly. Score = live wins + ghost wins. One shared pool, with each deck's Tier shown as a badge.
- **Fairness:** no money buys power. Deck depth buys refinement, not dominance (pillar 9). Before public
  PvP, run seeds are server-issued and action logs are replay-verified, so decks can't be forged.
- **Tech:** the engine is pure and deterministic, so the same code runs on the server authoritatively.
  Hidden information (hands, decks, face-down cards) only ever lives on the server. Response windows
  get a **timer** (e.g. 8 s, plus a turn bank) with auto-pass when you have no legal response, so PvP
  never stalls.
