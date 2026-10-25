# Review: new events, elite trials, chance coin

Scope: packages/campaign (deals, eventDeals, eventsMore, trials, events, run, rewards, save, types, index), apps/web/src/trials/*, run/ChanceCoin, Pickers, RunScreen, App, sfx.
Checks run: `pnpm lint` clean, `tsc --noEmit` clean for apps/web and packages/campaign, campaign vitest 109/109 pass, web trials vitest 7/7 pass.

No CRITICAL or HIGH issues. The engine-side design is sound: probes in `def().when` and `dealFeasible` work on `clone()` (JSON deep copy, rng included), so no rng is consumed from real state; `eventFlips` is cleared in `enterNode` and at the start of `chooseEvent`, so it cannot re-trigger the coin.

## MEDIUM

### M1. A lost (or won) trial is not committed until "Continue": reload gives unlimited retries of the identical, now-known puzzle
- apps/web/src/run/Pickers.tsx (EventView `playing`, onDone), apps/web/src/trials/TrialHost.tsx (`end`/`onDone`), packages/campaign/src/run.ts:849 (`finishTrial`)
- The run only learns the result when the player clicks Continue on the result screen. Until then the saved state is still `trial.state === 'open'` with the same `seed`. Scenario: player loses Cipher Door (sees the "It was this" reveal) or Echoes/Pairs/Rune Lock, reloads or closes the tab before Continue, comes back, hits the trial again and replays the same puzzle knowing the answer (cipher secret, song, tile layout, solution presses). Walking away and back is also free at any point. The accepted "client reports result" design does not cover this: it is a plain save-scum with no devtools needed.
- Fix: persist an attempt before play (e.g. a `startTrial` action that sets `state: 'playing'`, and treat a `playing` state found on load as a loss), or re-derive the seed from the rng on each attempt. Add 'playing' to `validTrial` and the UI.

## LOW

### L1. Rhythm: effect restarts the needle on every hit (harmless today, fragile)
- apps/web/src/trials/Rhythm.tsx:57 (`settle` useCallback deps `[hits, round, onEnd]`) feeding the needle effect deps `[beat, round, settle]` at ~line 68.
- `setHits` changes `settle`'s identity, so the needle effect tears down and resets `startedAt` during the 800 ms result pause. It is masked by `settled.current` and by LEAD_IN (900 ms > 800 ms pause, so `t` is clamped to 0 and no phantom miss fires). If the pause is ever lengthened past LEAD_IN, a hit would start a phantom "never struck" timeout clock in the pause window, and the needle would visibly jump. Use refs for `hits`/`round`/`onEnd` inside `settle` so it is stable.

### L2. Rhythm: backgrounding the tab loses a round
- Rhythm.tsx tick: `performance.now()` keeps running while rAF is paused, so after returning from another tab `t > period*2.5` and the round is silently scored a miss (and a run of misses can end the trial). Consider pausing on `visibilitychange` or restarting the round's clock on return.

### L3. ChanceCoin: auto-advance timer restarts on every parent render
- apps/web/src/run/ChanceCoin.tsx effect deps include `onDone`; RunScreen passes a fresh inline closure each render, so any RunScreen re-render during the 1.5 s hold resets the timer (delays, never loops or leaks; Skip always works). Wrap in a ref or `useCallback`.

### L4. Save validation gaps (hand-edited or damaged saves only)
- packages/campaign/src/save.ts: `RunState.marks` and `eventFlips` are not validated (a non-array `marks` crashes `(r.marks ?? []).includes` in event `needs` during `rollEvent`; eventFlips with garbage feeds the coin). `validTrial` does not check `theme`/`label` strings or prize `card`/`boon`/`potion` ids, so a bad id reaches `BoonCard`/`PotionCard`/`Pickable` in EventView. `validDeal` does not check `rarity` on `gift`/`crossed` (undefined falls through harmlessly in `crossedOffers`, but is inconsistent). Add `Array.isArray(marks) && isStrArray`, eventFlips shape, and id checks. Round-trip of valid new fields is fine (plain JSON, `RUN_SAVE_VERSION` unchanged and all new fields optional).

### L5. `dealFeasible` ignores chance effects on later steps
- packages/campaign/src/deals.ts:243-256: after a `chance` step the walk continues on the pre-chance state (the branches run on throwaway clones). A step after a chance that depends on the chance's outcome (e.g. shards gained then spent) can be judged infeasible/feasible wrongly. No current event orders steps this way (pale-dealer puts the payment before the chance), so latent only.

### L6. Dynamic-option events can come up with only "Walk away"
- eventDeals.ts `make` / eventsMore.ts `crossedTable`: if `crossedOffers` returns no cards (pool exhausted by canAdd limits) the event has zero real options but `when` passes (`every` on empty), so open-rift / walkers-cairn can be offered as a no-op with just the leave option. Add `if (spec.dyn && !built.opts.length) return false` in `when`.

### L7. Pairs is easy to win by brute force
- logic.ts `PAIR_MISSES = 7` of 12 tiles: clearing the board needs at most about 6 wrong turns even with no memory beyond "do not reopen the tile I just saw", so the game rarely fails. Balance only; consider 4-5 misses if Pairs is meant to guard better prizes (boons/rare cards).

## Verified OK (no action)
- Offered-but-untakeable options: `def().when` requires every option feasible on a probe; trial prizes are pre-filtered with `dealFeasible` (bounty) or `canAdd`/belt/boon checks at build; unaffected by the clone rng.
- exchange / loseBoon / maxHp: exchange excludes sanctified, basic and `~` cards and keeps deck size; loseBoon subtracts the Boon's maxHp bonus and clamps hp; negative maxHp blocked below 30; hurt/hurtPct never reduce hp below 1.
- remove respects `V2_DECK_RULES.minSize` per iteration and excludes sanctified; `static`/`wound` additions are size-safe; `card` re-checks `canAdd` at apply time.
- eventFlips re-trigger: cleared at `enterNode` (event) and `chooseEvent`; the coin only plays in `act()` from phase `event`, never from a loaded save.
- Echoes: song length 8 covers round 6; wrong-note replay re-runs the effect via `replay`, all timeouts cleaned on unmount; winnable. Cipher: distinct-rune secret, scoring correct, 8 guesses, winnable. Rune Lock: scramble is built from presses so always solvable (tested for 200 seeds), recursion terminates in practice. Rhythm: win/lose thresholds consistent (4 of 5).
- Won-trial state: the options list is hidden in the UI, but prizes are always claimable (feasibility was checked when built and the deck cannot change in between); `finishTrial`/`claimTrialPrize` guard phase and state. `resolveEvent('trial')` correctly throws.
- No Math.random/Date/DOM in engine packages (Math.random appears only in the web practice screen, which is outside the pure packages).
