# Changelog

Player-visible changes, newest first. Format loosely follows [Keep a Changelog](https://keepachangelog.com).

## [Unreleased]

### Changed (the big one)
- **Combat is rebuilt like Slay the Spire.** Your Riftwalker is a fighter on the field with HP; you play cards with Mana (3 a turn,
  a 5-card hand); every enemy shows what it will do next as an icon and a number; Barrier soaks damage until your next turn; and
  fights are side to side, your hero and companions on the left, the enemies on the right. With one possible target a card just
  plays: no aiming. Companions fight for you (Rivet's drones, Kesh's Hound) or buff you; Maren and Vesper go without. Traps became
  Snares: face-down sigils that spring on their own when the enemy attacks, summons, or hurts you.
- **Runs carry HP between fights.** Win a fight and you keep the HP you ended with; shrines heal, upgrade a card (Temper) or remove
  one. Losing a fight costs Resolve and you retry at the HP you entered with. Maps, rewards, the merchant, Wardens and Bank/Continue
  are the same shape as before.
- 4 Riftwalkers, about 80 cards (each with a "+" version), 12 companions and 26 encounters including all four Wardens and Vorthax.
  The old duel (Essence, slots, the Chain) and its practice mode are gone; `#/fight` is the new practice fight.

### Added
- **Faster, snappier fights (Slay the Spire 2 pacing).** Attacks, summons, deaths, trap reveals and spell flourishes are
  all much shorter, and the default animation speed is now 1.5x (Settings offers 1x, 1.5x, 2x and 4x and remembers
  your choice). Spell cards no longer hold the board: they fly in and fade while the next thing already happens. And
  your own actions never wait for animations: you can play your next card, attack, or end your turn while the last
  play is still animating. (The enemy still waits its turn so you can follow what it does.)
- **You can see the Riftwalkers.** Your character stands at the front left of the battlefield and the enemy at the back
  right, each with a glowing aura. They breathe, flinch when they take damage, swell when they cast a spell, and the
  loser crumples when the duel ends. The enemy Riftwalker lights up when you can attack them: click them (or their
  portrait) to hit them directly.
- **Card frames** now have a round cost orb at the top left and a centred name banner.
- **Juice pass.** Hits now land with weight: the screen shakes in proportion to the damage, big blows freeze the game
  for a beat (hit-stop), struck monsters throw sparks and bigger damage numbers, and taking damage washes the screen red.
  Essence bars trail a pale "ghost" so you can see what you just lost, numbers pop when they change, and the turn
  banner sweeps in. There is now sound (all synthesized, no files): summons, attacks, hits, deaths, spells, trap
  reveals, turn changes and a win/lose fanfare, with a Sound toggle and Volume slider in Settings. The 1x/2x/4x speed
  setting now speeds up the animations too, not just the pauses between them.
- **Interface polish.** The duel has a proper opponent and player panel (crest, Essence bar, Mana crystals), an
  always-visible "Your turn / Enemy turn" pill and a titled log. The opening hand always fits on one row. The Sanctum
  and practice setup are centred and show each Riftwalker's Sigil, playstyle and full starter deck. The stage map is
  larger, tinted by realm, and has a legend. The title screen shows all four Riftwalkers and leads with Begin Run.
- **Bigger card text, "this unit can act" arrows, and no more target menus.** Card rules text is much larger
  (and the art window shorter to make room). Your units that can attack or use an ability now show a pulsing
  light at their feet and a bobbing arrow above. Targeted spells now cast the moment you drop them on a valid
  target; drop one above the hand instead and the valid targets glow so you can just click one. Choices that
  used to be a list (a unit's "when summoned" target, a trap or ability's target) work the same way: click the
  glowing target and it goes. Response windows no longer list the spells in your hand; drag them instead.
- **The campaign (first playable run):** "Begin Run" now starts a real run. Pick a Riftwalker, walk a five-stage map
  (duels, elites, events, shrines, a merchant, and a Warden at the end of each stage), win duels to earn shards and a
  card reward (take one of three, or skip), spend shards at the merchant, rest or trim your deck at shrines, take the
  Warden's Gift, and face Vorthax in stage five. Lose a duel and you lose Resolve; lose it all and the run collapses.
  Clear the loop and choose to Bank the deck or Continue one Rift Tier deeper. Your run autosaves in this browser and
  can be exported to a file and imported again. The difficulty is not tuned yet.
- **Easier to read and play:** hover any card in your hand or on the board to read it large on the left, with its HP,
  Damage, cost and a plain-language explanation of every keyword. HP is now on the left and Damage on the right
  (cards and units). A big **End turn** button sits bottom right (shortcut: E) and pulses when you have nothing left
  to play, plus a **How to play** guide. Card text now says HP and Damage.
- **Campaign engine (no screens yet):** the run rules are built and tested: five-stage maps, duels, elites, Wardens,
  card rewards with skip, shrines, the merchant, events, the Warden's Gift, Resolve, Bank or Continue and saves.
- **Duel the AI (first playable duel):** a full practice duel in the browser. Pick a Riftwalker and an opponent, keep or
  replace your opening hand, then play cards by dragging them onto the board, click your units to attack (click a
  glowing enemy or the enemy portrait), respond to the enemy with traps and Swift spells in response windows, and end
  your turn. The enemy AI answers, with every summon, attack, trap reveal and death animated in order. Includes a duel log,
  Mana and Essence displays, an animation speed setting, and a game-over screen.
- **Trap sigils and the reveal (preview):** set traps appear as glowing sealed sigils with a hovering card back. When one
  springs, the board dims and slows, the card flips over and flies to the centre with a light burst, its name flashes across
  the screen, and then the effect lands. Click a trap and press "Spring trap" to see it. Also: a site icon.
- **Monsters on the field (preview):** played units now stand on the battlefield as cut-outs of their card art with a
  ground shadow and attack/health badges. They breathe while idle, lunge when they attack, flash and recoil when hit
  (with floating damage numbers), and crack apart into rift particles when defeated. Click a monster and use the test
  buttons to see each animation. The board now sits above your hand so cards no longer cover the slots.
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
