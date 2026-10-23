# C2 Review: Combat v2 content, validator, bot, sim

Scope: `packages/content/src/v2/{build,cards,units,index}.ts`, `v2.test.ts`, `packages/combat/src/{validate,bot}.ts`,
`tools/src/sim2.ts`, checked against `docs/08_COMBAT_V2.md` and `packages/combat/src/engine.ts`.
I ran `pnpm sim2 -- --n 10` to confirm the sim behaviour described below. No source files were modified.

Overall: the data is structurally sound (selectors are used correctly almost everywhere, `validateDb` passes, no duplicate ids found,
Maren and Vesper have no companions, Rivet starts with a Drone). There are no crashes or CRITICAL defects. The real problems are
(a) enemy statuses whose duration makes them do nothing, (b) phase logic that can re-trigger a boss's signature moves,
(c) Kesh's identity versus the spec, and (d) a sim/bot that will mislead balance work.

## CRITICAL

None found.

## HIGH

### H1. Enemy-applied Exposed expires before it can matter (Ghostwire, Lamplighter, Nyxara)
Engine `decay()` (engine.ts:528-533, called at 549 at the end of the enemy phase) removes 1 Exposed from the hero's side at the end of the
same enemy phase it was applied in. So "Exposed N" from an enemy covers (N-1) later enemy phases and only affects enemies that act
after it in the same phase.
- `units.ts:173,177` Ghostwire cycle is `hack` (Exposed 2) -> `signal` (no damage) -> `strike`. Exposed is gone by `strike`. Wasted.
- `units.ts:311` Lamplighter `lantern` applies Exposed 1 and he is solo: it is removed at once. Vacuous.
- `units.ts:336` Nyxara `whisper` Exposed 1: same, vacuous (her `unmask` Exposed 2 -> `ambush` at 339-340 does work).
- `units.ts:278` Hooded Acolyte `curse` Exposed 2 -> `stab` works (that is the intended pattern).
Fix: reorder Ghostwire to `signal, hack, strike`; raise the one-stack Exposed moves to 2 and put a damaging move right after; or
change the engine so debuffs applied by a side tick on the victim's own turn. Add a test that every enemy move applying Exposed to
`target` is followed by a damaging move in the cycle.

### H2. Phase selection can flip back and re-trigger signature moves (Seraphine, Gorrmaw, Choir/anything that heals)
`engine.ts:401-417,435-438`: the phase is recomputed from current HP each time an intent is chosen, and a change resets `patCount`.
Moves that heal the boss cross the threshold back upward:
- `units.ts:117` Seraphine `ascend` (heal 8, summon, Might) is the first move of phase 2 (<=50%). Healing 8 from just under 50% puts her
  back in phase 1, which restarts at `smite`. When pushed under 50% again she `ascend`s again: another summon, heal and Might, and her
  `bell2` (28) is skipped when the cycle is cut short.
- `units.ts:259,262` Gorrmaw `gorge` heals; `frenzy` (Might +3, permanent) is the first move of phase 2 and re-fires every time the phase
  is re-entered, so Might stacks without limit.
Fix: make phases monotonic (store the highest phase reached on the unit, only move forward), or add hysteresis. This is an engine
change, so flag it for Robert. Also note `phaseIndex` only works if phases are listed from highest to lowest threshold (see M5).

### H3. Kesh does not match the spec identity (docs 08 section 5)
Spec: "Buffed, not summoned. Cards give his Pack (1-2 pups, from one card) Might and feed them." Implementation: Kesh starts with a Hound
(fine, Sigil) but his pool has six summon cards (`cards.ts:302-325` Call Gnashlings, Packhound, Ironhide Charger, Maw Brute, Alpha Call, plus
the start unit) and so plays like a smaller Rivet. Either change the spec table (log it in DECISIONS.md) or cut the pool to about
Call Gnashlings + Alpha Call and add more Pack-buff/feed cards (Might, heal, Barrier on allFriends). `Alpha Call` (rare, cost 2, one 10 HP Hound + Might 1)
is also strictly weaker than the common `Packhound` + `Blood Frenzy` and does not feel like a rare.

### H4. Sim results are unreliable for Maren and Vesper, and sim2 hides why
`pnpm sim2 -- --n 10` shows Maren and Vesper at 0% vs Seraphine, Gorrmaw and Nyxara (Kron 60%/0%), Bloated One 20% for Maren, and Vorthax 0% for
all four heroes. That pattern suggests the bot, not just balance, is the cause (see M1-M3): it values Barrier only up to the next visible
hit, gives Thorns 1.5 and Snares a flat 5 regardless of trigger, so defensive and trap decks are under-played. Also `sim2.ts:203-208` counts a
fight that hits the 800-action cap as a loss, so stalls are indistinguishable from deaths. Do not tune enemy numbers against this table
until the bot is improved and timeouts/turn counts are reported.

## MEDIUM

### M1. Bot sees the RNG (`bot.ts:146-152`)
`applyAction` clones the state including the seeded RNG, so the one-step lookahead sees exactly what a random enemy pick (`randomFoe`),
a draw or a reshuffle will give. Random cards (Scrap Volley) and draw cards (Second Wind, Pommel Strike) are chosen with perfect
information, which inflates their value in sims. Fix: score only the deterministic part (e.g. clone with a fixed dummy RNG, or evaluate random ops by expectation).

### M2. Bot evaluation is blind to defensive value that is not an incoming-damage number (`bot.ts:102-137`)
- `incoming()` counts every enemy damage op as hitting the hero even when Taunt allies or ally Barrier would absorb it, ignores AoE vs allies, and sums only the first damage op's amount times all hits.
- Barrier above `threat` is worth 0 but retained Barrier (Steady Guard) is not modelled.
- Thorns are valued at a flat 1.5 per stack; Snares are +5 each whether or not the trigger can ever fire. The bot will happily set a `foeSummons` Snare (Whisper Net) in a fight with no summoners, and spend three slots on Snares.
- No lookahead over a sequence: a two-card combo where neither card scores positively alone (Veil Strike's Exposed 1 then a big hit, Overclock then attack) is only found by luck. `gain > 0.5` also means 0-gain useful cards (Mindrot's Seared on a nearly dead enemy) never get played, and the bot never holds a card back.
Fix: value a Snare by whether any foe's visible intent or pattern can spring it; score ordering by trying 2-card sequences; treat Seared as stacks*(stacks+1)/2 damage.

### M3. `chooseAction` plays PvP/self-damage without a reserve (`bot.ts:141-157`)
`lose()` cards can take the hero to 0 on the bot's own turn: it avoids this only because a death evaluates to -1e6. `canPlay` in the engine also allows a human to kill themselves with Cold Bargain/Rend. Consider `canPlay` refusing self-lethal `loseHp` (or the UI confirming).

### M4. plus() produces uneven upgrade power and free summons (`build.ts:63-113`)
- Summon-only cards have nothing to "improve", so they drop a cost (`build.ts:96-99`): Deploy Drone+ (the Rivet basic, two in his starter), Call Turret+, Salvage Bot+, Repair Bot+, Packhound+, Call Gnashlings+ become **0-cost** summons; Swarm Protocol+, Build Enforcer+, War Engine+, Maw Brute+ drop a Mana. Free summons with a 3-slot cap are a refill loop, and the summoned unit is not upgraded. Fix: give summons "+" unit variants (e.g. `patrol-drone+`) or a +HP/+damage step, and only reduce cost on non-summons.
- Multi-effect cards gain on every op: Cold Bargain+ goes lose 3 -> 2, mana 1 -> 2, draw 1 -> 2 on a 0-cost card (net +2 Mana and 2 cards for 2 HP); Dawn Smite+/Dawnlance+/Bell Toll+ gain +3 on both damage and Barrier. Cap to the main effect, or use a per-card `up` override for outliers.
- `Silencing Snare+` (stun and Shielded only) becomes cost 0; `EMP+` becomes a free stun. Intended by the rule, but check against the budget.
- `lose` is only reduced when `> 1` and only when `to === 'self'`; a card whose only change is that reduction is flagged `changed = false` and gets the cost cut as well (not currently hit, but fragile).
- `build.ts:69` `o.to === 'allFoes' ? 3 : 3` is a redundant branch; `build.ts:106-109` the `basic` branch is dead code (only the `unplayable` return does anything).

### M5. validateDb gaps (`validate.ts`)
- Does not check summon side/kind: a hero card summoning an enemy-brain unit would put an `enemy` kind unit on side a, and an enemy move summoning an ally-brain unit (e.g. a Wyldmaw boss summoning `hound`) creates a body that never acts (allies only act in `endTurn`). Add: summon from a card/ally requires `brain.kind === 'ally'`, summon from an enemy move requires `'enemy'`.
- Phases: `phaseIndex` depends on listing order (first entry is the default, thresholds must descend), but the validator does not require descending, unique thresholds or that the first covers 100. A zero-positive-weight `weighted` pattern is only checked at the top level (line 69), not inside phases, where `nextInt(total = 0)` would misbehave. Empty `weighted.options` inside a phase is also unchecked.
- `prevent` is rejected for `foeSummons` (line 46-51) but not for `hpLost`, where `a.hit` is null so it silently does nothing (engine.ts:190,289-291). No card does this today.
- Amounts are only checked for finiteness: negative `damage`/`barrier`/`heal`/`draw` amounts, non-integer amounts, `hpLost.min <= 0`, a `friend` card with no effect using `target`, and a `summon`/`attack` card with no matching op all pass.
- `hero` selector inside an enemy move resolves to nothing (enemies have no hero); `front`/`randomFoe` etc. fine. Add a check for `to: 'hero'` in enemy moves.
- Hero checks: no `startUnits.length <= MAX_ALLIES`, mana/handSize/maxHp positivity.
- Duplicate ids cannot be detected after `Object.fromEntries` in `index.ts:540-543` silently de-duplicates. Assert uniqueness of `V2_CARDS`, `ALLIES`+`ENEMY_UNITS` and `ENCOUNTERS` ids before building the maps. I found none today.

### M6. Scaling transform (`units.ts:378-420`)
- Elites scale damage by 1.5 but regulars by 1.6, so an elite is scaled *less* than a regular and `ENEMY_SCALE.elite.hp` equals regular hp. If that is deliberate (elites carry extra raw numbers) say so in a comment; otherwise swap.
- Summoned adds are scaled by their own tier: Warden/finale minions (`scrap-drone`, `maw-spawn`, `rift-shard`, `raptor`, `gilded-halberdier`) all get regular x1.6 damage / x1.15 HP even though the boss is "hand-tuned, scale 1". Vorthax's `rift-shard` becomes Slice 10 per shard per turn, which probably contributes to Vorthax at 0%. Either scale adds with the boss tier or hand-tune adds.
- `loseHp` is not scaled (`units.ts:403` only touches `damage`); Vorthax `rupture` is a boss so no effect now, but a regular/elite using `lose(..., 'target')` would be silently unscaled. Heals and Barrier are intentionally unscaled; say so.
- `BOSSES`/`ELITES` are free-form id sets; a typo silently falls to the regular tier. Add a test that every id exists and that elite/warden encounter units match their tier.
- `Math.round` makes the effective multiplier uneven (3 -> 5 is +67%, 4 -> 6 is +50%); fine but expect odd small-number results. The scaled values still use Might unscaled.

### M7. Weak and vacuous tests (`v2.test.ts`)
- `:583-592` "upgrades are strictly better or cheaper" only asserts the JSON differs; it would pass if an upgrade lowered damage, raised cost or added Exhaust. Assert per-op monotonicity (`amount >=`, `cost <=`, no new `exhaust`).
- `:616-629` the bot test only asserts a winner exists (a loss passes), with a 600-action cap; it proves no crashes, not balance. Add assertions on win-rate bands (e.g. each hero beats each regular > 50% over N seeds) or move that to the sim with thresholds.
- `:575-581` rules text `> 3` characters is near-vacuous.
- No scenario tests for any card or enemy (project golden rule 5): no test that Whisper Net springs on a summon, EMP stuns, Sanctuary prevents, Taunt allies redirect, phase changes happen, ENEMY_SCALE numbers, or the hero-identity rules from the spec (no Aurelion/Umbral card contains `summon`; Maren/Vesper have no `startUnits`; Rivet's pool has drones; Kesh's pack is capped).
- No test that every unit is referenced (ally by a card or hero, enemy by an encounter) or that every unit is within MAX_ENEMIES.

## LOW

- L1. Enemy Snares: spec section 5 says "Umbral enemies set Snares of their own" but the engine has no enemy Snares (`fireSnare` returns for a side with no hero, engine.ts:175) and no Umbral enemy sets one. Log in DECISIONS.md or drop from the spec.
- L2. `units.ts:64` Cleric of the Ninth Bell `bless`: `heal(4)` defaults to `self`, while `barrier(6,'allFriends')` covers the group. Probably should be `heal(4,'allFriends')` (Blessing).
- L3. Aurelion "a few cards give an ally Shielded" (spec): `Aegis of the Warden` and `Hallowed Ground` give Shielded to the **hero** (`self`), which is the right call for a no-companion hero, but update the spec wording.
- L4. Stun consumes the whole move (engine.ts:469-474): stunning a Warden on its signature move (`bell`, `orbital`, `collapse`) removes it from that cycle rather than delaying it. Fine as design, but note it when tuning Wardens and Whisper Net/EMP/Silencing Snare.
- L5. Multi-hit and AoE enemy moves vs Snares: a Snare is spent per hit event and `prevent` cancels only that hit (engine.ts:149-155). Sanctuary/Mirror Veil/Bait and Switch stop 1 of 3 hits of `burst` or 1 of 4 of `shardstorm`. Maybe add text on the card.
- L6. `Hollow Snare` Faltering 1 only weakens the hit that sprang it, because Faltering on the enemy side decays at the end of the same enemy phase (engine.ts:530); `Mirror Veil` 2 gives one extra turn. Consider raising it.
- L7. Whisper Net (`foeSummons`) has no target in 19 of 27 encounters (only Line Technician, Hive-7, Packmother, Kron, Gorrmaw, Seraphine, Vorthax summon). Not a bug, but a dead pick in most fights.
- L8. Balance notes: `Bell Toll` (1 Mana, common) dominates neutral `Rift Storm` (2 Mana, uncommon) for Maren; `Rend` (11 dmg for 1) is above the header budget "1-Mana attack ~6-9"; `drone` vs `patrol-drone` and `hound` vs `packhound` are near-duplicates; `Squire Recruit` (36 HP) is tougher than `Squire` (24 HP) despite its name.
- L9. `Wound` and `Static` (`cards.ts:453-456`) are identical, unplayable, empty-effect cards; nothing can remove them from the deck for the rest of the fight. Fine for now; confirm intent.
- L10. `index.ts:430` `Riftwalker.starter` comment says "which card ids it may draft from" but it is the starter deck; draft access is `rewardPool()`. `rewardPool` excludes basics, so Rivet cannot be offered more Deploy Drones and Vesper no more Set the Web.
- L11. `sim2.ts:168-170` `Number('abc')` yields NaN and prints NaN%; no bounds on `--n`. `deckFor` draws reward cards uniformly across rarities (rares as likely as commons) and the same draws index per hero; use rarity weights for a realistic draft. Results are also not tied to a start-of-fight HP/upgrades.
- L12. `UnitDef.art` is never set for any unit (UI hint), so the C3 scene will need a fallback.

## Resolution
H1 fixed in content (enemy debuffs now applied before the attack they set up, Exposed 2); H2 fixed in engine (phases monotonic via lowPct); H3 fixed (Kesh now buffs a starting Hound; 2 summon cards left); H4: sim counts stalls separately (0 observed) and the bot caveat is in BALANCE.md. MEDIUM: "+" summon cards now bring "+" companions; validateDb checks negative amounts and prevent on non-attack Snares; boss adds unscaled; identity tests added. Remaining MEDIUM/LOW deferred.
