# Damage preview review — local 0.204.0

Robert requested companion damage tooltips and a card damage display pass after seeing a Hunter attack show the wrong amount. This release changes presentation only. Combat stats, costs, damage rules and rules version83 stay unchanged.

Run Wild and Reckless Blow both have fixed two-hit attacks. Previously fixed multi-hit effects could omit their total, and the HP payment before Reckless Blow caused its preview to stop early. Known effects before damage now resolve on a private copy using the actual engine rules; the display includes hit count and total. Companion calculations use the same path, showing current bonuses, penalties, target protections and total.

Projections stop before unknown draws, random outcomes with multiple possibilities or unresolved choices, and have a512-operation/hit budget. They remove opposing face-down Trap responses before projection and never mutate the original state or RNG. Future Trap trigger damage is not presented as immediate damage. Current-board damage is distinct from Barrier absorption, remaining HP and later changes to targets. Known conditional, command and Totem follow-ups can contribute to totals. This is not a guarantee of a complete future turn.

## Deterministic correctness coverage

The catalog fixture uses one enemy with10,000HP,10Mana,12stars, hero Might3 and enemy Exposed1. It scans676 base/upgraded definitions with direct or nested damage:

| Classification | Definitions | Result |
| --- | ---: | --- |
| Immediately resolvable damage | 602 | Preview total matches accepted damage events |
| Future Trap triggers | 62 | No immediate attack preview |
| Random/draw/unresolved effects | 8 | Qualified as uncertain |
| Unavailable in this setup | 4 | Outside the equivalence comparison |

Additional tests cover both Hunter attacks and upgrades, hurt-triggered Might before damage, hidden draw-order independence, opponent face-down Trap independence, finite zero formulas, known Totem follow-ups, companion modifiers and every base/upgraded companion's end-of-turn damage. Existing regression tests remain green. These checks compare single accepted actions under controlled conditions; they are not balance simulations, human playtests, win-rate estimates or proof of parity across builds or matchups.

Isolated Chromium rendered the real UnitPlates and FightCard components at desktop and phone sizes. Native hover opened the companion calculation; tooltips stayed inside the viewport. Card examples displayed14 base damage,30 with Might/Exposed, and0 for an empty scaling resource. No access to Robert's browser/account was needed.

Robert approved release of the complete0.204 changes on2026-11-05 (decision #628). See RELEASE_0.204_VALIDATION.md for release checks.
