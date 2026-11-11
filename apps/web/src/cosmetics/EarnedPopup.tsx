// What the player has just earned, shown once to acknowledge (DECISIONS #739). Nothing is claimed: the reward is already theirs when
// this opens. It waits while a fight is on screen, and shows on whatever page comes after. Acknowledged on one device, it is not
// shown again on another.

import { useSyncExternalStore } from 'react';
import { cosmeticDef } from '@sr/content/v2';
import { inUse, unseenEarned } from '@sr/pvp';
import { battleActive, subscribeBattle } from '../battleActivity';
import { choose, useCosmetics } from './cosmetics';
import { acknowledge, useEarned } from './mastery';
import { CardBackFace, earnedWords } from './CardBackFace';
import './cardback.css';

export function EarnedPopup() {
  const unseen = unseenEarned(useEarned());
  const inBattle = useSyncExternalStore(subscribeBattle, battleActive);
  const mine = useCosmetics();
  const showing = unseen.length > 0 && !inBattle;
  const ids = unseen.map((e) => e.id);
  // (only its own buttons acknowledge: Esc closes other things too, and a reward must not be acknowledged by a key meant for them)
  if (!showing) return null;
  const [only] = unseen;
  // one card back, owned and not already in use: it can be put to use from here
  const usable =
    unseen.length === 1 &&
    only &&
    cosmeticDef(only.cosmetic)?.kind === 'cardBack' &&
    mine.owned.includes(only.cosmetic) &&
    inUse(mine, 'cardBack') !== only.cosmetic
      ? only.cosmetic
      : null;
  return (
    <div className="earnedpop" role="dialog" aria-modal="true" aria-labelledby="earnedpop-title">
      <div className="earnedpop__panel">
        <p className="earnedpop__kicker" id="earnedpop-title">
          {unseen.length === 1 ? 'You earned a reward' : `You earned ${unseen.length} rewards`}
        </p>
        <ul className={`earnedpop__list${unseen.length > 1 ? ' earnedpop__list--many' : ''}`}>
          {unseen.map((e) => {
            const words = earnedWords(e);
            return (
              <li key={e.id} className="earnedpop__item">
                {cosmeticDef(e.cosmetic)?.kind === 'cardBack' && <CardBackFace back={e.cosmetic} />}
                <h2>{words.title}</h2>
                <p>{words.text}</p>
              </li>
            );
          })}
        </ul>
        <div className="earnedpop__acts">
          {usable && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                choose('cardBack', usable);
                acknowledge(ids);
              }}
            >
              <span>Use this card back</span>
            </button>
          )}
          <button
            type="button"
            className="btn btn--primary"
            autoFocus
            onClick={() => acknowledge(ids)}
          >
            <span>{usable ? 'Keep my card back' : 'OK'}</span>
          </button>
        </div>
        <p className="earnedpop__more">
          Everything you earn is listed under Earned on the home screen, and card backs are chosen
          in your Collection.
        </p>
      </div>
    </div>
  );
}
