# The Knight rebuilt: Guard, Riposte, Thorns (2026-10-29, DECISIONS #415; the pool expansion, DECISIONS #423)

From `docs/BASE_CLASS_REWORKS.md` §4. The Ironclad copy she was (DECISIONS #364-367) is frozen in
`reviews/balance-baselines/2026-10-29-pre-identity-reworks/` (`cards/knight.md`). Her card-by-card prices are in
[`knight-ledger.md`](knight-ledger.md) (generated); the rates are in `docs/14_CARD_COSTING.md` §15.

**Fantasy:** a disciplined armoured knight who meets attacks, makes openings and punishes contact. No self-burning, no blood magic,
no Consume engine, no Might-and-multihit package.

## The rules (engine contract)

| Rule | Exactly |
|---|---|
| Guard | A hero whose trait has `openings` (the Knight). When one enemy attack hit **aimed at her** lands with at least 1 damage after its modifiers and her Barrier soaks all of it (she loses no HP), the attacker gets an **Opening** (`opening` status). Not when: the hit was 0, Shielded cancelled it, she was Ghostly (it was capped), a Trap cancelled it, any of it got through, it was the overflow from a fallen companion, or it hit a companion. Faltering, Exposed and the like are counted first: what is checked is the hit as it lands. An attack on every unit counts for the hit on her. |
| Order in a hit | Traps spring (a cancel ends it) -> damage after modifiers -> Ghostly cap / Shielded -> Barrier soaks -> HP -> Guard (Opening, then the "earned" triggers) -> Thorns retaliate. So Thorns that kill the attacker come after its Opening, and nothing answers twice. |
| One per enemy | An Opening is on or off (capped at 1). A multi-hit attack earns at most one. |
| How long | Until the end of the turn of the side that can spend it: an Opening earned on the enemy turn lasts through her next turn and goes as it ends; one a card gives on her turn goes at the end of that turn. Units that die take theirs with them; a summoned or replaced unit is a new unit with none. |
| Whose | An Opening is spent only by attacks of the other side (in the Arena, the other hero is the one left Open; the hero who holds it can never spend it). |
| Riposte | `counter(n, bonus)`: a damage effect aimed at the target; if the target is Open when it begins, the Opening is spent and every hit deals `bonus` more. `riposte(...ops)`: if the target is Open, spend it and do the ops. An ordinary attack never spends an Opening. A Riposte on a target killed earlier in the card finds nothing ("no loot from the dead"). The Opening is spent as the Riposte attack begins: a Shielded target or a Trap that stops the hit still uses it up (tested). The bonus is only for the Open target: hits that move to another enemy after it dies do not get it. |
| Earned vs given | "Whenever you earn an Opening" (Bastion Engine, Stoneskin, Iron Cadence, Measured Guard, the trait) answers only Guard. Cards that open an enemy (Draw Them In, Challenge, Last Bastion, Warlord's Oath, Duelist's Focus, Thornwake) never set those off, so no card loop can feed them. |
| Thorns | Temporary Thorns as before (`statusTheirs`): direct damage back per attack hit, until the enemy turn is over. They never make an Opening by themselves; Thornwake (an Aura) does, once a turn. |
| Riposte on every enemy | `counter(n, bonus, 'allFoes')` (Answer Them All, #423): the enemies Open **when the card is played** each spend their own Opening for their own bonus, once (each answers Exploit the Gap once). An Open enemy the hit kills still spent its Opening (it is spent as the attack begins, as for one target). An Opening a spend trigger gives back mid-card (Marshal's Eye) is kept, not spent again. |
| Keeping an Opening | "If the target is Open" / "If an enemy is Open" (`when('opening' / 'foesOpen')`) only read it. Scaling by "+N per Opening on the target" or "per Open enemy" reads it too. Only a Riposte spends. |
| Shedding Thorns | `shedTemp` (#423): takes up to N of her **temporary** stacks (the ones a card put up until the enemy turn is over), newest first, never lasting ones and never more than she has; the expiry entries go down with them, so nothing comes off twice when the rest wear off. `thornsSpent` reads how many, for one hit of "base + N per Thorns shed". A played card's target is alive, so nothing is shed into a dead enemy. Crown of Thorns' Thorns are put up at the end of her turn and gone by her next one, so they are retaliation only. |
| No intents | No Knight card reads an enemy intent (#423): Giant's Stance, Deflecting Blow and Sentinel's Patience were rewritten, so every card reads the same in the campaign and the Arena (tested). |
| Previews | The live damage on a Riposte card counts the bonus against an Open target and agrees with what it deals (tested); a Riposte on every enemy shows the range from a closed enemy to an Open one. |

## Trait and starter

- **Hold and Answer:** start every fight with 6 Barrier; Guard; the first time each turn you earn an Opening, gain 3 Barrier. (~21,
  guide §15; no Plating.)
- **Starter (10):** 4 Strike, 4 Defend, **Sundering Blow** (2: 9 damage, Riposte +6, 1 Exposed) and **Briarplate** (1: 5 Barrier,
  2 Thorns until the enemy turn is over). The first fight already asks: block the whole hit for an Opening, or attack; spend the
  Opening now or keep Sundering Blow; play Thorns before a multi-hit enemy. Sundering Blow and Strike are useful when no enemy attacks.

## Strategies

1. **Guard:** block whole hits and gain from every Opening. Shield Wall, Measured Guard, Patient Guard, Sentinel's Patience, Stoneskin,
   Iron Cadence, Bastion Engine, Aegis Eternal, Immovable Oath. Package: Shield Wall (14 Barrier) on a 9-damage intent = an Opening and
   +3 Barrier from the trait; Bastion Engine turns it into 8 damage; Iron Cadence into next turn's Mana.
2. **Riposte:** heavy counters that spend Openings, and ways to open enemies that will not attack. Return the Blow, Counterstroke,
   Bulwark Blow, Breaking Point, Perfect Counter, Masterstroke, Iron Rejoinder, Break Guard, Draw Them In, Challenge, Last Bastion,
   Warlord's Oath, Exploit the Gap. Package: Warlord's Oath opens the front enemy every turn; Perfect Counter+ spends it for 26.
3. **Thorns:** hurt whatever hits you. Briarplate, Spiked Pauldron, Thorned Gauntlet, Ember Ward, Barbed Vigil, Wall of Briars, Crown of
   Thorns; payoffs Briar Lash, Thornburst, Vengeful Strike, Bramble Guard, Barbed Retort, and Thornwake, which rewards retaliation
   without a no-damage turn by opening the attacker its Thorns strike.

Glue: Oath of Iron, Hilt Strike, Dawn Smite, Field Repairs, Clarion Clap, Squire's Drill, Rebuke, Provoke, Clang of Steel, Sweeping
Guard, Rallying Cry.

## Card disposition (54 live: 8 kept, 8 changed, 38 new; 67 removed)

**Kept (same card, lightly tuned):** Oath of Iron (upgrade 11 Barrier, draw 1 instead of +3/+1), Dawn Smite (upgrade 8 + 5), Hilt Strike
(upgrade 12 + draw 1), Field Repairs, Clarion Clap (upgrade 7 to all + 1 Exposed), Provoke (upgrade 10 Barrier + 1 Exposed), Ember Ward,
Immovable Oath (30 -> 26 Barrier).

**Changed (same id, new job):** Sundering Blow (signature Riposte), Bulwark Blow (an Opening finisher: 4, Riposte +12, no longer damage
equal to all Barrier), Stoneskin (Aura: 2 Barrier at turn end and per earned Opening), Giant's Stance (6 Barrier, 2 Faltering on an
attacker), Bastion Engine (8 to each enemy an earned Opening falls on, not damage on every Barrier gain), Warlord's Oath (open the front
enemy and gain 5 Barrier each turn, not Demon Form), Break Guard (8, Riposte: 2 Exposed), Challenge (open the target, Sap it 3, 4
Barrier).

**New:** Briarplate, Squire's Drill, Rebuke, Clang of Steel, Sweeping Guard, Rallying Cry, Measured Guard, Shield Wall, Guarded Advance,
Watchful Eye, Sentinel's Patience, Patient Guard, Iron Cadence, Aegis Eternal, Return the Blow, Draw Them In, Steady Blade, Counterstroke,
Shoulder Check, Iron Rejoinder, Breaking Point, Deflecting Blow, Exploit the Gap, Perfect Counter, Masterstroke, Last Bastion, Duelist's
Focus, Spiked Pauldron, Bramble Guard, Briar Lash, Thorned Gauntlet, Thornburst, Barbed Vigil, Barbed Retort, Thornwake, Wall of Briars,
Vengeful Strike, Crown of Thorns. (`hold-the-line` was an old retired id, so the 2-cost block is `shield-wall`.)

**Removed** (each into the nearest new card in `RETIRED_CARDS`, `packages/content/src/v2/retired.ts`): the Consume engine (Unholy Pact,
Rite of Recall, Numbing Rite, Burn It All, Fan the Flames, Bitter Breath, Sacrificial Guard, Scorching Blow, Searing Fist, Smoldering
Blow, Ritual of Ash, Forsake, Flailing Blows, War Drums, Pact of Embers, Howl of the Fallen, Ashen Reckoning, Wild Gamble, Unravel,
Borrowed Blade, Grim Focus, Cold Stare); the Blood engine (Draw Blood, Blood Plate, Breach, Reckless Smite, Scar Over, Blood Fire,
Spiteful Jab, Crimson Offering, Bloodied Plate, Rending Fury, Rally); the Might/multihit package (Twin Cut, Braced Strike, Cleaving
Throws, Mastered Strike, Steel Resolve, Intimidate, Pile On, Whirling Blade, Mounting Fury, Relentless Push, Berserker's Rage, Charging
Herd, Juggler's Rhythm, Wildfire, Double Down, Raised Hell, Unforgiving Drill, Stone Fury, Giant Rock, Hot Temper, Trampling Charge,
Plunder, Ram Home); Barrier retention to damage (Unbroken Wall, Stone Stance); and Rattle, Rising Fist, Hammer Fall, Scent of Weakness,
Cruel Streak, Crippling Blow, Bloodfeast, Brace for Battle, Inner Furnace. Consume stays a shared keyword (Immovable Oath, Duelist's
Focus), not her payoff chain.

## Checks the points can't do (guide §8)

- **Loops:** no free card makes Mana or returns itself. Rallying Cry's Mana is next turn's (the first draft refunded its own cost while
  an enemy was Open, which five copies could chain). Duelist's Focus (0) Consumes. Shoulder Check's draw needs an Opening, which it
  spends. Openings a card gives never set off an "earn" trigger.
- **Multipliers:** Warlord's Oath + Perfect Counter+ is one guaranteed counter a turn (26); with Exploit the Gap it draws 1 and gives
  3 Barrier more. Last Bastion + several Ripostes needs several enemies (one Opening each). Thorns: Wall of Briars (8) + Crown of Thorns
  (3) = 11 per hit; a 3-hit attack takes 33 a turn, a boss's single hit 11. Those are rare + rare and need the enemy to attack.
- **Turn-four ceiling:** a Riposte deck with Warlord's Oath: Perfect Counter+ 26 + Counterstroke 14 + a Strike 6 a turn, about a
  3-Mana turn's worth plus one Riposte bonus: under the rare ceiling.
- **Tiers:** bigger enemy hits are harder to stop completely, so Openings come less often at high tiers (Shield Wall, Immovable Oath
  and Aegis Eternal keep up; flat Thorns shrink against big enemies). A balance assumption to watch in play.
- **Bosses and single targets:** every strategy works against one enemy (Openings come from its attacks; Draw Them In, Challenge and
  Warlord's Oath open it on its buff turns). No kill trigger is needed.
- **Arena:** the Opening is visible to both players (a gold "Open" chip); it is a status on the other hero. No Knight card reads an
  intent any more (#423), so every card works the same against a hero; see the expansion's Arena section below.
- **Stall:** nothing heals or loops on defence alone; Guard pays Barrier, cards and next-turn Mana, and only damage ends a fight.

## The pool expansion (2026-10-29, DECISIONS #423): 89 cards, 87 reward-eligible

The cards as they stood before it (54, 52 reward-eligible) are frozen in `reviews/balance-baselines/2026-10-29-knight-duelist-pass/`.
35 cards were added (the nine of the Duelist brief and 26 more), four were changed; none was removed. 13 Auras (was 7). Build paths
(hidden): Guard 22, Riposte 36, Thorns 18. Every card is priced in the ledger; 87 of 89 within ±15% (the two outside are Oath of Iron
and Hilt Strike, kept from before).

### Five ways to play her

1. **The Duelist** (Riposte): keep the Opening, and use it for something before spending it. Testing Cut (7, 4 Barrier if Open),
   Measured Footwork, Keep Your Distance (2 Sapped on the Open enemy through its turn), Patient Edge (8, 12 if Open, Hold), Read the
   Duel, Probing Thrust (0: 5, 1 Exposed if Open), Keen Eye (2 Exposed if Open), Second Intention (Riposte: Open again, 3 Barrier),
   Closing Argument (16, Riposte: draw 2), Seize the Moment (0: 2 Mana while an enemy is Open, Consume), and two Auras: Measured
   Tempo (2 Barrier a hit on an Open enemy, never a Riposte) and Knight's Composure (6 Barrier at the end of a turn an enemy is still
   Open). **Sequencing:** with an Open enemy, play the cards that read the Opening first (Probing Thrust's or Keen Eye's Exposed,
   Testing Cut's Barrier, Patient Edge, Measured Tempo's Barrier), then the one Riposte that spends it, last, into the Exposed. Or keep
   it: with Composure, an Opening still there when the turn ends is 6 Barrier, and an earned one is gone at the end of her turn either
   way, so the choice each turn is the counter now or the Barrier. With Warlord's Oath the front enemy is Open every turn: Oath plus
   Composure is 11 Barrier a turn for the turns she does not counter.
2. **The formation fighter** (Guard path): many enemies and which of them are Open. Answer Them All (10 to all, +8 on each Open one),
   Ring of Steel (5 Barrier, +3 an Open enemy), Sweep the Line, Pick Them Apart (7, +3 an Open enemy, Hold), Cleaving Riposte
   (Riposte: 8 to all first, then 14, so a kill still splashes) and Marshal's Eye (Aura: the first Opening spent each turn opens the
   front enemy). **Managing several Openings:** each enemy holds at most one, and an earned one is on the enemy that attacked. Spend the
   one on the enemy you want dead, keep the others for the cards that count Open enemies, and finish the turn with Answer Them All,
   which spends all of them at once (each once). Last Bastion opens every enemy for it.
3. **The patient defender** (Guard): defence now, Mana and cards next turn, never more Barrier for its own sake. Steady Breath (5
   Barrier, 1 Mana next turn), Night Watch (5 Guarded, 2 cards next turn, Hold), Steel Before Dawn (10 Barrier, Mana and a card next
   turn), Bulwark of Dawn (12 Guarded, 2 Mana next turn, Hold), Prepared Ground (Aura: end a turn on 8+ Barrier for a Mana and a card
   next turn). They make the next turn a big attack, so the defence turns into damage (no stall: nothing grows while she waits).
4. **Offensive Thorns** (Thorns): put Thorns up, then keep them for the enemy turn or spend them as damage now. Shed the Spines (6,
   +3 per temporary Thorns shed, up to 4), Spine Volley (4 to all, +3 to all per Thorns, up to 3), Thornstorm Rush (12, +4 per Thorns,
   up to 6), Bristle (0: 4 Thorns), Splinter Guard (5 Barrier, 2 Thorns +1 an enemy), Thorned Momentum (Aura: 1 Thorns an Attack).
   **The conversion:** a Thorns stack is worth about 1.5 on the enemy turn (1 a hit it takes, ~1.5 hits); shed, it is a sure 3 (4 for
   Thornstorm Rush) now. Shedding is right against an enemy that will not attack this turn, a human who stops attacking her, or for a
   kill; keeping is right against a multi-hit attacker. The card text says what goes: "Shed up to 4 of your temporary Thorns".
5. **The siege fighter** (Riposte): open enemies that will not attack, and break their defence. Feinting Cut (6, left Open), Batter
   Down (8, 2 Brittle), Sunder Armour (remove the target's Barrier, then 8), Breach the Wall (remove its Barrier, left Open, a card),
   Siege Line (12, left Open, 2 Exposed) and Siege Doctrine (Aura: the first debuff each turn leaves that enemy Open).

### Changed cards (before -> after)

| Card | Before | After | Why |
|---|---|---|---|
| Giant's Stance (U1) | 6 Barrier; 2 Faltering if the target means to attack (upgrade 9 Barrier) | 6 Barrier, 1 Faltering, 1 more if the target is Open (upgrade 9) | read an intent: 0 against an Arena hero |
| Deflecting Blow (U1) | 6; 6 Barrier if the target means to attack (upgrade 9) | Riposte: 7 Barrier; 7 (upgrade 10) | the same |
| Sentinel's Patience (U1, Hold) | 6 Barrier +2 per enemy that means to attack (upgrade 9) | 5 Barrier +2 per enemy (upgrade 8): 7 against one, 9 against two | the same; the old average was ~8.1, now ~8.4 |
| Barbed Vigil (U2) | 11 Barrier, 4 Thorns (upgrade 14 / 5): Ember Ward's twin | 7 Barrier, 6 Guarded, 4 Thorns, **Hold** (upgrade 9 / 8 Guarded / 4) | the brief: Barrier over two enemy turns; Ember Ward kept as the plain big source |

### The Arena (a human may choose not to attack)

- **Pressure without attacks:** a human can stop Guard by not attacking (or attacking into her open Barrier only when it pays). Every
  strategy still has proactive Openings: Feinting Cut, Siege Line, Breach the Wall, Siege Doctrine (any debuff), Draw Them In,
  Challenge, Last Bastion, Warlord's Oath, Duelist's Focus. Sunder Armour and Breach the Wall take away a defending Knight's Barrier,
  and Batter Down's Brittle shrinks it, so turtling is answered.
- **Preserve or spend:** a kept Opening is worth Barrier (Composure), Exposed and draw (the Duelist cards); spending it is the burst.
  The holder cannot spend it, and it goes at the end of the turn of the side that may spend it, from either seat (tested).
- **Thorns counterplay:** temporary Thorns punish attacks this turn only, so a human plays around them by not attacking; the shed
  cards turn the same stacks into damage on her turn instead, so stopping the attack does not leave them wasted.
- **No reliance on intent:** no Knight card reads one (tested over the pool). Previews: the Riposte bonus is shown only against an Open
  target; a Riposte on every enemy shows the range. The engine is unchanged in its determinism (pure ops, seeded, no new randomness).
- **Burst** (worked through legal actions, `tools`-side check and a test; seat b has 540 HP, ARENA_HP_MULT 6 x 80 + 60), the other hero
  Open at the start of her turn, no Barrier:

| Turn | Mana | Damage | Share of 540 |
|---|---|---|---|
| Masterstroke+ | 3 | 52 | 10% |
| Probing Thrust+ (Exposed), Masterstroke+ | 3 | 85 | 16% |
| Probing Thrust+, Perfect Counter+, Feinting Cut+, Perfect Counter+ | 3 | 98 | 18% |
| Warlord's Oath turn: Keen Eye+ (2 Exposed), Perfect Counter+, Closing Argument+ | 4 (Iron Cadence) | 70 | 13% |
| After Bulwark of Dawn: Probing Thrust+, Siege Line+, Masterstroke+ | 5 | 109 | 20% |
| Seize the Moment, Probing Thrust+, Second Intention+, Masterstroke+, Perfect Counter+ (test) | 3 + 2 | 113 | 21% |
| Bristle+, Bristle+, Thornstorm Rush+ | 2 | 40 | 7% |
| No Opening: Feinting Cut+, Probing Thrust+, Perfect Counter+ | 2 | 55 | 10% |

  The ceiling needs four or five specific cards (two rares, two of them Consume or 3-Mana) in one hand: a fifth of the opponent's HP.
  No single turn ends a game.
- **Remaining limits:** Guard itself still needs the other side to attack; a human who never attacks earns her no Openings, which the
  proactive cards answer at a Mana cost. Engine note (unchanged, not Knight-only): the `exposeFoe` trigger ("whenever you put
  Exposed on an enemy") skips heroes, so an Aura on it would not answer in the Arena; Siege Doctrine uses `debuffFoe`, which does.

## Saves, decks and replays

Removed ids become their replacements wherever an old save, a Vault deck, an Arena deck or a ghost still holds them (`canonicalCard`).
A run of the Knight saved before this rework is stamped and the player is told on load; a fight it was in starts again from its first
turn (`CLASS_REWORKS`, DECISIONS #415). Old Arena games and replays are refused by `RULES_VERSION` 34.

## Art

No new pictures were made. Kept and changed cards keep their art (Bulwark Blow, Sundering Blow, Stoneskin, Bastion Engine, Warlord's
Oath, Giant's Stance, Break Guard and Challenge were drawn for their old effects: listed for review in `docs/CLASS_REWORK_ART.md`); the 38
new cards use the procedural placeholder until art is approved. The 35 cards of the expansion (#423) have no art either (listed there).
