export type WardenEffect =
  | 'blade'
  | 'fang'
  | 'claw'
  | 'quake'
  | 'bell'
  | 'beam'
  | 'lightning'
  | 'shards'
  | 'tide'
  | 'roots'
  | 'web'
  | 'gravity'
  | 'orbit'
  | 'breath'
  | 'curtain'
  | 'halo'
  | 'summon'
  | 'hourglass'
  | 'rift';

export interface WardenMotion {
  effect: WardenEffect;
  pose: WardenPose;
  tint: string;
  windup: number;
  travel: number;
  rise: number;
  tilt: number;
  releaseHeight: number;
  charge: boolean;
  targetOpponent: boolean;
}

interface WardenStyle {
  tint: string;
  moves: Partial<Record<WardenEffect, string>>;
  colors?: Record<string, string>;
  /** Utility moves whose effect lands across the field. */
  aimed?: string;
}

const styles: Record<string, WardenStyle> = {
  seraphine: {
    tint: '#ffe19a',
    moves: { blade: 'smite radiance', bell: 'bell bell2', halo: 'chant kneel', summon: 'ascend' },
  },
  'the-hollow-benediction': {
    tint: '#e9cd9d',
    moves: { bell: 'blessing rite', quake: 'litany', halo: 'halo veil' },
  },
  kron: {
    tint: '#ff9b50',
    moves: {
      quake: 'slam',
      beam: 'laser',
      lightning: 'orbital orbital2',
      halo: 'charge',
      summon: 'reopen',
    },
    colors: { laser: '#ff5b48', orbital: '#ffce90', orbital2: '#ffce90' },
  },
  'mother-of-static': {
    tint: '#71f6ed',
    moves: {
      lightning: 'crackle overload storm',
      orbit: 'broadcast',
      halo: 'ground',
      beam: 'cut',
      web: 'jam',
    },
  },
  gorrmaw: {
    tint: '#f55348',
    moves: { fang: 'bite bite2 gorge', claw: 'rend', summon: 'spawn brood' },
  },
  'the-upside-down-stag': {
    tint: '#b6e169',
    moves: { blade: 'gore', roots: 'turnover upend grow', quake: 'trample kick', halo: 'bark' },
  },
  nyxara: {
    tint: '#b279ff',
    aimed: 'ensnare whisper unmask',
    moves: { web: 'web ensnare', curtain: 'unmask whisper', blade: 'strike ambush', claw: 'lash' },
  },
  'the-applause-below': {
    tint: '#ebad66',
    moves: { curtain: 'curtain encore', bell: 'clap ovation', halo: 'bow' },
  },
  'the-mourning-tide': {
    tint: '#7bdccd',
    aimed: 'undertow',
    moves: { tide: 'wave flood breakers', gravity: 'undertow lowtide', halo: 'swell' },
  },
  'queen-of-the-unmade': {
    tint: '#ffd26e',
    moves: { shards: 'shards', rift: 'decree', blade: 'verdict', orbit: 'crown', halo: 'throne' },
  },
  'event-horizon-regent': {
    tint: '#d483ff',
    moves: { gravity: 'gravity', rift: 'horizon', shards: 'debris', orbit: 'ring orbit' },
  },
  'ashbound-colossus': {
    tint: '#ff7b31',
    moves: { halo: 'stoke', breath: 'march', quake: 'rupture' },
  },
  'pearlbound-sovereign': {
    tint: '#66dfec',
    moves: { orbit: 'mirror', tide: 'surge', gravity: 'ebb' },
  },
  'dreaming-monarch': {
    tint: '#ed9dd8',
    moves: { orbit: 'dream', curtain: 'hush', shards: 'wake' },
  },
  'sandbound-chronicler': {
    tint: '#fac779',
    moves: { hourglass: 'measure turn', breath: 'erode', blade: 'stroke' },
  },
  pyrewing: {
    tint: '#ff792d',
    moves: { halo: 'inhale', breath: 'breath', claw: 'talon' },
  },
  nacreth: {
    tint: '#9bdcff',
    moves: { orbit: 'scales', shards: 'shards', beam: 'fracture' },
  },
  morvane: {
    tint: '#e571ab',
    moves: { summon: 'brood', gravity: 'maw', fang: 'consume' },
  },
  aethrion: {
    tint: '#7ba9ff',
    moves: { orbit: 'charge', lightning: 'bolts', quake: 'thunder' },
    colors: { thunder: '#ffe485' },
  },
  xalvorr: {
    tint: '#af70f5',
    moves: { orbit: 'eclipse', claw: 'shadow', rift: 'night' },
  },
  vorthax: {
    tint: '#c47cff',
    aimed: 'pull close',
    moves: {
      summon: 'ward call-pyrewing call-nacreth call-morvane call-aethrion call-xalvorr',
      shards: 'shards shardstorm',
      quake: 'collapse collapse2 rupture rupture2',
      orbit: 'refract refract2 core',
      rift: 'shatter reshatter close',
      fang: 'feed',
      gravity: 'pull',
      beam: 'beam beam2',
      hourglass: 'turnover',
    },
    colors: {
      'call-pyrewing': '#ff792d',
      'call-nacreth': '#9bdcff',
      'call-morvane': '#e571ab',
      'call-aethrion': '#7ba9ff',
      'call-xalvorr': '#af70f5',
      beam2: '#ef8bff',
      close: '#ff87ca',
    },
  },
};

const motion: Record<WardenEffect, readonly [windup: number, travel: number, rise: number]> = {
  blade: [0.15, 105, 26],
  fang: [0.2, 128, 0],
  claw: [0.12, 70, 18],
  quake: [0.24, 38, 34],
  bell: [0.21, 20, 12],
  beam: [0.24, 2, 0],
  lightning: [0.14, 0, 14],
  shards: [0.19, 5, 22],
  tide: [0.21, 48, 28],
  roots: [0.21, 52, 30],
  web: [0.18, 0, 13],
  gravity: [0.27, -25, 25],
  orbit: [0.22, 0, 20],
  breath: [0.2, 22, 12],
  curtain: [0.27, 9, 19],
  halo: [0.18, 0, 4],
  summon: [0.26, 0, 17],
  hourglass: [0.26, -12, 14],
  rift: [0.31, 7, 30],
};

export function wardenMotion(def: string, move: string | null): WardenMotion | undefined {
  const id = def.replace(/\+$/, '').replace(/-incarnation$/, '');
  const style = Object.hasOwn(styles, id) ? styles[id] : undefined;
  if (!style || !move) return undefined;
  const effect = (Object.keys(style.moves) as WardenEffect[]).find((kind) =>
    style.moves[kind]?.split(' ').includes(move),
  );
  if (!effect) return undefined;
  const [windup, travel, rise] = motion[effect];
  return {
    effect,
    pose: poses[effect],
    tint: style.colors?.[move] ?? style.tint,
    windup,
    travel,
    rise,
    tilt: travel > 28 ? 0.1 : 0.036,
    releaseHeight: effect === 'blade' || effect === 'claw' || effect === 'tide' ? 0.5 : 0,
    charge: ['beam', 'breath', 'lightning', 'rift', 'summon'].includes(effect),
    targetOpponent: style.aimed?.split(' ').includes(move) ?? false,
  };
}

// Keyframes sample the existing drawings. Neither sampling nor a rigid stage transform changes
// the silhouette. Each sequence marks its own release frame.
export const WARDEN_POSES = {
  thrust: {
    frames: ['ready', 'antic', 'windup', 'release', 'contact', 'follow', 'recover', 'ready'],
    hit: 4,
  },
  slam: {
    frames: [
      'ready',
      'antic',
      'windup',
      'windup',
      'release',
      'contact',
      'contact',
      'follow',
      'ready',
    ],
    hit: 5,
  },
  rake: {
    frames: [
      'ready',
      'windup',
      'release',
      'contact',
      'follow',
      'release',
      'follow',
      'recover',
      'ready',
    ],
    hit: 3,
  },
  cast: {
    frames: ['ready', 'antic', 'windup', 'windup', 'release', 'release', 'recover', 'ready'],
    hit: 4,
  },
  channel: {
    frames: [
      'ready',
      'antic',
      'windup',
      'windup',
      'release',
      'release',
      'release',
      'recover',
      'ready',
    ],
    hit: 4,
  },
  invoke: { frames: ['ready', 'antic', 'windup', 'windup', 'windup', 'antic', 'ready'], hit: 3 },
} as const;

export type WardenPose = keyof typeof WARDEN_POSES;

const poses: Record<WardenEffect, WardenPose> = {
  blade: 'thrust',
  fang: 'thrust',
  claw: 'rake',
  quake: 'slam',
  bell: 'invoke',
  beam: 'channel',
  lightning: 'cast',
  shards: 'cast',
  tide: 'channel',
  roots: 'slam',
  web: 'invoke',
  gravity: 'channel',
  orbit: 'invoke',
  breath: 'channel',
  curtain: 'cast',
  halo: 'invoke',
  summon: 'invoke',
  hourglass: 'channel',
  rift: 'channel',
};
