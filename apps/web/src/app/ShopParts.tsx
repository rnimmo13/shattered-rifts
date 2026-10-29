// The pieces the Store and the Cosmetics Vault share (DECISIONS #409): a compact header with a Store / Vault switch, a bar that stays at
// the top of the page while it scrolls (the category tabs, and under Riftwalker looks a row of classes), the tile a look is shown on,
// and the panel a category with nothing in it yet shows.

import type { ReactNode } from 'react';
import { RIFTWALKERS } from '@sr/content/v2';
import { HEROES, SHOP_TABS, type ShopTab } from './shopTabs';
import { HeroIcon } from '../ui/HeroIcon';
import { StoreIcon } from './StoreIcon';
import './store.css';

/** The page around a shop: header, the sticky bar, then what the chosen tab shows. */
export function ShopFrame(props: {
  page: 'store' | 'vault';
  lead: string;
  tab: ShopTab;
  onTab: (t: ShopTab) => void;
  /** the class filter under Riftwalker looks ('all', or a Riftwalker id), with whether 'all' is offered */
  hero?: { value: string; onPick: (h: string) => void; all: boolean };
  /** a count beside a tab (the Vault: how many you own) */
  counts?: Partial<Record<ShopTab, number>>;
  children: ReactNode;
}) {
  const { page, tab, hero } = props;
  return (
    <main className="shop">
      <header className="shop__head">
        <a className="btn btn--small" href="#/">
          <span>Back</span>
        </a>
        <StoreIcon size={44} className="store__mark" />
        <div className="shop__title">
          <h1>{page === 'store' ? 'Store' : 'Cosmetics Vault'}</h1>
          <p>{props.lead}</p>
        </div>
        <nav className="shop__switch" aria-label="Store or Vault">
          <a
            href="#/store"
            className={page === 'store' ? 'is-on' : ''}
            aria-current={page === 'store' ? 'page' : undefined}
          >
            Store
          </a>
          <a
            href="#/cosmetics"
            className={page === 'vault' ? 'is-on' : ''}
            aria-current={page === 'vault' ? 'page' : undefined}
          >
            Vault
          </a>
        </nav>
      </header>
      <div className="shop__bar">
        <div className="shop__tabs" role="tablist" aria-label="Kinds of cosmetics">
          {SHOP_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`shop__tab${tab === t.id ? ' is-on' : ''}`}
              onClick={() => props.onTab(t.id)}
            >
              {t.name}
              {props.counts?.[t.id] !== undefined && (
                <i className="shop__count">{props.counts[t.id]}</i>
              )}
            </button>
          ))}
        </div>
        {tab === 'looks' && hero && (
          <div className="shop__classes" role="tablist" aria-label="Riftwalker">
            {hero.all && (
              <button
                type="button"
                role="tab"
                aria-selected={hero.value === 'all'}
                className={`shop__class${hero.value === 'all' ? ' is-on' : ''}`}
                onClick={() => hero.onPick('all')}
              >
                All
              </button>
            )}
            {HEROES.map((h) => (
              <button
                key={h}
                type="button"
                role="tab"
                aria-selected={hero.value === h}
                aria-label={RIFTWALKERS[h].hero.name}
                title={RIFTWALKERS[h].hero.name}
                className={`shop__class shop__class--icon${hero.value === h ? ' is-on' : ''}`}
                onClick={() => hero.onPick(h)}
              >
                <HeroIcon hero={h} size={26} />
                <span>{RIFTWALKERS[h].hero.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <section className="shop__body" role="tabpanel">
        {props.children}
      </section>
    </main>
  );
}

/** A look on its stage: the figure, its name and class, a tag (Free, Owned, Wearing) and the button that acts on it. */
export function LookTile(props: {
  src: string;
  name: string;
  sub: string;
  tag?: string | undefined;
  on?: boolean | undefined;
  action?: ReactNode;
  onOpen?: (() => void) | undefined;
  /** what clicking the stage does, read out for it (the stage is a plain picture when it does nothing) */
  openLabel?: string | undefined;
}) {
  const inner = (
    <>
      <img src={props.src} alt="" loading="lazy" />
      {props.tag && <i className="look__tag">{props.tag}</i>}
    </>
  );
  return (
    <li className={`look${props.on ? ' is-on' : ''}`}>
      {props.onOpen ? (
        // (a shortcut for the mouse: the tile's own button does the same for the keyboard)
        <button
          type="button"
          className="look__stage"
          onClick={props.onOpen}
          tabIndex={-1}
          aria-label={props.openLabel}
        >
          {inner}
        </button>
      ) : (
        <div className="look__stage">{inner}</div>
      )}
      <b className="look__name">{props.name}</b>
      <span className="look__sub">{props.sub}</span>
      <div className="look__act">{props.action}</div>
    </li>
  );
}

/** A category with nothing in it yet. */
export function SoonPanel(props: { tab: ShopTab; text?: string }) {
  const t = SHOP_TABS.find((x) => x.id === props.tab);
  return (
    <div className="shop__soon">
      <StoreIcon size={56} />
      <b>{t?.name}</b>
      <span>{props.text ?? t?.text}</span>
      <i>Coming soon</i>
    </div>
  );
}
