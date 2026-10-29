# Shaman: totems, elements and Trinity (built 2026-10-29, DECISIONS #420; this was the proposal Robert approved)

Robert's direction (2026-10-29): he starts with three totems; he casts Flame, Frost and Storm spells himself; totems help his spells
every turn and never leave unless he replaces one; he can add totem positions; he commands his spirits, as often as he builds for;
Spirit power only grows and strengthens his totems and his elemental damage; Trinity triggers from using all three elements in a
turn and only raises his Spirit (no count, no streak; Spirit has no cap); two rarer totems give Spirit when planted and Mana on
Trinity; a stacking Gathering Storm; utility cards. **Built** (DECISIONS #420): the live card list and prices are in shaman-ledger.md and
SHAMAN.md, which supersede the list below where they differ. Numbers are first-pass prices from docs/14_CARD_COSTING.md; every card is hand-priced in the ledger when built.

## Rules

| Rule | Proposal |
|---|---|
| Totems | He starts every fight with a **Hawk**, a **Bear** and a **Thunderbird** in three positions. Cards add positions, up to **5**. A totem stays for the fight; planting into a full row asks which one to replace (or keep them all). No queue, nothing pushed out. |
| Help each turn | Each totem boosts **the first spell of its element each turn**: Hawk: Flame spell +3 damage; Bear: Frost spell +3 Barrier; Thunderbird: Storm spell +2 damage to each enemy it hits. Two Hawks double it. |
| Commands | **1 command a turn**, plus every extra one a card gives ("Command a totem again this turn", a rare Aura's +1 a turn). Each command: any totem, any number of times. No targeting: **Hawk** 6 damage to a random enemy; **Bear** 5 Barrier to him; **Thunderbird** 3 to every enemy. Unused commands are lost at the end of the turn. |
| Rare totems | **Elder Tree:** planting it gives **2 Spirit**; its boost: his first spell each turn, of any element, deals or gives 2 more; command: 1 Spirit and draw a card. **Moon Owl:** **1 Mana whenever Trinity triggers**; command: his next spell this turn costs 1 less. Only from rare cards. |
| Elements | Spells carry one element tag. **Flame:** single-target damage, Bleed. **Frost:** Barrier and Faltering. **Storm:** every enemy, or random enemies several times. Damage spells are Attacks (Exposed, Faltering and Thorns apply as for any attack); a defensive spell is a Skill. |
| Trait: Spirit and Trinity | His trait (Robert, 2026-10-29) is the pair. **Trinity** has one purpose, raising his Spirit: the first time each turn he has cast a Flame, a Frost and a Storm spell, Trinity triggers and he gains **1 Spirit**. There is no Trinity count, streak or halving. **Spirit:** see below. |
| Trinity on screen | Like the Trickster's Suits (`SuitTrack.tsx`, Robert 2026-10-29): a **Trinity** panel in his column with three pips (Flame, Frost, Storm, each a mark and a word, so it reads without colour). A pip lights as he casts a spell of that element this turn; the card under the pointer shows which pip it would light (a Prism Spell lights all three). When all three are lit the row flares and says **Trinity**, and the panel shows the +1 Spirit it just gave. |
| Spirit | **No cap, never goes down** (Robert, 2026-10-29). Each point: **+1 to every command**; every 2 points: **+1 to every totem's spell boost**. Gained by Trinity (1 a trigger), the Elder Tree and Spirit cards; spent by nothing. |
| Gone from the live version | Empower, Rousing, Shelter, picking a command's target, the once-a-turn command limit. |

Starter (10): 2 Strike, 2 Defend, 2 **Ember Bolt** (Flame), 2 **Frost Ward** (Frost), 2 **Gathering Storm** (Storm). A hand of 5 holds one
of each element about 40% of the time, so Trinity can happen in the first fight without a rare; on other turns the totems and the
command carry him.

## First card list (about 82; F = Flame, I = Frost, S = Storm)

Points: damage 1, all enemies 1.3, a random enemy 0.9, Barrier 1.2, Faltering or Exposed 3, Bleed by the guide, Spirit (permanent, uncapped) ~5
a point, an extra command ~5.5, a totem position ~3, planting a totem ~2. Budgets: 0 cost 6, 1 cost 10, 2 cost 19, 3 cost 28; uncommon
x1.12, rare x1.25, Aura over four turns.

**Basics (3)**
- Ember Bolt (F, 1): Deal 7. *(7, basic 8)*
- Frost Ward (I, 1): Gain 5 Barrier. Apply 1 Faltering to a random enemy. *(8.7)*
- Gathering Storm (S, 1): Deal 3 to ALL enemies. Every copy deals 2 more for the rest of the fight. *(~7; grows)*

**Flame: single target (14)**
- Searing Lash (common, 1): Deal 7. Apply 2 Bleed. *(9)*
- Kindle (common, 0): Deal 4; +2 if you have a Hawk. *(5.8)*
- Firebrand (common, 1): Deal 8. Your next Flame spell this turn deals 3 more. *(9.8)*
- Twin Cinders (common, 1): Deal 5 twice. *(10)*
- Flame Spear (common, 2): Deal 17. *(17)*
- Immolate (uncommon, 2): Deal 13. Apply 4 Bleed. *(19.5)*
- Wildfire (uncommon, 1): Deal 6. Double the target's Bleed. *(~10)*
- Ember Lance (uncommon, 1): Deal 10; +3 if it is your first spell this turn. *(11.5)*
- Pyre Strike (uncommon, 2): Deal 17; costs 1 less if Trinity triggered last turn. *(~19)*
- Phoenix Feather (uncommon, 1, Skill): Your next Flame spell this turn is cast twice. *(~11)*
- Smoulder (uncommon, 1, Aura): Your Flame spells also apply 2 Bleed. *(~15)*
- Flashpoint (rare, 1): Deal damage equal to 3 times the target's Bleed. *(~12)*
- Heart of the Pyre (rare, 1, Aura): Your Flame spells deal 3 more. *(~18)*
- Inferno (rare, 3): Deal 30. Apply 3 Bleed. *(33.9)*

**Frost: defence and Faltering (15)**
- Frost Needle (common, 0): Deal 4; apply 1 Faltering if the target means to attack. *(6.1, kept)*
- Rime Shield (common, 1, Skill): Gain 7 Barrier; +2 if you have a Bear. *(10.4)*
- Chill Touch (common, 1): Deal 6. Apply 1 Faltering. *(9)*
- Hoarfrost (common, 1, Skill): Gain 5 Barrier. Apply 1 Faltering to ALL enemies. *(9.9)*
- Ice Wall (common, 2, Skill): Gain 15 Barrier. *(18)*
- Glacier Guard (uncommon, 1, Skill): Gain 6 Barrier; next turn, 4 more. *(11.2)*
- Frozen Grasp (uncommon, 1, Skill): Apply 2 Faltering. Gain 4 Barrier. *(10.8)*
- Shatter (uncommon, 1): Deal 7; +6 if the target is Faltering. *(10.6)*
- Ice Mirror (uncommon, 1, Skill): Gain 6 Barrier; attack damage it soaks this turn is dealt back. *(~11)*
- Winter's Embrace (uncommon, 2, Skill): Gain 12 Barrier. Apply 2 Faltering to ALL enemies. *(22.2)*
- Hail Rite (uncommon, 1, Aura): At the end of your turn, if you have a Bear, gain 4 Barrier. *(~17)*
- Frostbound (rare, 1, Aura): Whenever you apply Faltering, gain 3 Barrier. *(~21)*
- Avalanche (rare, 2): Deal 14 to ALL enemies. Apply 1 Faltering to ALL enemies. *(22.1)*
- Absolute Zero (rare, 2): Deal 10 to ALL enemies. Apply 2 Faltering to ALL enemies. *(20.8)*
- Glacial Fortress (rare, 3, Skill): Gain 24 Barrier; your Bear commands this turn give double. *(~34)*

**Storm: many targets (14)**
- Chain Lightning (common, 1): Deal 4 to a random enemy 3 times. *(10.8)*
- Static Crackle (common, 0): Deal 4 to ALL enemies. *(5.2)*
- Gale Call (common, 1): Deal 5 to ALL enemies. Draw 1. *(9.5)*
- Thunderclap (common, 2): Deal 13 to ALL enemies. *(16.9)*
- Squall (uncommon, 1): Deal 2 to a random enemy 6 times. *(10.8)*
- Storm Front (uncommon, 1): Deal 3 to ALL enemies twice. Draw 1. *(10.8)*
- Tempest Call (uncommon, 1, Skill): Your Gathering Storms gain 3 damage. Draw 1. *(~10)*
- Maelstrom (uncommon, 2): Deal 7 to ALL enemies twice. *(18.2)*
- Static Field (uncommon, 2): Deal 10 to ALL enemies. Apply 2 Exposed to ALL enemies. *(20.8)*
- Lightning Rod (uncommon, 1, Aura): Whenever you cast a Storm spell, deal 3 to a random enemy. *(~16)*
- Eye of the Tempest (rare, 2): Deal 3 to a random enemy 7 times, once more for each Thunderbird. *(~21.6, kept id)*
- Storm Sovereign (rare, 1, Aura): Whenever you command a totem, deal 3 to ALL enemies. *(~20)*
- Rising Gale (rare, 2, Aura): Whenever a Gathering Storm grows, deal 4 to ALL enemies. *(~price)*
- Superstorm (rare, 3): Deal 6 to ALL enemies 4 times. *(31.2)*

**Totems and commands (15)**
- Hawk Call (common, 1, Skill): Plant a Hawk. Gain 4 Barrier. Command a totem once more this turn. *(~11)*
- Bear Call (common, 1, Skill): Plant a Bear. Gain 7 Barrier. *(10.4)*
- Thunderbird Call (common, 1, Skill): Plant a Thunderbird. Deal 4 to ALL enemies. Gain 3 Barrier. *(10.8)*
- Call Again (common, 0, Skill): Command a totem once more this turn. *(~5.5)*
- Raise the Pole (common, 1, Skill): Gain a totem position (at most 5). Gain 5 Barrier. *(9)*
- Carve the Spirit Pole (uncommon, 1, Skill): Gain a totem position; plant a totem of your choice in it. Draw 2. *(~12.5)*
- Rally the Spirits (uncommon, 1, Skill): Command totems twice more this turn. *(11)*
- Ancestral Exchange (uncommon, 1, Skill): Replace a totem with one of another kind (your choice). Gain 1 Spirit. Draw 1. *(~11)*
- Bear's Embrace (uncommon, 1, Skill): Gain 6 Barrier. Your next Bear command this turn gives double. *(~12)*
- Talon Mark (uncommon, 1): Deal 6. Your next Hawk command this turn deals double. *(~12)*
- Thunder Roost (uncommon, 1, Aura): At the start of your turn, if you have a Thunderbird, deal 3 to ALL enemies. *(~15.6)*
- Call the Elder Tree (rare, 1, Skill): Plant an Elder Tree (2 Spirit). Gain 3 Barrier. *(~12.5)*
- Call the Moon Owl (rare, 1, Skill): Plant a Moon Owl. Draw 1. *(~12.5)*
- Spirit Chorus (rare, 1, Aura): At the start of your turn, gain 1 command. *(~22)*
- Great Spirit's Call (rare, 2, Skill): Command every totem you have once. *(~20)*

**Trinity and Spirit (7)**
- Prism Spell (uncommon, 1): Counts as Flame, Frost and Storm. Deal 3; gain 3 Barrier; deal 1 to ALL enemies. *(~10)*
- Balance of Elements (uncommon, 0, Skill): Your next spell this turn counts as every element. *(~6)*
- Spirit Surge (uncommon, 1, Skill): Gain 2 Spirit. Gain 4 Barrier. *(10.8)*
- Communion (uncommon, 1, Skill): Gain 1 Spirit. Draw 2. *(10)*
- Spiritstorm (rare, 1): Deal 4, plus your Spirit, to ALL enemies. *(~12)*
- Harmony (rare, 1, Aura): Whenever Trinity triggers, gain 6 Barrier and draw 1. *(~21)*
- Spirit Walk (rare, 1, Skill, Consume): Gain 3 Spirit. Draw 2. *(16)*

**Utility (12)**
- Stone Skin, Tidecaller, Spirit Memory, Clear Spring, Crystal Ward, Ironbark, Skybreaker: kept as they are.
- Read the Winds (common, 1, Skill): Foresee 3. Gain 4 Barrier. *(9.8)*
- Shaman's Insight (uncommon, 1, Skill): Draw 2. Your next spell this turn costs 1 less. *(10)*
- Smoke Offering (uncommon, 1, Skill): Consume a card from your hand. Next turn, gain 2 extra Mana. *(~9)*
- Ancestral Recall (uncommon, 1, Skill): Return a spell of your choice from your discard pile; it costs 0 this turn. Gain 4 Barrier. *(~11.8)*
- Spirit Vision (rare, 1, Skill, Consume): Draw 4. Gain 1 Spirit. *(16)*

## Checks to do when building

- **Ramp:** Spirit has no cap by design (an exception to the guide's "no uncapped permanent scaling" rule, to be logged in DECISIONS). Trinity adds 1 a turn at most, so with the starter Spirit grows by about 1 every other turn; a Trinity deck with Spirit cards may gain 2-3 a turn. Each point is worth about as much as a point of Might for the rest of the fight, so Spirit cards are priced at 5 a point, not 3. The long boss fight is the case to check: by turn 10 a Trinity deck can have 10-15 Spirit (+10-15 a command, +5-7 a boost).
- **Command loops:** extra commands come only from cards and one rare Aura, so there is no free loop. Storm Sovereign with several
  commands a turn is the multiplier to test.
- **Arena:** random Hawk dives and automatic Bear guards need no reaction prompts; Trinity and Spirit are visible on the side.
- **Saves:** a second Shaman rework (`CLASS_REWORKS.shaman` version 2), with old ids mapped as before.
