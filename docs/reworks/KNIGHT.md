# The Knight rebuilt: Guard, Riposte, Thorns (2026-10-29, DECISIONS #415)

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
| Previews | The live damage on a Riposte card counts the bonus against an Open target and agrees with what it deals (tested). |

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
- **Arena:** the Opening is visible to both players (a gold "Open" chip); it is a status on the other hero. A hero has no intent, so
  "if the target means to attack" (Giant's Stance, Deflecting Blow) and Sentinel's Patience read 0 against one: those cards are a little
  weaker in the Arena (a known gap, left as it is).
- **Stall:** nothing heals or loops on defence alone; Guard pays Barrier, cards and next-turn Mana, and only damage ends a fight.

## Saves, decks and replays

Removed ids become their replacements wherever an old save, a Vault deck, an Arena deck or a ghost still holds them (`canonicalCard`).
A run of the Knight saved before this rework is stamped and the player is told on load; a fight it was in starts again from its first
turn (`CLASS_REWORKS`, DECISIONS #415). Old Arena games and replays are refused by `RULES_VERSION` 34.

## Art

No new pictures were made. Kept and changed cards keep their art (Bulwark Blow, Sundering Blow, Stoneskin, Bastion Engine, Warlord's
Oath, Giant's Stance, Break Guard and Challenge were drawn for their old effects: listed for review in `docs/CLASS_REWORK_ART.md`); the 38
new cards use the procedural placeholder until art is approved.
