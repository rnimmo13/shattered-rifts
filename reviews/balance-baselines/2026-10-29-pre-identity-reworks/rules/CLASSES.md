# The archived classes: rules, starters, combos and known deviations

Frozen 2026-10-29 (commit 82867b0). Card-by-card data is in `resolved/<id>.json` and `cards/<id>.md`; what the statuses and ops mean
is in `ENGINE_SEMANTICS.md`. Strike = 1 Mana, 6 damage; Defend = 1 Mana, 5 Barrier (Neutral basics shared by every class).

The five baseline classes were deliberate close copies of Slay the Spire characters, made as balancing references (DECISIONS #364-371).
"Known deviations" lists where the copy differed from its model, so a later reader does not mistake a deliberate change for the model's
number.

## Knight (`knight`), modelled on the Slay the Spire 2 Ironclad (StS2 v0.103.2)

- 80 HP, 3 Mana, 5 cards. **Trait Oathkeeper:** start every fight with 6 Barrier and 6 Plating.
- **Starter:** 5 Strike, 4 Defend, Sundering Blow (2 Mana: 8 damage, 2 Exposed; the Bash).
- **Engines:** Barrier that persists (Plating, Fortified/Unbroken Wall, Stone Stance) and converts to damage (Bulwark Blow = damage equal
  to Barrier; Bastion Engine = 5 to a random enemy per Barrier gain); Might and multi-hit (Steel Resolve, Warlord's Oath = Demon Form,
  Twin Cut, Whirling Blade); Consume (Unholy Pact = Corruption, Rite of Recall = Dark Embrace, Numbing Rite = Feel No Pain, Burn It All =
  Fiend Fire); Blood (Draw Blood, Scar Over = Rupture, Blood Fire = Inferno, Crimson Offering).
- **Representative combos:** Unholy Pact + Rite of Recall + Numbing Rite (every Skill free, consumed for a card and 3 Barrier);
  Stone Stance/Fortified + Bulwark Blow; Warlord's Oath + Twin Cut/Whirling Blade; Scar Over + Blood Fire + self-damage cards.
- **Known deviations:** no Tank, Demonic Shield or Break (two-player or event cards); Thorns and Traps were removed from her for the
  copy (DECISIONS #367); Ember Ward is Flame Barrier as temporary Thorns; Legendary cards shelved (#363).

## Assassin (`assassin`), modelled on the Slay the Spire 2 Silent (v0.110 beta list)

- 70 HP, 3 Mana, 5 cards. **Trait Hidden Blades:** at the start of your turn, add a Dagger to your hand.
- **Starter:** 5 Strike, 5 Defend, Hobbling Jab (0: 3 damage, 1 Faltering; Neutralize), Duck and Weave (1: 8 Barrier, discard 1;
  Survivor). 12 cards.
- **Engines:** Daggers (Shivs: 0-cost 4-damage knife tokens) with Edge (Accuracy), Bottomless Sleeves (Infinite Blades), Wide Arc (Fan
  of Knives); Bleed (Poison) with Thin the Blood (Accelerant), Weeping Cuts (Noxious Fumes), Bloodburst (Outbreak), Serrated Edges
  (Envenom); Sly discard engine (Sly cards play free when discarded) with Grand Scheme (Master Planner), Into the Shadows, Nimble Deal.
- **Representative combos:** Whetted Edge + Knife Juggle + trait Daggers; Thin the Blood + Open Vein + Reopen the Wound; Grand Scheme +
  discard Skills; Ghost Knives (Phantom Blades) + held Daggers.
- **Known deviations:** no Blade Symphony, Concoct, Fade, Flanking, Sneaky (two-player); no Suppress/Wraith Form (Ancient). Shiv is
  called Dagger since #379 (id `sleeve-knife` kept). Weak = Faltering (25% less), Vulnerable = Exposed, Dexterity = Bracing, Strength
  lost = Sapped. Hand Trick gives Sly to a random Skill.

## Shaman (`shaman`), modelled on the Slay the Spire 2 Defect (Beta v0.111)

- 75 HP, 3 Mana, 5 cards. **Trait Totem-bound:** start every fight with a Hawk, a Bear and a Splinter totem (all three slots full).
- **Starter:** 4 Strike, 4 Defend, Hawk Call (1: plant a Hawk; Zap), Twin Awakening (1: awaken your first totem twice; Dualcast).
- **Engines:** FIFO orb row (3 slots; planting into a full row awakens the oldest) with Totem Row (Capacitor, +2 slots), Many Voices
  (Multi-Cast), Shatter the Row; Focus as Spirit (Tune the Spirits = Defragment, +1 permanently); Elder (Dark) charging; Owl (Plasma)
  Mana; 0-cost recursion (Spirit Wave = All for One, Wind's Favor = One for All, Gathering Storm = Claw); status-card synergies.
- **Representative combos:** Tune the Spirits x2 + Hawks; Totem Row + Endless Storm (Voltaic); Gathering Storm copies + Spirit Wave;
  Devouring Night (Consuming Shadow) + Elders.
- **Known deviations:** totems are not attacks (no Might/Exposed); no Ignition, Imitation Learning, Hibernate, Genetic Algorithm,
  Biased Cognition, Quadcast. Owl's passive is at the start of the turn (Plasma).

## Spellblade (`spellblade`), modelled on the Slay the Spire 2 Regent (Beta v0.111)

- 75 HP, 3 Mana, 5 cards. **Sigil:** 3 Arcana at the start of every fight. **Trait Kindled:** at the start of your turn, gain 1 Arcana
  and Sharpen the Obsidian Blade by 1.
- **Starter:** 4 Strike, 4 Defend, Cinderfall (0 Mana + 2 Arcana: 8 damage, 1 Faltering, 1 Exposed; Falling Star), Gather Arcana (1:
  gain 2 Arcana; Venerate).
- **Engines:** Arcana generator/spender (Stars) with big Arcana-cost cards (Molten Ruin = Devastate 35, Lava Bomb = Comet); Obsidian
  Blade (Sovereign Blade: 2 Mana, 10 + permanent Sharpen, Hold) with Forged in Fury, Whetstone, Warm Anvil (Furnace), Echoing Blade
  (Sword Sage), Cleaving Edge (Seeking Edge); Court: created cards (Retainers, Rubble, Neutral cards) with Glass Armory (Arsenal),
  Collapsing Vein (Supermassive); Hollow Form (Void Form: first 2 cards each turn free).
- **Representative combos:** Warm Anvil + Echoing Blade + Call the Blade; Sigil of Kindling (Genesis) + Arcana spenders; Hollow Form +
  Retainer tokens; Glass Armory + Rift Gifts.
- **Known deviations:** no Constellation, Largesse, Tutor, Hammer Time (two-player), no Royalties (economy). Arcana costs from
  sts2.untapped.gg. Sharpen carries over to newly made copies (#399).

## Necromancer (`necromancer`), modelled on the Slay the Spire 2 Necrobinder (stays live; archived as a baseline)

- 70 HP, 3 Mana, 5 cards. Starts with a 2-HP Bone Thrall (#411). **Trait Grave Chill:** at the start of your turn, Raise 2; whenever
  one of your allies dies, curse a random enemy with 2 Fate (#413); whenever a card is consumed, 3 Fate.
- **Starter:** 4 Strike, 4 Defend, Raise Thrall (Raise 5), Off the Leash (Command: each companion deals 6 + its HP).
- **Engines:** Thralls (several Osty copies) and Command cards; Fate (Doom) and cash-in; Souls (Gravesouls) and Fleeting cards.
- **Known deviations:** several Thralls instead of one Osty; the Thrall never acts on its own; Doom is called Fate.

## Monk (`monk`), reference only: shaped like the original Slay the Spire's Watcher

- 82 HP, 3 Mana, 5 cards. **Sigil:** start in Serene. **Trait Inner Fire:** whenever you enter a stance, gain 1 Fervor; the first time
  each turn you leave Serene, gain 2 Mana; whenever you leave Fury, gain 2 Primed (#412, #413).
- **Starter:** 4 Strike, 4 Defend, Kindle Fury (2: 9 damage, enter Fury; Eruption), Still Guard (1: 3 Barrier, enter Serene; Vigilance).
- **Engines:** Serene exit Mana + Fury double damage (+50% taken, not the Watcher's double) + 10 Fervor (Mantra) to Radiant (Divinity,
  triple damage, +1 Mana, ends at turn end); Fury burst, stance-cycling Flow, Fervor/Radiant paths.
- It was not built card-for-card from the Watcher; the resemblance is in the rule system (see docs/BASE_CLASS_REWORKS.md §12).
