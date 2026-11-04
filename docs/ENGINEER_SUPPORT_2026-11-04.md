# Engineer opening, Swarmwright scaling and Aura expectations

Implemented for 0.191.0 / rules 77, DECISIONS #591. This is a hand-priced pass, not simulated or measured A-tier parity.

## Changes

| Area | Before | Now | Purpose |
|---|---|---|---|
| Starting Drone | 6 base HP, attacks for 3 | 8 base HP, attacks for 4 | More opening damage and two more points of protection. Tinkerer still adds its usual 1 max HP at the start of turn one, so the first screen shows 9 HP. |
| Starting deck | Four Strikes | Three Strikes and one Pulse Pistol | Same ten cards, with an early personal weapon: 5 damage twice rather than a Strike's 6. Existing saved decks are retained. |
| Micro Drone | 3 HP, attacks for 2 | 3 HP, attacks for 3 | Cheap summons contribute more damage while retaining their fragile bodies. Patrol Drone and larger-machine base stats are unchanged. |
| Swarmwright | Fourth slot; companions gain 1 Primed at the start of the turn | Retains both; adds Fabrication, +1 companion attack damage per hit for every four successful non-starting summons in the fight | Rebuilding and cycling summons creates lasting fleet growth instead of depending entirely on a one-use Primed bonus. |
| Reactor | 2 Mana, grant 3 Might to the current board once; upgrade 4 | 2 Mana, attacks by the Engineer and current/future companions deal +3 damage per hit for the fight; upgrade +4 | A continuous support Aura. It neither gains Might each round nor loses its effect on replacement summons. |
| Kron's Assembly Arm | 1 Mana, current-board Might +1 and draw 1; upgrade +2/draw 2 | Same numbers/cost, continuous attack bonus instead of current-board Might | The other Aura with the same snapshot-of-the-board issue. Card draw is explicitly on play. |

## Does one Primed scale?

Not by itself. It is spent by the companion's next attack and unused Primed decays at turn end. Four single-hit companions receive
four extra damage on their first attacks each round; a command consumes the same charge, rather than earning an extra charge for
every command. A War Engine's three hits and a Light companion's one hit also receive four extra damage in total. The fourth slot
is useful and scales with support cards, but the 1 Primed is not an accumulating late-fight engine.

Fabrication now supplies that engine. Its bonus is `floor(successful summons this fight / 4)`, recalculated at attack time.
Starting companions and failed/blocked summons do not count. Successful summons from cards, Auras, death replacements and revivals
use the existing summon counter. The bonus survives losing the board and rebuilding, but resets each fight. Hero attacks receive
no Fabrication bonus. The Ascendancy trait chip shows its current bonus and summon count.

### Exact damage example

Four ordinary Patrol Drones, each attacking once, with 1 Primed each. No Might, Exposed, Faltering, commands, damage prevention or
other effects; all four must remain alive to act. Figures show raw companion damage, excluding the Engineer's own attacks.

| Successful summons | Previous Swarmwright | Swarmwright with Fabrication | With one Reactor too |
|---:|---:|---:|---:|
| 0 | 16 | 16 | 28 |
| 4 | 16 | 20 | 32 |
| 8 | 16 | 24 | 36 |
| 12 | 16 | 28 | 40 |
| 20 | 16 | 36 | 48 |

The zero row isolates the mechanic; a normal starting board does not contain four Patrol Drones. Extra commands receive the
persistent damage bonus too, but do not restore spent Primed. This is linear in summons, not free growth merely for passing turns.
Golemancer still rewards HP investment in a large machine; Artillerist still grows the Engineer's own Might. Their mechanics are
unchanged.

## Pricing and ceilings

- **Opening:** Pulse Pistol is an existing 1-Mana common with 10 raw damage, replacing a 6-damage basic. Starting-Drone damage is
  +1 per act, plus two base HP; hero HP, three Defends, healing and Mana are unchanged. This improves useful opening actions
  without making every machine tougher or increasing the deck size.
- **Micro Drone:** using the guide's one-act small-body estimate, `1.2 × 3 HP + 3 body + 3 damage = 9.6`. Spare Parts is a 0-Mana
  common with Consume, reference `6 × 1.25 = 7.5`: the new body is deliberately 28% above that reference, versus 15% before.
  The reusable 1-Mana Breach Charge supplies 3 damage plus this body (12.6 against a 10-point common), and Parts Bin adds draw.
  These are intentional small-summon buffs; they require checking free-generation and death engines in playtesting, rather than
  claiming every result falls inside a conventional printed budget.
- **Reactor:** a 2-Mana rare Aura reference is `19 × 1.25 × 2 = 47.5` over four turns. Four friendly attack hits per turn yield
  `3 × 4 × 4 = 48` added damage, close to that reference. One hero attack plus a War Engine's three hits also gives 48 before
  multipliers. A full four-unit fleet plus two hero hits gives 72; this stronger ceiling requires paid bodies, support, Mana
  and keeping the board alive. Two Reactors add +6, not +12 and not +3 each turn. Reactor+ adds +4 per hit.
- **Large machines:** the bonus applies per hit and before ordinary attack multipliers, including Golemancer's frame multiplier.
  At Golemancer's +100% ceiling, one Reactor adds 18 to a War Engine's three-hit act. Extra commands repeat that persistent bonus.
  This is a supported late-game interaction, not proof of measured balance.
- **Swarmwright:** 8 successful summons buy +2 per companion hit: +8 each act with four attacking Light units, plus the existing
  +4 from Primed on the first act. Summons have resource, body and replacement costs. Two-slot or three-slot machines get the
  same bonus per hit, so a three-hit Colossal plus a Light can also use the fourth slot; no frame receives a separate multiplier.
- **Assembly Arm:** the same four-hit/four-turn example gives 16 extra damage plus 3 points of draw, versus the 1-Mana rare Aura
  reference of 25. Its upgrade gives 32 plus roughly 7 points of draw. This Warden signature retains its existing upgrade numbers;
  its full-board upgrade is strong and is a playtest target, not silently priced as an ordinary 1-Mana skill.

## What “persistent” means

Reactor uses a generic `attackAura` effect stored on the side and evaluated for each attack. It does not grant Might, increase
Might-reading payoffs such as Critical Mass, transfer through Salvage, or leave a duplicate bonus on a replacement. Existing
Might still works and adds alongside it. Skills, Traps, Aura damage, totem effects, healing and Barrier receive no damage bonus.
Copies add their numbers normally. The effect appears in the active Aura list, and weapon previews/companion intents use the
same bonus. Saved combat state retains it, and fight creation resets it.

## Broader Aura audit

Inspected all 210 base Aura definitions; 37 do not contain an event-trigger `power` operation. That alone is not a defect:
permanent personal statuses, maximum Mana and totem-position changes can be valid Auras. The two untriggered Auras granting
Might to the current board were Reactor and Kron's Assembly Arm; both now use the continuous bonus.

One-time status/resource Aura effects now say **On play**. Timing that was already explicit, such as Attunement's maximum Mana
from the next turn, is retained. Mixed Assembly Arm text identifies its draw as on play. Triggered Auras retain their specific
“at the start” and “whenever” wording. No blanket conversion into endlessly growing turn-start Might was made.

Ossify already strengthens current and future companions through the hero's Marrow status. Its effect is retained; companion
intent previews now include Marrow, fixing a display mismatch. Existing permanent-effect descriptions avoid repeating “for the
rest of the fight” twice.

## Validation and remaining uncertainty

Deterministic scenarios exercise fixed bonuses across turns, multi-hit previews, late summons, upgrade/copy stacking, Salvage,
non-attack exclusions, failed summons, Fabrication progression/reset/save restoration, and Ossify previews. Full regression,
type and lint checks cover the engine change. No balance simulations were requested or run.

Playtesting must still assess early chip damage, full-board uptime in tiers 17–20, replacing a lost board, summon-generating
loops, two-Aura combinations and PvP burst. This pass gives Swarmwright an explicit growth route; it does not establish an A-tier
rating empirically. New rules restart older unfinished encounters from their saved checkpoint instead of replaying different
damage rules.
