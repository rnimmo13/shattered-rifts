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
  introduction?: string[];
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
    introduction: [
      'Vorthax was the most powerful being his realm had ever produced. Over centuries, he crushed its kingdoms, destroyed rival powers and claimed their knowledge. His people survived by obeying. Then his experiments revealed other realms beyond the Ward: unfamiliar magic and rulers who had never heard his name.',
      "He wanted their power and could not tolerate being kept outside. He spent years forcing a breach through his own boundary, consuming his realm's resources and sacrificing entire cities. When he finally broke out, he found where the Ward joined around neighboring worlds.",
    ],
    panels: [
      {
        image: 'ch3-crack',
        title: 'The first crack',
        text: 'Vorthax struck from the space between worlds. He gathered his power against one junction of the Ward and released it in a catastrophic blast. The barrier held for an instant. Then a vast section shattered, opening the neighboring worlds to his conquest. That attack was the Shattering.',
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
        text: "The Wardens tried to hold the broken edges. Vorthax reached through the Rifts and took them. Through their bonds to their worlds, he discovered how to claim those worlds' laws. He kept them as servants, guarding their shards for the Heart and giving him powers his own realm had never held.",
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
        text: 'Vorthax had no equal in his own realm. Beyond it, there are powers he has not mastered. Riftwalkers carry those powers across the boundaries, combining them in ways he did not anticipate. Each has a different home to save. Together, their worlds hold the means to challenge him.',
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
    subtitle:
      'He broke the sky because it was the last thing in his world that would not obey him.',
    panels: [
      {
        image: 'ch6-sealed',
        title: 'A moment of silence',
        text: "A shard closes a Rift. For a moment, the world is quiet. But a sealed Rift cuts off Vorthax's reach, and he tears another open, worse than before. The climb continues through the realms, deeper into the territory he has taken.",
        alt: 'A Riftwalker seals one crack with a shard while new cracks open in the distance.',
      },
      {
        image: 'ch6-heart',
        title: 'Vorthax',
        text: 'At the centre of the shattered section waits Vorthax, the Heart of the Rift. He fights with the rules of the Wardens he has taken. The broken worlds are his first foothold. He intends to breach more realms, seize their powers and make every world answer to him.',
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
