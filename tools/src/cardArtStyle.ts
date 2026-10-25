// What the card-art prompts say about each world, each Riftwalker and each kind of card (shared by cardprompts.ts and cardprompts-extra.ts).

export const REALM_STYLE: Record<string, string> = {
  aurelion:
    'a gilded cathedral-castle: white marble, gold, royal blue, warm sunset light through stained glass',
  nexus:
    'a teal-and-orange foundry of machines: hazard stripes, steel, glowing cyan, sparks and steam',
  wyldmaw:
    'a primal jungle inside the ribcage of a giant beast: bone, crimson, moss green, bioluminescent mushrooms',
  umbral: 'a moonlit ballroom of shadows: violet and teal mist, masks, mirrors, candelabras',
  starfall:
    'a volcanic glass desert: black obsidian, ember-orange cracks, violet sheen, floating arcana stars',
  gloomfen: 'a drowned fen at night: pale green witch-light, bone, reeds, black water, mist',
  midden:
    "the rift's rubbish dump: rusty junk, green bottle glass, amber oil-drum firelight, a deep blue-black sky",
  neutral: 'the shattered rift between worlds: violet and cyan energy, floating broken stone',
};

export const KIND_HINT: Record<string, string> = {
  attack: 'a dynamic strike caught mid-action',
  skill: 'a defensive or tactical moment, calm and clear',
  power: 'a grand symbolic still-life: one iconic object or pose that stands for the idea',
  summon: 'the creature or machine arriving, shown whole',
  snare: 'a hidden trap seen as it is being set, ominous',
};

export const OWN_LOOK: Record<string, string> = {
  knight: 'Valeria, a blonde knight in blue-and-gold plate',
  engineer: 'Rivet, an engineer with a hovering drone',
  hunter: 'Kesh, a tribal huntress with bone weapons',
  trapper: 'Vesper, a masked trapper with teal glow',
  assassin: 'Sylas, a flamboyant rogue throwing teal-glowing knives',
  totemist: 'Ilvane, a spirit shaman who calls glowing totems',
  barbarian: 'Sehra, a flame-bound warrior with twin scimitars',
  spellblade: 'Obsidia, a queen of black volcanic glass with floating shards',
  necromancer: 'Mire, a spectral green-eyed reaper with thralls',
  drunkard: 'KP, a boisterous drunk dwarf with a shotgun and bottles',
};

export const strip = (t: string): string => t.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();

