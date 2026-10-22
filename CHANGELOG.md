# Changelog

Player-visible changes, newest first. Format loosely follows [Keep a Changelog](https://keepachangelog.com).

## [Unreleased]

### Added
- **The hand and the cards (preview):** cards with realm-coloured frames and rarity treatments (rare shimmer, epic glint,
  legendary holo foil with an edge glow, mythic prism). Your hand fans out; hovering lifts and tilts a card toward the
  cursor, and dragging shows a curved targeting arrow, lights valid slots and dims the rest. Playable cards glow,
  unaffordable ones fade. Try it from "Enter the battlefield".
- **The battlefield (first look):** a painted-style dark-fantasy arena: a rift tearing through the sky, floating
  ruins, a perspective stone floor with glowing cracks and a pulsing Rift line, drifting fog, rising rift motes,
  and rune-circle slots for units and traps that glow when a card can be played there. Includes a "reduced
  effects" setting and respects "reduce motion". Open it from the title screen ("Enter the battlefield").
- **Smarter opponents:** the AI now plans: it develops its board, attacks when it's favourable, holds back from
  attacking into set traps when you're holding Mana, and springs its own traps at good moments. It has
  personalities (aggressive, controlling, trappy, novice). `pnpm duel` uses it by default (`--ai random` for the old one).
- **The whole Core Set:** all 74 cards, plus the 12 Warden signature cards (Seraphine's Oath, Override Virus,
  Nyxara's Web and more), are in the engine and tested.
- **Enemies:** 12 regular duelists, 8 Elites, the 4 Wardens and Vorthax have decks.
- **Playable terminal duel** (`pnpm duel`): play a full duel against a random AI with any of the four
  characters' starters, including traps, the Chain, Ambush flips and character Sigils.
- All 40 Core Set Commons, plus the Drone, Larva, Lurker and Rift Ravager tokens and Rift Spark.
- Four Riftwalkers with Sigils: **Oathbound** (Maren), **Spare Parts** (Rivet), **Pack Hunger** (Kesh),
  **Sleight** (Vesper).
- Placeholder title screen with the four Riftwalkers: Ser Maren Ashcourt, Rivet, Kesh the Unfed, and a locked
  fourth.

### Changed
- The campaign is now a Slay-the-Spire-style run: pick a character, grow your deck over five stages, then
  **Bank** it for PvP or **Continue** one Rift Tier deeper and risk it. Decks are seasonal (weekly); characters,
  unlocks and cosmetics are permanent.
