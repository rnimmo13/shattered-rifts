# Warden Heart revision — 0.206.0 / rules 84

Local implementation, 2026-11-05. No release approval. Campaign only; no simulations. Robert requested passive tradeoffs with no targeting, Glutton −5% Max HP, three-turn Blood/Warded opening penalties, Rift chance 10%, continued switching, and an additional half-health Barrier Heart. Resurgent's 25%-Max-HP phase and three opening Exposed turns are provisional implementation choices for review.

## Exact changes

- Glutton: +1 draw each turn unchanged; −20 Max HP becomes −5% of the underlying maximum. Effective Max HP floors, minimum one. Track withheld HP to avoid compounding; growth applies immediately in and out of combat. Taking it reduces current HP by the withheld amount, minimum one; giving it back restores maximum only. Legacy flat-penalty saves restore the old 20 maximum once, apply the new percentage and preserve current HP/wounds.
- Blood: starting 3 Might and recurring 2 HP loss removed. Direct hero-card damage ×1.25, floored per hit, after normal damage modifiers and before Ascendancy multipliers. Includes damaging Skills, Auras and Traps; excludes HP-loss operations, status ticks, companions and totems. Start Faltering 3 turns. Existing Faltering affects Attacks, not Skill/Trap/Aura damage, and remains cleanseable.
- Warded: remove starting Shielded 1 and Plating 7 and recurring Brittle 1. Card Barrier ×1.25, floored before Brittle's ×0.75 floor. Start Brittle 3 turns, cleanseable. Passive/phase Barrier is not multiplied.
- Ember becomes Rift: random 3 enemy Burn each turn and starting self-Burn 2 removed. Ordinary per-slot cross-class chance 3→10%; fight-victory shard multiplier 100→75%. Stable ember-heart ID.
- Thorned becomes Gilded: opening Thorns 4, Might 2 and Exposed 2 removed. Ordinary per-slot cross-class chance 3→0%; victory shards 100→140%. Stable thorned-heart ID. Explicit foreign events/merchants, own-class Gift selection, earned shards and already-generated offers are retained. Ordinary rewards, extra rewards, rerolls, shop stock and ordinary event card rolls use the held Heart.
- Resurgent: new sixth option; once each fight use the same 50%-HP damage-stop phase as enemy Omens, then gain ceil(Max HP ×25%) Barrier, with no Might. Start Exposed 3 turns. No healing; a hero already below half blocks the triggering damage once and receives Barrier. Direct HP payments and status damage can trigger it, like enemy phases. Multi-hit follow-ups can spend the shield. Phase resolves before Deathwish's emergency rescue, so it does not waste the later rescue.

Victory shard multipliers combine multiplicatively with Omens before one nearest-integer rounding. Normal fights, selectable Elite/Echo shards and non-final Warden rewards are covered; fixed Boon income and event shards are not. Vorthax remains immediate victory with no reward, as in the separately pending finale change. One Heart at a time, replacing it instead of a Gift card; two offers exclude the held Heart. Legacy IDs preserve current Hearts and displayed gift options. Rules84 restarts older unfinished fights through the existing checkpoint migration. Arena has no Hearts; its HP, cards, policy and economy are unchanged.

## Assessment and evidence

No real-player Heart dataset was available. Only synthetic report previews were found; BALANCE_ADMIN_TOKEN was unavailable. No private export retrieval, measured regrade or simulation was performed. Code and deterministic regression positions are correctness evidence only.

Glutton's opportunity cost becomes proportional rather than a diminishing flat penalty: at 100 underlying Max HP, 95 effective; at 300, 285. It remains broadly useful. Blood's 40-damage Attack becomes 30 under Faltering then 37 with the bonus; after Faltering it becomes 50. A damaging Skill becomes 50 immediately because Faltering does not affect Skills. Warded's 40 Barrier becomes 50, then 37 while Brittle; after three turns it becomes 50. Rounding means low printed values do not achieve exact percentage parity.

Rift's three independent eligible slots have approximately 27.1% chance of at least one foreign card versus 8.7% at baseline, not a 10% chance per reward screen or guaranteed synergy. Twenty normal victories at baseline15 shards would yield220 instead of300 (11 each after rounding); Gilded yields420 (21 each). Omens, Elite choices and Boons alter actual run income. Economic Hearts favor earlier acquisition and can be exchanged for finale combat Hearts. No extra free swap or retroactive offer reroll is added.

Resurgent can prevent a very large threshold-crossing hit, making it stronger than its nominal25%-Max-HP Barrier. Its opening Exposed can also worsen subsequent hits. Measure multi-hit encounters, already-wounded starts, low-HP engines and Deathwish; do not price it as Barrier alone.

See balance-history/0.206.0.json and generated charts for all30 Ascendancies, class starts, mixed engines, progression bands, setup, recovery, rare reliance and beyond-ten-turn uncertainties. No previous grade is upgraded from these fixtures.

Opening debuffs use normal status stacking: the Heart applies3 turns in addition to any Omen debuffs. All remain cleanseable.

## Local validation

All3,871 tests across183 files pass. Workspace type checks and web/desktop-shell build pass. Full lint found one new test typing error, corrected and rechecked with targeted lint; remaining two React-refresh warnings are pre-existing. Hidden Chromium verifies six Heart entries/icons, labelled buff/nerf rows and no horizontal page overflow at1360,390 and320px. Test fixtures are synthetic correctness checks, not balance simulations or measured player parity. Screenshots are retained under .wrangler/hearts-ui-2026-11-05. No push, deployment or installer publication.
