# Changelog

Player-visible changes, newest first. Format loosely follows [Keep a Changelog](https://keepachangelog.com).

## [Unreleased]

### Added (newest)
- **Ancestral cards.** Twelve powerful cards that belong to no class (Ancestral Blade, Elder's Bulwark, Forebear's Gift, The Long Memory, Wrath of Ages, Unbroken Line...), with a jade-teal "ANCESTRAL" frame. One copy per deck, never in ordinary card rewards. They turn up in: the **Ancestors' Offering** event (take one for 12 HP), the Warden's Gift (sometimes), the merchant (rarely, 240 shards) and a new "Call on the Ancestors" bargain at the start of a run or stage.
- **Summon cards now say what you are getting**: "Summon Patrol Drone (7 HP). At the end of your turn it will: Deal 4 damage."
- **Every companion and enemy has its own model.** Units that used to be the same model with a different name now differ in colour, build, crown, horns, wings, weapon, glow and a chest emblem. (Dev page: #/models shows them all.)
- **Card library** (title screen, or #/cards): every card in the game in the grimoire, with search, character, type and rarity filters, and a switch between base cards, upgraded cards or both.
- **Rarity and upgrades you can read at a glance.** The name banner, the frame ring and the word on the type line (BASIC · COMMON · UNCOMMON · RARE · LEGENDARY) wear the rarity colour (silver, blue, gold, orange), and an upgraded card has a green name and a green UPGRADED ribbon.
- **Grimoire:** every copy of a card is its own card (no more stacked numbers), the book is laid out from the box it sits in so the pages no longer overlap, and the starting deck in the Sanctum shows large cards.
- **Bigger cards where you read them.** The grimoire (deck builder, deck view, piles) fills the window with cards up to 280 px wide, the merchant, rewards and starting-deck cards are about 40% larger, and the hover preview (including the upgraded version when you pick a card to upgrade) is 330 px.
- **Bigger text everywhere.** Names, HP and Barrier numbers, intents and every small label are larger (a 14px minimum in the UI), and statuses (buffs and debuffs) are big tinted icons with the number beside them: gold for good, red for bad. Hand cards are a little larger. The Snare tiles no longer cover the card you are hovering.
- **Fixed:** the Snare tiles drew on top of a hovered hand card.
- **Normal is tougher: 2 Resolve and about a third of runs clear** (Hard: 1 Resolve, one lost fight ends the run; Easy is unchanged). A lost duel costs 1 Resolve; a lost Elite or Warden costs 2.
- **Difficulty: Easy / Normal / Hard** (Normal is the default now). Easy is relaxed (weaker enemies, 5 Resolve, a few shards), Normal is the intended game, Hard has tougher enemies and only 2 Resolve. Enemies also get tougher as a run goes deeper (stage 1 is gentle, stage 5 is the real test).
- **Balance pass.** Snares that cancel an attack cost more or hit softer (Mirror Veil, Silencing Snare, Perfect Trap, Booby-Trapped Window...), the strongest defence cards were trimmed (Maren, Ilvane's Ward rune, KP), the weakest cards and characters were lifted, hero HP was evened out. See docs/BALANCE.md. Version 0.3.0.
- **Version 0.2.0**: the build label now reads v0.2.0 (new characters KP, traits, art pass, grimoire, legendaries, Mana tools).
- **Hand limit explained.** Your hand holds at most 10 cards (cards drawn beyond that go to the discard pile; added cards too). The draw-pile tooltip and the first tip now say so.
- **Innate traits.** Every Riftwalker has a passive they always have: Maren *Oathkeeper* (3 Barrier every turn), Rivet *Tinkerer* (heal 2 you and your companions each turn), Kesh *Pack Instinct* (start with 1 Might for the pack), Vesper *Ambusher* (enemies start Exposed), Quill *Weak Spot* (a random enemy is Exposed each turn), Ilvane *Attuned* (start with 1 Resonance), Sehra *Inner Fire* (start with 2 Fervor), Astra *Starborn* (1 Lumen each turn), Mire *Grave Chill* (enemies start with 2 Fate) and KP *Clutch Genes* (deals 50% more attack damage at or below half HP; a status shows when it is active). Shown on the character screens and when you hover your name in a fight.
- **Pick your character on the title screen**, then Begin Run or Practice fight starts with them (the Sanctum and practice setup open on your choice).
- **Snares are easy to see**: each face-down Snare is a violet trap tile on the floor in front of you with a web on it, a pulsing ring, and what sets it off written underneath.
- **Fixes:** maximum Mana shows correctly after Attunement and friends (and is capped at 6); Mana debt carries over instead of being forgiven; old saves keep working after the Twelve Gauge card was renamed.
- **Art pass.** Every Riftwalker has a hand-built figure (knight with a dawn shield, goggled engineer with a drone, hooded hunter with a drawn bow, masked trapper, knife-fan assassin, rune-ringed caster, barbarian with wrapped fists, star-crowned spellblade, lantern-bearing necromancer, and KP the short, fat, bald dwarf with a hammer and a window pane) and their own **character icon** (sun-shield, cog, bow, mask, daggers, rune ring, fist, star, skull, bottle and window) shown on the title screen, pickers, fight plates and the card book. Every card now shows a symbol for what it is about (a shell, a window pane, a bottle, a bell, a rune...) and its owner's emblem as a maker's mark.
- **Class colours.** Each Riftwalker's cards have their own ink, metal and glow (gold, teal, crimson, violet, pink, blue, amber, silver-indigo, green, rust) whatever realm they come from; Neutral is grey.
- **Hovering a card in a fight** lifts and grows it less, so the arena stays visible.
- **KP's Old Twelve Gauge.** KP starts each fight with a shotgun that hits every enemy (5, +1 per point of Sharpening) and stays in hand; eight Sharpen cards improve it for the fight (Rack the Slide, Powder Load, Hair Trigger: playing a shell sharpens it...). Snare icons now have real tooltips.
- **Mana tricks for everyone.** New op "maximum Mana" and Mana debt: Borrowed Time (3 Mana now, lose 2 next turn), Attunement (+1 max Mana), plus one or two Mana cards per Riftwalker (Steady Resolve, Overcharge, Blood Pact, Saved Breath, Light Fingers, Leyline Tap, Deep Breath, Borrowed Light, Soul Tithe, Liquid Lunch, Last Call).
- **A banner when you get a Boon.** A new Boon drops a banner onto the run screen with its medallion, name and effect.
- **Summon cards are unplayable when your companion slots are full** (3 allies). KP now has his own realm, The Midden. Kesh is a Hunter and Sehra a Barbarian.
- **KP, the Homeless Drunk** (Nexus-9, role Drunkard): a short, fat, bald dwarf with a hammer, a 12 gauge and a trolley of window panes. Lanes: Junk Traps (a few booby-trap Snares), Glass (Barrier and Thorns, then break it) and Shells (Buckshot Shells that hit every enemy, plus swigs and liquid courage). He says things. 42 cards including two legendaries. Art is a placeholder for now.
- **Legendary cards.** 20 new one-of-a-kind cards (two per Riftwalker, two Neutral): build-arounds like The Last Oath, Deck of a Thousand Knives, The Last Toll and Rift Collapse. Max one copy per deck, never in a starting deck, found rarely: elite fights (about 1%), the Warden's Gift (sometimes), the merchant (260 shards) and a new "A Legend's Price" bargain; Card luck makes them likelier.
- **Your deck, piles and starter decks are grimoires too** (run deck view, shrine upgrade/remove picks, the draw/discard/consume piles, the character picker). Rift Collapse costs 15 HP. A Warden may leave one extra legendary in its Gift.
- **The practice deck builder is now a grimoire.** An open book with real card visuals, one ribbon bookmark per realm (plus Neutral, Warden gifts, Tokens), cards grouped by character and rarity. Click a card to add a copy; chosen cards glow with a count, with − / + under each. Search reads the whole book; hover for a big preview.
- **Build number.** A small label in the bottom-right corner of every screen (and on the title screen) shows the version, the commit it was built from and when, e.g. `v0.1.0 · 44fc840 · 23 Oct 2026, 14:05`. Hover it for details. A `+` after the commit means the build had uncommitted changes. Please include it in bug reports.
- **Role tags.** Every Riftwalker now has a one-word role so you can tell at a glance what they are: Knight (Maren), Engineer (Rivet), Barbarian (Kesh), Trapper (Vesper), Assassin (Quill), Runecaster (Ilvane), Monk (Sehra), Spellblade (Astra), Necromancer (Mire).
- **Card luck setting.** On the Sanctum screen, choose Card luck: normal, lucky (about 2.5x as many rares in offers) or blessed (mostly rares). It also stocks the merchant with better cards. Great for testing strong decks; normal stays the designed game.
- **Tooltips everywhere.** Hover Barrier, HP, status chips, Mana, Lumen, runes, Auras, Snares and the card piles for a proper explanation. Keyword explanations now appear beside the card you are holding, and the big card preview on shop, reward and deck screens lists them too.
- **Boons and potions are clearer.** Boons are medallions with a symbol and a rich tooltip; potions are real flask icons coloured by what they do, on a labelled belt with three slots, so they cannot be mistaken for anything else.
- **A readable deck viewer** (cards at nearly twice the size) and a **tidier merchant**: cards with their price and a Buy button under each, then Potions, Boon and Services in aligned rows.
- **Fixed:** cards no longer twitch up and down when the pointer is near the bottom of a lifted card.
- **Practice fight deck builder.** Build any deck from every card in the game: any Riftwalker's cards, Neutral, Warden gifts, tokens, and upgraded (+) versions, with any number of copies. Filter by pool and rarity or search card text; start from your character's starter, clear it, or roll a random 20. You can also pick any Boons and up to three Potions. Perfect for trying every combination.
- **Choose your starting deck.** A run now opens with a choice between two semi-random starting decks. Each swaps three plain Slash/Guard cards of your usual starter for three of your own cards that lean the same way (Snares, Exposed, Fate, runes, companions, Lumen, stances...), and the two kits always lean differently. Then The Threshold follows.
- **Choices at the start of a run and of every stage.** Every run opens on **The Threshold**: three blessings (more max HP, a full purse, a free uncommon card, two upgrades, thinner deck, a potion, a trinket, extra Resolve) and one bargain with a price (a rare card for 12 HP, double the shards for a Wound, a Boon for max HP, three starter cards transformed, and more). Each new stage begins at a **Waymark** themed to its realm: a rest, two blessings, and sometimes a bargain. Offers are seeded, so a seed and your choices reproduce the run.
- **A ninth Riftwalker: Mire, the Gravewarden** (Gloomfen). Starts with a Bone Thrall and stacks **Doom** on enemies: when an enemy's turn ends with its HP at or below its Doom, it dies. Lanes: Doom, Thralls, and Ashes (consumed cards fuel her).
- **Many new card mechanics, shared across decks:** Bracing, Brittle, Ghostly, Steadfast, Armored, Ritual, Vigor, Twinned, Mirrored, Unbound, Fortified, Holdfast; temporary buffs, banking Mana and cards for next turn, discovering random cards, upgrading or cheapening your hand mid-fight, and copying a card.
- **Vocabulary pass 2:** Doom is now **Fate**, Ritual **Cadence**, Vigor **Primed**, Channel **Conjure** and Evoke **Release**.
- **Foresee is worth taking now:** cards it throws away count as real discards, so discard payoffs fire. Three new payoff Auras (Marked Cards, Reading the Signs, Star Chart).
- **Teaching:** one-time tips appear in fights the first time you meet something new (turn them off with the Tips button), each character shows how it plays on the picker, and a **How to play** page on the title screen lists every mechanic.
- **Balance pass:** Vesper, Astra and Mire strengthened; Rivet and Kesh starters trimmed so the nine characters are closer in strength (see docs/BALANCE.md).
- **Eight Riftwalkers.** Four new characters join Maren, Rivet, Kesh and Vesper: **Quill** (Sleeve Knives, Seared and discard tricks), **Ilvane** (runes that fire every turn and burst when evoked), **Sehra** (stances: Fury for burst, Serene for tempo, Fervor to Radiant) and **Astra** (Lumen and a Starforged Blade that every Sharpen improves for good).
- **Every character now has three card lanes** (about 35-40 cards each, over 300 in all) so reward screens are real choices, like Silent's poison, shivs and discard. Common tools (draw, Barrier, Scry, Exhaust) are shared; engines like Sleeve Knives, Runes, Stances and Lumen belong to one character each.
- **New card abilities:** choose cards to discard or exhaust, Scry, cards that scale with the board ("damage equal to your Barrier"), X-cost cards, Auras that trigger on events, Snares that spring when an enemy defends or when the enemy turn begins, and sacrificing an ally.
- **Choosing cards** opens a picker (discard, exhaust, scry); aiming a card now shows the exact damage it will do, scaling included.
- **A board panel** shows your Lumen, your row of runes (with their charge) and the Auras in play.

### Added (earlier)
- **Potions**: carry up to three, use them for free on your turn (Fire Flask, Guard Draught, Mana Vial, Frost Phial...). Fights can drop them and the merchant sells two.
- **Enemy move tooltips**: point at an enemy's intent to read what its move does. Aiming a card shows the damage it will deal. Hovering a card explains its keywords.
- **Readable cards**: the whole card shows in your hand, and each card has its own picture (a slash, a shield, a burst, the companion it summons).
- **Rewards arrive with a little ceremony**: screens fade in and cards deal in one at a time.
- **Easy mode** is the default for now (enemies at 60% HP and 55% damage, 5 Resolve, 100 shards) so the whole game can be tested quickly; Normal is one dropdown away on the Sanctum screen.
- **Boons**: 12 run-long passives (start fights with Barrier or Thorns, heal after fights, +1 Mana, a bigger hand, max HP...). Elites and Wardens drop them and the merchant sells one. They show in the run bar and during fights.
- **Warden signature cards**: each Warden (Seraphine, Kron, Gorrmaw, Nyxara) offers three unique cards as the Warden's Gift, some with their own companions.
- **New events**: a wandering smith who upgrades a random card, and a blood altar that trades HP for shards or a Boon.

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
