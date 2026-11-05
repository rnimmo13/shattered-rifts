import { classNameOf } from '@sr/content/v2';
import type { RunState } from '@sr/campaign';

/** An earned, persistent ending: no automatic restart or forced navigation. */
export function VictoryPanel({
  run,
  onKeep,
  onHome,
}: {
  run: RunState;
  onKeep: () => void;
  onHome: () => void;
}) {
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
          Vorthax has fallen. You have conquered the paths between the realms and reclaimed their
          stolen power. With the Ward restored, the worlds can finally breathe again.
        </p>
        <p className="campaign-victory__record">
          {classNameOf(run.character, run.ascendancy)} · {run.stats.duelsWon} victories ·{' '}
          {run.deck.length} cards
        </p>
        <div className="choices-row">
          <button className="btn btn--primary" onClick={onKeep}>
            <span>Keep this victorious deck</span>
          </button>
          <button className="btn" onClick={onHome}>
            <span>Return to the Sanctum</span>
          </button>
        </div>
      </div>
    </section>
  );
}
