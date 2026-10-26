// The patch notes (#/patch-notes): what changed from version to version, written for players. Newest first. Each version
// is a few short lines in a handful of kinds, so a play tester can see at a glance what to look at.
//
// What never goes in: anything that would help someone game the game. No server limits or anti-cheat checks, nothing about
// how the boards decide what counts, no hidden odds or how a choice is rolled, nothing about what a browser could see that it
// should not. Those stay in docs/DECISIONS.md.

export type NoteKind = 'new' | 'changed' | 'balance' | 'fixed';

export interface PatchNote {
  version: string;
  /** yyyy-mm-dd */
  date: string;
  /** a few words for the list */
  title: string;
  /** one line on what this patch is about */
  summary: string;
  notes: { kind: NoteKind; text: string }[];
  /** something play testers should know (an old replay that no longer plays, a reload) */
  heads?: string;
}

export const KIND_LABEL: Record<NoteKind, string> = {
  new: 'New',
  changed: 'Changed',
  balance: 'Balance',
  fixed: 'Fixed',
};

export const PATCH_NOTES: PatchNote[] = [
  {
    version: '0.68.0',
    date: '2026-10-26',
    title: 'Three build paths for everyone',
    summary:
      'Every Riftwalker has three clear ways to build, a trait that helps all of them, and cards of our own. Ghost Wardens are fairer.',
    heads:
      'Many cards changed what they do, so a replay of a fight from an older version may not play back the same way.',
    notes: [
      {
        kind: 'new',
        text: 'Build paths: the three ways each Riftwalker builds a deck are shown on the character picker.',
      },
      {
        kind: 'new',
        text: 'Ilvane builds through Totems, Whittling (small free Carvings that keep coming back) or Rites (Auras that pay whenever you play another Aura).',
      },
      {
        kind: 'changed',
        text: 'Sehra builds through Fury, Flow (every stance change pays) or Radiant. Vesper’s third build path is now Patience: hold your cards, keep your Mana, strike later.',
      },
      {
        kind: 'changed',
        text: 'New traits: Sylas gets a Sleeve Knife every turn, Vesper starts with Barrier and two extra cards and gains Barrier every turn, Sehra gains Fervor and Barrier whenever she enters a stance, Dorian curses an enemy whenever an ally dies or a card is consumed, and Obsidia sharpens her blade each turn.',
      },
      {
        kind: 'changed',
        text: 'Dozens of cards have new names and new effects. Your decks keep the same cards and art.',
      },
      {
        kind: 'balance',
        text: 'Ilvane, Sehra and Vesper are stronger, especially later in a run. Rivet’s Overdrive and Perpetual Motion cost 1 less; several of Vesper’s Traps hit harder.',
      },
      {
        kind: 'fixed',
        text: 'On phones the username panel fits the screen, and no page scrolls sideways.',
      },
      {
        kind: 'balance',
        text: 'A ghost Warden is never from a higher Rift Tier than yours, and never more than three tiers below it.',
      },
      {
        kind: 'changed',
        text: 'Whether a stage’s Warden is a ghost is settled as the stage begins: the map only says Ghost Warden when there is one to fight, and otherwise it is the usual Warden.',
      },
      {
        kind: 'changed',
        text: 'The Arena page no longer shows the Vault code box or the server setting. To bring your saved decks to another device, sign in.',
      },
      {
        kind: 'changed',
        text: 'Your username now sits at the top right of the home page. No username yet? Choose one right there. Open it to change your name or sign in.',
      },
    ],
  },
  {
    version: '0.67.0',
    date: '2026-10-26',
    title: 'One Arena, with ranks',
    summary: 'Ranks are simply part of the Arena.',
    notes: [
      {
        kind: 'changed',
        text: 'There is one Arena: every match against another player counts toward your Arena rank (Bronze to Diamond). Matches against ghosts are practice and never count.',
      },
      {
        kind: 'changed',
        text: 'The Arena page always shows your rank and the season, and the Leaderboards’ Arena tab opens on the season’s ranks, with the weekly and monthly win boards (the trophy races) beside them.',
      },
      {
        kind: 'changed',
        text: 'Leaderboards redesigned: pick Arena, Campaign or Ghosts, then the view (season ranks, this week, this month), with how long it has left beside it. What each board counts is folded away under “How this board works”.',
      },
      {
        kind: 'fixed',
        text: 'Long lines of text no longer stretch across wide screens, and introductions sit centred under their titles.',
      },
    ],
  },
  {
    version: '0.66.0',
    date: '2026-10-26',
    title: 'A tidier home page',
    summary: 'The home page’s smaller links are now a grid of tiles.',
    notes: [
      {
        kind: 'changed',
        text: 'Saved decks, Run history, Trophy case, Leaderboards, Ghost decks, Card library, How to play and Patch notes are tiles with icons under the main menu. A green dot on Patch notes means there is something new to read.',
      },
    ],
  },
  {
    version: '0.65.0',
    date: '2026-10-26',
    title: 'Patch notes',
    summary: 'A page to see what changed from patch to patch.',
    notes: [
      {
        kind: 'new',
        text: 'Patch notes (on the home page): every patch, newest first, sorted into New, Changed, Balance and Fixed. The link says New until you have read the latest.',
      },
    ],
  },
  {
    version: '0.64.0',
    date: '2026-10-26',
    title: 'Rift Omens',
    summary: 'Every Rift Tier now changes how the run plays, and Wardens offer a Heart.',
    notes: [
      {
        kind: 'new',
        text: 'Rift Omens: every Rift Tier from II brings an Omen, they stack, and each one grows the deeper you go. Hover the Omens tag on the run bar to read them all.',
      },
      {
        kind: 'new',
        text: 'Second phases: from Tier II, elites and Wardens stop at half HP and rise with Barrier and Might. A red notch on the HP bar shows where.',
      },
      {
        kind: 'new',
        text: 'Warden’s Hearts: after a Warden, take a rare card, one of two Hearts, or nothing. A Heart changes every fight for the rest of the run, at a price. You hold one at a time.',
      },
      {
        kind: 'balance',
        text: 'Shrug It Off lessens every debuff by 1 or 25%, Steady Nerves by 2 or 50% (whichever is more). Purging Light still clears them all.',
      },
      {
        kind: 'balance',
        text: 'Old Twelve Gauge: Point Blank, 25% more damage when only one enemy is left.',
      },
      {
        kind: 'changed',
        text: 'Attacks land on the target: fighters no longer run across the board. A sword cuts across the target, a hammer comes down on it.',
      },
      {
        kind: 'changed',
        text: 'Drag a card that needs a target up towards the enemies and it turns into the targeting arrow.',
      },
      {
        kind: 'changed',
        text: 'Fight layout: your Boons and Auras sit top left, potions beside the Mana, statuses are small round icons. Campaign buttons read View map, Forfeit, Abandon run.',
      },
      {
        kind: 'changed',
        text: 'Event chances that are not even spin a wheel with the right share of gold; only a 50% chance is a coin.',
      },
      {
        kind: 'fixed',
        text: 'Messages can always be dismissed and are never hidden behind other panels. Card costs use a clearer font (0 and 1 no longer look alike).',
      },
    ],
    heads:
      'Arena replays from before this version can no longer be watched, and a campaign fight left half-played may start again.',
  },
  {
    version: '0.63.0',
    date: '2026-10-26',
    title: 'Replays and ranks',
    summary: 'Look back at any fight, climb the Arena ranks, and share your matches.',
    notes: [
      {
        kind: 'new',
        text: 'After every fight: a recap (what hurt you most, the blow that ended it, your best turns), the whole battle log, and a replay at up to 4× speed.',
      },
      {
        kind: 'new',
        text: 'Run history: every run that has ended, with its deck and the last fight it played, to watch again.',
      },
      {
        kind: 'new',
        text: 'Arena ranks: Bronze, Silver, Gold, Platinum and Diamond. A season is a month, with a Ranked leaderboard.',
      },
      {
        kind: 'new',
        text: 'Arena replays can be shared by link for 30 days, and friends can be invited to watch a match live (your hand stays hidden).',
      },
      {
        kind: 'new',
        text: 'Constructed decks (preview): build an Arena deck card by card. The Constructed Arena is not open yet.',
      },
      {
        kind: 'changed',
        text: 'The merchant: one card on every table is on sale, a card for the build path your deck follows is always there, and card removal costs a little more each time.',
      },
      {
        kind: 'new',
        text: 'Offered cards say when they fit a build path your deck is following.',
      },
    ],
  },
  {
    version: '0.62.0',
    date: '2026-10-25',
    title: 'Trophies',
    summary: 'Weekly and monthly Arena trophies, a Store page, and new events.',
    notes: [
      {
        kind: 'new',
        text: 'Arena trophies: finish a week or a month in the top 100 for a silver or gold cup. They show beside your name, and the Trophy case keeps them.',
      },
      {
        kind: 'new',
        text: 'A Store page for cosmetics (coming soon; it will only ever be cosmetic).',
      },
      {
        kind: 'new',
        text: 'Seven new events, among them the reliquary of legends: trade your Legendary for another.',
      },
      { kind: 'changed', text: 'Ghost Wardens are marked on the map.' },
      {
        kind: 'balance',
        text: 'One Legendary and two Ancestral cards per deck. Decks that already hold more keep them, but the Arena takes only decks within the limits.',
      },
    ],
  },
  {
    version: '0.61.0',
    date: '2026-10-25',
    title: 'The Gambler’s Shrine',
    summary: 'A new Shrine for deep runs, and longer Arena matches.',
    notes: [
      {
        kind: 'new',
        text: 'The Gambler’s Shrine (Tier VI and up): two different blessings from seven, including wagers like Sacrifice, Loaded Dice, the Chisel and the Ledger.',
      },
      { kind: 'changed', text: 'You can walk away from any Shrine.' },
      {
        kind: 'balance',
        text: 'Arena: every Riftwalker has 6× their HP (damage unchanged), going second gives +60 HP, and Boons stay out of the Arena.',
      },
      {
        kind: 'balance',
        text: 'Fevered Communion gives 2 Spirit (3 upgraded); Blood Tithe+ draws 3 and loses 4 HP; entering Radiant gives 1 Mana.',
      },
      {
        kind: 'balance',
        text: 'Enemies a little tougher on every tier. Ghost Wardens grow with the tier, and every Warden you beat gives you Max HP.',
      },
      { kind: 'changed', text: 'Only decks that have cleared Tier 3 become ghosts.' },
    ],
  },
  {
    version: '0.60.0',
    date: '2026-10-25',
    title: 'Clearer events',
    summary: 'Events say which card they take.',
    notes: [
      { kind: 'changed', text: 'An event that removes a card names the card it takes.' },
      {
        kind: 'changed',
        text: 'Sanctified cards can be removed, and show each number their roll changed.',
      },
    ],
  },
  {
    version: '0.59.0',
    date: '2026-10-25',
    title: 'A steeper climb',
    summary: 'Harder from the first stage, and every tier harder than the last.',
    notes: [
      {
        kind: 'balance',
        text: 'Tier I is harder, and each Rift Tier climbs more steeply: every stage is harder than the one before.',
      },
      { kind: 'changed', text: 'Every run shows on the campaign board from its first fight.' },
      {
        kind: 'changed',
        text: 'Ghost Wardens come from decks near your tier, never the same one twice in a run, and say so when they appear. A ghost deck stays even after its run collapses.',
      },
    ],
  },
  {
    version: '0.58.0',
    date: '2026-10-25',
    title: 'Events pass',
    summary: 'Fewer Boons, more meaningful event choices.',
    notes: [
      {
        kind: 'balance',
        text: 'Boons are rarer: Wardens no longer give one. Legendary Boons are the rarest of all.',
      },
      {
        kind: 'new',
        text: 'Events can tag a card with Hold, Opening hand or Flare, and more events let you choose the card.',
      },
      { kind: 'new', text: 'Some events start a fight that pays spoils on top of the reward.' },
      {
        kind: 'fixed',
        text: 'Sanctified and engraved cards work everywhere, Arena and ghost Wardens included.',
      },
      { kind: 'fixed', text: 'The Brass Reel looks right in a run.' },
    ],
  },
  {
    version: '0.57.0',
    date: '2026-10-25',
    title: 'Threshold and Waymarks',
    summary: 'Better choices between stages.',
    notes: [
      {
        kind: 'changed',
        text: 'Cards at the Threshold and Waymarks are a choice of three from your own class, and upgrades hit your own cards.',
      },
      {
        kind: 'balance',
        text: 'Resolve is offered only when you are missing some, and bargains pay clearly more.',
      },
    ],
  },
  {
    version: '0.56.0',
    date: '2026-10-25',
    title: 'Balance audit',
    summary: 'Numbers brought in line across the board.',
    notes: [
      {
        kind: 'balance',
        text: 'Riftwalker HP 70 to 88, enemies at sensible Tier I values, and a clear table of how much each tier adds.',
      },
      {
        kind: 'balance',
        text: 'Fervor reaches Radiant at 10, Serene gives its Mana once a turn, and cards that double things are capped.',
      },
      {
        kind: 'new',
        text: 'The Brass Reel: pay 25 shards a spin, take the prize or spin again.',
      },
    ],
  },
  {
    version: '0.55.0',
    date: '2026-10-25',
    title: 'Decks save themselves',
    summary: 'Your run’s deck is in the Arena without asking.',
    notes: [
      { kind: 'new', text: 'Your deck saves to the Arena by itself after every fight.' },
      { kind: 'new', text: 'Ambush events, and a notice whenever a card is upgraded.' },
      { kind: 'changed', text: 'The merchant upgrades cards, and Foresee draws a card.' },
    ],
  },
];

const SEEN_KEY = 'sr.patchNotesSeen';

/** The newest version the player has opened the patch notes for (null if never). */
export function seenVersion(): string | null {
  try {
    return localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
}

/** The player has read the newest notes. */
export function markSeen(): void {
  try {
    const top = PATCH_NOTES[0];
    if (top) localStorage.setItem(SEEN_KEY, top.version);
  } catch {
    /* it will say "new" again */
  }
}

/** There are notes the player has not opened yet. */
export const hasUnread = (): boolean => {
  const top = PATCH_NOTES[0];
  return !!top && seenVersion() !== top.version;
};
