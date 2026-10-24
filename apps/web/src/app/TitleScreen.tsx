// The home page: the Riftwalker you have picked on show, the three ways to play (New Run, Arena, Practice), and sign-in.

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { REALMS, RIFTWALKERS, heroesByRealm, type HeroId } from '@sr/content/v2';
import { BUILD } from '../build';
import { heroFigure } from '../fight/art';
import { clearSavedRun, loadSavedRun } from '../run/saves';
import { AccountBox } from '../pvp/AccountBox';
import { whoAmI, type Me } from '../pvp/vaultSync';
import { HeroIcon } from '../ui/HeroIcon';
import { HERO_COLOR } from '../art/emblems';
import { tipAttrs } from '../ui/tip';
import { getHero, rememberHero } from './heroChoice';
import './home.css';

/** A Riftwalker standing on show, drawn from their full-length figure. */
function HeroStage(props: { hero: HeroId }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const g = c?.getContext('2d');
    if (!c || !g) return;
    const src = heroFigure(props.hero);
    const h = 560;
    const w = Math.max(1, Math.round((src.width / src.height) * h));
    c.width = w;
    c.height = h;
    g.clearRect(0, 0, w, h);
    g.drawImage(src, 0, 0, w, h);
  }, [props.hero]);
  return <canvas ref={ref} className="home__figure" aria-hidden />;
}

export function TitleScreen() {
  const groups = heroesByRealm();
  const [picked, setPicked] = useState(getHero);
  const [me, setMe] = useState<Me>({ signedIn: false, available: false });
  const [saved, setSaved] = useState(loadSavedRun);
  const [confirmNew, setConfirmNew] = useState(false);
  const hero = RIFTWALKERS[picked];
  const color = HERO_COLOR[picked] ?? '#d4a84b';
  const realm = useMemo(() => REALMS.find((r) => r.id === hero.realm)?.name ?? '', [hero.realm]);

  useEffect(() => {
    let live = true;
    void whoAmI().then((m) => {
      if (live) setMe(m);
    });
    return () => {
      live = false;
    };
  }, []);

  const pick = (h: HeroId): void => {
    setPicked(h);
    rememberHero(h);
  };
  const startNew = (): void => {
    window.location.hash = '#/run';
  };

  return (
    <main className="home" style={{ '--accent': color } as CSSProperties}>
      <div className="home__bar">
        <span className="home__eyebrow">Friends alpha · working title</span>
        <AccountBox
          me={me}
          to="home"
          compact
          onSignedOut={() => setMe({ signedIn: false, available: true })}
        />
      </div>

      <div className="home__body">
        <section className="home__menu" aria-label="Play">
          <h1 className="home__name">Shattered Rifts</h1>
          <p className="home__tagline">
            Walk the broken worlds. Build a deck. Read the rift. Spring the trap.
          </p>

          {saved && (
            <a className="home__play home__play--continue" href="#/run">
              <b>Continue run</b>
              <small>
                {RIFTWALKERS[saved.character].hero.name} · Stage {saved.stage} · Rift Tier{' '}
                {saved.tier}
              </small>
            </a>
          )}
          {saved && confirmNew ? (
            <div className="home__confirm" role="alertdialog" aria-label="Start a new run?">
              <span>Starting a new run throws away your current one.</span>
              <button
                type="button"
                className="btn btn--small"
                onClick={() => {
                  clearSavedRun();
                  setSaved(null);
                  startNew();
                }}
              >
                <span>Abandon it and start over</span>
              </button>
              <button type="button" className="btn btn--small" onClick={() => setConfirmNew(false)}>
                <span>Keep it</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={`home__play${saved ? ' home__play--quiet' : ' home__play--primary'}`}
              onClick={() => (saved ? setConfirmNew(true) : startNew())}
            >
              <b>New Run</b>
              <small>Three stages as {hero.hero.name}. Build a deck and face Vorthax.</small>
            </button>
          )}
          <a className="home__play" href="#/arena">
            <b>Arena</b>
            <small>Duel another player with a deck you banked.</small>
          </a>
          <a className="home__play" href="#/fight">
            <b>Practice</b>
            <small>Try any fight as {hero.hero.name}, no run needed.</small>
          </a>

          <nav className="home__links" aria-label="More">
            <a href="#/decks">Saved decks</a>
            <a href="#/cards">Card library</a>
            <a href="#/learn">How to play</a>
            <a href="#/credits">Credits</a>
          </nav>
        </section>

        <section className="home__stage" aria-label="Riftwalkers">
          <div className="home__show">
            <HeroStage hero={picked} />
            <div className="home__floor" aria-hidden />
          </div>
          <div className="home__info">
            <h2 className="home__hero">{hero.hero.name}</h2>
            <p className="home__role">
              {hero.role} · {realm}
            </p>
            <p className="home__lanes">
              {hero.lanes.map((l) => (
                <span key={l}>{l.split(':')[0]}</span>
              ))}
            </p>
            <p className="home__trait">
              <b>{hero.trait.name}.</b> {hero.trait.text}
            </p>
          </div>
          <ul className="home__roster" aria-label="Choose a Riftwalker">
            {groups
              .flatMap((g) => g.heroes)
              .map((h) => (
                <li key={h}>
                  <button
                    type="button"
                    className={`home__pick${picked === h ? ' is-picked' : ''}`}
                    aria-pressed={picked === h}
                    aria-label={RIFTWALKERS[h].hero.name}
                    {...tipAttrs({
                      kicker: `Innate · ${RIFTWALKERS[h].role}`,
                      title: RIFTWALKERS[h].hero.name,
                      text: RIFTWALKERS[h].trait.text,
                    })}
                    onClick={() => pick(h)}
                  >
                    <HeroIcon hero={h} size={52} />
                  </button>
                </li>
              ))}
          </ul>
        </section>
      </div>

      <p className="home__footer">
        <a href="#/credits">Credits</a> · combat v2 preview · {BUILD.label}
      </p>
    </main>
  );
}
