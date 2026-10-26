// The heroes' weapons and the painted attack effects (docs/weapon-prompts.md, cut by tools/pack-weapons.ps1 into public/art/weapons).
// Presentation only, like attackStyles.ts: the weapon a hero swings never changes what a card does. Loaded once in the background;
// until it is (or if it never is) the attacks keep their drawn effects.

import { Texture } from 'pixi.js';
import type { CardDef } from '@sr/combat';
import type { AttackKind } from './attackStyles';

export type WeaponId =
  | 'sword'
  | 'shield'
  | 'wrench'
  | 'cleaver'
  | 'stiletto'
  | 'throwing-knife'
  | 'totem-staff'
  | 'flame-blade'
  | 'obsidian-blade'
  | 'grave-lantern'
  | 'hammer'
  | 'shotgun';
export type FxId = 'muzzle' | 'impact' | 'spark' | 'cast';

/** How a weapon moves when it is used. */
export type Motion = 'swing' | 'slam' | 'thrust' | 'throw' | 'fire' | 'raise';

export interface WeaponLook {
  motion: Motion;
  /** where the hand holds it, as a share of the picture (0,0 top left): it turns about this point */
  grip: [number, number];
  /** its length on the stage, as a share of the hero's height */
  size: number;
}

export const WEAPON_LOOK: Record<WeaponId, WeaponLook> = {
  sword: { motion: 'swing', grip: [0.1, 0.5], size: 0.6 },
  shield: { motion: 'thrust', grip: [0.3, 0.5], size: 0.42 },
  wrench: { motion: 'slam', grip: [0.08, 0.62], size: 0.55 },
  cleaver: { motion: 'swing', grip: [0.12, 0.42], size: 0.55 },
  stiletto: { motion: 'thrust', grip: [0.1, 0.45], size: 0.45 },
  'throwing-knife': { motion: 'throw', grip: [0.1, 0.4], size: 0.34 },
  'totem-staff': { motion: 'raise', grip: [0.08, 0.78], size: 0.7 },
  'flame-blade': { motion: 'swing', grip: [0.08, 0.42], size: 0.58 },
  'obsidian-blade': { motion: 'swing', grip: [0.08, 0.5], size: 0.62 },
  'grave-lantern': { motion: 'raise', grip: [0.05, 0.3], size: 0.55 },
  hammer: { motion: 'slam', grip: [0.08, 0.55], size: 0.6 },
  shotgun: { motion: 'fire', grip: [0.22, 0.5], size: 0.5 },
};

/** the attack style a motion plays as (the stage's beats: a melee rush, or a shot from where the hero stands) */
export const MOTION_KIND: Record<Motion, AttackKind> = {
  swing: 'slash',
  slam: 'smash',
  thrust: 'stab',
  throw: 'throw',
  fire: 'shoot',
  raise: 'cast',
};

/** a Riftwalker's weapon when the card says nothing more */
const HERO_WEAPON: Record<string, WeaponId> = {
  knight: 'sword',
  engineer: 'wrench',
  hunter: 'cleaver',
  trapper: 'stiletto',
  assassin: 'throwing-knife',
  totemist: 'totem-staff',
  barbarian: 'flame-blade',
  spellblade: 'obsidian-blade',
  necromancer: 'grave-lantern',
  drunkard: 'shotgun',
};

/**
 * The weapon a hero uses for a card: KP fires the Old Twelve Gauge for gun and shell cards and anything that hits every enemy,
 * and swings the hammer for the rest; Valeria bashes with her shield for a card that hits with her Barrier.
 */
export function weaponFor(hero: string, card?: CardDef | null): WeaponId | null {
  const def = HERO_WEAPON[hero];
  if (!def) return null;
  if (!card) return def;
  if (hero === 'drunkard') {
    const tags = card.tags ?? [];
    const spray = card.effects.some((o) => o.op === 'damage' && o.to === 'allFoes');
    return tags.includes('gun') || tags.includes('shell') || spray ? 'shotgun' : 'hammer';
  }
  if (hero === 'knight')
    return card.effects.some((o) => 'scale' in o && o.scale?.by === 'barrier') ? 'shield' : 'sword';
  return def;
}

interface Loaded {
  weapons: Map<string, Texture>;
  fx: Map<string, Texture[]>;
}
let loaded: Loaded | null = null;
let loading: Promise<void> | null = null;

const image = (url: string): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });

/** Load the weapon pictures and effect frames once (safe to call again; never fails: without them the drawn effects stay). */
export function loadWeaponArt(): Promise<void> {
  loading ??= (async () => {
    const base = import.meta.env.BASE_URL;
    let index: { weapons?: Record<string, string>; fx?: Record<string, string[]> };
    try {
      const res = await fetch(`${base}art/weapons/index.json`, { cache: 'no-cache' });
      if (!res.ok) return;
      index = (await res.json()) as typeof index;
    } catch {
      return;
    }
    const out: Loaded = { weapons: new Map(), fx: new Map() };
    await Promise.all([
      ...Object.entries(index.weapons ?? {}).map(async ([id, path]) => {
        const img = await image(`${base}art/${path}`);
        if (img) out.weapons.set(id, Texture.from(img));
      }),
      ...Object.entries(index.fx ?? {}).map(async ([id, paths]) => {
        const imgs = await Promise.all(paths.map((p) => image(`${base}art/${p}`)));
        // (an effect plays only when every frame of it came)
        if (imgs.every((i) => i !== null))
          out.fx.set(
            id,
            imgs.map((i) => Texture.from(i)),
          );
      }),
    ]);
    loaded = out;
  })();
  return loading;
}

export const weaponTexture = (id: WeaponId): Texture | undefined => loaded?.weapons.get(id);
export const fxFrames = (id: FxId): Texture[] | undefined => loaded?.fx.get(id);
