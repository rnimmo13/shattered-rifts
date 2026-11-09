import { useLayoutEffect, type ReactNode } from 'react';
import { classNameOf } from '@sr/content/v2';
import type { RunState } from '@sr/campaign';
import { enterVictory } from '../audio/music';

/**
 * An earned, persistent ending: no automatic restart or forced navigation. The run banks itself as it is won, so its deck is saved
 * without asking (children: where it went; Robert 2026-11-09, #701).
 */
export function VictoryPanel({
  run,
  onHome,
  children,
}: {
  run: RunState;
  onHome: () => void;
  children?: ReactNode;
}) {
  // Beyond the Clouds plays from the beginning while the ending is open (DECISIONS #664).
  // (a layout effect, like FightView's, so leaving the last fight goes straight to this theme)
  useLayoutEffect(enterVictory, []);
  return (
    <section className="campaign-victory" aria-labelledby="victory-title">
      <img
        className="campaign-victory__art"
        src="/art/victory/rifts-sealed.webp"
        alt="A victorious Riftwalker reunites golden Ward shards above the reclaimed realms as the violet rifts seal shut."
      />
      <div className="campaign-victory__story">
        <p className="campaign-victory__eyebrow">Campaign complete</p>
        <h1 id="victory-title">The Shattered Rifts are sealed</h1>
        <p>
          Drago has fallen. You have conquered the paths between the realms and reclaimed their
          stolen power. With the Ward restored, the worlds can finally breathe again.
        </p>
        <p className="campaign-victory__record">
          {classNameOf(run.character, run.ascendancy)} · {run.stats.duelsWon} victories ·{' '}
          {run.deck.length} cards
        </p>
        {children}
        <div className="choices-row">
          <button className="btn btn--primary" onClick={onHome}>
            <span>Return to the Sanctum</span>
          </button>
        </div>
      </div>
    </section>
  );
}
