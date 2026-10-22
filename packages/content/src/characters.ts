// Characters and their 20-card starters (03_CAMPAIGN §1, 02_CARDS §5).

export type CharacterId = 'maren' | 'rivet' | 'kesh' | 'vesper';

export interface Character {
  id: CharacterId;
  name: string;
  realm: 'aurelion' | 'nexus' | 'wyldmaw' | 'umbral';
  sigil: string;
  starterName: string;
  /** Unlocked from the start, or by defeating a Warden. */
  unlock: 'start' | 'boss:nyxara';
  starter: Record<string, number>;
}

export const CHARACTERS: Character[] = [
  {
    id: 'maren',
    name: 'Ser Maren Ashcourt',
    realm: 'aurelion',
    sigil: 'SIG-MAREN',
    starterName: 'Oath of Dawn',
    unlock: 'start',
    starter: {
      'AUR-01': 3, // Gilded Squire
      'AUR-02': 2, // Lightbearer Acolyte
      'AUR-03': 2, // Cleric of the Ninth Bell
      'AUR-04': 2, // Bastion Sentinel
      'AUR-05': 2, // Dawnlance Cavalier
      'AUR-10': 2, // Smite
      'AUR-11': 1, // Benediction
      'AUR-13': 2, // Aegis of the Warden
      'NEU-01': 2, // Rift Wanderer
      'NEU-07': 2, // Rift Bolt
    },
  },
  {
    id: 'rivet',
    name: 'Rivet',
    realm: 'nexus',
    sigil: 'SIG-RIVET',
    starterName: 'Iron Protocol',
    unlock: 'start',
    starter: {
      'NEX-01': 3, // Patrol Drone
      'NEX-02': 2, // Field Technician
      'NEX-03': 2, // Sentry Turret
      'NEX-04': 2, // Enforcer Mk.II
      'NEX-16': 2, // Salvage Bot
      'NEX-08': 2, // Overcharge
      'NEX-09': 1, // Swarm Protocol
      'NEX-11': 1, // Recompile
      'NEX-12': 2, // Countermeasure Grid
      'NEU-01': 1, // Rift Wanderer
      'NEU-07': 2, // Rift Bolt
    },
  },
  {
    id: 'kesh',
    name: 'Kesh the Unfed',
    realm: 'wyldmaw',
    sigil: 'SIG-KESH',
    starterName: 'Hunger Unleashed',
    unlock: 'start',
    starter: {
      'WYL-01': 3, // Gnashling
      'WYL-02': 2, // Rift Raptor
      'WYL-03': 2, // Acid Spitter
      'WYL-04': 2, // Ravenous Packhound
      'WYL-05': 2, // Maw Brute
      'WYL-15': 1, // Carrion Picker
      'WYL-16': 1, // Ironhide Charger
      'WYL-08': 2, // Blood Frenzy
      'WYL-09': 1, // Primal Feast
      'WYL-11': 2, // Bone Pit
      'NEU-07': 2, // Rift Bolt
    },
  },
  {
    id: 'vesper',
    name: 'Vesper Nightlace',
    realm: 'umbral',
    sigil: 'SIG-VESPER',
    starterName: 'Veil of Snares',
    unlock: 'boss:nyxara',
    starter: {
      'UMB-01': 3, // Veilshade
      'UMB-02': 2, // Whisper Acolyte
      'UMB-03': 2, // Gloomstalker
      'UMB-05': 2, // Hollow Lurcher
      'UMB-08': 1, // Mindrot
      'UMB-16': 2, // Whispered Bargain
      'UMB-10': 3, // Shadow Coil
      'NEU-01': 1, // Rift Wanderer
      'NEU-07': 2, // Rift Bolt
      'NEU-06': 1, // Shatter
      'NEU-03': 1, // Shardstone Golem
    },
  },
];

export function starterDeck(id: CharacterId): string[] {
  const c = CHARACTERS.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown character ${id}`);
  return Object.entries(c.starter).flatMap(([card, n]) => Array.from({ length: n }, () => card));
}

export function character(id: CharacterId): Character {
  const c = CHARACTERS.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown character ${id}`);
  return c;
}
