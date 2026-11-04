import type { HeroId } from '@sr/content/v2';
export interface LorePanel {
  image: string;
  title: string;
  text: string;
  alt: string;
}
export interface LoreChapter {
  id: string;
  title: string;
  subtitle: string;
  panels: LorePanel[];
}
export const LORE_CHAPTERS: LoreChapter[] = [
  {
    id: 'worlds-apart',
    title: 'The Worlds Apart',
    subtitle: 'For an age, they never touched.',
    panels: [
      {
        image: 'ch1-worlds',
        title: 'A thousand separate skies',
        text: 'There were many worlds, each with its own laws. In one, light was a weapon and faith was armour. In another, everything that lived had been built; elsewhere, the forest hungered.',
        alt: 'Distinct golden, mechanical, forest and shadow worlds sealed inside glassy spheres.',
      },
      {
        image: 'ch1-apart',
        title: 'Beyond the glass',
        text: 'What kept them apart was the Ward: a barrier so complete that most never knew it was there. Other worlds waited beyond it, unseen.',
        alt: 'A golden cathedral city and an unseen dark forest separated by the iridescent Ward.',
      },
    ],
  },
  {
    id: 'wardens',
    title: 'The Ward and its Wardens',
    subtitle: 'Guardians, before they were enemies.',
    panels: [
      {
        image: 'ch2-ward',
        title: 'A hand against the sky',
        text: 'Every world had a Warden, bound to keep its part of the Ward whole. Most were not cruel. The wall was their duty, and their duty was all they knew.',
        alt: 'A hooded guardian rests a glowing hand against the Ward above a protected city.',
      },
      {
        image: 'ch2-wardens',
        title: 'Each world kept its watch',
        text: 'They took the shapes of their worlds: radiant, forged, rooted or veiled. For an age, each kept the same silent vigil.',
        alt: 'Four different guardians watch over their separate radiant, foundry, woodland and shadow worlds.',
      },
    ],
  },
  {
    id: 'shattering',
    title: 'The Shattering',
    subtitle: 'Vorthax broke the barrier. The worlds paid the price.',
    panels: [
      {
        image: 'ch3-crack',
        title: 'The first crack',
        text: 'Vorthax struck from the space between worlds. To force a way inside, it gathered its power against a junction of the Ward and released it in one catastrophic blast. The barrier held for an instant. Then a vast section shattered.',
        alt: 'Citizens of Aurelion look up at a violet-cyan crack in their glassy sky.',
      },
      {
        image: 'ch3-shatter',
        title: 'Cracks became doors',
        text: 'The blast tore open the worlds along the broken section. Across their skies, cracks became Rifts, and Rifts became doors. Farther away, the Ward still stood. Here, its shattered pieces were all that remained between home and the invasion.',
        alt: 'The Ward shatters into a storm of glowing glass as Rifts tear between worlds.',
      },
      {
        image: 'ch3-spill',
        title: 'Power from somewhere else',
        text: 'Creatures, machines and magic spilled across the thresholds. What the cards call Rift-crossed is exactly that: power that drifted in from another world.',
        alt: 'A vine-covered beast, shadow birds and a golden relic emerge into a machine-world street.',
      },
      {
        image: 'ch3-taken',
        title: 'The first to fall',
        text: 'The Wardens of the breached worlds tried to hold the broken edges. Vorthax reached through the Rifts and took them. They still guarded their shards, but no longer for their worlds. Now they guarded them for the Heart.',
        alt: 'The robed guardian kneels as violet tendrils corrupt its once-golden light.',
      },
    ],
  },
  {
    id: 'riftwalkers',
    title: 'The Riftwalkers',
    subtitle: 'Champions of their own worlds.',
    panels: [
      {
        image: 'ch4-step',
        title: 'Those who can cross',
        text: 'Most who enter a Rift come out wrong, or never return. A rare few can walk the Rifts and live. These are the Riftwalkers.',
        alt: 'The default helmeted Knight steps toward a towering Rift, leaving a broken homeland behind.',
      },
      {
        image: 'ch4-champions',
        title: 'A home worth saving',
        text: 'Each comes from a world worth saving. The Knight carries its oaths, the Engineer its making, and the Hunter its hunger. Each is right about home, and in someone else’s way.',
        alt: 'The default Knight, respirator-wearing Engineer and Hunter stand on separate rocks across a Rift.',
      },
      {
        image: 'ch4-many',
        title: 'Lights in the dark',
        text: 'They carry what their worlds taught them into the space between. Not every traveler is an ally. Not every rival is a villain.',
        alt: 'Many small travelers carry their worlds’ lights along a floating path through the Far Rifts.',
      },
    ],
  },
  {
    id: 'shards',
    title: 'Shards and Rivals',
    subtitle: 'There are not enough shards for everyone.',
    panels: [
      {
        image: 'ch5-shard',
        title: 'A piece of the Ward',
        text: 'A Warden’s shard can seal a world again, or at least close the Rifts around it. But the shards are finite, and every breached world is bleeding.',
        alt: 'A gauntleted hand holds an iridescent Ward shard before a fallen Warden.',
      },
      {
        image: 'ch5-rivals',
        title: 'The Crossing',
        text: 'Saving home means taking a shard someone else needed. Where many Rifts meet, in the Crossing, Riftwalkers face one another. This is the Arena.',
        alt: 'The default masked Trickster and celestial Spellblade face each other over one shard.',
      },
      {
        image: 'ch5-echo',
        title: 'What the Rift remembers',
        text: 'The Rift keeps echoes of those who walked before: their decks, their habits, their battles. At the Crossing, these memories can take shape as ghostly opponents.',
        alt: 'A living Knight confronts its translucent violet Echo among floating cards.',
      },
    ],
  },
  {
    id: 'heart',
    title: 'The Heart of the Rift',
    subtitle: 'Every victory opens another question.',
    panels: [
      {
        image: 'ch6-sealed',
        title: 'A moment of silence',
        text: 'A shard closes a Rift. For a moment, the world is quiet. Then another tear opens, worse than before. The climb continues through twenty Rift Tiers.',
        alt: 'A Riftwalker seals one crack with a shard while new cracks open in the distance.',
      },
      {
        image: 'ch6-heart',
        title: 'Vorthax',
        text: 'At the centre of the shattered section waits Vorthax, the Heart of the Rift. It broke the Ward to enter the worlds, then made their Wardens its own. It fights with all their rules. Where it came from, and what it ultimately wants from the worlds it opened, remain unanswered.',
        alt: 'A vast hidden presence pulses faintly beneath an immense violet-cyan chasm.',
      },
    ],
  },
];
export interface LoreWorld {
  id: string;
  name: string;
  image: string;
  text: string;
  heroes: HeroId[];
  note?: string;
}
export const LORE_WORLDS: LoreWorld[] = [
  {
    id: 'aurelion',
    name: 'Aurelion',
    image: 'world-aurelion',
    text: 'Gilded light, cathedrals and oaths. Here, faith is a weapon.',
    heroes: ['knight', 'monk'],
  },
  {
    id: 'nexus',
    name: 'Nexus-9',
    image: 'world-nexus',
    text: 'Everything alive was built. Foundries burn, and storms are harnessed in totems.',
    heroes: ['engineer', 'shaman'],
  },
  {
    id: 'wyldmaw',
    name: 'Wyldmaw',
    image: 'world-wyldmaw',
    text: 'A world that eats: forests with teeth, packs and hunger.',
    heroes: ['hunter'],
  },
  {
    id: 'umbral',
    name: 'Umbral Veil',
    image: 'world-umbral',
    text: 'Shadow and masks, half theatre and half trap. Nothing is what it shows.',
    heroes: ['trickster', 'assassin'],
  },
  {
    id: 'starfall',
    name: 'The Hollow Crown',
    image: 'world-hollow-crown',
    text: 'A kingdom built on a fallen star, where spells are forged like blades.',
    heroes: ['spellblade'],
  },
  {
    id: 'gloomfen',
    name: 'Gloomfen',
    image: 'world-gloomfen',
    text: 'A drowned marsh where the dead do not stay down.',
    heroes: ['necromancer'],
  },
  {
    id: 'midden',
    name: 'The Midden',
    image: 'world-midden',
    text: 'The wreckage of broken worlds washes up here. Someone has made a home among it.',
    heroes: ['drunkard'],
    note: 'No Warden keeps the Midden.',
  },
  {
    id: 'beyond',
    name: 'The Far Rifts',
    image: 'world-far-rifts',
    text: 'The space between worlds, where the Ward broke worst.',
    heroes: [],
    note: 'No Riftwalker calls this place home.',
  },
];
export const loreImage = (id: string, small = false): string =>
  `${import.meta.env.BASE_URL}art/lore/${id}${small ? '-small' : ''}.webp`;
