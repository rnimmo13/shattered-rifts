// How each fighter's attacks look on the stage. Presentation only: every hero still plays the same "Strike" card, and
// the engine never sees this. The kind picks the animation (see Fighters.attack and attackFx.ts), the tint colours the
// slash arc, tracer or spell, and `hits` repeats it (a double slash, a shotgun spread).

export type AttackKind =
  | 'lunge' // the plain body rush (the fallback for anything not listed)
  | 'slash' // a blade swing with a bright arc
  | 'stab' // a quick thrust with a streak
  | 'claw' // three scratch marks
  | 'smash' // a heavy overhead blow with a shock ring
  | 'shoot' // a muzzle flash and tracer(s) from a distance
  | 'throw' // a spinning blade thrown at the target
  | 'cast'; // a charge-up and an orb

export interface AttackSpec {
  kind: AttackKind;
  /** the effect colour */
  tint: string;
  /** repeats: slashes in a flurry, pellets in a spread */
  hits?: number;
}

const a = (kind: AttackKind, tint: string, hits?: number): AttackSpec =>
  hits === undefined ? { kind, tint } : { kind, tint, hits };

export const PLAIN_ATTACK: AttackSpec = a('lunge', '#ffffff');

/** by hero id (`HeroDef.id`) */
const HERO_ATTACK: Record<string, AttackSpec> = {
  knight: a('slash', '#ffe9a8'), // Valeria: sword
  engineer: a('smash', '#ff9d3c'), // the big wrench
  hunter: a('claw', '#ff4a4a'), // feral cleaver
  trapper: a('stab', '#7ff0e0'), // stiletto
  assassin: a('throw', '#b79bff'), // thrown knives
  shaman: a('cast', '#6ee8ff'), // totem magic
  barbarian: a('slash', '#ff7a3a', 2), // flame blades: a flurry
  spellblade: a('slash', '#c4ccdf'), // Obsidia: the obsidian blade
  necromancer: a('cast', '#8dff9a'), // lantern fire
  drunkard: a('shoot', '#ffd27a', 5), // the sawed-off: buckshot
};

/** by enemy / companion unit id; anything missing gets the plain lunge */
const UNIT_ATTACK: Record<string, AttackSpec> = {
  // Aurelion
  squire: a('slash', '#ffe9a8'),
  'gilded-page': a('stab', '#ffe9a8'),
  'squire-recruit': a('slash', '#ffe9a8'),
  'bell-cleric': a('cast', '#ffe9a8'),
  'wandering-knight': a('slash', '#ffe9a8'),
  'templar-aldric': a('smash', '#ffd36a'),
  'inquisitor-maelis': a('cast', '#fff3c4'),
  'gilded-halberdier': a('stab', '#ffe9a8'),
  seraphine: a('smash', '#ffd36a'),
  // Nexus-9
  'scrap-drone': a('shoot', '#6ee8ff'),
  'line-technician': a('smash', '#ff9d3c'),
  'patrol-unit': a('shoot', '#6ee8ff', 2),
  'hive-7': a('shoot', '#6ee8ff', 3),
  ghostwire: a('cast', '#6ee8ff'),
  kron: a('smash', '#ff8a2a'),
  // Wyldmaw
  raptor: a('claw', '#ff5a5a'),
  'acid-spitter': a('throw', '#a6ff4a'),
  'feral-riftling': a('claw', '#ff5a5a'),
  'packmother-ruhn': a('claw', '#ff5a5a'),
  'maw-spawn': a('claw', '#ff5a5a'),
  gorrmaw: a('smash', '#ff5a5a'),
  // Umbral
  'hooded-acolyte': a('stab', '#b79bff'),
  whisperer: a('cast', '#b79bff'),
  'lost-courtier': a('cast', '#7ff0e0'),
  lamplighter: a('cast', '#7ff0e0'),
  'choir-of-silence': a('cast', '#b79bff'),
  nyxara: a('stab', '#b79bff'),
  // the Rift
  'rift-shard': a('shoot', '#e0b0ff'),
  vorthax: a('cast', '#ff7ad9'),
};

export function attackFor(def: string, isHero: boolean): AttackSpec {
  return (isHero ? HERO_ATTACK[def] : UNIT_ATTACK[def]) ?? PLAIN_ATTACK;
}
