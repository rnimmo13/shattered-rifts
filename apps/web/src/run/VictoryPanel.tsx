import { useEffect, useLayoutEffect, type ReactNode } from 'react';
import { classNameOf } from '@sr/content/v2';
import type { RunState } from '@sr/campaign';
import { enterVictory } from '../audio/music';
import './victory.css';

/** What the ending says of the run that earned it. */
export interface VictoryRecord {
  hero: string;
  ascendancy?: string | undefined;
  /** fights won (left out when it is not known: a saved deck does not say) */
  victories?: number | undefined;
  cards: number;
}

export const victoryOf = (run: RunState): VictoryRecord => ({
  hero: run.character,
  ascendancy: run.ascendancy,
  victories: run.stats.duelsWon,
  cards: run.deck.length,
});

/**
 * An earned, persistent ending: no automatic restart or forced navigation. The run banks itself as it is won, so its deck is saved
 * without asking (children: where it went; Robert 2026-11-09, #701).
 */
export function VictoryPanel({
  record,
  onHome,
  homeLabel = 'Return to the Sanctum',
  children,
}: {
  record: VictoryRecord;
  onHome: () => void;
  homeLabel?: string;
  children?: ReactNode;
}) {
  // Beyond the Clouds plays from the beginning while the ending is open (DECISIONS #664).
  // (a layout effect, like FightView's, so leaving the last fight goes straight to this theme)
  useLayoutEffect(enterVictory, []);
  return (
    <section className="campaign-victory" aria-labelledby="victory-title">
      <img
        className="campaign-victory__art"
        src={`${import.meta.env.BASE_URL}art/victory/rifts-sealed.webp`}
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
          {classNameOf(record.hero, record.ascendancy)}
          {record.victories !== undefined && ` · ${record.victories} victories`} · {record.cards}{' '}
          cards
        </p>
        {children}
        <div className="choices-row">
          <button className="btn btn--primary" onClick={onHome}>
            <span>{homeLabel}</span>
          </button>
        </div>
      </div>
    </section>
  );
}

/**
 * The ending, opened again from a completed run or its saved deck (DECISIONS #739): the same picture, words and music, over the page
 * it was opened from. Esc or Close goes back.
 */
export function VictoryAgain(props: { record: VictoryRecord; onClose: () => void }) {
  const { onClose } = props;
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="victory-again" role="dialog" aria-modal="true" aria-labelledby="victory-title">
      <VictoryPanel record={props.record} onHome={onClose} homeLabel="Close" />
    </div>
  );
}
