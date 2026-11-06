# Warden mechanics, Elite variety, stable models and required updates — 2026-11-05

Final 0.209.0 / rules 87 follow-up to REALMS_AND_DRAGO_2026-11-05.md. Robert explicitly authorizes these implementations, dedicated realm arenas/lore, mandatory updates and commit/push/deployment after validation (decisions645–650). Prior local realm assessment and prompts remain preserved; this ledger supersedes their simple Warden mechanics and borrowed-arena assumptions.

## Stable model presentation (Campaign and Arena)

Three causes were identified in source: group-size-dependent fitHeight and packLine scale changed existing models when a summon joined/died; late-loaded art replaced fallback canvases on the next action; and ordinary minions crossed18/30-Max-HP visual thresholds after buffs, including Tinkerer’s automatic growth.

Drago now has a fixed720-stage-pixel height (previous solo600, potentially300 or less under crowd fitting) and a dedicated back position. His actual painted vorthax figure is priority-loaded. Bosses are outside minion packing. Other figures use stable sizes with rows of two instead of shrinking the entire group; mobile still uses its existing figure-scale factors (Drago432stage pixels in portrait). Art selection is frozen per combatant/form during a fight. Ordinary allies use their definition’s HP for visual size; only intentional Bone Thrall growth still changes its model/height. A new fight can use newly loaded art; rotation still changes responsive layout. No stats, target eligibility, companion caps or Overflow rule changes.

## Five Elite encounters per realm

Four original realms had4 each; Gloomfen/Hollow Crown/Far Rifts and the four new worlds had2 each. All eleven now have5 distinct unit compositions:30 →55 total, adding25 encounters using existing native units and moves. Original solo Elites remain. Vanguard/Rearguard pair an Elite with a native support; Convergence is a three-unit native regular formation. These are encounter variations, not25 newly painted enemy archetypes. No old unit stats, reward amount or tier multipliers change. Existing generated maps remain; future maps/ambushes use expanded pools. The First Ruin remains six boss fights and has no ordinary Elite stops.

### Aurelion: 4 → 5 Elite encounters

- Templar-Commander Aldric: Templar-Commander Aldric (124 base HP).
- High Inquisitor Maelis: High Inquisitor Maelis (114 base HP).
- Prism Magistrate: Prism Magistrate (105 base HP).
- Procession Engine: Procession Engine (114 base HP).
- Aurelion Vanguard: Templar-Commander Aldric (124 base HP) + Gilded Squire (41 base HP).

### Nexus-9: 4 → 5 Elite encounters

- Hive-7: Hive-7 (110 base HP).
- Ghostwire: Ghostwire (100 base HP).
- Clockwork Guillotine: Clockwork Guillotine (105 base HP).
- Scrapyard Centipede: Scrapyard Centipede (114 base HP).
- Nexus-9 Vanguard: Hive-7 (110 base HP) + Line Technician (59 base HP).

### Wyldmaw: 4 → 5 Elite encounters

- Packmother Ruhn: Packmother Ruhn (114 base HP).
- The Bloated One: The Bloated One (141 base HP).
- Hunger Orchard: Hunger Orchard (105 base HP).
- Molting Cathedral: Molting Cathedral (114 base HP).
- Wyldmaw Vanguard: Packmother Ruhn (114 base HP) + Rift Raptor (19 base HP).

### Umbral Veil: 4 → 5 Elite encounters

- The Lamplighter: The Lamplighter (117 base HP).
- Choir of Silence: Choir of Silence (107 base HP).
- The Borrowed Face: The Borrowed Face (105 base HP).
- Midnight Seamstress: Midnight Seamstress (114 base HP).
- Umbral Veil Vanguard: The Lamplighter (117 base HP) + Hooded Acolyte (55 base HP).

### Gloomfen: 2 → 5 Elite encounters

- Pallbearer Swarm: Pallbearer Swarm (105 base HP).
- The Unburied Hour: The Unburied Hour (114 base HP).
- Gloomfen Vanguard: Pallbearer Swarm (105 base HP) + Coffin Nautilus (42 base HP).
- Gloomfen Rearguard: The Unburied Hour (114 base HP) + Bog Bell (49 base HP).
- Gloomfen Convergence: Coffin Nautilus (42 base HP) + Bog Bell (49 base HP) + Funeral Kite (56 base HP).

### The Hollow Crown: 2 → 5 Elite encounters

- The Cracked Heir: The Cracked Heir (105 base HP).
- Molten Reliquary: Molten Reliquary (114 base HP).
- The Hollow Crown Vanguard: The Cracked Heir (105 base HP) + Glass Hermit (42 base HP).
- The Hollow Crown Rearguard: Molten Reliquary (114 base HP) + Crown Centipede (49 base HP).
- The Hollow Crown Convergence: Glass Hermit (42 base HP) + Crown Centipede (49 base HP) + Ember Chessman (56 base HP).

### The Far Rifts: 2 → 5 Elite encounters

- Planet Eater: Planet Eater (123 base HP).
- The Missing Frame: The Missing Frame (105 base HP).
- The Far Rifts Vanguard: Planet Eater (123 base HP) + Pocket Singularity (42 base HP).
- The Far Rifts Rearguard: The Missing Frame (105 base HP) + Origami Leviathan (49 base HP).
- The Far Rifts Convergence: Pocket Singularity (42 base HP) + Origami Leviathan (49 base HP) + Astral Teacup (56 base HP).

### Cindervault: 2 → 5 Elite encounters

- Cinder Marshal: Cinder Marshal (120 base HP).
- Walking Kiln: Walking Kiln (128 base HP).
- Cindervault Vanguard: Cinder Marshal (120 base HP) + Cinder Soldier (42 base HP).
- Cindervault Rearguard: Walking Kiln (128 base HP) + Kiln Wisp (32 base HP).
- Cindervault Convergence: Cinder Soldier (42 base HP) + Kiln Wisp (32 base HP) + Ash Collector (40 base HP).

### Thalassar: 2 → 5 Elite encounters

- Mirror Ray: Mirror Ray (116 base HP).
- Deep Watcher: Deep Watcher (126 base HP).
- Thalassar Vanguard: Mirror Ray (116 base HP) + Pearl Crab (42 base HP).
- Thalassar Rearguard: Deep Watcher (126 base HP) + Tide Sprite (32 base HP).
- Thalassar Convergence: Pearl Crab (42 base HP) + Tide Sprite (32 base HP) + Reef Stalker (38 base HP).

### Vespera: 2 → 5 Elite encounters

- Nightmare Loom: Nightmare Loom (118 base HP).
- Dream Custodian: Dream Custodian (124 base HP).
- Vespera Vanguard: Nightmare Loom (118 base HP) + Dream Moth (32 base HP).
- Vespera Rearguard: Dream Custodian (124 base HP) + Hollow Sleeper (44 base HP).
- Vespera Convergence: Dream Moth (32 base HP) + Hollow Sleeper (44 base HP) + Memory Thief (36 base HP).

### The Hourglass Expanse: 2 → 5 Elite encounters

- Bronze Sphinx: Bronze Sphinx (124 base HP).
- Hourglass Giant: Hourglass Giant (136 base HP).
- The Hourglass Expanse Vanguard: Bronze Sphinx (124 base HP) + Sand Sentinel (46 base HP).
- The Hourglass Expanse Rearguard: Hourglass Giant (136 base HP) + Glass Scorpion (34 base HP).
- The Hourglass Expanse Convergence: Sand Sentinel (46 base HP) + Glass Scorpion (34 base HP) + Dune Scribe (36 base HP).

## Nine new Warden identities (Campaign)

All amounts are authored bases before existing enemy damage/guard/tier scaling, Might, debuffs and Omens. Percent-of-state operations are already scaled and are not guarded twice. Parenthetical caps are local conversions, not universal damage/Barrier caps. These final mechanics replace the simpler unpublished versions in the initial realm candidate.

### The Ashbound Colossus

210 base HP (unchanged from the initial local realm candidate). Furnace Fuel: its charge retains Barrier for one turn. Discharge deals 12 damage to all foes plus half its remaining Barrier (up to +24), then spends the fuel. Break its Barrier to weaken the blast.

Move cycle: Stoke the Heart: 24 Barrier to itself; 1 Blur to itself; 2 Might to itself. Furnace Discharge: 1 × (12 + floor(0.5 × its own barrier), capped at +24) damage to all foes; clear Barrier and Steadfast from itself. Furnace Rupture: 1 × (27) damage to the target; 2 Exposed to itself.

### The Pearlbound Sovereign

210 base HP (unchanged from the initial local realm candidate). Pearl Tribute steals up to 20 Barrier from its target before gaining its own 24 base Barrier. Its ebb leaves it Exposed. Spend or break through the stolen protection.

Move cycle: Pearl Tribute: 0 + floor(1 × the target’s barrier), capped at +20 Barrier to itself; remove up to 20 Barrier from the target; 24 Barrier to itself. Royal Tide: 1 × (18) damage to all foes. The Ebb: 1 × (23) damage to the target; 2 Exposed to itself.

### The Dreaming Monarch

215 base HP (unchanged from the initial local realm candidate). Recurring Nightmares: two are placed in your hand. Each left unplayed at turn end or discarded by an effect creates another Nightmare. Pay 1 Mana to Consume one and draw a card; all are fight-only.

Move cycle: The Sleeping Court: add 2 Recurring Nightmare to the opponent’s hand pile; 18 Barrier to itself. Royal Hush: 1 × (17) damage to the target; 1 Faltering to the target. Wake the World: 1 × (25) damage to the target; 1 Exposed to itself.

### The Sandbound Chronicler

220 base HP (unchanged from the initial local realm candidate). The Hourglass Wager: it curses itself with Fate equal to 15% of its Max HP. Its fourth move gains damage equal to 10% of that Fate (up to +12), then clears it. Bring its HP below its Fate before the wager ends.

Move cycle: Wager the Age: 2 Might to itself; 16 Barrier to itself; 0 + floor(0.15 × its own maxHp) Doom to itself. Erosion: 1 × (15) damage to the target; 1 Brittle to the target. Three Ages: 3 × (7) damage to the target. Turn the Hourglass: 1 × (26 + floor(0.1 × its own doom), capped at +12) damage to the target; clear Doom from itself; 1 Exposed to itself.

### Pyrewing, the Cinder Tyrant

225 base HP (unchanged from the initial local realm candidate). Kindling: Worldfire applies 4 Burn to every foe. The next two talon hits gain +2 damage per remaining Burn on their target (up to +8 per hit), then clear that Burn. Block the Burn tick or cleanse it before the talons.

Move cycle: Gather the Pyre: 20 Barrier to itself; 2 Might to itself. Worldfire Breath: 1 × (19) damage to all foes; 4 Burn to all foes. Kindling Talons: 2 × (12 + floor(2 × the target’s burn), capped at +8) damage to the target; clear Burn from the target; 1 Exposed to itself.

### Nacreth, the Glassscale

230 base HP (unchanged from the initial local realm candidate). Three Mirror Facets: three Shielded charges and 8 Reflect punish repeated small hits. Fractured Breath removes both protections and leaves Nacreth Exposed for 2 turns: save your burst for the opening.

Move cycle: Three Mirror Facets: 28 Barrier to itself; 3 Shielded to itself; 8 Reflect to itself. Glassfall: 3 × (8) damage to the target. Fractured Breath: clear Shielded from itself; clear Reflect from itself; 1 × (24) damage to the target; 2 Exposed to itself.

### Morvane, the Hollow Maw

230 base HP (unchanged from the initial local realm candidate). Hollow Brood: two Eggs incubate once, then each heals all allies for 2% of their own Max HP and grants them 1 Might before dying. Kill the Eggs before they hatch to deny the support. The Open Maw leaves Morvane Exposed.

Move cycle: Brood of Ruin: summon Hollow Egg; summon Hollow Egg. Hollow Maw: 1 × (23) damage to the target. The Open Maw: 1 × (26) damage to the target; 2 Exposed to itself.

### Aethrion, the Storm-Crowned

220 base HP (unchanged from the initial local realm candidate). Forked Crown: a lone foe takes three 7-damage bolts; against a formation, up to four different foes take one 7-damage bolt each. Healthy companions spread the lightning. Its crown still builds Might.

Move cycle: Storm Crown: 2 Might to itself; 16 Barrier to itself. Forked Crown: with at most 1 foes: 3 × (7) damage to the target; with at least 2 foes: 4 × (7) damage to random foes (different targets). Thunderwake: 1 × (18) damage to all foes; 1 Exposed to itself.

### Xalvorr, the Last Eclipse

240 base HP (unchanged from the initial local realm candidate). The Last Eclipse applies Fate equal to 15% of its target’s missing HP (up to 12). Endless Night adds half that target’s existing Fate (up to 10). Healing lowers the first curse; cleansing prevents compounding Fate.

Move cycle: Last Eclipse: 20 Barrier to itself; 1 Brittle to the target; 0 + floor(0.15 × the target’s missingHp), capped at +12 Doom to the target. Eclipse Talons: 2 × (11) damage to the target. Endless Night: 1 × (26) damage to the target; 0 + floor(0.5 × the target’s doom), capped at +10 Doom to the target; 1 Exposed to the target; 1 Exposed to itself.


Recurring Nightmare: fight-only junk/status token,1Mana, Consume, draw1. Each left in hand at turn end creates1additional copy in the fight discard pile. Effect-caused discard also creates1copy; normal end cleanup never triggers both. Consume prevents spreading. Not offered by reward pools; ordinary fight-created cards do not enter the permanent run deck. Discard/Consume/Created engines can experience different burdens or synergies.

Hollow Eggs:18baseHP. Incubate gains6baseBarrier; second action heals all friendly units for2% of each recipient’s ownMaxHP, grants1Might to each, then loses all its own HP. Kill them before that action to deny support. Native Morvane remains a leader; its incarnation is not one.

## Drago’s court

Drago retains300baseHP and existing named moves. Four health phases (75/50/25 thresholds) become five (80/60/40/20). Initial first intent Refract → Call Pyrewing. Phase leads:100% CallPyrewing;80% CallNacreth then Shattering;60% CallMorvane then Pull;40% CallAethrion;20% CallXalvorr then Prismatic Core. Existing cycle moves continue in each phase. Final closing/Fate pressure now belongs to20%, not25%.

Each calls an incarnation of the native Warden with40%baseHP: Pyrewing90,Nacreth92,Morvane92,Aethrion88,Xalvorr96, before normal tier scaling. It retains the native move cycle/signature mechanic, painted figure and usual summon-cap rules, but no leader rule. Damage values are not reduced merely because HP is reduced. Killing an incarnation does not defeat Drago. Killing Drago still removes his entire side.

Generic summon operation gains optional replacement-unit list. Before spawning, matched friendly units other than the summoner are released without deaths; full summon slots are freed first. Drago’s list contains the five incarnations,HollowEgg,RiftShard,RiftWard. It cannot accidentally trigger Morvane leader death or player death payoffs. Normal allyLost semantics can hear releases. This avoids overcrowding and ensures each eligible call has room. Existing escorts may act before the call, following ordinary enemy order. Health phases remain monotone: healing never rewinds them. Burst may skip a phase/call; no forced invulnerability, round damage cap or health gate was added. Rules87 makes old unfinished battles use the saved-checkpoint migration. Arena cards/Ascendancy stats remain unchanged by this NPC work; the separately approved Recall revision still applies in both modes.

## Dedicated arenas and lore

Cindervault, Thalassar, Vespera and Hourglass Expanse now have four independent painted panoramas and floor textures, replacing glass/dock/cave/ramparts reuse. Their Wardens share their realm’s new venue. The First Ruin and its dragon Wardens share the existing Drago arena. New packs deliberately use scenery painted into the panorama rather than unrelated old foreground prop cutouts; the loader requests only props named by a venue’s layout.

All four vistas also appear in Lore, with responsive previews; total lore illustrations26→30. Learn lists all eleven worlds and five Elite formations per world, and points to Lore. Existing class/card homelands remain unchanged. Built-in image generation prompts/asset paths: art-prompts/0.209-arenas.json. Cindervault was regenerated without the floating-crown motif to make its industrial identity distinct. No CLI/API fallback used.

## Mandatory updates

The prior ready-update modal already blocked new play outside battle, but still required a manual refresh/restart and native messages described convenient/optional installation. Now a new web build or downloaded native patch automatically saves and refreshes/restarts at the safe boundary. Current battles are not interrupted. There is no Later/dismiss option. Failure to save leaves the game open with a blocking retry, and no reload/install is started before save confirmation. Concurrent automatic/retry requests coalesce. Desktop checks immediately at startup and every60seconds (previously initial15seconds and every300seconds); renderer polls availability every10seconds. Known ready updates remain required through offline checks; a check with no known update cannot fabricate a requirement. Steam-managed editions remain Steam-managed. Existing older clients retain the update UI shipped in their version until they load/install this release.

## Evidence and assessment limits

Available retained real-player evidence remains the older Golemancer and Assassin client Campaign positions/finale trace, not new-realm matches, independent fights or complete reward histories. No representative current human Arena matchup sample is available. These observations informed the earlier Recall review, not measured new-boss strength. No balance simulations were run. Deterministic mechanic/counterplay fixtures and UI checks are behavior verification only. All30Ascendancies,10class starts and mixed builds are reassessed without claiming grades or parity in 0.209.0-wardens-review-1. Initial optimal Drago clear target remains approximately50% or somewhat above; no new clear rate is measured. Beyond10-own-turn growth and recovery require field evidence, including Cinder/Pyrewing/Aethrion Might growth, Nacreth protection windows, Morvane egg support and Xalvorr/Drago Fate.


## Final visual framing refinement

Drago’s fight uses one fixed larger camera frame for the whole fight, with wing/plate clearance independent of summon count. Body height remains720stagepixels; the static viewport fits him and the court without clipping. Mobile minions have a260stagepixel minimum spacing footprint, use rows of two, and no longer change alternating flyer altitude when the roster changes. The painted body size stays fixed; movement/hover/intent positioning remains presentation only. Responsive tests inspect real rendered height before/after a summon and an Engineer turn at1366/390/320px.
