# Review: ghost Wardens batch (uncommitted)

Checks run: `pnpm typecheck` clean, `pnpm lint` clean, `pnpm test` 2485/2485 pass.
No Math.random / Date in the packages/campaign or combat additions. save.ts imports run.ts one-way (run.ts does not import save.ts), so no import cycle.

## HIGH

H1. Ghost fight: reload after the final move leaves the player stuck with no result screen.
- apps/web/src/run/ghostDuel.ts (history replay of saved moves, `link.end` always null), apps/web/src/fight/FightView.tsx ~748 (`if (!history) enqueue(...)`) and ~594-606 (the only place `setResult` fires after a win).
- Scenario: the ghost kills the player (or the player kills it). The final move is already saved in `sr.ghostlog:*`. The player reloads on the result screen, or in the 300 ms before it shows. All saved moves, including the deciding one, replay as history: no events are enqueued, so `setResult` is never called, and `link.end` is null so the pvpEnd effect does nothing. The state has a winner but the screen has no result and no Continue; only Forfeit / Abandon run remain. Forfeit records a loss even when the player had WON (Resolve lost, run possibly collapses). The campaign path has `finishRef` for exactly this case; the ghost path has no equivalent.
- Fix: in createGhostDuel, if replay reaches a winner, do not push the deciding move as history (push it normally after attach), or set `link.end = {winner, reason}` when the loaded state has a winner.

## MEDIUM

M1. POST /pvp/board/ghostboss is unlimited for anonymous callers and can be used to harvest full decks.
- apps/server/src/board.ts:272-275 (rate limit only `if (requester)`), apps/server/src/worker.ts ghostboss branch lets `id == null` through.
- Scenario: a script posts `{}` in a loop with no code. No limit; each call runs a 400-row select plus a deck read on the single `main` Durable Object (which also serves boards). A few thousand calls reveal every upper-half deck's cards and Boons (matchable by name/hero/tier), which /ghostdecks and GhostDecksScreen promise never to show, and can slow the DO. Anonymous callers also cannot be excluded from their own deck.
- Fix: IP-keyed limit like `ip-run`, plus a daily cap, for the anonymous case.

M2. The player controls whether a ghost appears and can re-roll it.
- RunScreen.tsx (wanted effect) with run.ts `ghostAsked`, which is only set by `attachGhost`.
- Scenario: reload while on "A rival rises" (ghostAsked not yet persisted) and a different ghost is drawn each time; going offline (6 s race) always yields the usual Warden. The run is client-side anyway, so low harm, but "same ghost on retry" only holds after the first attach.

M3. `checkGhostBoss` is looser than a legal deck.
- run.ts checkGhostBoss: accepts 1..80 known cards of any hero pool, up to 12 Boons, no duplicate Boon check, no deck rules (`canAdd`). If server-side `checkEntry` ever misses a case, a forged registered deck (e.g. 80 copies of one strong card) becomes a boss for strangers. Mirror the full deck-rule check client-side.

M4. Legacy hero ids are silently dropped.
- run.ts checkGhostBoss uses `Object.hasOwn(RIFTWALKERS, hero)` with no `canonicalHero`; board.ts:245 inserts `e.hero` raw (not `storedHero`). A post-migration registration with a legacy id gives a row the Warden code always rejects, so that ghost is never used (falls back to the standard Warden). Use `canonicalHero` in both places.

M5. Resume logs leak.
- `sr.fightlog:*` / `sr.ghostlog:*` are cleared only by reportResult and leaveRun. Deleting a run slot, importing another run, or a collapsed run leaves orphans (each a full move list). Old `sr.duelstarted:*` keys are never removed. Small but unbounded.

## LOW

L1. The "A rival rises" screen has no Abandon/Back during the up to 6 s fetch. The dev-only manual ghost (`sr.debug.ghostboss`) is correctly gated by `import.meta.env.DEV`.
L2. FightView `slice(-3)` on flourishes drops the oldest card abruptly (no fly-out) when four cards are played quickly.
L3. clearOfBelt.ts: `useLayoutEffect` without deps runs a querySelector plus two layout reads on every render of every WhoTag/StanceAura (layout cost during animation).
L4. Cascade.tsx has a stray `;;` after `[lanes])`. Lint passes.
L5. `won` passed to finishTrial/endTrial is still client-supplied. It cannot improve lanes any more (lanes come from `cascadeLanes(t.seed)`), and false only costs the player. The seed is visible in the save, so lanes are knowable before the drop; harmless because the draw is fair and fixed.
L6. Ghost HP is `hero maxHp * (1.4 + 0.06 * (tier - 3))` with no difficulty/stage scaling, no potions, and the engine is not in PvP mode (no seat compensation). A stage-1 Warden ghost is as strong as a stage-3 one. Check with `pnpm sim` and note in DECISIONS.
L7. Events: option ids come from `['d1'..'d4'][i]`; an event with more than 4 options after the new optional ones would get an undefined id. None do now; add a test assertion.
L8. /ghostdecks and GhostDecksScreen verified: SELECT blanks deck/boons and the response omits id and owner; only name, hero, tier, stage, counts and lastAt are exposed. Several decks by the same name can be correlated; acceptable.
L9. apps/web/src/audio/sfx.ts has no uncommitted change (last touched in the committed 0.43.0), so item 7 has nothing new to review.

## Verified OK
- RNG: generateStageMap consumes a `nextInt` only when tier > GHOST_FROM_TIER, so tier 1-3 maps and all saved maps are unchanged. Old saves have no `ghost` fields and load. save.ts rejects a malformed `context.ghost`.
- /ghost/boss returns only name, hero, deck, boons, tier, stage; no owner or deck id; own deck excluded for identified callers; 30/hour limit for them.
- StrictMode: the fetch effect is guarded by `live`; the double `useState` initializer in GhostLink builds an un-attached duel; `activate()` restarts the bot after dispose.
- A loss keeps `context.ghost` (same ghost on retry), the seed changes per loss, logs clear on result/forfeit/abandon. Campaign (non-ghost) resume handles the deciding move through finishRef.
- Cleanse: affects only DEBUFFS, does not trip Steadfast (negative amount), `plus()` handled, tests cover Doom and the Stun cap, dispel only on the rare.
- Brass Cascade: lanes depend only on the seed; prize shuffle uses r.rng; one Legendary lane with a rare fallback.
