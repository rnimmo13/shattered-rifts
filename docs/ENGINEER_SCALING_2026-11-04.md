# Focused Engineer scaling, v0.197.0 / rules 80

Robert authorized pushing/deploying changes supported by the completed review on 2026-11-04. This release includes the earlier local Vorthax lore update, the approved 20-minute Arena game limit, and **P4 only** from [the broader review](ARENA_LONG_FIGHTS_REVIEW_2026-11-04.md). P1–P3 and P5–P7, Bonelord/Deathwish candidates, HP and targeting changes remain unimplemented. This is deliberately a small first balance step because the wider proposals have unresolved Campaign costs.

## Implemented in Campaign and Arena

| Card | Before | After | Retained |
|---|---|---|---|
| Heavy Hitter | Biggest living ally maxHP; upgraded 3+maxHP | 12+floor(maxHP/2); upgraded 15+floor(maxHP/2) | Rare 2-Mana Attack; uses maxHP, not current HP |
| Resonant Pulse | Every Skill heals all friends 1 | First 4 own-turn Skills per Aura heal all friends 1; later and off-turn Skills give 0 | Uncommon 1-Mana Aura; upgrade Innate; companion heals still add current/max HP |

Two Pulse copies each count independently and together provide up to 8 growth per companion each own turn. Counters reset for the next own turn and remain spent through a same-turn save/reload. Other growth sources remain unrestricted by Pulse's limit. Four ordinary Skills with one Pulse still give 4 growth; only additional activations or off-turn Skills lose the old benefit.

Heavy Hitter base/upgraded examples: no living ally 0/3→12/15;22 maxHP 22/25→23/26;160 maxHP 160/163→92/95;320 maxHP 320/323→172/175. This preserves an early payoff and a fallback after removal while reducing giant-machine burst. A machine at 1/160 still powers 92/95; its lost current HP does not reduce this card. The Golemancer companion-only damage multiplier does not multiply a hero's Heavy Hitter.

Golemancer retains uncapped HP growth, Engineer+1 and Ascendancy+3 per companion start, +1% companion attack per maxHP capped+100% for Heavy/Colossal units, and its earned-growth recovery reserve. A160-HP machine remains possible. No minion HP cap, summon refund, blanket damage increase or forced-minion targeting was added. Crankshaft, Bulwark Frame, Reactor Meltdown, Strip for Parts, other growth cards and all other classes remain unchanged.

## Hand budget and tradeoffs

At 22 maxHP, Heavy Hitter 23 damage is near the guide's2-Mana rare budget 23.75, before accounting for the companion setup. At 160 it still yields 92 damage, intentionally much greater than a standalone card because the deck has invested in a surviving board; it is no longer a full one-for-one copy of the HP investment. Its 12-damage fallback is below that budget. This is a conditional payoff estimate, not a proof that 92 is the final correct value.

For each Pulse, a three-Skill turn remains 3 healing to the hero (subject to maxHP) plus 3 current/maxHP per companion. Four Skills remain 4; eight Skills now give 4 instead of 8. Multiple companions benefit separately, so do not price it as a single-target heal. Preserve the 4-cap initial hypothesis until real throughput/board-count data show otherwise.

Early Campaign loses little on ordinary turns and gains a useful Heavy Hitter fallback. High-HP Campaign builds lose burst but retain growth, common Crankshaft, sacrifice payoffs and automatic companion attacks. Late-tier danger is longer exposure to boss mechanics; test XVII–XX rather than compensating with an enemy-damage change. In Arena, direct hero pressure and true removal remain relevant. Neither these changes nor the 20-minute clock guarantees 10+ rounds or A-tier parity.

## Assessment and validation

The [new implemented snapshot](balance-history/0.197.0.md) includes all 30 Ascendancies and the earlier Campaign bands. Golemancer overall remains estimated A; conditional turns 10–15 changes A+→A relative to the immediately preceding review because the repeatable HP conversion is lower. Other estimates remain unchanged and still include the outstanding S/B+ concerns. Confidence is low, measured matches 0. The friend's160-HP report is anecdotal, not an averaged result.

Regression checks cover base/upgraded odd/even HP rounding, wounded versus max HP, empty/dead companion fallback, preview/actual damage agreement, two Pulse copies, fifth/sixth Skill limits, same-turn JSON restoration, next-turn reset, preserved upgrade Innate, and the companion damage cap at 100/160/320 HP. These are controlled rule fixtures, not balance simulations. Existing companion-growth/recovery tests continue to apply.

Rules 80 fences older unfinished action logs; existing cards/decks keep their IDs and receive the new definitions. Existing checkpoint migration preserves Campaign progress/decks. The server and clients must deploy together; older Arena clients must refresh/update. The complete release also carries 20-minute games/75-second turns and the approved lore.

Local validation: `pnpm check` passed all package type checks, 3,731 tests across165 files, and builds. Lint had zero errors and two existing React-refresh warnings in unchanged files. Static verification checked all30 chart rows, source paths, previous grades, resource/arithmetic ledgers and nine historical-file hashes. Temporary re-rendering of all three older snapshots produced byte-identical Markdown/CSV. No balance simulations were run.
