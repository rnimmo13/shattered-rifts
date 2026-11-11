// The picked Riftwalker on show (figure, name, role, mechanics, trait) with the row of icons to pick another. The home page and
// the Sandbox both use it, so a Riftwalker is chosen the same way everywhere. On the home page the row is also the mastery tracker
// (DECISIONS #739).

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  REALMS,
  RIFTWALKERS,
  ascendanciesOf,
  heroCardBack,
  heroesByRealm,
  type HeroId,
} from '@sr/content/v2';
import { crestPic } from '../fight/fxMoments';
import { Picture } from '../ui/Picture';
import { heroFigure } from '../fight/art';
import { ART_READY_EVENT } from '../art/assets';
import {
  MASTERY_TIERS,
  heroMastery,
  isMastered,
  masteryTotals,
  wornSkin,
  type HeroMastery,
} from '@sr/pvp';
import { useCosmetics } from '../cosmetics/cosmetics';
import { useMastery } from '../cosmetics/mastery';
import { HeroIcon } from '../ui/HeroIcon';
import { HERO_COLOR } from '../art/emblems';
import { tipAttrs } from '../ui/tip';
import { localOnly } from '../playAccess';
import { HeroModel } from '../art/HeroModel';
import './home.css';

function HeroStage(props: { hero: HeroId }) {
  const ref = useRef<HTMLCanvasElement>(null);
  // the look you chose for this Riftwalker (DECISIONS #406), drawn again when its figure arrives
  const skin = wornSkin(useCosmetics(), props.hero);
  const [art, setArt] = useState(0);
  useEffect(() => {
    const on = (): void => setArt((v) => v + 1);
    window.addEventListener(ART_READY_EVENT, on);
    return () => window.removeEventListener(ART_READY_EVENT, on);
  }, []);
  // (before the first paint, so the canvas is never seen at its default size)
  useLayoutEffect(() => {
    const c = ref.current;
    const g = c?.getContext('2d');
    if (!c || !g) return;
    const src = heroFigure(props.hero, skin);
    const h = 560;
    const w = Math.max(1, Math.round((src.width / src.height) * h));
    c.width = w;
    c.height = h;
    g.clearRect(0, 0, w, h);
    g.drawImage(src, 0, 0, w, h);
  }, [props.hero, skin, art]);
  // (the animated model over it, where the hero's own look has one: DECISIONS #680)
  return (
    <HeroModel hero={props.hero} skin={skin} className="home__figure">
      <canvas ref={ref} aria-hidden />
    </HeroModel>
  );
}

/**
 * The number under a Riftwalker's icon (DECISIONS #741): its mastery, the campaigns cleared with it, once there is one; before that,
 * how far it has got. And the same in words.
 */
function masteryStat(m: HeroMastery): { short: string; words: string } {
  if (isMastered(m))
    return {
      short: `★ ${m.clears}`,
      words: `mastery ${m.clears}, ${m.clears === 1 ? 'campaign' : 'campaigns'} cleared`,
    };
  return m.best > 0
    ? {
        short: `${m.best}/${MASTERY_TIERS}`,
        words: `Rift Tier ${m.best} of ${MASTERY_TIERS} cleared`,
      }
    : { short: '–', words: 'no Rift Tier cleared yet' };
}

/** A ring of one segment per Rift Tier around a Riftwalker's icon: the tiers cleared are lit, and the ring is gold once mastered. */
function MasteryRing(props: { m: HeroMastery }) {
  const n = Math.min(MASTERY_TIERS, props.m.best);
  const seg = 120 / MASTERY_TIERS;
  const gap = 1.6;
  const dash = `${seg - gap} ${gap}`;
  return (
    <svg
      className={`home__ring${isMastered(props.m) ? ' is-mastered' : ''}`}
      viewBox="0 0 44 44"
      aria-hidden
    >
      <circle
        className="home__ringTrack"
        cx="22"
        cy="22"
        r="20"
        pathLength="120"
        strokeDasharray={dash}
      />
      {n > 0 && (
        <circle
          className="home__ringLit"
          cx="22"
          cy="22"
          r="20"
          pathLength="120"
          strokeDasharray={`${Array.from({ length: n }, () => dash).join(' ')} 0 ${120 - n * seg}`}
        />
      )}
    </svg>
  );
}

export function HeroShowcase(props: {
  picked: HeroId;
  onPick: (h: HeroId) => void;
  /** a smaller figure, for a page with more below it (the Sandbox) */
  compact?: boolean;
  /** the mastery tracker on the row of Riftwalkers, and the picked one's mastery in words (the home page: DECISIONS #739) */
  mastery?: boolean;
}) {
  const { picked } = props;
  const hero = RIFTWALKERS[picked];
  const realm = useMemo(() => REALMS.find((r) => r.id === hero.realm)?.name ?? '', [hero.realm]);
  const heroes = useMemo(() => heroesByRealm().flatMap((g) => g.heroes), []);
  const all = useMastery();
  const { owned } = useCosmetics();
  const mine = heroMastery(all, picked);
  const totals = masteryTotals(all);
  return (
    <section
      className={`home__stage${props.compact ? ' home__stage--compact' : ''}`}
      aria-label="Riftwalkers"
      style={{ '--accent': HERO_COLOR[picked] ?? '#d4a84b' } as CSSProperties}
    >
      <div className="home__show">
        <HeroStage hero={picked} />
        <div className="home__floor" aria-hidden />
      </div>
      <div className="home__info">
        <h2 className="home__hero">{hero.hero.name}</h2>
        <p className="home__role">{realm}</p>
        <p className="home__paths">
          {hero.mechanics.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </p>
        <p className="home__trait">
          <b>{hero.trait.name}.</b> {hero.trait.text}
        </p>
        {/* the classes they can become after Tier III (hover one for what it does) */}
        <div className="home__ascend">
          <span className="home__ascendKicker">Ascendancies</span>
          <ul>
            {ascendanciesOf(picked).map((x) => (
              <li
                key={x.id}
                tabIndex={0}
                {...tipAttrs({ kicker: `Ascendancy · ${x.leans}`, title: x.name, text: x.text })}
              >
                <Picture id={crestPic(x.id)} className="home__ascendCrest">
                  {null}
                </Picture>
                {x.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <ul
        className={`home__roster${props.mastery ? ' home__roster--mastery' : ''}`}
        aria-label="Choose a Riftwalker"
      >
        {heroes.map((h) => {
          const m = heroMastery(all, h);
          const stat = masteryStat(m);
          return (
            <li key={h}>
              <button
                type="button"
                className={`home__pick${picked === h ? ' is-picked' : ''}`}
                aria-pressed={picked === h}
                aria-label={
                  props.mastery
                    ? `${RIFTWALKERS[h].hero.name}: ${stat.words}`
                    : RIFTWALKERS[h].hero.name
                }
                {...tipAttrs({
                  kicker: `Innate · ${RIFTWALKERS[h].role}`,
                  title: RIFTWALKERS[h].hero.name,
                  text: RIFTWALKERS[h].trait.text,
                })}
                onClick={() => props.onPick(h)}
              >
                {props.mastery && <MasteryRing m={m} />}
                <HeroIcon hero={h} size={52} />
                {props.mastery && (
                  <span className={`home__stat${isMastered(m) ? ' is-mastered' : ''}`} aria-hidden>
                    {stat.short}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {props.mastery && (
        <div className="home__mastery">
          {/* a snapshot of the player's time with the picked Riftwalker: its mastery first, then the plain numbers */}
          <dl className="home__stats" aria-label={`Your ${hero.hero.name}`}>
            <div className={`home__statBox${isMastered(mine) ? ' is-mastered' : ''}`}>
              <dt>Mastery</dt>
              <dd>{mine.clears}</dd>
              <small>{mine.clears === 1 ? 'campaign cleared' : 'campaigns cleared'}</small>
            </div>
            <div className="home__statBox">
              <dt>Furthest</dt>
              <dd>{mine.best > 0 ? `${mine.best}/${MASTERY_TIERS}` : '–'}</dd>
              <small>Rift Tiers cleared</small>
            </div>
            <div className="home__statBox">
              <dt>Arena</dt>
              <dd>{mine.arenaWins}</dd>
              <small>{mine.arenaWins === 1 ? 'battle won' : 'battles won'}</small>
            </div>
            <div className="home__statBox">
              <dt>Ghosts</dt>
              <dd>{mine.ghostWins}</dd>
              <small>{mine.ghostWins === 1 ? 'battle won' : 'battles won'}</small>
            </div>
          </dl>
          <p className="home__masteryMine">
            {isMastered(mine) ? (
              <span className="home__masteryDone">
                {/* (the card back is the server's to give: until it has, say so rather than promise it) */}
                {owned.includes(heroCardBack(picked)) ? (
                  <>
                    The {hero.hero.name} card back is yours, in your{' '}
                    <a href="#/cosmetics">Collection</a>.
                  </>
                ) : localOnly() ? (
                  'Card backs are earned with your online account.'
                ) : (
                  `The ${hero.hero.name} card back arrives the next time you are online.`
                )}
              </span>
            ) : (
              <span>
                Clear the campaign as the {hero.hero.name} to master it and earn its card back.
              </span>
            )}
            <span className="home__masteryTotal">
              {totals.mastered} of {heroes.length} Riftwalkers mastered · {totals.clears}{' '}
              {totals.clears === 1 ? 'campaign' : 'campaigns'} cleared in all
            </span>
          </p>
        </div>
      )}
    </section>
  );
}
