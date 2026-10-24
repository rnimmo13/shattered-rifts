# Changelog

Player-visible changes, newest first. Format loosely follows [Keep a Changelog](https://keepachangelog.com).

## [Unreleased]

### Added (newest)
- **One saved deck per run:** saving a run again replaces its earlier save instead of adding a second. Saved decks show Tier and Stage progress.
- **Card library:** the book shows many more cards at once, in one run sorted by rarity (rarest first) with no lane sections; page headers show character icons, realm tabs stay on one row, and cards show their character icon again (bottom left).
- **Saved decks page** is centred again.
- **PvP match screen:** player names (with their campaign progress, like "Tier 1 · Stage 2/3") stand above both characters, the opponent's totems and Consumed count are visible, and your Traps no longer overlap your totems.
- **Card art:** 139 more illustrated cards (batches 4 and 5, plus the first of batch 6), 535 in all.
- **Test build: save a deck at any time.** The Save deck button now works in every part of a run, so the Arena and deck saving can be tried freely. This is temporary.
- **Save a deck without ending the run, and park runs:** at the end of a Rift Tier you now choose Save this deck (a copy goes to your Vault, the run carries on), then Continue to the next tier or Leave it for now. The Save deck button in the run bar also works at the start of the next tier before its stage 1. Home takes you out of a run and leaves it parked: you can keep up to 3 unfinished runs and carry on any of them from the home page.
- **Test build: Save deck works at more points.** It is now enabled just before a new stage begins: after stage 1 or after stage 2, and on a Rift Tier beyond the first just before its stage 1 begins. Never in the middle of a stage.
- **Saved decks page:** a new Saved decks page (from the home page and the Arena) shows each saved deck like a post-game report: its Riftwalker, tier and date, the Boons it was saved with, and its cards by rarity, best first, as small cards with counts. Hover a card for a big copy. Decks can be removed there (with a confirmation). The Arena lists the same decks in short, with a View full deck link. Saved decks now remember their Boons, and their Boons are in effect in Arena matches. The Vault now holds 10 decks (was 5).
- **Test build: save a deck after stage 1.** The run bar's Save deck button (in place of Export run) copies your deck into the Vault, only on the Stage 1 cleared screen before stage 2 starts, so the Arena can be tried without finishing a whole run. The real game will only save decks when a Rift Tier is cleared.
- **Arena needs a saved deck:** the Riftwalker starting decks are gone from the Arena. With no banked deck the screen explains how to get one (win a run and choose Bank) and links to a New Run.
- **0.30.0:** save a deck without ending the run, park up to 3 runs, Home button.
- **0.29.0:** Save deck works after stage 1 and 2, and at the start of later Rift Tiers.
- **0.28.0:** a Saved decks page, Boons saved with decks and used in the Arena, and 10 deck slots.
- **0.27.0:** the Arena needs a banked deck, and the home page sign-in is spaced properly.
- **0.26.0:** a new home page (New Run, Arena, Practice, the Riftwalker on show) with sign-in.
- **0.25.0:** Sign in with Google.
- **Sign in with Google:** on shatteredrifts.app the Arena has a Sign in with Google button; your saved decks then follow your account to any device. No name or email is kept. Guests still use the Vault code.
- **0.24.0:** Vault online.
- **Vault online:** banked decks are now also saved on the server under a Vault code (shown in the Arena, with Copy), so your decks appear in the Arena on any device that has the code. The browser copy still works if the server can't be reached.
- **0.23.1:** PvP is now called the Arena.
- **0.23.0:** PvP (the Arena), the Vault for banked decks, no-overlap fighters, Devotion, copyable error screens and 396 illustrated cards.
- **The Arena (PvP, first test version):** bank a deck at the end of a run, then take it into a match from the title screen: Find a match (queue), or make a room and send the code to a friend. Turns alternate, each has a 75-second clock. Before a match both players choose to go first or go second with 10 more HP; if they choose the same, a coin flip decides. Needs the PvP server (see docs/11_PVP.md).
- **0.22.1:** more card art (396 cards), the grimoire size fix, Kesh's paw icon and Rivet's new look.
- **More card art:** 396 cards now have illustrated art (every Legendary, every Rare among the first batches, and many Uncommons). The rest keep their painted placeholders until their art arrives.
- **Rivet's new look:** a rustier, gas-masked engineer with a bigger wrench (the drone is still drawn as his companion).
- **Kesh's icon:** the hunter now wears a bold paw print (the thin bow was hard to read and she no longer carries one).
- **Grimoire size:** the card book no longer flashes small when you pick a filter, and on medium-width windows it shows one big page instead of two cramped ones.
- **0.22.0:** three-stage runs, no-overlap fighters, Devotion, copyable error screens, and the first batch of illustrated card art.
- **Card art:** 99 illustrated cards (every Riftwalker's Legendary and best Rare cards, plus the Neutral Ancestral cards). Other cards keep their painted placeholders until their art arrives.
- **Three stages, a bit longer:** a run is now three stages: two realms of seven floors and a Warden each, then the Rift, eight floors of the other two realms and Vorthax. (An older run saved past stage 3 can't be continued.)
- **No overlapping fighters:** each side's line is measured and spaced from the real figure sizes, with fliers tucked above or beside the others; a crowded side shrinks a little rather than overlapping.
- **Errors you can copy:** the error screens show the message in a box you can select, with a Copy button. A tab left open across an update now reloads itself once instead of showing \"Failed to fetch dynamically imported module\".
- **Devotion:** Valeria's heal-and-Shielded lane is renamed from Sanctified to Devotion (the Sanctum event keeps its name).
- **0.21.0:** grounded fighters and flyers, per-arena scenery, Traps, Attack and Defend, Sehra and Sylas, screen-fit fixes.
- **Fits the screen:** cards in your hand are a little smaller, a tall or flying monster's next move always stays on screen, and flyers no longer rise out of view.
- **Traps:** Snares are now called Traps everywhere you read them (card type, tips, shop and event text, card names).
- **Attack and Defend:** the basic cards every Riftwalker starts with are now simply called Attack and Defend.
- **Grounded fighters and flyers:** figures stand on the floor with a proper shadow; drones, spirits and other flyers hover above the line in their own row (with their health bars hanging under them), which makes room for bigger crowds. Potions moved above the Mana orb. Each arena sets out its scenery differently and keeps it on the floor.
- **Wider battlefield:** the two sides stand further apart, and a pack of wide creatures is drawn a little smaller so it no longer melts together.
- **Sehra and Sylas:** the stance fighter is called Sehra again (was Ragnar), and the knife rogue is Sylas (was Scarlet).
- **0.20.0:** illustrated models for every enemy, three Legendaries per Riftwalker.
- **Three Legendary cards per Riftwalker** (down from five): the two originals plus one of the 0.12.0 additions. A deck still holds at most two.
- **0.19.0:** painted arenas, companion art and new hero art.
- **New arenas:** six realms (Aurelion, Nexus-9, Wyldmaw, Umbral Veil, Gloomfen, the Rift) have painted backdrops with scenery that drifts with your mouse, glowing braziers and lanterns, and swaying banners; all eight realms have a new floor surface. The floor is still lit live and pulses along the Rift line.
- **Companion art:** the Nexus drones and machines, the Wyldmaw beasts, the Gilded Guard and the Gloomfen undead have illustrated figures (cut out by `tools/pack-arenas.ps1`).
- **New hero art:** all ten Riftwalkers now have cartoony illustrated figures in one bold-outline style (cut out by `tools/pack-heroes.ps1` from `assets-src/heroes`).
- **0.18.0:** per-hero attack animations and real art for nine Riftwalkers.
- **Attack animations:** every Riftwalker and most enemies attack in their own style (sword slashes, claw marks, stabs, heavy smashes, shotgun spreads, thrown knives, spell orbs). Cards and numbers are unchanged; Strike is still Strike.
- **0.17.0:** Valeria (the knight) with real art, trait balance (Plating, three-totem Ilvane, 1-Arcana Obsidia), The Hollow Crown.
- **Valeria** (the knight, formerly Maren) has real art: a blonde paladin in blue and gold plate with a sunburst shield.
- **The Glasswaste is now The Hollow Crown.**
- **Maren is now Valeria**, a woman in dawn-gold plate with ash-pale hair. Her trait is 6 Barrier and a new Plating that keeps it through the first turns (instead of 2 Barrier every turn); Ilvane starts with three totems (Hawk, Bear, Splinter) instead of 2 Spirit; Obsidia gains 1 Arcana a turn instead of 3.
- **0.16.0:** a castle, factory, forest, glass, swamp and alley stage per realm, real monster art for twelve enemies, mossy cave props, Boon and potion rarity gems, more credits.
- **Ghostwire** now is a one-eyed, tentacled horror (art by TheRealFusion, from the Jitsu-Koan collection).
- **Mossy cave:** the cave and swamp stages have swaying hanging fronds and plants, and the Acid Spitter, Maw Spawn and Hooded Acolyte are now a green slime, an orange slime and a little wizard (art by Maaot).
- **Real monster art:** eight enemies (Vorthax, Gorrmaw, Nyxara, the Whisperer, Packmother Ruhn, Feral Riftling, Bloated One and Choir of Silence) now use hand-inked illustrations by Tania Herrero.
- **A different place for every realm:** Aurelion fights are at a castle at sunset, Nexus-9 in a teal factory skyline, Wyldmaw in a pine forest, the Glasswaste against a glowing ember sky, Gloomfen in a swamp and the Midden in a back alley (Umbral Veil stays in the cave). Boons and potions show their rarity gem in rewards and shops.
- **0.15.0:** Credits page, How to play in two columns.
- **How to play** reads in two columns and every section is open: no more expanding Riftwalkers or totems one at a time.
- **Credits page:** the title screen footer links to a Credits page thanking the artists behind the cave, rarity gems, card backs and effects.
- **0.14.0:** cave stage, sprite effects (fire, frost, portals), and real art for rarity gems and card backs.
- **Cave stage:** fights in Umbral Veil and Gloomfen now take place in a hand-drawn cavern (rock walls, columns, glowing mushrooms, a cobbled cave floor) instead of the Rift arena.
- **Sprite effects:** big hits (10+) on enemies burst in flames, big Barrier gains (12+) flash with frost, and summoned allies step out of an arcane portal. Rarity gems and card-back piles now use real art.
- **0.13.0:** Balance pass for every Riftwalker, scene-based card art, rim-lit hero models.
- **Balance pass for every Riftwalker:** Kesh, Scarlet, Ragnar and Dorian are stronger (more HP, better Feast, knife, Mantra and Fate cards), Ilvane and Vesper have less HP, and a few cards that were far ahead (Aegis Eternal, Radiance Eternal, Scrap Heap) are toned down. Eternal Rage and Final Round are better.
- **Card art:** every character's cards are set in their own place (castle walls, a factory, a pine forest, glass spires, a swamp, a back alley...), each card's symbol sits differently, a second symbol shows what else it does, and Rare and Legendary cards shine.
- **Hero models:** every hero has a rim light in their own colour; Obsidia and Vesper have new faces and gloves.
- **0.12.0:** Astra is Obsidia and Ilvane is a totem-calling golem (new names, models and card names); five Legendaries per Riftwalker with a limit of two per deck; Fortified keeps 75% of Barrier.
- **Five Legendary cards per Riftwalker, but a deck holds only two at a time:** taking a Legendary now costs a slot, so it is a real choice. 30 new Legendaries, three for each Riftwalker.
- **Fortified is weaker:** it keeps 75% of your Barrier each turn instead of all of it.
- **New models:** Obsidia is a female obsidian villain whose Obsidian Blade floats beside her while she holds it; Ilvane is a stone golem who calls spirits through his totems.
- **Fixed:** the card preview in the upgrade picker no longer runs off the bottom of the screen.
- **Ilvane now calls spirits through totems:** runes are now totems (Hawk, Splinter, Bear, Elder, Owl), Release is Awaken, Resonance is Spirit, and every card has a new name. The cards still do the same things.
- **Astra is now Obsidia, the Glasswaste Spellblade:** a volcanic-glass spellblade. Lumen is now Arcana (an orange orb), the Starforged Blade is the Obsidian Blade, Constellations are Sigils, the realm is The Glasswaste, and every card has a new name. The cards still do the same things.
- **30 new events (50 in all):** a ferry, a bone collector, a locked reliquary, a pact with the Hollow, a wishing stone, a bell tower and more. Most are a choice between two deals (HP, shards, cards, potions, Boons, max HP), and an event never shows up if you could not afford its choices.
- **Starting kits are now three fixed choices, one per lane:** your usual starter with two plain cards swapped for two uncommon cards that show off the lane (for example Maren: Bulwark, Thorns or Sanctified). Same cards every run.
- **0.11.0:** The potion belt no longer overlaps the Lumen counter (it slides right of the orb for Lumen heroes).
- **0.10.0:** The stage map is centered and its hover glow is no longer cut off; the fight screen has an Abandon run button (with a confirmation), Forfeit says it cost Resolve, and enemy shields (Patrol Unit 44 and others) are no longer clipped.
- **0.9.0:** The Sanctum shows the chosen Riftwalker beside the tiles, and the Threshold draws from a bigger pool (17 blessings, 16 bargains).
- **0.8.0:** All ten hero models redrawn (Scarlet, Astra and Rivet are women; Quill is now Scarlet, the necromancer is Dorian Blackthorn), 30 new events (50 in all), three preset lane starter kits per hero, tougher Ilvane, Rivet, Vesper and KP.
- **How to play** is now tabs (Start here, A run, Combat, Card words, Statuses, Riftwalkers) with fold-away character entries instead of one long page.
- **0.7.0:** Rift Tiers stop at 20, and continuing a loop heals you fully.
- **0.6.0:** Sell potions to merchants for half price. Maren is now just "Maren" and the barbarian is Ragnar (was Sehra), the necromancer is Dorian Blackthorn (was Mire), and Quill, Astra and Ilvane Glyphwright have short names; potions sit by the Mana orb, Auras by your hero, and Thorns has a proper icon.
- **0.5.0:** X cards now upgrade to X+1. Weaker Riftwalkers (KP, Vesper, Astra, Mire, Quill) are tougher or hit harder; a few free-loop cards cost more or are Consumed. KP's lanes are Gun / Shells / Hangover.
- **About 90 cards per Riftwalker (was 70).** 221 new cards, 15-25 per character, spread across each lane with new rares and build-arounds (Maren's Tower Shield and Radiance Eternal, Rivet's Relay Network and Backup Core, Kesh's Pack Leader and Grave Hunger, Vesper's four new Snare triggers, Quill's Knife Storm and Compounding Interest, Ilvane's Echo Cascade, Sehra's Mantra Engine, Astra's constellations, Mire's Ominous Chimes and Soul Furnace, KP's Hot Brass and Glass Jaw).
- **Events read better:** the text is a narrow column and each choice is a card with a short headline and its price or reward underneath. The run bar and the fight title now show the floor you are on.
- **Home screen:** clicking a Riftwalker takes you straight to the Sanctum with them chosen.
- **About 70 cards per Riftwalker (was 45-55).** Roughly 230 new cards across all ten characters, with a spread of 20 common / 26 uncommon / 20 rare. Maren and Kesh now cover the Ironclad-style staples (Barrier engines, self-damage into Might, Exhaust engines), Quill and Vesper the Silent-style ones (Bleed, knives, discard tricks, Exposed, Snares), Astra the Regent-style Lumen and Blade, Ilvane the Defect-style rune toolkit, Mire the Necromancer-style Doom, Thralls and Ashes. Rivet, Sehra and KP got more depth and combos.
- **New combo hooks:** Powers can now react to gaining Barrier, losing HP to your own cards, drawing a card, or creating a card (Bastion Engine, Briar Heart, Scar Tissue, Armory of Light, Pillar of Light...). New effect: put a random card from your discard pile in your hand or on top of your draw pile (Scavenge, Meditate, Echo of Glyphs). New scaling: per card drawn or created this fight, per Skill played this turn.
- Normal enemies are a touch tougher (128% HP / 118% damage) to keep the bot's Normal clear rate near a third with the bigger card pools.
- **Every build now has at least 12 cards.** About 40 new cards fill out the thinner lanes of Maren, Rivet, Ilvane, Mire, Astra, Kesh, Vesper, Quill, Sehra and KP (for example Maren's Rampart, Citadel March, Caltrops, Bramble Storm and Radiant Renewal; Rivet's Overwatch, Grand Assembly and Forge Titan; Ilvane's Permafrost and Abyssal Glyph; Mire's Funeral Pyre and Ash Ritual; Astra's Celestial Edge). A test keeps every lane at 12 or more.
- Sehra is now called a barbarian everywhere (the old "monk" wording is gone from her blurb).
- **A new rune for Ilvane: Splinter.** It chips every enemy for 2 at the end of your turn and releases for 6 to every enemy. New cards: Splinter Cast, Prismatic Burst, Shard Chorus and the rare Glasswright (a Splinter every turn). Ilvane's HP is 74 (was 56).
- **Astra and Sehra are stronger.** Astra starts with 3 Lumen, gains 3 each turn and has a second Lumen Bolt in her starting deck; her Lumen spenders, Starforged Blade, Ray of Light and Cosmic Lance hit harder. Sehra has 104 HP (was 90). In the bot sim Astra went from 5% to about 23% of Normal runs and Sehra from 17% to about 33%.
- **Runes sit beside the hero** (in a curved column towards the enemies) instead of on top of the buffs under the health bar.
- **Enemies attack your minions first** (front-most first) and only then you. An enemy's own summons now stand in front of the summoner, never behind it. Because minions soak damage, Normal enemies are a little tougher (124% HP / 116% damage) and the companion heroes lost some HP (Rivet 46, Kesh 80, Mire 76) and Rivet's Tinkerer heals 1.
- **The map shows a Rift-crossed merchant** (a badge with that Riftwalker's icon, labelled "Stranger") before you walk to it, and **View map** during a fight opens the stage map. Maps are wider (2-4 choices per floor, more forks, a second Elite, a second Merchant and mid-map Shrines are possible) but stay five floors; **never more than two Events in a row** on any path.
- **Eight new events:** the drowned shoal (heal, or +6 max HP and a Wound), the rift healer (pay to heal or cleanse), the hot anvil (two cards upgraded for 12 HP), the wheel of the rift (gold, heal or a Wound), the gilded idol (120 shards, the roof falls), the bonfire spirits (burn a card for healing by rarity), the alchemist's bench (two potions) and the shifting wall (a basic card becomes a new card of your class).
- **Sanctify can leave a card alone** (about a fifth of cards are untouched; costs never change).
- **Shop rows redesigned:** name and price on top, the description below, the button full width at the bottom. The upgrade preview in the grimoire no longer runs off the right edge of the screen.
- **Every Riftwalker's three lanes are now shown in the grimoire.** Cards are grouped by character, then by lane ("Ser Maren Ashcourt · Bulwark"), then basic to legendary; the character picker shows how many cards each lane has. KP's lanes are now Gun, Shells and Hangover, and his glass cards scale with missing HP instead of Thorns, so Maren keeps Thorns to herself.
- **Mire can bring the dead back.** New cards: Grave Robbery and Bone Pile (return Consumed cards to your hand), Reanimate (a fallen Thrall returns with half its HP) and Death Feeds (each time a Thrall dies: Barrier and a card).
- **Rivet is sturdier:** 72 HP (was 58) and the Tinkerer heals 3 (was 2).
- **The class icon is gone from the lower-left of cards** (it hid the rules text).
- **Rift-crossed cards are rare:** the visiting merchant is 7.5% of merchants, 3% of ordinary card offers cross over, and a new event, "A traveller from another world", can leave you one.
- **A proper character icon on every card** (lower left): a dark plate with a ring and the Riftwalker's emblem in their colour, bigger than before so it reads at a glance. Neutral cards have none.
- Review fixes: a long line of enemies stays on the stage, an event's result is always shown, and a few save-safety and wording fixes.
- **More events, and a gamble: the Sanctum of Change.** Step into the white fire and your whole deck is *sanctified*: every card with numbers is re-rolled, roughly half 25% stronger and half 25% weaker, and you do not choose which. You can say no. (Idea borrowed from Path of Exile.) Rolled cards show a ▲ or ▼ and their changed numbers.
- **Eleven kinds of event now**, picked at random and weighted: the rift cache (its card is only sometimes on the table), the smith, the blood altar, the Ancestors' Offering, the Sanctum of Change, the gambler's table (bet 30 shards), a wounded traveller (help for a potion, or rob them for shards and a Wound), the whispering idol (a Boon for two Wounds), the whispering well (60% heal, 40% hurt), the mirror pool (copy a card for 15 HP) and the scrapyard (shed a basic card or sell scrap). Some are generous, some are traps. What an event did is shown when it ends.
- **Card images cleaned up.** Each card now shows one crisp symbol on a calm background (dark plate, dark outline, bright fill) instead of two layers of colour fighting each other; the action backdrop is faint behind it. Attacks are never drawn as shields.
- **Whose card is it?** Every Riftwalker's cards show their icon in the lower-left corner. A card offered from another class is tagged "Rift-crossed" with that character's icon (rewards, events, merchant), and now and then (8%) a **visiting merchant** sells only another Riftwalker's cards, with a banner saying so.
- **The Warden's Gift is your class only** (rare and sometimes legendary cards of your own class, no Neutral, Warden or other-class cards) and **every card reward, the Gift included, can be skipped.**
- **Big crowds.** New fights start with up to six enemies (Drone Swarm, Page Troop of tiny Gilded Pages, Raptor Horde); the figures pack closer, and enemy plates narrow or stagger so no two overlap (fixes the Kron fight). Summons in a fight still stop at four.
- **Fixed:** the "Consumed" pile box and the other piles are wide enough for their words.
- **Fixed the card library overflow.** The big hover preview had no styles on that page, so it was drawn below the book (and vanished when you moved away). It now floats beside the card you are pointing at. Also: "Sleeve Knifes" is now "Sleeve Knives".
- **Keen Edge, Deck of a Thousand Knives and friends now say what Edge does** on the card: "Gain 3 Edge: your Sleeve Knives deal 3 more damage for the rest of the fight." (Quill already had the card; it just did not explain itself.)
- **Grimoire:** page turns are a fade, and the book clips its pages, so no card can draw outside it.
- **Legendary cards lose the rainbow.** The holographic rainbow foil is replaced by a warm ember-gold sheen and an amber glow.
- **The green UPGRADED ribbon is gone** from cards; an upgraded card is still marked by its "+" and its green name and banner glow.
- **Seared is now Bleed** (the status that hurts at the start of its turn and then shrinks), everywhere it is named: cards, tooltips, character screens, the Learn page.
- **Hold a merchant card for later.** Pay a 20% deposit to put one card on hold; at your next merchant it is waiting, first in the row, for 70% of its price (90% in all). One card at a time; it stays on hold until you buy it.
- **Fixed:** turning a page in the grimoire made the nearer page grow past the bottom of the book for a moment and then snap back (the page-turn animation was 3D). It is a simple slide now.
- **The grimoire is a bit smaller** (cards up to 240 px, down from 280) and sized so two rows of cards always fit in the window, so nothing runs off the bottom of the book.
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
