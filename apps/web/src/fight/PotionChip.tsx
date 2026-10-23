// Potions: a flask icon whose liquid shows what it does, so a potion is never mistaken for a Boon or a button. Used on the
// belt in a fight (click to drink), in the run bar, and in shops and rewards.

import { COMBAT_DB } from '@sr/content/v2';
import type { PotionDef } from '@sr/combat';
import { tipAttrs } from '../ui/tip';
import { liquidOf, potionTip } from './potionStyle';

/** A little glass flask, drawn in SVG: cork, neck, round belly, and a liquid that fills most of it. */
export function PotionIcon(props: { potion: PotionDef; size?: number }) {
  const { potion: p } = props;
  const size = props.size ?? 40;
  const liquid = liquidOf(p);
  const id = `pf-${p.id}`;
  const rim = p.rarity === 'rare' ? '#dcb8ff' : p.rarity === 'uncommon' ? '#ffe0a0' : '#dfe9ff';
  return (
    <svg
      className={`flask flask--${p.rarity}`}
      width={size}
      height={size * 1.25}
      viewBox="0 0 48 60"
      aria-hidden
      focusable="false"
    >
      <defs>
        <clipPath id={id}>
          <path d="M19 14 h10 v10 c10 5 15 12 15 21 a15 12 0 0 1 -15 12 h-10 a15 12 0 0 1 -15 -12 c0 -9 5 -16 15 -21z" />
        </clipPath>
      </defs>
      {/* the liquid, filling the lower three quarters */}
      <g clipPath={`url(#${id})`}>
        <rect x="0" y="30" width="48" height="30" fill={liquid} />
        <rect x="0" y="30" width="48" height="4" fill="#fff" opacity="0.28" />
        <circle cx="19" cy="46" r="2.2" fill="#fff" opacity="0.35" />
        <circle cx="27" cy="50" r="1.4" fill="#fff" opacity="0.3" />
      </g>
      {/* glass */}
      <path
        d="M19 14 h10 v10 c10 5 15 12 15 21 a15 12 0 0 1 -15 12 h-10 a15 12 0 0 1 -15 -12 c0 -9 5 -16 15 -21z"
        fill="rgba(200,225,255,0.10)"
        stroke={rim}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M13 40 c0 -4 2 -7 5 -9"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        opacity="0.5"
        strokeLinecap="round"
      />
      {/* the neck and cork */}
      <rect
        x="18"
        y="8"
        width="12"
        height="8"
        rx="2"
        fill="rgba(200,225,255,0.14)"
        stroke={rim}
        strokeWidth="2"
      />
      <rect
        x="17"
        y="2"
        width="14"
        height="8"
        rx="3"
        fill="#b9854f"
        stroke="#6b4420"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/** A potion as a small flask icon (run bar). */
export function PotionChip(props: { id: string }) {
  const p = COMBAT_DB.potions[props.id];
  if (!p) return null;
  return (
    <span
      className={`potionchip potion--${p.rarity}`}
      aria-label={`${p.name}: ${p.text}`}
      {...tipAttrs(potionTip(p, 'A one-use item. Drink it during a fight, for free.'))}
      tabIndex={0}
    >
      <PotionIcon potion={p} size={26} />
    </span>
  );
}

/** A potion you can drink in a fight: a flask with its name under it. */
export function PotionButton(props: {
  id: string;
  disabled: boolean;
  active: boolean;
  onUse: () => void;
}) {
  const p = COMBAT_DB.potions[props.id];
  if (!p) return null;
  const aimed = p.target !== 'none';
  return (
    <button
      className={`potionbtn potion--${p.rarity}${props.active ? ' is-active' : ''}`}
      disabled={props.disabled}
      onClick={props.onUse}
      aria-label={`Drink ${p.name}: ${p.text}`}
      {...tipAttrs(
        potionTip(
          p,
          aimed
            ? 'Click, then choose a target. Free: costs no Mana.'
            : 'Click to drink. Free: costs no Mana.',
        ),
      )}
    >
      <PotionIcon potion={p} size={34} />
      <small>{p.name}</small>
    </button>
  );
}

/** A potion written out, with its text (rewards, shop). */
export function PotionCard(props: { id: string; note?: string }) {
  const p = COMBAT_DB.potions[props.id];
  if (!p) return null;
  return (
    <div className={`booncard potion--${p.rarity}`}>
      <span className="potionbig">
        <PotionIcon potion={p} size={44} />
      </span>
      <div>
        <b>{p.name}</b>
        <small>potion · {p.rarity}</small>
        <p>{p.text}</p>
        {props.note && <em>{props.note}</em>}
      </div>
    </div>
  );
}
