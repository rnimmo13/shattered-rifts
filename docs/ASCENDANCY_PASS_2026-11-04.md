# Ascendancy identity and late-game pass — 2026-11-04

Approved direction: Robert requested all Ascendancies be compelling late-game choices in Campaign
and Arena, with distinct play patterns, and explicitly deferred card-pool balance. Implemented as
version 0.181.0, decision #580, combat rules 75. This is a hand-priced starting pass and scenario-tested
implementation, not measured A-tier parity. No balance simulations were requested or run.

## Exact changes

All growth and one-use protection reset each fight. Existing names/ids and old Engineer/Shaman
aliases remain readable. All choices keep their base class trait. These twelve replace their old
Ascendancy effects except the explicitly retained parts below.

| Ascendancy | Implemented effect | Distinct decision |
|---|---|---|
| Marshal | Max Reserves 4 retained. Attacks gain +10% damage per Reserve actually spent this turn, max +40%. Mana is still spent before Reserves. X expenditure counts. | Save resources, then fund a committed attack turn. |
| Blood Knight | Actual HP lost charges the next damaging Attack by +2% per 1% max HP lost. At most +30% earned per own round and +60% stored. Charge is spent once per Attack act, applying to all its hits; blocked/prevented HP loss grants nothing. | Take wounds, choose when to retaliate. No permanent Might copy of Artillerist. |
| Golemancer | Existing +3 max/current HP per companion each own turn retained. Heavy/Colossal companions deal +1% attack damage per max HP, max +100%. Light companions do not receive this damage multiplier. | Protect and invest in a large machine. Bonus multiplies damage, not hit count. |
| Seer | The first damaging aimed Attack on the own turn marks its chosen foe and applies 1 Exposed. Same mark builds +10% attack damage against it per qualifying turn, max +50%. A new mark starts at +10%. Other attacks that turn do not switch the mark. | Deliberate target and attack order. No random target selection. |
| Assassin | Each completed Skill on the own turn prepares +15% damage for the next damaging Attack, max +60%, retained between turns. Attacks also gain +20% against foes at <=50% HP. These bonuses add. Former Edge/Lethality removed. | Prepare a large execution; small Attacks can spend preparation prematurely. |
| Totemist | Starting 1 Spirit/8 Barrier retained. End own turn with at least two totems and no command/push-out that turn to gain 1 Spirit. A commanded/replaced row does not qualify. | Cultivate the row instead of cycling it through commands. |
| Elementalist | First completed Flame/Frost/Storm per own turn gives 3 Burn to a random foe / 3 Barrier / 2 damage to all foes. Each element's next qualifying bonus grows by 1. Switching from the last qualifying element adds 2 to the current bonus. | Repeat one element for growth or weave elements for immediate extra output. No all-three requirement. |
| Zealot | First Fury entry on own turn builds +8% attack damage while in Fury, max +40% for the fight. First Fury exit on own turn gives 4 Barrier +2 per earned growth step, max 14. | Develop aggression while making controlled exits. Re-entry loops cannot farm growth or Barrier. |
| Sunwalker | Existing first-stance-per-turn extra Fervor retained. First Radiant exit on own turn returns 2 Fervor; subsequent qualifying exits return 3, then 4, capped at 4. Natural expiry qualifies. | Build recurring Radiant windows; returned Fervor stays below its 10-point threshold. |
| Archmage | Starting +3 Spell Power retained. First Spell Attack per own turn that actually spends Spell Power gains +1 damage per spent point per hit. Half that expenditure, rounded down, returns next turn. Generic first-Attack Lethality removed. | Spend and recover Spell Power. Free/copy plays do not refund expenditure they never paid. |
| Brewmaster | First actual Hangover payment per own turn builds 1 Fermentation, max 5. End own turn heals 1% max HP per Fermentation (whole total rounded up) and grants 2 Barrier per Fermentation. | Drink and survive the payment to develop sustained recovery. Other self-damage and prevented payments do not ferment. |
| Deathwish | Ordinary base Clutch retained. At <=40% HP, Attacks gain a separate +25% multiplier. Once per fight, a lethal opposing attack leaves 1 HP and grants 10% max HP Barrier, rounded up. Further hits can kill; self-damage and damage-over-time do not spend or receive the rescue. | Immediate low-health pressure with one escape opportunity, rather than slow cumulative growth. |

An Attack's prepared/retaliation bonus is latched once for that act and survives a pending choice.
An automatically repeated copy is another act: it does not duplicate already-spent preparation.
Target HP conditions read current HP at each hit. All damage bonuses apply only to actual attacks,
not damage from Skills, Auras, totems or incidental triggers. Ordinary damage protection still applies.
Defensive rewards use the ordinary Barrier/healing rules. No enemy scaling or card numbers changed.

## Other eighteen identities retained

| Class | Retained choices and purpose |
|---|---|
| Knight | Paladin: keep defensive investment and support Barrier payoffs. |
| Engineer | Artillerist: personal Might/weapons; Swarmwright: extra machine capacity and Primed. |
| Hunter | Beastmaster: shared Might; Reaver: HP-payment resources; Predator: draw-driven burst. |
| Trickster | Trapmaster: reactive Trap resources; Cardsharp: four-suit resource execution. |
| Rogue | Bladedancer: knife volume; Bloodletter: faster Bleed/Burn pressure. |
| Shaman | Spiritwalker: command/replacement tempo. |
| Monk | Sage: Serene resource efficiency. |
| Spellblade | Blademaster: Sword volume and draw; Shatterer: Fracture/Shatter payoff. |
| Drunkard | Gunslinger: recurring weapon Precision. |
| Necromancer | Bonelord: Thrall endurance/commands; Fateweaver: execution thresholds; Soulreaper: Consume defense. |

These are open-ended incentives, not predefined deck lists, card groups or reward filters.

## Hand budgets and boundaries

The costing guide's flat 4–6-turn, tier-I exchange rates are a starting reference, not enough to
price an entire late-game Ascendancy. Compare marginal contribution, resource/HP costs and timing.
Traits themselves cost no Mana; all examples still require paying for the cards and surviving setup.

- **Marshal:** spend 4 banked Reserves to reach +40% for that turn. On 60 ordinary attack damage,
  this adds about 24 before per-hit rounding. This is not +40% every turn automatically: rebuilding
  the reserve bank competes with spending Mana now. It also does not supply that 60 damage for free.
- **Blood Knight:** on 80 max HP, 8 actual HP lost charges +20%; the 12 HP needed for the round's
  +30% cap costs about 18 points by the HP rate. A 40-damage Attack gains 12 at +30%, a 100-damage
  Attack gains 30. Small attacks waste the opportunity; at most two capped rounds fill the bank.
  Using HP percentage keeps charge rates comparable with Arena's larger HP pools.
- **Golemancer:** an unupgraded War Engine surviving four/eight extra +3 growth triggers has at
  least 34/46 max HP before base Tinkerer growth and card investment: +34%/+46% attack damage.
  A Might-buffed three-hit act totaling 30 becomes about 40/43 (per-hit rounding matters). One
  health investment affects all three hits, but never creates more hits; +100% bounds the multiplier.
- **Seer:** four qualifying turns on the same mark reach +40%, five +50%. A 60-damage attack
  sequence against an already Exposed target gains about 24 at +40%; do not count Exposed again
  if the deck would already apply it. Switching targets loses accumulated focus.
- **Assassin:** two Skills prepare +30%; four reach +60%. Against a wounded target, +30% and
  +20% add to +50%, rather than multiplying to +56%. A 40-damage attack gains about 20.
  Skill cards/Mana and postponing an attack are the setup costs; zero-cost Skill loops cannot
  exceed +60% stored preparation. Daggers remain usable but can spend it inefficiently.
- **Totemist:** four/eight qualifying end turns give +4/+8 Spirit beyond its retained initial +1.
  Two ordinary standing totems can use each point repeatedly. The price is foregoing commands
  and push-outs on qualifying turns; uncommon/rare totem supply is not assumed free.
- **Elementalist:** repeating just Flame gives bonus Burn 3,4,5,6 over four qualifying turns,
  then 7,8,9,10 through eight. Frost has the same Barrier numbers. Alternating Flame/Frost
  bonuses are 3,5,6,6 over two turns (each element once/turn), rewarding variety without requiring
  every element. Trigger damage/status amounts have linear growth, not extra attack hits.
- **Zealot:** four/eight qualifying Fury entries give +32%/+40%; first-exit Barrier is 12/14.
  Fury's ordinary double damage and incoming risk remain. A 60-damage sequence already in Fury
  gains about 19 at +32%, not an additional doubled 38. Staying in Fury can still be punished.
- **Sunwalker:** qualifying exits return 2,3,4,4 Fervor. Four cycles retain 13 Fervor across exits,
  but each cycle still requires reaching Radiant; stance loops do not pay twice in one turn.
  No upfront Radiant, new Mana loop or direct attack multiplier is added.
- **Archmage:** a first Spell Attack spending 6 gains +6 per hit and returns 3 Spell Power next
  turn. A three-hit attack gains 18 before modifiers; this assumes a suitable paid multi-hit card,
  not every spell. Same-turn replays/repeat spending grant no extra recovery. Delayed half recovery
  cannot replace all the spent power, so generators and defense remain necessary.
- **Brewmaster:** after four payments, end-turn recovery on 88 max HP is ceil(3.52)=4 HP and
  8 Barrier; at the cap, 5 HP and 10 Barrier. At 264 max HP, capped healing is 14, but Hangover
  payment scales with max HP too. Reaching the cap requires five actual payment turns, not five
  cheap Stagger plays in one turn. More drinking is optional after developing Fermentation.
- **Deathwish:** at 60% missing HP, base Clutch is 1.60x, becoming approximately 2.00x with the
  extra multiplier. At 80% missing it is 1.80x -> 2.25x. The one rescue produces 9 Barrier at
  88 max HP / 27 at 264, but later hits in that very attack can still finish the hero.

## Validation and remaining work

Deterministic scenario tests cover actual/prevented HP payments, caps, X Reserve spending,
one-use survival before the second Arena seat's first turn, multi-hit damage, deliberate marks,
command interruption, natural Radiant expiry, delayed Spell Power recovery, old-rule fight-log
rejection, non-mutating previews and JSON restoration mid-card. Existing regression tests remain.

Release rules bump prevents old Arena clients/replays silently using different combat. Saved
campaign runs and Ascendancy ids remain; unfinished fights logged under older/unversioned rules
restart from their encounter checkpoint. New fight/ghost logs stamp the rules version.

A-tier for every choice remains the acceptance target. Focus playtesting on ordinary late-game
decks missing preferred rares, fast Arena pressure, Seer target changes, Totemist versus command
opportunity costs, Golemancer after losing a developed machine, Elementalist multi-element turns,
Archmage multi-hit spenders, and Brewmaster/Deathwish endurance. No claim of measured win-rate
parity, guaranteed endgame wins, or balanced underlying card pools is made.
