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
    version: '0.101.0',
    date: '2026-10-27',
    title: 'Elements and the morning after',
    summary: 'Ilvane casts the Elements, KP drinks now and pays tomorrow, and every Warden leaves a Gift.',
    notes: [
      {
        kind: 'new',
        text: 'Ilvane: the Whittling build path is now Elements, lightning, ice, fire, water and earth spells that grow with Spirit. Gathering Storm grows every time you cast it, and the Legendary is Avatar of the Elements.',
      },
      {
        kind: 'new',
        text: 'KP: the Hangover build path is rebuilt around drinking. Drinks pay off now and leave a Hangover, HP you lose at the start of your next turn (never your last). Some cards hit harder the more you carry, Hair of the Dog and Sweat It Out clear it, and his heals grow with the HP you are missing.',
      },
      {
        kind: 'changed',
        text: 'The last Warden leaves a Gift too, and a Warden’s Gift always has cards.',
      },
      {
        kind: 'balance',
        text: 'Ilvane: the Bear totem gives 2 Barrier at the end of your turn (was 1).',
      },
      {
        kind: 'fixed',
        text: 'Leaderboard: a run could be left off the board after a busy day of play. Only recorded runs count against the limits now.',
      },
      {
        kind: 'fixed',
        text: 'Devotion costs show a ⚜ (the old cross read like a plus).',
      },
    ],
    heads:
      'The rules changed: reload if the game asks you to. Arena games and replays from before this version can no longer be watched. Retired cards in saved decks are swapped for their replacements.',
  },
  {
    version: '0.100.0',
    date: '2026-10-27',
    title: 'Shields you can see',
    summary:
      'Shielded units glow inside a yellow bubble, Fortified no longer stacks, and Valeria’s Sunfall and Sunforged Edge spend all her Devotion.',
    notes: [
      {
        kind: 'new',
        text: 'A Shielded unit (yours or an enemy) glows inside a yellow bubble until the shield is spent.',
      },
      {
        kind: 'changed',
        text: 'Fortified is on or off: a second source adds nothing, and cards say "Gain Fortified".',
      },
      {
        kind: 'balance',
        text: 'Valeria: Sunfall deals 10 (+2 per Devotion) and Sunforged Edge 6 (+1 per Devotion); both spend all your Devotion, with no minimum.',
      },
      {
        kind: 'balance',
        text: 'Valeria: Unbroken Wall (Fortified for the fight) costs 3, 2 upgraded. Retribution costs 2, 1 upgraded (its upgrade used to deal 3 more).',
      },
      {
        kind: 'fixed',
        text: 'The Devotion counter beside your Mana reads its whole name.',
      },
    ],
    heads:
      'The rules changed: reload if the game asks you to. Arena games and replays from before this version can no longer be watched.',
  },
  {
    version: '0.99.0',
    date: '2026-10-27',
    title: 'Tidier screens',
    summary:
      'The campaign header fits smaller screens, the Brass Reel shows its card choices side by side, and the build path moves to the bottom of the card.',
    notes: [
      {
        kind: 'fixed',
        text: 'Spin to win: the three Rift-crossed cards on offer are laid out side by side instead of stacked.',
      },
      {
        kind: 'changed',
        text: 'The campaign header fits smaller screens: two lines on a laptop, three on a phone. Your Arena deck is now a small ⚔ badge beside Deck (hover it for the details).',
      },
      {
        kind: 'changed',
        text: 'The build path label sits at the bottom left of a card, and more cards have their own art again.',
      },
    ],
  },
  {
    version: '0.98.0',
    date: '2026-10-27',
    title: 'Rarer, deeper card pools',
    summary:
      'Every Riftwalker’s cards were rebuilt like a proper deckbuilder: more uncommons and rares, each split over the three build paths, near-duplicates gone and Legendaries that build a deck around them.',
    notes: [
      {
        kind: 'new',
        text: 'Every Riftwalker now has 20 commons, 30 uncommons, 25 rares and 3 Legendaries, split evenly over the three build paths, so a rare is a find that defines a build. Near-duplicate cards are gone, many cards are new, and a card that left the game turns into a similar card in any old run or deck.',
      },
      {
        kind: 'new',
        text: 'Kesh: the Feast build path is now Predator: gain Mana, draw hard and play many cards in one turn; its attacks grow with every card played that turn. New cards include Unbridled, Killing Spree, Bloodstorm, Rising Howl and the Legendary Apex Frenzy.',
      },
      {
        kind: 'changed',
        text: 'Legendaries reworked: each one builds a deck around its build path. Valeria’s Dawn’s Mercy turns every heal into a strike; Eye of the Storm, Shatterstorm, Grave Harvest, The Spirit Council, Masquerade, The Twelve-Gauge Opera and more do far more than a one-off burst.',
      },
      {
        kind: 'new',
        text: 'Cards show their build path at the top right of the art, and the card library can filter by build path.',
      },
      {
        kind: 'changed',
        text: 'Starting decks: each kit swaps in two uncommons and a common of its build path. Valeria’s Devotion kit can spend Devotion from the start (Hymn of Reckoning).',
      },
      {
        kind: 'changed',
        text: 'A deck holds at most 5 copies of a card, in a run and in the Arena (a Legendary is one of a kind).',
      },
      {
        kind: 'balance',
        text: 'Kesh no longer heals after a won fight or starts each fight with Might. Valeria’s Devotion shows beside her Mana, and new Devotion attacks join her: Hand of Justice, Consecrated Blade and Hand of God.',
      },
      {
        kind: 'changed',
        text: 'After a fight, Continue sits on top, with the replay options under it.',
      },
    ],
    heads:
      'The rules changed: reload if the game asks you to. Arena games and replays from before this version can no longer be watched.',
  },
  {
    version: '0.97.0',
    date: '2026-10-27',
    title: 'Valeria’s Devotion',
    summary:
      'Valeria’s healing build now pays off: every heal builds Devotion, and new cards cash it in for big hits.',
    notes: [
      {
        kind: 'new',
        text: 'Valeria: whenever she heals she gains that much Devotion, even at full HP, so no heal is wasted. Cards with a gold cost spend it: Lightbrand (5 Devotion: deal 14), Hymn of Reckoning (8 Devotion: 12 to every enemy) and Sunfall (10 Devotion: 2 damage for every Devotion you had, then it is all spent).',
      },
      {
        kind: 'changed',
        text: 'Sunforged Edge now grows with your Devotion (8, +1 per 2 Devotion). Last Stand counts as a Bulwark card.',
      },
      {
        kind: 'changed',
        text: 'Sanctified cards are final: the shrine’s chisel and the engraver no longer put a tag on a sanctified card.',
      },
    ],
    heads:
      'The rules changed: reload if the game asks you to. Arena games and replays from before this version can no longer be watched.',
  },
  {
    version: '0.96.0',
    date: '2026-10-27',
    title: 'Kesh’s pack, rebuilt for Overflow',
    summary:
      'Kesh’s summons are told apart, and her Hound is sturdy again now that minions can be overrun.',
    notes: [
      {
        kind: 'balance',
        text: 'Kesh: her Hound has 8 HP and hits for 4, and she can have 3 companions at once again. Litter is back: two Hounds for 2 Mana. Rally the Pack gives each of your allies 4 Barrier.',
      },
      {
        kind: 'balance',
        text: 'Kesh’s basics: Rend loses 2 HP, Blood Frenzy loses 1 HP, and Savage Bite deals 8 (10 upgraded).',
      },
      {
        kind: 'new',
        text: 'Kesh: Summon Pup (1 Mana, a Pup), Alpha Call now brings a 16 HP, 10 damage Alpha, and a new Dire Wolf card (3 Mana, 24 HP, 14 damage).',
      },
      {
        kind: 'changed',
        text: 'Den Mother is now an Aura: whenever an enemy kills one of your allies, it takes 15 damage (20 upgraded).',
      },
    ],
    heads:
      'The rules changed: reload if the game asks you to. Arena games and replays from before this version can no longer be watched.',
  },
  {
    version: '0.95.0',
    date: '2026-10-27',
    title: 'Overflow',
    summary: 'Cheap minions no longer block a whole big hit.',
    notes: [
      {
        kind: 'balance',
        text: 'Overflow: when a single attack kills one of your companions, all of the damage left over (after its Barrier and HP) carries through to you. A 14-damage hit on a 4 HP drone now sends 10 through. It works the same for your enemies’ companions in the Arena. Area attacks, Traps and Thorns are unchanged.',
      },
    ],
    heads:
      'The rules changed: reload if the game asks you to. Arena games and replays from before this version can no longer be watched.',
  },
  {
    version: '0.94.0',
    date: '2026-10-27',
    title: 'Everything on every device',
    summary:
      'Signed in, your run history, Arena match history and username follow you as your runs do; Devour hits harder.',
    notes: [
      {
        kind: 'new',
        text: 'Signed in on shatteredrifts.app, your run history (with the last fight to watch again), your Arena match history and your username appear on every device you sign in on.',
      },
      {
        kind: 'fixed',
        text: 'A run that ended on one device can no longer come back from another device that still had it open, and a device never drops a run it holds to make room for runs from your other devices.',
      },
      {
        kind: 'balance',
        text: 'Kesh: Devour deals 16 (was 14). Fell the Prey, its near twin, is switched off for now.',
      },
    ],
    heads:
      'The rules changed: reload if the game asks you to. Arena games and replays from before this version can no longer be watched.',
  },
  {
    version: '0.93.0',
    date: '2026-10-27',
    title: 'A smaller pack, Stun cards tidied',
    summary:
      'Kesh runs a smaller, frailer pack, and Stun cards apply only Stun, longer on rare ones.',
    notes: [
      {
        kind: 'balance',
        text: 'Kesh: she can have 2 companions at once (was 3). Her Hound has 5 HP and hits for 3, Savage Bite deals 6 (8 upgraded), and Feeding Time gives 3 max HP.',
      },
      {
        kind: 'balance',
        text: 'Kesh: Call Gnashlings is gone (a saved deck that held it, or Heel, gets Thick Hide), and Litter is switched off for now (a deck that has it keeps it).',
      },
      {
        kind: 'balance',
        text: 'Stun cards apply only Stun (no extra Exposed: Stun already counts as Exposed). Rare and Legendary ones Stun for 2 turns: Override Virus, Silencing Trap, The Perfect Trap, The Long Ambush. Cards now say how many turns.',
      },
    ],
    heads:
      'The rules changed: reload if the game asks you to. Arena games and replays from before this version can no longer be watched.',
  },
  {
    version: '0.92.0',
    date: '2026-10-27',
    title: 'Stun reworked, Kesh retuned',
    summary:
      'Stun no longer skips a turn, three uncommons shield your allies instead of making them act, and Kesh pays more HP with fewer free cards.',
    notes: [
      {
        kind: 'balance',
        text: 'Stun: nobody skips a turn any more. A Stunned unit counts as Exposed, Faltering and Brittle at once (takes 50% more attack damage, deals 25% less, gains 25% less Barrier) for 1 turn, or as many as the card says. It never adds to real Exposed, Faltering or Brittle, and a new Stun keeps the longer countdown.',
      },
      {
        kind: 'balance',
        text: 'Rally the Pack, Hamstring Slam and Second Death no longer make your allies act: each of your allies gains 3 Barrier instead.',
      },
      {
        kind: 'balance',
        text: 'Kesh: every card of hers that costs HP costs 1 more (she has Lifesteal now). Heel, Howl and Guard Dog are gone; a saved run or deck that holds one gets Call Gnashlings, Pack Tactics or Rend in its place.',
      },
    ],
    heads:
      'The rules changed: reload if the game asks you to. Arena games and replays from before this version can no longer be watched.',
  },
  {
    version: '0.91.0',
    date: '2026-10-27',
    title: 'Pick your deck, runs on every device',
    summary:
      'Choose your Arena deck after you are matched, before each game; your runs follow you to every device you sign in on; Kesh is toned down again.',
    notes: [
      {
        kind: 'new',
        text: 'Arena: every saved deck comes to the match. Once you are matched, you choose one before each game, of any Riftwalker, without seeing your opponent’s choice (they cannot see yours either). One deck is enough. Players are matched by Arena rank.',
      },
      {
        kind: 'new',
        text: 'Your runs follow you: sign in on shatteredrifts.app and the runs you have in progress appear on every device you sign in on. Open the game once on the device you played on, so its runs are sent up.',
      },
      {
        kind: 'balance',
        text: 'Kesh: her Hound has 8 HP. Her starting deck has Rend (Deal 9, lose 2 HP, gain 1 Might) instead of Guard Dog, and Savage Bite deals 8 (10 upgraded).',
      },
      {
        kind: 'balance',
        text: 'Stunned heroes: in the Arena and against a ghost Warden, a Stunned hero draws one card fewer at the start of their next turn. Companions and enemies still skip their next action.',
      },
    ],
    heads:
      'The rules changed: reload if the game asks you to. Arena games and replays from before this version can no longer be watched.',
  },
  {
    version: '0.90.0',
    date: '2026-10-27',
    title: 'Kesh, Auras and the Arena page',
    summary:
      'Kesh is toned down early, Auras say how long they last, the battle log shows more, and the Arena page shows who is queued.',
    notes: [
      {
        kind: 'balance',
        text: 'Kesh: the cards that call her pack bring a companion by their rarity: a Pup (6 HP) from Guard Dog and Heel, a Hound (10 HP) from Rally the Pack, a Pack Alpha (14 HP) from Alpha Call. Her companions share half her Might (rounded down), not all of it.',
      },
      {
        kind: 'balance',
        text: 'Cards that raise your maximum Mana (Deep Pockets and others) start paying on your next turn, not the turn you play them. Deep Pockets+ costs 3 again and has Hold and Opening hand.',
      },
      {
        kind: 'balance',
        text: 'Rift Resonance gives 1 Might, and 1 more every time your deck is reshuffled (it gave 2 Might once).',
      },
      {
        kind: 'balance',
        text: 'A run holds one Legendary Boon at most: once you have one, no other is offered.',
      },
      {
        kind: 'changed',
        text: 'Auras that give you a status once now say it lasts the rest of the fight, and cards that give you a status say "Gain" instead of "Apply".',
      },
      {
        kind: 'new',
        text: 'The battle log shows how hard an enemy move hits ("Gilded Squire uses Slash (9)") and the HP before and after every hit or heal.',
      },
      {
        kind: 'new',
        text: 'The Arena page shows how many players are looking for a match. Making or joining a friend’s room has its own panel, and the room code box shows its hint in full.',
      },
      {
        kind: 'changed',
        text: 'Hovering a card in the card library, your Grimoire or a deck shows its upgrade beside it. In the sandbox the book is no longer split by build path, and ticking Upgraded keeps your page.',
      },
      {
        kind: 'changed',
        text: 'Constructed decks are gone: the Arena only ever takes decks saved from a campaign run.',
      },
      {
        kind: 'changed',
        text: 'The campaign board’s last column, Status, says whether each run is Live, Fell or was Abandoned. An enemy’s intent counts its Vigor.',
      },
      {
        kind: 'fixed',
        text: 'Master Trapper, Gleeful Trapsmith and Curtain Call said "Snare": they say Trap now. Trap is bold on cards, with its note on hover.',
      },
    ],
    heads:
      'Cards and the rules changed: reload if the game asks you to. Arena games and replays from before this version can no longer be watched.',
  },
  {
    version: '0.89.0',
    date: '2026-10-26',
    title: 'Board status',
    summary:
      'The campaign board shows each player once per Riftwalker, and whether the run is still going.',
    notes: [
      {
        kind: 'changed',
        text: 'The campaign board lists each player once per Riftwalker, at their furthest run, and says whether that run is Live, Fell or was Abandoned.',
      },
    ],
  },
  {
    version: '0.88.0',
    date: '2026-10-26',
    title: 'Back on your feet',
    summary:
      'A retried fight starts with at least half your HP, and a clearer end-of-fight screen.',
    notes: [
      {
        kind: 'balance',
        text: 'Lose a fight with Resolve left and you retry it with at least half your max HP (or more, if you came in with more).',
      },
      {
        kind: 'changed',
        text: 'After a fight, Continue comes first and stands on its own; the recap, the board and the replay sit beside it.',
      },
      {
        kind: 'fixed',
        text: 'The Sharpen number on the hero can be read when the blade is sharpened.',
      },
    ],
  },
  {
    version: '0.87.0',
    date: '2026-10-26',
    title: 'Arcana unbound',
    summary: 'Obsidia gets cards paid in Arcana alone, and payoffs for spending it.',
    heads:
      'Arena games and replays from earlier versions can no longer be played or watched: the rules have changed.',
    notes: [
      {
        kind: 'balance',
        text: 'Arcane Bolt deals 12 (was 16).',
      },
      {
        kind: 'new',
        text: 'Obsidia: Spellbolt, Arcane Barrier, Falling Shards, Searing Ray and Crown Strike cost no Mana, only Arcana. Sigil of Scorch and Sigil of Glass now answer whenever you spend Arcana, and Honed Strike makes Arcana.',
      },
      {
        kind: 'changed',
        text: 'A card’s Arcana cost shows only on the card itself, not again in its text.',
      },
    ],
  },
  {
    version: '0.86.0',
    date: '2026-10-26',
    title: 'Kesh unleashed',
    summary: 'Kesh reworked, Lifesteal, companions that grow, and a tidier merchant.',
    heads:
      'Arena games and replays from earlier versions can no longer be played or watched: the rules have changed.',
    notes: [
      {
        kind: 'balance',
        text: 'Kesh: her companions share her Might, she heals 6 after every fight she wins, and her starting deck has Savage Bite (Lifesteal), Blood Frenzy (hits every enemy) and Guard Dog (a Hound and Barrier). Her self-damage cards pay off properly, and look-alike cards were pulled apart.',
      },
      {
        kind: 'new',
        text: 'Lifesteal: some attacks heal you a share of the HP they take off. Some of Kesh’s, Rivet’s and Dorian’s cards now raise a companion’s max HP instead of only shielding it.',
      },
      {
        kind: 'changed',
        text: 'The merchant has the same layout every visit: Leave the shop at the top, the cards in one row, and Potions, Boon and Services in three columns.',
      },
    ],
  },
  {
    version: '0.85.0',
    date: '2026-10-26',
    title: 'Spin To Win',
    summary:
      'A free first spin, replays you can trust, a tidier Arena, traits on show, and coloured arrows.',
    notes: [
      {
        kind: 'new',
        text: 'The Brass Reel is now Spin To Win, and the first spin at a reel is free. With Reduce motion on, the reel still spins (briefly) instead of jumping to the prize.',
      },
      {
        kind: 'new',
        text: 'Replays: a move counter and a Step button while paused, and a replay says from which move it no longer matches the real game (when the cards have changed since). A game the clock called can be watched again.',
      },
      {
        kind: 'changed',
        text: 'In the Arena the opponent’s piles, trait, Boons and Auras stack on their side without covering each other, and both Riftwalkers’ traits are shown during a fight.',
      },
      {
        kind: 'changed',
        text: 'Coloured arrows instead of triangles (sanctified cards, changed costs, Sharpen, buff and debuff intents). Traps are “triggered”. A held merchant card shows what it will cost next time.',
      },
      {
        kind: 'changed',
        text: 'The campaign board shows every run that made progress this week (or month). A ghost Warden is never your own deck.',
      },
      {
        kind: 'balance',
        text: 'Apex Maw heals 10 (+2 per Might); upgraded, it costs 2.',
      },
    ],
  },
  {
    version: '0.84.0',
    date: '2026-10-26',
    title: 'Tidier runs list',
    summary: 'Each run in progress is one box, with Abandon inside it.',
    notes: [
      {
        kind: 'changed',
        text: 'On the home page each run in progress is one box: Continue fills it, and Abandon (and the question that follows) sits inside it.',
      },
    ],
  },
  {
    version: '0.83.0',
    date: '2026-10-26',
    title: 'Ten runs at once',
    summary: 'Keep up to 10 runs going at the same time.',
    notes: [
      {
        kind: 'changed',
        text: 'You can have up to 10 runs in progress (was 3). With more than two, the home page lists them in a compact panel that scrolls, with how many slots you are using.',
      },
    ],
  },
  {
    version: '0.82.0',
    date: '2026-10-26',
    title: 'No hidden run slots',
    summary:
      'A saved run that cannot be loaded is shown on the home page instead of quietly taking a slot.',
    notes: [
      {
        kind: 'fixed',
        text: 'A saved run the game cannot load used to take one of your three run slots without being listed, so New Run said you were full. It now shows on the home page: copy it to send with a bug report, or remove it to free the slot.',
      },
    ],
  },
  {
    version: '0.81.0',
    date: '2026-10-26',
    title: 'Clearer choices',
    summary:
      'Event cards sit in their option, marked with what happens to them; a centred fight title.',
    notes: [
      {
        kind: 'changed',
        text: 'The cards an event option means sit inside its box: crossed out when they leave your deck, a Swap or Upgrade arrow to what they become, and a plus on a card you get. Options have a little more room between them.',
      },
      {
        kind: 'changed',
        text: 'The fight title sits in the middle of the screen.',
      },
      {
        kind: 'balance',
        text: 'Punishing Gale is one hit: deal 8 (+1 per Thorns) damage to ALL enemies.',
      },
    ],
  },
  {
    version: '0.80.0',
    date: '2026-10-26',
    title: 'Tidier corners',
    summary: 'Card-shaped piles, and the potions, Mana and draw pile lined up.',
    notes: [
      {
        kind: 'changed',
        text: 'The Draw, Discard and Consumed piles have the shape of a real card, so they read as stacks of card backs, and the potions, Mana and the Draw pile sit on one line.',
      },
    ],
  },
  {
    version: '0.79.0',
    date: '2026-10-26',
    title: 'Gentler Wardens',
    summary:
      'A lost Warden costs 1 Resolve, every boss fight shows what is at stake, and KP’s shells are retuned.',
    notes: [
      {
        kind: 'balance',
        text: 'Losing to a Warden costs 1 Resolve (an Elite still costs 2), so a Normal run survives one lost boss fight.',
      },
      {
        kind: 'new',
        text: 'Every Warden fight shows your Resolve and what a loss would leave, in red when a loss would end the run.',
      },
      {
        kind: 'balance',
        text: 'Ammo Dump adds 6 Buckshot Shells (was 8); upgraded, it adds 6 upgraded shells that deal 6 to every enemy. Fire in the Hole+ grows faster with your consumed cards (+2 per 3) instead of gaining flat damage.',
      },
    ],
  },
  {
    version: '0.78.0',
    date: '2026-10-26',
    title: 'No more mystery cards',
    summary: 'Events show the exact random cards they mean before you choose.',
    notes: [
      {
        kind: 'changed',
        text: 'An event option that trades, transforms, copies, gives, removes or upgrades a random card now shows the exact cards: what leaves your deck, and what you get. The Rift-crossed pilgrim shows your card and the one you would trade it for.',
      },
      {
        kind: 'changed',
        text: 'Links to the game now say what it is: a free roguelike deckbuilder card game in your browser.',
      },
    ],
  },
  {
    version: '0.77.0',
    date: '2026-10-26',
    title: 'Numbers you can read',
    summary:
      'Cards show the damage they will really deal, hit numbers hold still, cheaper upgrades for the big cards, and missing-HP cards behave in the Arena.',
    notes: [
      {
        kind: 'new',
        text: 'A damage number on a card in your hand shows what it will really deal: your Might, stance, Faltering, Sharpen and Edge counted, green when higher than printed and red when lower. Aim it at an enemy and their Exposed counts too; a card that could hit several enemies shows the range. A sharpened weapon shows its sharpened damage right on the card.',
      },
      {
        kind: 'changed',
        text: 'Damage (red), healing (green) and Barrier (blue) numbers are bigger and hold still while they fade; a hit that Barrier partly soaks shows both.',
      },
      {
        kind: 'balance',
        text: 'Cards that grow as you get hurt (Bar Stool, the window panes, Last Stand, Death or Glory and more) count the share of your HP missing, so they hit about the same in the campaign and no longer run away in the Arena.',
      },
      {
        kind: 'balance',
        text: 'Some upgrades make a big card cheaper instead of a little bigger: The Twelve-Gauge Opera+, Rift Collapse+, Bloodmoon Hunt+, The Great Pole+ and The Perfect Trap+ cost 2; Shatterstorm+, Cataclysm+ and Killing Glass+ need one less Arcana; Cataclysm Totem+ awakens your totems 3 times.',
      },
      {
        kind: 'changed',
        text: 'Bigger status numbers on the fighters, and a plain map legend.',
      },
    ],
  },
  {
    version: '0.76.0',
    date: '2026-10-26',
    title: 'Your deck at stake',
    summary:
      'Giving up mid-fight costs your Arena deck, no event forces a card on you, retuned card rewards, and shorter Arena games.',
    notes: [
      {
        kind: 'changed',
        text: 'A run saves its deck for the Arena as you go. Fall, or give up in the middle of a fight, and that deck leaves the Arena; give up anywhere else and it stays. Push deeper for a stronger deck, or stop and keep it.',
      },
      {
        kind: 'changed',
        text: 'When an event lays out three cards (the smuggler’s crate, cards from other worlds) you can take none of them.',
      },
      {
        kind: 'balance',
        text: 'Card rewards: each card after a fight is 55% common, 35% uncommon, 9% rare and 1% Legendary; after an Elite 35 / 42 / 20 / 3. Card luck is gone: everyone has the same odds.',
      },
      {
        kind: 'balance',
        text: 'Each Arena game is called at 15 minutes (was 20).',
      },
      {
        kind: 'changed',
        text: 'Decks are "saved" for the Arena (no more "banked"). Event options have bigger text. The Sandbox picks a Riftwalker like the home page does, and its card book fills the window.',
      },
    ],
  },
  {
    version: '0.75.0',
    date: '2026-10-26',
    title: 'Gentler start',
    summary: 'Tier I enemies have less HP, and multi-hit attacks behave when their target falls.',
    notes: [
      {
        kind: 'balance',
        text: 'Tier I enemies start at 125% HP (was 150%); every Tier up still adds +50%.',
      },
      {
        kind: 'fixed',
        text: 'An enemy whose multi-hit attack kills its target spends the hits it has left on a new one by its usual way of choosing, so an 8x3 that fells your minion in two hits still lands its third on you.',
      },
    ],
  },
  {
    version: '0.74.0',
    date: '2026-10-26',
    title: 'Readable allies, quieter map',
    summary:
      'Allies show what they will do, the map keeps who you will fight a secret, and the Rift Tiers are retuned.',
    notes: [
      {
        kind: 'new',
        text: 'Every ally and minion wears a small badge with what it does at the end of its side’s turn and how much damage it will deal to the front enemy (Might, Weak and Exposed counted), or "Stunned" when it will skip.',
      },
      {
        kind: 'changed',
        text: 'The map only says Duel or Elite until you arrive, and a ghost Warden in the campaign never says whose deck it is.',
      },
      {
        kind: 'balance',
        text: 'Rift Tiers retuned: Tier I enemies start at 150% HP and 100% damage, and every Tier up adds +50% HP and +20% damage (+12% HP and +5% damage each stage).',
      },
    ],
  },
  {
    version: '0.73.0',
    date: '2026-10-26',
    title: 'Even tiers, smarter ghosts',
    summary:
      'Rift Tiers climb by the same step every time, ghost decks think through their turn, and legendary Boons stand out.',
    notes: [
      {
        kind: 'balance',
        text: 'Rift Tiers climb evenly: Tier I enemies start at 175% HP and 120% damage, and every Tier up adds the same +50% HP and +15% damage, all the way to Tier XX. How to play shows the table.',
      },
      {
        kind: 'changed',
        text: 'Ghost decks (Arena ghosts and ghost Wardens) play smarter: they think through the end of their turn, their allies, Traps and end-of-turn effects, before picking their cards.',
      },
      {
        kind: 'changed',
        text: 'Legendary Boons glow crimson instead of gold, so they never look like a common one.',
      },
    ],
  },
  {
    version: '0.72.0',
    date: '2026-10-26',
    title: 'Weapons and tougher foes',
    summary:
      'Heroes strike with their own weapons, the card you play sits by the discard pile, and every enemy has more HP.',
    notes: [
      {
        kind: 'new',
        text: 'Heroes strike with their own weapons: KP swings his hammer or fires the Old Twelve Gauge with a muzzle flash, Valeria cuts with her sword or bashes with her shield, Sylas throws his knife, and everyone else has theirs, with dust, sparks and spirit swirls where the blow lands.',
      },
      {
        kind: 'changed',
        text: 'The card you play shows beside the discard pile instead of over the arena, and the Draw, Discard and Consumed piles wear card backs.',
      },
      {
        kind: 'balance',
        text: 'Every enemy has 50% more HP at every Rift Tier.',
      },
    ],
  },
  {
    version: '0.71.0',
    date: '2026-10-26',
    title: 'Every Arena game ends',
    summary:
      'Sudden death from Turn 51 and a 20-minute clock for each Arena game. No more blank cards.',
    heads: 'An Arena game in progress when this version arrived was ended as a draw.',
    notes: [
      {
        kind: 'new',
        text: 'Sudden death in the Arena: from Turn 51 both heroes lose more HP every turn (10, then 20, 30...), straight through Barrier and Shielded.',
      },
      {
        kind: 'new',
        text: 'Each Arena game has 20 minutes, shown under the turn clock. When it runs out the game goes to whoever has the larger share of their HP left.',
      },
      {
        kind: 'fixed',
        text: 'A card picture that fails to load shows the card’s painted art instead of a blank.',
      },
    ],
  },
  {
    version: '0.70.0',
    date: '2026-10-26',
    title: 'A harder Rift',
    summary:
      'Tier I is tougher and every tier climbs faster. New events trade your cards, Omens are in view, and Thorns are fairer.',
    notes: [
      {
        kind: 'balance',
        text: 'Tier I enemies have about 15% more HP and hit a little harder, and every Rift Tier after it climbs faster.',
      },
      {
        kind: 'new',
        text: 'Trades: new events melt two common Attacks (or bind two common Skills) into an uncommon of your choice, trade a rare for another, retrain a card that does not fit your build path, or step an uncommon up to a rare.',
      },
      {
        kind: 'new',
        text: 'The Threshold can trade Strikes or Defends for your pick of uncommon Attacks or Skills, or upgraded commons.',
      },
      {
        kind: 'new',
        text: 'In a campaign fight the Rift Tier’s Omens sit at the top right; in the Arena your opponent’s Auras and Boons show there.',
      },
      {
        kind: 'new',
        text: 'How to play lists every Omen and every Warden’s Heart. A fight’s title says its Rift Tier.',
      },
      {
        kind: 'changed',
        text: 'Sanctified cards show their changed numbers in green or red, and hovering one says what the roll changed.',
      },
      {
        kind: 'changed',
        text: 'Played cards are smaller (smaller still in replays). Potions stand above Mana with Arcana beside it. Notices no longer cover the run bar.',
      },
      {
        kind: 'fixed',
        text: 'Thorns only answer attacks: your Traps, Auras, totems and potions no longer hurt you when they hit an enemy with Thorns.',
      },
      {
        kind: 'fixed',
        text: 'Back to the result no longer jumps away when you point at it.',
      },
    ],
  },
  {
    version: '0.69.0',
    date: '2026-10-26',
    title: 'Three build paths for everyone',
    summary:
      'Every Riftwalker has three clear ways to build, a trait that helps all of them, and cards of our own.',
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
    ],
  },
  {
    version: '0.68.0',
    date: '2026-10-26',
    title: 'Fairer ghost Wardens',
    summary: 'Ghost Wardens come from your own tier or just below, and only when there is one.',
    notes: [
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
