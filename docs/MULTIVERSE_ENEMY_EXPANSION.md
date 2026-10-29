# Multiverse enemy expansion: 31 to 93

Artwork and encounter design handoff, 2026-10-29. **No live gameplay changes.**

Count verified against ENEMY_UNITS: 31 unique enemies, including bosses and summon-only units. Add 62 new IDs for 93 total; this is NOT a claim of 93 implemented monsters.

## Balance and encounter rules

All HP and move numbers below are provisional Tier I/stage 1 targets, using existing 5-14 regular, 9-23 elite and 14-34 boss damage bands as a reference. The player card-costing guide does NOT directly price an enemy HP bar or enemy turn economy. For each encounter compare three-turn incoming damage, setup windows, group size, debuff burden and summoned bodies with a current same-stage encounter. Do not reuse player rarity budgets as monster budgets. No sims were run.

Cycles below are deterministic left-to-right intent loops. Semicolons separate moves; a half-HP clause is a proposed second phase. Self Barrier/healing unless another recipient is specified. Fate targets the opposing hero and resolves at that affected unit's OWN turn end; no automatic immediate execution. All buffs/debuffs use existing rules. Temporary Thorns lasts through the following opponent turn. Targets and intent previews must be explicit.

Summon attempts must fail safely if slots are full; never increase the four-enemy cap. For group encounters use regulars with complementary roles, not three 14-damage attackers at stage 1. Avoid pairing multiple Fate or junk generators. Each boss should initially appear alone. Balance high HP and repeated defense against the four-to-six-turn fight goal. Proposed visuals do not imply unsupported mechanics such as stealing cards, deleting Mana, reversing time or permanent card loss.

## Encounter menu

### aurelion

Regular pair A: Censer Crab + Waxwing Bailiff. Regular pair B: Marble Mantis + Reliquary Hound. Later-stage trio: Censer Crab, Marble Mantis, Banner Leech (retune combined damage first). Elites: each alone before testing one weak helper. Boss: The Hollow Benediction alone.

| Cell | ID / name | Role | HP target | Telegraph / move cycle |
|---|---|---|---:|---|
| 1 | `censer-crab` — Censer Crab | regular | 42 | 9 damage; 7 Barrier; 6 damage and 1 Faltering |
| 2 | `waxwing-bailiff` — Waxwing Bailiff | regular | 49 | 5 damage twice; 8 Barrier; 11 damage |
| 3 | `marble-mantis` — Marble Mantis | regular | 56 | 12 damage; 6 Barrier; 8 damage and 1 Exposed |
| 4 | `reliquary-hound` — Reliquary Hound | regular | 63 | 8 damage; 5 Barrier to all friends; 10 damage |
| 5 | `banner-leech` — Banner Leech | regular | 42 | 1 Faltering; 11 damage; 7 Barrier |
| 6 | `bellows-pilgrim` — Bellows Pilgrim | regular | 49 | 7 damage; 1 Might to self; 4 damage three times |
| 7 | `prism-magistrate` — Prism Magistrate | elite | 105 | 14 damage; 12 Barrier; 10 damage and 1 Exposed |
| 8 | `procession-engine` — Procession Engine | elite | 114 | 9 Barrier to all friends; 9 damage twice; 20 damage |
| 9 | `the-hollow-benediction` — The Hollow Benediction | boss | 230 | 14 damage; 15 Barrier; 26 damage; half HP: alternate 10 damage twice and 12 Barrier |


### nexus

Regular pair A: Magnet Tick + Receipt Wraith. Regular pair B: Cable Jelly + Piston Hare. Later-stage trio: Magnet Tick, Cable Jelly, Boiler Snail (retune combined damage first). Elites: each alone before testing one weak helper. Boss: Mother of Static alone.

| Cell | ID / name | Role | HP target | Telegraph / move cycle |
|---|---|---|---:|---|
| 1 | `magnet-tick` — Magnet Tick | regular | 42 | 8 damage; 9 Barrier; 10 damage |
| 2 | `receipt-wraith` — Receipt Wraith | regular | 49 | 7 damage and one junk card; 6 Barrier; 10 damage |
| 3 | `cable-jelly` — Cable Jelly | regular | 56 | 4 damage three times; 7 Barrier; 8 damage |
| 4 | `piston-hare` — Piston Hare | regular | 63 | 7 damage; 11 damage; 6 Barrier |
| 5 | `boiler-snail` — Boiler Snail | regular | 42 | 12 Barrier; 13 damage; 5 damage twice |
| 6 | `welding-cherub` — Welding Cherub | regular | 49 | 8 damage; 1 Exposed; 12 damage |
| 7 | `clockwork-guillotine` — Clockwork Guillotine | elite | 105 | 12 Barrier; 22 damage; 8 damage twice |
| 8 | `scrapyard-centipede` — Scrapyard Centipede | elite | 114 | 6 damage three times; 12 Barrier; 19 damage |
| 9 | `mother-of-static` — Mother of Static | boss | 230 | 12 damage; one junk card and 10 Barrier; 24 damage; half HP: 8 damage three times then 14 Barrier |


### wyldmaw

Regular pair A: Thornback Toad + Orchid Maw. Regular pair B: Antler Wasp + Mossjaw Turtle. Later-stage trio: Thornback Toad, Antler Wasp, Fungal Drummer (retune combined damage first). Elites: each alone before testing one weak helper. Boss: The Upside-Down Stag alone.

| Cell | ID / name | Role | HP target | Telegraph / move cycle |
|---|---|---|---:|---|
| 1 | `thornback-toad` — Thornback Toad | regular | 42 | 8 damage; 3 temporary Thorns; 11 damage |
| 2 | `orchid-maw` — Orchid Maw | regular | 49 | 9 damage; heal self 5; 12 damage |
| 3 | `antler-wasp` — Antler Wasp | regular | 56 | 4 damage three times; 1 Faltering; 10 damage |
| 4 | `mossjaw-turtle` — Mossjaw Turtle | regular | 63 | 11 Barrier; 13 damage; 7 damage |
| 5 | `fungal-drummer` — Fungal Drummer | regular | 42 | 7 damage; 1 Might to all friends; 9 damage |
| 6 | `ribcage-eel` — Ribcage Eel | regular | 49 | 10 damage; 7 Barrier; 5 damage twice |
| 7 | `hunger-orchard` — Hunger Orchard | elite | 105 | 14 damage; summon existing raptor if room; 18 damage |
| 8 | `molting-cathedral` — Molting Cathedral | elite | 114 | 15 Barrier; 20 damage; 7 damage three times |
| 9 | `the-upside-down-stag` — The Upside-Down Stag | boss | 230 | 14 damage; 12 Barrier and 1 Might; 25 damage; half HP: 10 damage twice then 15 Barrier |


### umbral

Regular pair A: Velvet Lamprey + Keyhole Imp. Regular pair B: Umbrella Widow + Mirror Moth. Later-stage trio: Velvet Lamprey, Umbrella Widow, Inkbound Usher (retune combined damage first). Elites: each alone before testing one weak helper. Boss: The Applause Below alone.

| Cell | ID / name | Role | HP target | Telegraph / move cycle |
|---|---|---|---:|---|
| 1 | `velvet-lamprey` — Velvet Lamprey | regular | 42 | 8 damage; 1 Faltering; 11 damage |
| 2 | `keyhole-imp` — Keyhole Imp | regular | 49 | 7 damage; 8 Barrier; 10 damage |
| 3 | `umbrella-widow` — Umbrella Widow | regular | 56 | 10 Barrier; 11 damage; 4 damage twice |
| 4 | `mirror-moth` — Mirror Moth | regular | 63 | 8 damage and 1 Exposed; 7 Barrier; 10 damage |
| 5 | `inkbound-usher` — Inkbound Usher | regular | 42 | 7 damage and one junk card; 8 Barrier; 11 damage |
| 6 | `puppet-of-knots` — Puppet of Knots | regular | 49 | 5 damage twice; 1 Might to self; 12 damage |
| 7 | `the-borrowed-face` — The Borrowed Face | elite | 105 | 12 damage and 1 Faltering; 14 Barrier; 21 damage |
| 8 | `midnight-seamstress` — Midnight Seamstress | elite | 114 | 8 damage twice; two junk cards; 19 damage |
| 9 | `the-applause-below` — The Applause Below | boss | 230 | 12 Barrier; 16 damage; 26 damage; half HP: 7 damage three times then 15 Barrier |


### gloomfen

Regular pair A: Coffin Nautilus + Bog Bell. Regular pair B: Funeral Kite + Gravewax Slug. Later-stage trio: Coffin Nautilus, Funeral Kite, Silt Bride (retune combined damage first). Elites: each alone before testing one weak helper. Boss: The Mourning Tide alone.

| Cell | ID / name | Role | HP target | Telegraph / move cycle |
|---|---|---|---:|---|
| 1 | `coffin-nautilus` — Coffin Nautilus | regular | 42 | 10 Barrier; 10 damage; 7 damage and 1 Faltering |
| 2 | `bog-bell` — Bog Bell | regular | 49 | 7 damage; 5 Fate; 10 damage |
| 3 | `funeral-kite` — Funeral Kite | regular | 56 | 8 damage; 6 Barrier; 11 damage |
| 4 | `gravewax-slug` — Gravewax Slug | regular | 63 | 7 damage; heal self 4; 11 damage |
| 5 | `silt-bride` — Silt Bride | regular | 42 | 8 damage and 1 Faltering; 7 Barrier; 10 damage |
| 6 | `lantern-angler` — Lantern Angler | regular | 49 | 8 damage; 6 Fate; 12 damage |
| 7 | `pallbearer-swarm` — Pallbearer Swarm | elite | 105 | 6 damage three times; 12 Barrier; 18 damage |
| 8 | `the-unburied-hour` — The Unburied Hour | elite | 114 | 10 Fate; 12 Barrier; 20 damage |
| 9 | `the-mourning-tide` — The Mourning Tide | boss | 230 | 14 damage; heal self 8 and 10 Barrier; 24 damage; half HP: 8 Fate then 10 damage twice |


### hollow-crown

Regular pair A: Glass Hermit + Crown Centipede. Regular pair B: Ember Chessman + Shard Peacock. Later-stage trio: Glass Hermit, Ember Chessman, Cinder Scribe (retune combined damage first). Elites: each alone before testing one weak helper. Boss: Queen of the Unmade alone.

| Cell | ID / name | Role | HP target | Telegraph / move cycle |
|---|---|---|---:|---|
| 1 | `glass-hermit` — Glass Hermit | regular | 42 | 8 damage; 9 Barrier; 11 damage |
| 2 | `crown-centipede` — Crown Centipede | regular | 49 | 4 damage three times; 6 Barrier; 10 damage |
| 3 | `ember-chessman` — Ember Chessman | regular | 56 | 12 damage; 9 Barrier; 8 damage |
| 4 | `shard-peacock` — Shard Peacock | regular | 63 | 8 damage; 1 Exposed; 4 damage three times |
| 5 | `cinder-scribe` — Cinder Scribe | regular | 42 | 7 damage and one junk card; 8 Barrier; 11 damage |
| 6 | `obsidian-anemone` — Obsidian Anemone | regular | 49 | 5 damage twice; 8 Barrier; 12 damage |
| 7 | `the-cracked-heir` — The Cracked Heir | elite | 105 | 14 damage; 14 Barrier; 9 damage twice |
| 8 | `molten-reliquary` — Molten Reliquary | elite | 114 | 12 Barrier; 21 damage; 7 damage three times |
| 9 | `queen-of-the-unmade` — Queen of the Unmade | boss | 230 | 14 damage; 14 Barrier and 1 Might; 25 damage; half HP: 9 damage three times then 12 Barrier |


### far-rifts

Regular pair A: Pocket Singularity + Origami Leviathan. Regular pair B: Astral Teacup + Inverse Diver. Later-stage trio: Pocket Singularity, Astral Teacup, Paradox Jelly (retune combined damage first). Elites: each alone before testing one weak helper. Boss: Event Horizon Regent alone.

| Cell | ID / name | Role | HP target | Telegraph / move cycle |
|---|---|---|---:|---|
| 1 | `pocket-singularity` — Pocket Singularity | regular | 42 | 8 Barrier; 9 damage; 13 damage, ring opens before the big hit |
| 2 | `origami-leviathan` — Origami Leviathan | regular | 49 | 9 damage; 7 Barrier; 5 damage twice |
| 3 | `astral-teacup` — Astral Teacup | regular | 56 | 7 damage; 7 Barrier and 1 Might; 10 damage |
| 4 | `inverse-diver` — Inverse Diver | regular | 63 | 10 damage; 9 Barrier; 8 damage and 1 Faltering |
| 5 | `paradox-jelly` — Paradox Jelly | regular | 42 | 7 damage and one junk card; 9 Barrier; 11 damage |
| 6 | `planet-eater` — Planet Eater | elite | 123 | 16 damage; 13 Barrier; 22 damage |
| 7 | `the-missing-frame` — The Missing Frame | elite | 105 | 13 damage; 12 Barrier; 8 damage three times |
| 8 | `event-horizon-regent` — Event Horizon Regent | boss | 230 | 12 damage; 16 Barrier; 28 damage; half HP: 9 damage three times then 14 Barrier |


## Production art notes

Nine cells per sheet, index starts at zero in JSON and one in this table. Last Far Rifts cell intentionally blank. Every ID has its own silhouette rather than a color swap. The Borrowed Face is an original asymmetrical theatrical mask: no heart silhouette, perimeter spikes or recognizably copied mask markings. Pixel exports must preserve margins and have verified transparency before shipping. Review image counts and cell alignment before slicing; these source sheets are candidates, not approved final figures.

Exact prompt, style reference, sheet path, cell and approval status belong in the provenance manifest. Do not overwrite current enemy art or register these IDs in rewards/encounters until separately authorized.
