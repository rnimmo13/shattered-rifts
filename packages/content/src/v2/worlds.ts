/** Campaign worlds are separate from the seven Riftwalker/card-art homelands. */
export const CAMPAIGN_REALMS = [
  {
    id: 'aurelion',
    name: 'Aurelion',
    description: 'Gilded light, cathedral bells and binding oaths.',
    wardens: ['seraphine', 'the-hollow-benediction'],
  },
  {
    id: 'nexus',
    name: 'Nexus-9',
    description: 'Living machinery, foundries and stolen lightning.',
    wardens: ['kron', 'mother-of-static'],
  },
  {
    id: 'wyldmaw',
    name: 'Wyldmaw',
    description: 'Hungry forests, roaming packs and impossible beasts.',
    wardens: ['gorrmaw', 'the-upside-down-stag'],
  },
  {
    id: 'umbral',
    name: 'Umbral Veil',
    description: 'Masks, hidden courts and hungry theatres.',
    wardens: ['nyxara', 'the-applause-below'],
  },
  {
    id: 'gloomfen',
    name: 'Gloomfen',
    description: 'A drowned marsh whose dead answer the tide.',
    wardens: ['the-mourning-tide'],
  },
  {
    id: 'starfall',
    name: 'The Hollow Crown',
    description: 'A fallen-star kingdom of forged spells and broken glass.',
    wardens: ['queen-of-the-unmade'],
  },
  {
    id: 'beyond',
    name: 'The Far Rifts',
    description: 'Impossible distances, broken gravity and worlds folded together.',
    wardens: ['event-horizon-regent'],
  },
  {
    id: 'cinder',
    name: 'Cindervault',
    description: 'An ash-buried empire whose armies still march from living furnaces.',
    wardens: ['ashbound-colossus'],
  },
  {
    id: 'tides',
    name: 'Thalassar',
    description: 'A living ocean of pearl citadels, mirror tides and luminous reefs.',
    wardens: ['pearlbound-sovereign'],
  },
  {
    id: 'vespera',
    name: 'Vespera',
    description: 'A world asleep, where dreams become creatures and memories are stolen.',
    wardens: ['dreaming-monarch'],
  },
  {
    id: 'sands',
    name: 'The Hourglass Expanse',
    description: 'Twin suns, buried histories and dunes that measure the passing of ages.',
    wardens: ['sandbound-chronicler'],
  },
] as const;
export type CampaignRealmId = (typeof CAMPAIGN_REALMS)[number]['id'];
export type CampaignMapRealm = CampaignRealmId | 'rift' | 'ruin';
export const CAMPAIGN_REALM_IDS: readonly CampaignRealmId[] = CAMPAIGN_REALMS.map((r) => r.id);
export const DRAGON_WARDENS = ['pyrewing', 'nacreth', 'morvane', 'aethrion', 'xalvorr'] as const;
export const RUIN_NAME = 'The First Ruin';
export function worldOfWarden(id: string): CampaignRealmId | 'ruin' | undefined {
  if (id === 'vorthax' || (DRAGON_WARDENS as readonly string[]).includes(id)) return 'ruin';
  return CAMPAIGN_REALMS.find((r) => (r.wardens as readonly string[]).includes(id))?.id;
}
