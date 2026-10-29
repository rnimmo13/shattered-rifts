// #/store: the Store. It sells cosmetics only (never power: the game's pillars rule out pay-to-win). One kind of cosmetic at a time, its
// tabs in a bar that stays at the top while the page scrolls (DECISIONS #409). Riftwalker looks (skins, #402, #406) are on sale, free for
// now: a grid of tiles, filtered by class, each with Get (it goes on your account) and then Wear; what you own is in the Cosmetics
// Vault (#/cosmetics). The other kinds are coming soon.

import { useEffect, useState } from 'react';
import { RIFTWALKERS, SKINS } from '@sr/content/v2';
import { wornSkin } from '@sr/pvp';
import { preloadArt, realSkins } from '../art/assets';
import { skinName } from '../art/skins';
import { getSkin, useCosmetics, wear } from '../cosmetics/cosmetics';
import { LookTile, ShopFrame, SoonPanel } from './ShopParts';
import { HEROES, SHOP_TABS, remember, remembered, type ShopTab } from './shopTabs';

const isTab = (v: string): boolean => SHOP_TABS.some((t) => t.id === v);
const isHeroOrAll = (v: string): boolean => v === 'all' || (HEROES as string[]).includes(v);

export function StoreScreen() {
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
  const [tab, setTab] = useState<ShopTab>(() => remembered('sr-store-tab', 'looks', isTab));
  const [hero, setHero] = useState<string>(() => remembered('sr-store-hero', 'all', isHeroOrAll));
  const pickTab = (t: ShopTab): void => {
    setTab(t);
    remember('sr-store-tab', t);
  };
  const pickHero = (h: string): void => {
    setHero(h);
    remember('sr-store-hero', h);
  };

  // the looks on sale with a figure, in class order, for the class picked
  const looks = SKINS.filter((s) => art.has(s.id) && (hero === 'all' || s.hero === hero));
  return (
    <ShopFrame
      page="store"
      lead="Cosmetics only: nothing here ever makes a deck stronger. Riftwalker looks are free for now."
      tab={tab}
      onTab={pickTab}
      hero={{ value: hero, onPick: pickHero, all: true }}
    >
      {tab !== 'looks' ? (
        <SoonPanel tab={tab} />
      ) : looks.length === 0 ? (
        <SoonPanel tab="looks" text="No looks for this Riftwalker yet." />
      ) : (
        <ul className="shop__grid">
          {looks.map((s) => {
            const owned = mine.owned.includes(s.id);
            const worn = wornSkin(mine, s.hero) === s.id;
            const cls = RIFTWALKERS[s.hero].hero.name;
            return (
              <LookTile
                key={s.id}
                src={art.get(s.id) ?? ''}
                name={skinName(s)}
                sub={cls}
                tag={worn ? 'Wearing' : owned ? 'Owned' : s.price === 0 ? 'Free' : `${s.price}`}
                on={worn}
                action={
                  !owned ? (
                    <button
                      type="button"
                      className="btn btn--small"
                      aria-label={`Get ${skinName(s)} for the ${cls} (free)`}
                      onClick={() => getSkin(s.id)}
                    >
                      <span>Get (free)</span>
                    </button>
                  ) : worn ? (
                    <a
                      className="btn btn--small btn--ghost"
                      href="#/cosmetics"
                      aria-label={`Wearing ${skinName(s)}: change looks in your Cosmetics Vault`}
                    >
                      <span>Wearing</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="btn btn--small"
                      aria-label={`Wear ${skinName(s)} on the ${cls}`}
                      onClick={() => wear(s.hero, s.id)}
                    >
                      <span>Wear</span>
                    </button>
                  )
                }
              />
            );
          })}
        </ul>
      )}
    </ShopFrame>
  );
}
