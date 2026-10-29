// The picked Riftwalker on show (figure, name, role, mechanics, trait) with the row of icons to pick another. The home page and
// the Sandbox both use it, so a Riftwalker is chosen the same way everywhere.

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { REALMS, RIFTWALKERS, heroesByRealm, type HeroId } from '@sr/content/v2';
import { heroFigure } from '../fight/art';
import { ART_READY_EVENT } from '../art/assets';
import { wornSkin } from '@sr/pvp';
import { useCosmetics } from '../cosmetics/cosmetics';
import { HeroIcon } from '../ui/HeroIcon';
import { HERO_COLOR } from '../art/emblems';
import { tipAttrs } from '../ui/tip';
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
  useEffect(() => {
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
  return <canvas ref={ref} className="home__figure" aria-hidden />;
}

export function HeroShowcase(props: {
  picked: HeroId;
  onPick: (h: HeroId) => void;
  /** a smaller figure, for a page with more below it (the Sandbox) */
  compact?: boolean;
}) {
  const { picked } = props;
  const hero = RIFTWALKERS[picked];
  const realm = useMemo(() => REALMS.find((r) => r.id === hero.realm)?.name ?? '', [hero.realm]);
  const heroes = useMemo(() => heroesByRealm().flatMap((g) => g.heroes), []);
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
      </div>
      <ul className="home__roster" aria-label="Choose a Riftwalker">
        {heroes.map((h) => (
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
              onClick={() => props.onPick(h)}
            >
              <HeroIcon hero={h} size={52} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
