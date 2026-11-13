import { skinPreview } from '../art/skinPreview';
// The pieces the Store and the Cosmetics Vault share (DECISIONS #409): a compact header with a Store / Vault switch, a bar that stays at
// the top of the page while it scrolls (the category tabs, and under Riftwalker looks a row of classes), the tile a look is shown on,
// and the panel a category with nothing in it yet shows.

import { useState, type ReactNode } from 'react';
import { RIFTWALKERS } from '@sr/content/v2';
import { HEROES, SHOP_TABS, type ShopTab } from './shopTabs';
import { HeroIcon } from '../ui/HeroIcon';
import { StoreIcon } from './StoreIcon';
import { HeroModel } from '../art/HeroModel';
import { DEMON_KNIGHT_SKIN } from '../art/heroRigs';
import './store.css';

/** The Collection's mark: an open chest with what is yours inside (the Store's is a satchel: StoreIcon). */
function CollectionIcon(props: { size?: number; className?: string }) {
  const size = props.size ?? 28;
  return (
    <svg
      className={props.className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden
      focusable="false"
    >
      {/* the lid, thrown back */}
      <path
        d="M6 13 L8 5.5 H24 L26 13"
        fill="#12352f"
        stroke="#5fe0c8"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* what is inside: a gem */}
      <path d="M16 7.5 L20 11 L16 15.5 L12 11 Z" fill="#bffff2" stroke="#5fe0c8" strokeWidth="1" />
      {/* the box */}
      <path
        d="M5 13 H27 V25 C27 26.1 26.1 27 25 27 H7 C5.9 27 5 26.1 5 25 Z"
        fill="#123a34"
        stroke="#5fe0c8"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M5 18 H27" stroke="#5fe0c8" strokeWidth="1.4" />
      <rect
        x="14"
        y="16"
        width="4"
        height="5"
        rx="1"
        fill="#ffd36a"
        stroke="#0a1f1c"
        strokeWidth="0.8"
      />
    </svg>
  );
}

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
    // (DECISIONS #744) the two pages share a layout but must never be mistaken for each other: each has its own colour, mark and
    // a line across the top saying where you are and what the page is for
    <main className={`shop shop--${page}`}>
      <header className="shop__head">
        <a className="btn btn--small" href="#/">
          <span>Back</span>
        </a>
        <div className="shop__brand">
          {page === 'store' ? (
            <StoreIcon size={44} className="store__mark" />
          ) : (
            <CollectionIcon size={44} className="store__mark" />
          )}
          <div className="shop__title">
            <h1>{page === 'store' ? 'Store' : 'Collection'}</h1>
            <p>{props.lead}</p>
          </div>
        </div>
        <nav className="shop__switch" aria-label="Store or your Collection">
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
            Collection
          </a>
        </nav>
      </header>
      <p className="shop__where">
        {page === 'store' ? (
          <>
            <b>The Store</b>
            <span>
              Things to get. Whatever you get here goes into your{' '}
              <a href="#/cosmetics">Collection</a>, where you put it on.
            </span>
          </>
        ) : (
          <>
            <b>Yours</b>
            <span>
              Everything here is already yours: choose what you wear and use. To get more, visit the{' '}
              <a href="#/store">Store</a> or earn it by playing.
            </span>
          </>
        )}
      </p>
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
  /** this tile shows a Riftwalker's own look: their animated model, where they have one (DECISIONS #680) */
  hero?: string | undefined;
  skin?: string | undefined;
}) {
  const demonKnight = props.skin === DEMON_KNIGHT_SKIN;
  const inner = (
    <>
      {/* (no picture yet, or one that will not load: nothing, never a browser's broken-image mark) */}
      {props.hero ? (
        <HeroModel
          hero={props.hero}
          skin={props.skin}
          className={demonKnight ? 'look__model look__model--demon-knight' : 'look__model'}
          fill={demonKnight ? 0.86 : 1.34}
          contain
        >
          <LookPicture
            src={
              skinPreview(props.skin)
                ? `${import.meta.env.BASE_URL}art/skin-previews/${props.skin}.png`
                : props.src
            }
          />
        </HeroModel>
      ) : (
        <LookPicture src={props.src} />
      )}
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

function LookPicture(props: { src: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  const [wide, setWide] = useState<string | null>(null);
  if (!props.src || failed === props.src) return null;
  // (a picture wider than it is tall, a figure with its weapon held out: it stands at the box's height and runs past the sides, as its
  // animated model does, not shrunk to the box's width: DECISIONS #773)
  return (
    <img
      src={props.src}
      alt=""
      loading="lazy"
      className={wide === props.src ? 'is-wide' : undefined}
      onLoad={(e) => {
        const img = e.currentTarget;
        if (img.naturalWidth > img.naturalHeight * 1.05) setWide(props.src);
      }}
      onError={() => setFailed(props.src)}
    />
  );
}
