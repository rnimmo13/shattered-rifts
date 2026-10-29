// #/cosmetics: the Cosmetics Vault, what you own (DECISIONS #406, #409). It looks like the Store: the same tabs in a bar that stays at
// the top. Under Riftwalker looks, "All" shows each Riftwalker in the look it wears now (pick one to change it); a class shows its own
// look and the skins you own for it, to wear. The look you wear is your hero on the home screen, in the character picker and in your
// fights (never on an opponent's). Presentation only: nothing here changes how a hero plays.

import { useEffect, useMemo, useState } from 'react';
import { RIFTWALKERS, SKINS, type HeroId } from '@sr/content/v2';
import { wornSkin } from '@sr/pvp';
import { preloadArt, realSkins } from '../art/assets';
import { skinName } from '../art/skins';
import { useCosmetics, wear } from '../cosmetics/cosmetics';
import { heroFigure } from '../fight/art';
import { LookTile, ShopFrame, SoonPanel } from './ShopParts';
import { HEROES, SHOP_TABS, remember, remembered, type ShopTab } from './shopTabs';

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
  const [tab, setTab] = useState<ShopTab>(() => remembered('sr-vault-tab', 'looks', isTab));
  const [hero, setHero] = useState<string>(() => remembered('sr-vault-hero', 'all', isHeroOrAll));
  const pickTab = (t: ShopTab): void => {
    setTab(t);
    remember('sr-vault-tab', t);
  };
  const pickHero = (h: string): void => {
    setHero(h);
    remember('sr-vault-hero', h);
  };
  const ownedLooks = SKINS.filter((s) => mine.owned.includes(s.id) && art.has(s.id));
  const name = (h: HeroId): string => RIFTWALKERS[h].hero.name;

  let body;
  if (tab !== 'looks') body = <SoonPanel tab={tab} text="Nothing of this kind in the Store yet." />;
  else if (hero === 'all')
    // every Riftwalker in the look it wears now: pick one to change it
    body = (
      <ul className="shop__grid">
        {HEROES.map((h) => {
          const worn = wornSkin(mine, h);
          const count = ownedLooks.filter((s) => s.hero === h).length;
          return (
            <LookTile
              key={h}
              src={(worn ? art.get(worn) : undefined) ?? own.get(h) ?? ''}
              name={name(h)}
              sub={worn ? skinName({ id: worn, hero: h }) : 'Own look'}
              tag={count > 0 ? `${count + 1} looks` : undefined}
              onOpen={() => pickHero(h)}
              openLabel={`Change the ${name(h)}'s look`}
              action={
                <button
                  type="button"
                  className="btn btn--small btn--ghost"
                  onClick={() => pickHero(h)}
                  aria-label={`Change the ${name(h)}'s look`}
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
    const worn = wornSkin(mine, h) ?? null;
    const looks = [
      { id: null, label: 'Own look', src: own.get(h) ?? '' },
      ...ownedLooks
        .filter((s) => s.hero === h)
        .map((s) => ({ id: s.id, label: skinName(s), src: art.get(s.id) ?? '' })),
    ];
    const forSale = SKINS.filter((s) => s.hero === h && !mine.owned.includes(s.id)).length;
    body = (
      <>
        <ul className="shop__grid" role="radiogroup" aria-label={`The ${name(h)}'s look`}>
          {looks.map((l) => {
            const on = l.id === worn;
            return (
              <LookTile
                key={l.id ?? 'own'}
                src={l.src}
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
            {forSale} more {forSale === 1 ? 'look' : 'looks'} for the {name(h)} in{' '}
            <a href="#/store">the Store</a>.
          </p>
        )}
      </>
    );
  }
  return (
    <ShopFrame
      page="vault"
      lead="Everything you own, and the look each Riftwalker wears: on the home screen and in every fight, on any device with your account."
      tab={tab}
      onTab={pickTab}
      hero={{ value: hero, onPick: pickHero, all: true }}
      counts={{ looks: ownedLooks.length }}
    >
      {body}
    </ShopFrame>
  );
}
