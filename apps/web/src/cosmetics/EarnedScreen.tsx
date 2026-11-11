// #/earned: everything the player has earned by playing, newest first (DECISIONS #739). The log is kept on their Vault, so it is the
// same on every device; nothing here needs claiming.

import { useEffect } from 'react';
import { MASTERY_HEROES, cosmeticDef } from '@sr/content/v2';
import { masteryTotals } from '@sr/pvp';
import { localOnly } from '../playAccess';
import { syncMastery, useEarned, useMastery } from './mastery';
import { CardBackFace, earnedWords } from './CardBackFace';
import '../play/play.css';
import './cardback.css';

const day = (at: number): string =>
  new Date(at).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });

export default function EarnedScreen() {
  const log = useEarned();
  const totals = masteryTotals(useMastery());
  useEffect(() => {
    void syncMastery();
  }, []);
  return (
    <main className="setup setup--wide earned">
      <a className="btn btn--small setup__back" href="#/">
        <span>Back</span>
      </a>
      <header className="setup__head">
        <h1 className="setup__title">Earned</h1>
        <p className="setup__lead">
          What you have earned by playing. Rewards are given the moment you earn them and are never
          wiped. {totals.mastered} of {MASTERY_HEROES.length} Riftwalkers mastered · {totals.clears}{' '}
          {totals.clears === 1 ? 'campaign' : 'campaigns'} cleared · {totals.arenaWins} Arena{' '}
          {totals.arenaWins === 1 ? 'battle' : 'battles'} won · {totals.ghostWins} against ghosts.
        </p>
      </header>
      {log.length === 0 ? (
        <section className="pvp__status">
          <h2>Nothing yet</h2>
          <p>
            {localOnly()
              ? 'Rewards are kept with your online account. This offline profile tracks your mastery, but earns no rewards.'
              : 'Clear the campaign with a Riftwalker to master it and earn its card back.'}
          </p>
        </section>
      ) : (
        <ul className="earned__list">
          {log.map((e) => {
            const words = earnedWords(e);
            return (
              <li key={e.id} className="earned__item">
                {cosmeticDef(e.cosmetic)?.kind === 'cardBack' ? (
                  <CardBackFace back={e.cosmetic} />
                ) : (
                  <span />
                )}
                <b>{words.title}</b>
                <time dateTime={new Date(e.at).toISOString()}>{day(e.at)}</time>
                <p>{words.text}</p>
              </li>
            );
          })}
        </ul>
      )}
      <p className="earned__note">
        Choose a card back in your <a href="#/cosmetics">Collection</a>.
      </p>
    </main>
  );
}
