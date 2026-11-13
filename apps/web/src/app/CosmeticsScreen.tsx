// #/cosmetics: the Cosmetics Vault, what you own (DECISIONS #406, #409). It looks like the Store: the same tabs in a bar that stays at
// the top. Under Riftwalker looks, "All" shows each Riftwalker in the look it wears now (pick one to change it); a class shows its own
// look and the skins you own for it, to wear. The look you wear is your hero on the home screen, in the character picker and in your
// fights (never on an opponent's). Presentation only: nothing here changes how a hero plays.

import { useEffect, useMemo, useState } from 'react';
import { CARD_BACKS, RIFTWALKERS, type HeroId } from '@sr/content/v2';
import { inUse } from '@sr/pvp';
import { AVAILABLE_SKINS } from '../art/heroRigs';
import { preloadArt, realSkins } from '../art/assets';
import { skinName } from '../art/skins';
import { choose, shownSkin, useCosmetics, wear } from '../cosmetics/cosmetics';
import { CardBackFace } from '../cosmetics/CardBackFace';
import { heroFigure } from '../fight/art';
import { LookTile, ShopFrame, SoonPanel } from './ShopParts';
import { FIRST_TAB, HEROES, SHOP_TABS, remember, remembered, type ShopTab } from './shopTabs';

const isTab = (v: string): boolean => SHOP_TABS.some((t) => t.id === v);
const isHeroOrAll = (v: string): boolean => v === 'all' || (HEROES as string[]).includes(v);

export function CosmeticsScreen() {
  const mine = useCosmetics();
  const [art, setArt] = useState<Map<string, string>>(
    () => new Map(realSkins().map((s) => [s.id, s.url])),
  );
  useEffect(() => {
    let live = true;
    void preloadArt().then(() => {
      if (live) setArt(new Map(realSkins().map((s) => [s.id, s.url])));
    });
    return () => {
      live = false;
    };
  }, []);
  // (each Riftwalker's own look is drawn once, not on every Wear; again when the art arrives on a first, slow visit)
  const own = useMemo(
    () => new Map(HEROES.map((h) => [h, heroFigure(h).toDataURL('image/png')])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [art],
  );
  const [tab, setTab] = useState<ShopTab>(() => remembered('sr-vault-tab', FIRST_TAB, isTab));
  const [hero, setHero] = useState<string>(() => remembered('sr-vault-hero', 'all', isHeroOrAll));
  const pickTab = (t: ShopTab): void => {
    setTab(t);
    remember('sr-vault-tab', t);
  };
  const pickHero = (h: string): void => {
    setHero(h);
    remember('sr-vault-hero', h);
  };
  const ownedLooks = AVAILABLE_SKINS.filter((s) => mine.owned.includes(s.id) && art.has(s.id));
  const name = (h: HeroId): string => RIFTWALKERS[h].hero.name;

  const ownedBacks = CARD_BACKS.filter((b) => mine.owned.includes(b.id));
  const backInUse = inUse(mine, 'cardBack') ?? null;

  let body;
  if (tab === 'backs') {
    // the card back everyone starts with, then every card back there is: the ones you own to use, the rest with how they are earned
    const backs: { id: string | null; label: string; sub: string; owned: boolean }[] = [
      { id: null, label: 'S|R crest', sub: 'The card back everyone starts with', owned: true },
      ...CARD_BACKS.map((b) => ({
        id: b.id,
        label: b.crest ? `${name(b.crest)} card back` : b.name,
        sub: b.crest
          ? mine.owned.includes(b.id)
            ? `Mastery: campaign cleared as the ${name(b.crest)}`
            : `Clear the campaign as the ${name(b.crest)}`
          : b.name,
        owned: mine.owned.includes(b.id),
      })),
    ];
    body = (
      <>
        <ul className="shop__grid" role="radiogroup" aria-label="Your card back">
          {backs.map((b) => {
            const on = b.owned && b.id === backInUse;
            return (
              <li
                key={b.id ?? 'crest'}
                className={`look${on ? ' is-on' : ''}${b.owned ? '' : ' is-locked'}`}
              >
                <div className="look__stage look__stage--back">
                  <CardBackFace back={b.id ?? undefined} locked={!b.owned} />
                  {(on || !b.owned) && <i className="look__tag">{on ? 'In use' : 'Not earned'}</i>}
                </div>
                <b className="look__name">{b.label}</b>
                <span className="look__sub">{b.sub}</span>
                <div className="look__act">
                  {b.owned && (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={on}
                      aria-label={b.label}
                      className={`btn btn--small${on ? ' btn--ghost' : ''}`}
                      onClick={() => {
                        if (!on) choose('cardBack', b.id);
                      }}
                    >
                      <span>{on ? 'In use' : 'Use'}</span>
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <p className="shop__note">
          Your card back is on your draw pile and on every card you draw. Master a Riftwalker by
          clearing the campaign with it to earn its card back; what you have earned is listed under{' '}
          <a href="#/earned">Earned</a>.
        </p>
      </>
    );
  } else if (tab !== 'looks')
    body = <SoonPanel tab={tab} text="Nothing of this kind in the Store yet." />;
  else if (hero === 'all')
    // every Riftwalker in the look it wears now: pick one to change it
    body = (
      <ul className="shop__grid">
        {HEROES.map((h) => {
          const worn = shownSkin(mine, h);
          const count = ownedLooks.filter((s) => s.hero === h).length;
          return (
            <LookTile
              key={h}
              src={(worn ? art.get(worn) : undefined) ?? own.get(h) ?? ''}
              hero={h}
              skin={worn}
              name={name(h)}
              sub={worn ? skinName({ id: worn, hero: h }) : 'Default skin'}
              tag={count > 0 ? `${count + 1} skins` : undefined}
              onOpen={() => pickHero(h)}
              openLabel={`Change the ${name(h)}'s skin`}
              action={
                <button
                  type="button"
                  className="btn btn--small btn--ghost"
                  onClick={() => pickHero(h)}
                  aria-label={`Change the ${name(h)}'s skin`}
                >
                  <span>Change</span>
                </button>
              }
            />
          );
        })}
      </ul>
    );
  else {
    const h = hero as HeroId;
    const worn = shownSkin(mine, h) ?? null;
    const looks = [
      { id: null, label: 'Default skin', src: own.get(h) ?? '' },
      ...ownedLooks
        .filter((s) => s.hero === h)
        .map((s) => ({ id: s.id, label: skinName(s), src: art.get(s.id) ?? '' })),
    ];
    const forSale = AVAILABLE_SKINS.filter(
      (s) => s.hero === h && !mine.owned.includes(s.id),
    ).length;
    body = (
      <>
        <ul className="shop__grid" role="radiogroup" aria-label={`The ${name(h)}'s skin`}>
          {looks.map((l) => {
            const on = l.id === worn;
            return (
              <LookTile
                key={l.id ?? 'own'}
                src={l.src}
                hero={h}
                skin={l.id ?? undefined}
                name={l.label}
                sub={name(h)}
                tag={on ? 'Wearing' : undefined}
                on={on}
                action={
                  <button
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={l.label}
                    className={`btn btn--small${on ? ' btn--ghost' : ''}`}
                    onClick={() => {
                      if (!on) wear(h, l.id);
                    }}
                  >
                    <span>{on ? 'Wearing' : 'Wear'}</span>
                  </button>
                }
              />
            );
          })}
        </ul>
        {forSale > 0 && (
          <p className="shop__note">
            {forSale} more {forSale === 1 ? 'skin' : 'skins'} for the {name(h)} in{' '}
            <a href="#/store">the Store</a>.
          </p>
        )}
      </>
    );
  }
  return (
    <ShopFrame
      page="vault"
      lead="See what you own and choose what your Riftwalkers wear."
      tab={tab}
      onTab={pickTab}
      hero={{ value: hero, onPick: pickHero, all: true }}
      counts={{ looks: ownedLooks.length, backs: ownedBacks.length }}
    >
      {body}
    </ShopFrame>
  );
}
