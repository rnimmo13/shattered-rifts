# Shaman rare consolidation proposal

Date: 2026-10-30
Status: design handoff for Claude; suggestions, not implemented card changes. Read the final user-review section first: cuts and validation precede all optional reworks.

## User intent and precedence

This document supersedes the earlier chat recommendations to preferentially delete Slay the Spire imports. Robert clarified that imported cards are welcome, their build paths should remain functional, and he wants fewer duplicates plus Shaman-specific variations on their effects. Provenance is not a reason to remove a card.

Latest explicit requirement: preserve big payoff cards for **Status cards, Burn, totems, and Gathering Storm**. Payoffs and their supporting cards do not all need to be rare; Gathering Storm should remain accessible at common. Rares should feel impactful rather than merely be larger commons.

The working target is **about 13 fewer rares**, not 13 rares total. The reviewed source has 43 base rares; the proposed 13 removals leave 30. Recount before implementation because the working tree may change. Do not add replacement cards or move every removed rare into uncommon to disguise unchanged pool bloat.

Robert requested this proposal file for Claude to process. This file records recommendations and constraints; it does not claim that every proposed number or implementation has been approved or verified.

## Sources and current mechanics

Read CLAUDE.md, any applicable AGENTS.md, packages/content/src/v2/pools/shaman.ts, shaman.test.ts, docs/14_CARD_COSTING.md, relevant DECISIONS entries (especially #449), and the current engine before implementing.

The current source is authoritative over the older SHAMAN.md and shaman-ledger.md where they differ. In particular, Hawks deal damage rather than grant Spirit/Primed, and Moon Owls accumulate shared charge rather than discount/double spells. Commands consume the commanded totem; full-row planting pushes out the front totem and triggers its act. Do not price with the obsolete Owl or Hawk rates. Preserve the ordered totem cycle. Do not restore Trinity or automatic element-help mechanics from the abandoned rework.

## Recommended 13 cuts

These cuts mix older rework cards and imported cards. Their common criterion is overlap or a weaker strategic job, not origin.

| Remove (id) | Reason | Role preserved by |
|---|---|---|
| Inferno (inferno) | Mostly a bigger Flame Spear with the same base 3 Burn. It adds less deck identity than the Burn finisher. | Flame Spear/Immolate for direct Flame damage; Flashpoint for a rare Burn payoff. |
| Heart of the Pyre (heart-of-the-pyre) | A second Flame-play damage Aura alongside Smoulder. Keep the engine that actually builds Burn. | Smoulder -> Wildfire -> Flashpoint. Do not simply add Heart's damage to Smoulder. |
| Winter's Embrace (winters-embrace) | Larger Hoarfrost; defensive coverage is already dense. | Hoarfrost/Frozen Grasp, Hail Chant and Frostbound; Absolute Zero as the rare Faltering payoff. |
| Maelstrom (maelstrom) | Larger Storm Front; another generic two-cost crowd attack. | Storm Front for accessible multi-hit AoE; Blighted Chorus for a specialized multi-hit finisher. |
| Eye of the Tempest (eye-of-the-tempest) | A further two-cost crowd-damage option with little independent engine identity. | Gathering Storm/Forked Lightning retain Fork flavour; Thunder Beam and the totem finishers retain explosive AoE. |
| Calm Before the Storm (calm-before-the-storm) | Passive mitigation competes with the more class-specific Bear/Faltering engine. | Hail Chant; Wind Wall/Static Veil retain Sapped access. |
| Grow the Pole (grow-the-pole) | Third position-expansion option in a row capped at five positions. | Carve the Spirit Pole as the rare plant/position/draw package; Raise the Pole as the uncommon two-position option. |
| Spiritstorm (spiritstorm) | Modest generic AoE scaling; Spirit already has large aggregate payoff through a developed totem row. | Spirit scaling on totems, Spirit Lance, Shattering Call, Chain of Calls, Thunder Memory. |
| Elder Recall (elder-recall) | Generic recurring draw contributes less identity than the other Aura engines. | Swift Study, Spirit Walk, Bitter Lesson, Fresh Start; preserve these rather than removing all draw alongside it. |
| Totem Mantle (totem-mantle) | Another passive Barrier Aura amid several defensive engines. | Hail Chant (Bear), Frostbound (debuff), Storm Sovereign (cycling). Harmonize retains a reason to assemble diverse totems. |
| Three Winds (three-winds) | Mixed planting overlaps Totem Circle and the existing routes to Owls. | Totem Circle, Call the Moon Owl and Consuming Dusk. |
| Sorrow's Hammer (sorrows-hammer) | A second payoff reading Status cards left in the deck. | Keep Blighted Chorus for retaining Status cards and Flak Burst for consuming them. Preserve both distinct decisions. |
| Glacial Lance (glacial-lance) | Another attack-plus-multiple-totems package; three Bears plus damage is not essential to a separate build. | Frostbound Hide/Cold Breath for Bear supply; Hail Chant and Absolute Zero for Frost payoff. |

Do not transplant the full removed effects onto survivors. Most consolidation here means retaining one clear representative of a role, not stacking two cards into one.

## Protected payoff packages

Use this as an acceptance checklist. A rare cut must not leave a strategy with setup and no meaningful finish.

| Package | Accessible setup / support | Big payoff cards to preserve | Distinct decision |
|---|---|---|---|
| Status cards | Spirit Offering, Hasty Ward, Grim Ward, Harvest of Ruin; Bitter Lesson and Kindling Ward | **Blighted Chorus**, **Flak Burst**, **Salvage Spirit** | Keep Status cards for repeated damage, cash them in for a burst/deck cleanup, or turn their creation into a totem engine. |
| Burn | Firebrand, Twin Cinders, Flame Spear, Immolate, Smoulder; Ash Chant bridges from card creation | **Flashpoint**; **Wildfire** remains an uncommon multiplier; Phoenix Feather can amplify an attack payoff | Build Burn, decide when to double it, and time the finisher. Do not remove Flashpoint just because Wildfire is strong. |
| Totems / Spirit | Raise a Totem, Hawk Call, Bear Call, Thunderbird Call, Totem Circle, Spirit Surge, Spirit Call, Turning Wheel | **Shattering Call**, **Chain of Calls**, **Thunder Memory**, **Storm Sovereign**; rare Owl/Elder access | Preserve a row for passives, cash the row in, concentrate commands on its front, or turn repeated planting into damage. |
| Gathering Storm / zero-cost attacks | **Gathering Storm stays common**, Spirit Lance, Swift Strike, Snap Back; normal draw | **Free Hand**, **Return of the Free**, **Phoenix Feather**; Echoing Strike as an adjacent zero-cost supply engine | Grow copies, retrieve and replay them, and spend attack duplication on a developed Gathering Storm. A rare need not explicitly name Gathering Storm to be its payoff. |
| Aura-heavy decks | Boon Strike, Storm Chant, Wild Vision | **Dream Weaving**, **Doubled Vow**, **Echoing Spirit**, plus worthwhile class Auras | Invest in lasting engines and choose what to duplicate. Do not eliminate the imported Aura path as collateral damage. |
| Mana / expensive turns | Spirit Offering, Tidecaller, Double Rite, Burnt Offering | **Wellspring**, **Call the Elder Tree**, **Spent Strike**; X-cost cards | Immediate burst versus ongoing Mana; convert a large Mana turn into an attack or commands. |
| Frost / Faltering | Hoarfrost, Frozen Grasp, Ice Shatter, Bear supply | **Absolute Zero**, **Hail Chant**, **Frostbound** | Mitigate while developing Faltering, then convert that setup into damage. |

Keep Fresh Start as a distinctive hand reset rather than treating it as interchangeable with ordinary draw. Keep Ward of the Spirits as an insurance effect rather than treating it as another flat Barrier card. These were overly aggressive cuts in the prior proposal.

## Rework directions: preserve function, add flavour

These are alternatives to evaluate, not a request to change every retained import. Prefer a small number of substantive variations over changing cards merely to make them different. Costs and upgrades below are provisional.

### 1. Return of the Free: keep the Gathering Storm payoff

Keep the core identity: retrieve zero-cost cards from discard. It is a major payoff for growing Gathering Storm copies, not disposable generic utility. **Do not automatically replace it with a two-card, Consume-only elemental tutor** as suggested earlier; that would substantially change the existing zero-cost build.

A candidate flavour revision is to tag it Storm and change its incidental targeted 10 damage into a modest Fork (starting point: Fork 5 to two different enemies), retaining its 2 Mana cost and zero-cost retrieval. The contribution is approximately 8.5 points before retrieval at the guide's Fork-2 rate; price the retrieved hand in an actual zero-cost deck, not as random draws. Upgrade the Fork rather than both damage and retrieval volume. If recursion is excessive, constrain retrieval specifically after demonstrating the loop, instead of deleting the strategy.

### 2. Echoing Strike: retain the zero-cost copy engine

Keep its ability to seed zero-cost attacks. Removing it together with Return of the Free and Free Hand would hollow out that path.

A candidate Flame variation trades part of the immediate hit for Burn: start evaluation at **2 Mana, 14 damage, apply 2 Burn, add a zero-cost copy to discard**, with an upgrade primarily increasing damage. This connects its repeated casts to Flashpoint and Smoulder while preserving its original role. This is not a free Burn addition to the current 18 damage. Check copied-card costs, whether copies generate more copies, Ash Chant triggers, Snap Back, Free Hand and recursion before choosing final numbers. Keep the current version if the proposed bridge is too strong or muddies the role.

### 3. Hail Chant: the Bear/Faltering engine

Retain the Bear condition and recurring Faltering/Barrier. It makes Bears support the Frost spell path, and differs from Frostbound's debuff-triggered defence.

Candidate: **2 Mana Aura; at turn end, if you have a Bear, apply 1 Faltering to all enemies and gain 4 Barrier. Upgrade: 6 Barrier, still 1 Faltering.** Use 70% Bear uptime as the baseline: 4 x 0.70 x (4.5 + 4 x 1.2) = 26.04 points. The 37.2-point result assumes 100% uptime and is an optimistic sensitivity case, not the baseline. The proposed upgrade with 6 Barrier prices at 32.76 points at 70% uptime. This does not by itself justify the proposed move to 2 Mana against the 38-point rare Aura target. Leave the current card unchanged during the cuts pass; revisit cost, Barrier and upgrade together in a separate balance pass. Check actual Bear availability, enemy timing, multiple copies and Frostbound triggers rather than assuming the condition is always met.

### 4. Shattering Call and Chain of Calls: separate the two command finishers

Preserve **Shattering Call as the whole-row payoff** and **Chain of Calls as the concentrated front-totem payoff**. They need not be merged: breadth and concentration are meaningful choices.

Candidate Shattering Call: **3 Mana Storm attack; deal 7 to all enemies, then command every totem once, front to back; no Consume. Upgrade: 11 damage.** It becomes a repeatable build-row/cash-row/rebuild sequence, instead of doubling every totem at a heavily discounted upgraded cost. Price against the CURRENT totems and five-position rows, including Elder Mana. The old ledger's ~26-point whole-row estimate is only a rough reference and must be recomputed.

For Chain of Calls, preserve X-cost concentrated commands. Verify Owl shared charge is spent on the first act, subsequent acts do not spend it again, and the totem leaves only as intended. Do not describe it as multiplying the Owl's entire stored charge X times unless the engine actually does that.

### 5. Salvage Spirit: keep the Status-to-totem bridge impactful

Preserve the creation trigger and planting payoff. A blanket once-per-turn cap, proposed earlier, may gut the reason to create several Status cards at once. First price Harvest of Ruin creating three Status cards, a full row, push-outs, Storm Sovereign, and multiple Salvage Spirit copies.

If tuning is needed, prefer increasing its setup cost or keeping its upgrade from becoming free before restricting it to one plant. If a trigger limit is still needed, evaluate a small multi-trigger allowance that retains a satisfying batch payoff. Do not pick a numerical cap without checking both ordinary and optimized turns. The flavour already fits: turn unwanted cards into spirits that populate and cycle the row.

### 6. Echoing Spirit: optional elemental variant, not an automatic restriction

The earlier proposal restricted duplication to the first elemental spell each turn. That fits the spell theme but removes duplication of planting, commands and Auras, and would weaken the Aura build that Robert wants preserved.

**Default: keep the broad first-card duplication.** If an elemental-only version is chosen later, treat it as a deliberate build tradeoff and retain Doubled Vow plus sufficient totem payoff elsewhere. Do not apply the restriction solely because the broad version originated in Slay the Spire.

### 7. Free Hand and Gathering Storm: protect the accessible engine

Keep Gathering Storm common and its growth shared across copies. Keep Free Hand's zero-cost attack bonus as a rare engine; its interaction with Forks is already a class-specific flavour. Return of the Free is the burst enabler, Phoenix Feather the multiplier, and Snap Back the accessible repeated-cast support. Avoid adding a new rare that merely says 'Gathering Storm deals more damage' and recreates the duplicate problem.

Check that the resulting package has a satisfying ordinary turn and a large developed turn with legal Mana, actual draw/discard order, and no infinite retrieval loop. If Free Hand needs adjustment, tune its existing bonus rather than bolt draw and Mana onto the same Aura.

## Costing and implementation checks for Claude

- Use docs/14_CARD_COSTING.md; ordinary rare budgets are 12.5 / 23.75 / 35 at 1 / 2 / 3 Mana. Rare Aura targets are about 20 / 38 / 56 over four turns. Consume and upgrades need their own evaluation. These are heuristics, not proof of balance.
- Reprice current Hawk and Owl effects; the old ledger is stale. Do not count the same planted totem's full stored value both on its producer and on a later command without accounting for consumption/lost passives.
- Check Flashpoint with realistically accumulated Burn, Wildfire and attack duplication. Preserve a big Burn payoff; tune the multiplier or setup only if the actual sequence demands it. Do not apply the Bleed formula blindly to Burn.
- Compare Blighted Chorus at ordinary and developed Status counts against Flak Burst's one-time cleanup burst. Preserve their retain-versus-consume distinction.
- Check all zero-cost recursion with Echoing Strike, Return of the Free, Snap Back, Free Hand, Gathering Storm, Fresh Start and Mana generation. Account for Consume, draw order and reshuffles.
- Check Storm Sovereign's CURRENT combined damage-and-Barrier output, not the old damage-only entry. Its current 1-cost output is roughly 39 points over four turns at 1.3 acts per turn, before any stronger cycling; changing its cost is preferable to merging more effects into it.
- Check 3- and 5-position rows, repeated commands, Owl charge sharing, Elder refunds and multiple Auras. Preserve distinct burst and passive play patterns.
- No bot simulations unless Robert explicitly asks; follow the repository's hand-costing instruction. Use targeted deterministic scenario tests for implemented effects and required repository checks.
- For implementation, use generic DSL operations; no card-id special cases. Update upgrades, retirement/save mappings, generated card list, Shaman documentation/ledger, changelog and rules version as required by the actual changes. Migration mappings are compatibility fallbacks, not evidence two cards are identical.
- Do not generate art as part of this pass. Flag any renamed/reflavoured cards requiring later art work.

## Expected result

43 -> 30 base rares if the pool is unchanged. No new cards required. Retain big payoffs for Status cards, Burn, totems and Gathering Storm, plus viable Aura, Mana and zero-cost strategies. Reduce redundant damage/defence/position cards, with selective flavour changes to imports rather than wholesale removal of imported build paths.

Before implementing, report any changed source counts or material conflicts with this snapshot. After implementation, report actual counts, the final cut/rework list, payoff coverage, hand-costing findings and checks performed. Do not claim playtested balance from this design proposal alone.

## User review: required sequencing and safeguards (2026-10-30)

This section takes precedence over conflicting suggestions above. The initial implementation is a cuts-only consolidation, with retirement mappings and the associated generated data/tests/documentation. Optional card reworks are separate subsequent changes, not part of the cleanup.

### Phase 1: cuts, mappings, then immediate validation

1. Capture the current rare/reward counts, each path's reward count, and the fraction of Shaman rewards assigned to a path.
2. Apply the proposed 13 cuts and their retirement mappings. Do not modify retained card effects, costs or upgrades in this phase.
3. Immediately run `pnpm paths` and `pnpm test` before any optional rework. Inspect both the generated assignments and test results. Report the exact path counts and on-path fraction; passing tests alone is insufficient for the stricter design target below.
4. Require **at least 14 reward cards in each Shaman path** and **strictly more than 55% of his reward cards assigned to a path overall**. The current assertion in packages/content/src/v2/cards.test.ts requires at least 12 per path and >0.55 overall; 14 is Robert's stricter acceptance target for this pass. The percentage is collective path coverage, not 55% in each individual path.
5. If coverage fails, inspect meaningful existing assignments first (including Ash Chant and the prior path-assignment fix). Do not weaken the thresholds, arbitrarily label glue as elemental, or add filler cards to get green tests. Reconsider a cut if necessary and report the revised count; preserving functional paths matters more than exactly 13 removals.
6. Complete remaining repository-required checks and documentation for the cuts-only result. Keep its validation separate from any later rework.

### Frost and Flame coverage checks

Frost's remaining named rare engines/payoffs are Absolute Zero, Frostbound and Hail Chant; Absolute Zero already absorbed Avalanche. Verify the accessible Frost support is deep enough and these rares have separate jobs. Do not remove or weaken another Frost engine during the cleanup. If the path falls below 14 meaningful reward cards, revisit Winter's Embrace or Glacial Lance rather than force the original cut list.

Flame retains Flashpoint, Phoenix Feather, Echoing Strike, Spent Strike and Flak Burst in the intended package. Verify current generated assignments rather than assuming all these are already tagged or assigned identically. Burn relies on Flashpoint, Wildfire and Smoulder plus its direct applicators; Ash Chant can supply a Status/card-creation bridge. Hand-evaluate Smoulder at ordinary Flame-card frequency, including random targeting and realistic Mana/draw. It should feel like an engine without requiring a perfect hand or another rare. Preserve a substantial Burn payoff and accessible Burn supply; do not assume a list of Burn cards proves that the engine works.

### Phase 2: optional reworks, one at a time

Return of the Free's Fork, Echoing Strike's added Burn, Hail Chant's price/upgrade and Shattering Call's command change are independent balance changes. Each requires its own base/upgrade pricing, interaction scenarios and validation. None is implied by acceptance of the cuts.

**Shattering Call is the highest-risk proposal and remains unchanged in Phase 1.** A repeatable whole-row command may outperform a one-time double command over multiple reshuffles. Compare total legal fight sequences, row rebuilding costs, three/five positions, Elder refunds, Owl charge consumption, Storm Sovereign triggers, attack replay and Consume interactions. Do not call the once-per-totem version a nerf solely because each individual play commands fewer times.

Use Hail Chant's revised 70%-uptime baseline above, with higher uptime as a separate sensitivity case. Do not automatically retain 4 Barrier at the proposed new cost without repricing the whole effect and upgrade.

### Required retirement mappings

All listed targets were found in the live Shaman pool when this review was recorded. Recheck after applying cuts and validate upgraded-card migration under the repository's existing conventions. Avoid dangling targets and cycles.

| Retired card | Retired id | Live replacement | Replacement id |
|---|---|---|---|
| Inferno | inferno | Flame Spear | flame-spear |
| Heart of the Pyre | heart-of-the-pyre | Smoulder | smoulder |
| Winter's Embrace | winters-embrace | Hoarfrost | hoarfrost |
| Maelstrom | maelstrom | Storm Front | storm-front |
| Eye of the Tempest | eye-of-the-tempest | Gathering Storm | gathering-storm |
| Calm Before the Storm | calm-before-the-storm | Hail Chant | hail-chant |
| Grow the Pole | grow-the-pole | Carve the Spirit Pole | carve-the-spirit-pole |
| Spiritstorm | spiritstorm | Thunder Beam | thunder-beam |
| Elder Recall | elder-recall | Swift Study | swift-study |
| Totem Mantle | totem-mantle | Hail Chant | hail-chant |
| Three Winds | three-winds | Totem Circle | totem-circle |
| Sorrow's Hammer | sorrows-hammer | Blighted Chorus | blighted-chorus |
| Glacial Lance | glacial-lance | Frostbound Hide | frostbound-hide |

These mappings preserve usable saves; they do not assert equivalent cost or behaviour. In particular Spiritstorm -> Thunder Beam changes the Spirit interaction and should be described accurately in migration notes.
