# Proposals and ideas

Designs waiting on Robert's review, and ideas kept for later. Nothing in "For review" is built yet. Once a proposal is
approved it moves into the real doc (`08_COMBAT_V2.md`, `03_CAMPAIGN.md`) and gets a DECISIONS entry.

---

## For review

### 1. Enemies that set Traps (approved in principle 2026-10-27; details to review)

**Why:** the game is trap-driven, but in the campaign only the player sets Traps. Enemies with Traps make you play
*around* them, which no other game in this genre does.

**How it plays**
- An enemy's intent can be **Set a Trap** (its own icon). The Trap sits face-down above the enemy line, like yours do in
  the Arena.
- **Fully hidden (Robert, 2026-10-27, "for now").** You see that a Trap is set and which enemy set it, nothing else:
  not what sets it off, not what it does. Learning which enemies carry which Traps is part of the skill, and the
  answers below matter more. (Showing the trigger stays an option if hidden Traps feel like a dice roll in play.)
- The enemy side holds at most 3 Traps (the same cap as yours), and a Trap springs once.
- **Answers:** a common potion (*Tripwire Shears*: reveal and remove an enemy Trap), one Neutral card (*Disarm*: 0
  Mana, reveal every enemy Trap, consumed), and Vesper gets her own better version (springs it against them instead).
  The answers should be uncommon enough that playing around a Trap is still the usual choice.

**Who uses them**
- Mostly the **Umbral Veil** (the trap realm): two regular enemies, one Elite, and **Nyxara** (her Phase 2 sets one
  every other turn).
- One Trap-setter in each other realm so every run meets them.
- **Omen idea (a later Tier):** *Ambushers*: one enemy in every fight starts with a Trap set (`03_CAMPAIGN.md` already
  lists this name from the old design).

**First Traps (numbers are a first pass, before the tier multipliers)**

| Trap | Springs when | Does |
|---|---|---|
| Snapjaw | you attack its owner | deals 8 to your hero |
| Venom Needle | you attack its owner | you are Faltering for 2 turns |
| Mirror Veil | you gain Barrier | every enemy gains 6 Barrier |
| Lure | you summon an ally | the new ally is Stunned 1 turn |
| Ambush Signal | your turn starts | summons a Shade (small) |
| Grave Net | you lose 8+ HP in one hit | you are Exposed for 2 turns |

**Engine:** small. Traps already work per side (the Arena uses both), and every trigger above already exists. What's
new: an enemy move can set a Trap (a `setSnare` op), Trap cards for enemies (tokens, never in a reward), the
reveal/remove op for the answers, and the face-down Trap row on the enemy side in campaign fights.

**Questions for Robert**
1. Are the answers (potion, Neutral card, Vesper's card) the right amount? With fully hidden Traps a reveal is worth
   more, so they may need to be a little more common.
2. Should a Trap you have already seen sprung be recognised next time (the How to play page or a tooltip lists each
   enemy's Traps once you have met them)?

---

### 2. Warden's Marks (a variant of Warden signature cards)

**The catch:** signature cards were built in C5a (#92), and you removed them from the Gift on 2026-10-23 (#122) so the
Gift stays your own class's cards. A Warden card in every deck works against owning your class.

**The variant:** beating a Warden lets you **engrave its Mark onto one card already in your deck.** The card stays
yours and your class's. It just carries a piece of the Warden from then on, and it goes into the Arena with that deck.
Cards can already carry one engraved tag (Hold, Opening hand, Flare; #227), so a Mark is a new kind of engraving and
follows the same rule: **one tag per card.**

| Warden | Mark | On the card |
|---|---|---|
| Seraphine (Aurelion) | Gilded | also gain 4 Barrier |
| Kron (Nexus) | Overclocked | also draw a card; costs 1 more if it cost 0 |
| Gorrmaw (Wyldmaw) | Hungering | also heal 3 |
| Nyxara (Umbral) | Veiled | when this card is drawn, set a small Trap (deal 4 to whoever springs it) |
| Vorthax (the Rift) | Riftborn | is played twice; consumed afterwards |

**Where it goes in the reward:** after a Warden it is currently a rare card, a Heart, or nothing. The Mark would be a
fourth choice ("Engrave Seraphine's Mark"), so it competes with them instead of being free on top.

**Questions:** a fourth option, or replace the rare card? Are five Marks enough, or one per Warden *per Tier band* later?

---

### 3. New Boons (draft for review)

**Rule now live:** a run holds **one Legendary Boon at most** (DECISIONS #293).

**Proposed engine addition:** Boons get **triggers** the same way Riftwalker traits have them (`triggers` on
`BoonDef`, run like an Aura but not counted as one). Most of the Boons below need nothing else. Boons tied to one
mechanic (Traps, summons, stances) would carry `for: [...]` so they are only offered to the Riftwalkers who use that
mechanic. A Stance Boon never turns up for Kesh.

Numbers are measured against today's Boons (a common is worth about "6 Barrier at the start of each fight").

**Common**
| Boon | Text | For | Needs |
|---|---|---|---|
| Tripwire Coil | Start each fight with a Trap set: when an enemy attacks, deal 5 damage to it. | all | the `setSnare` op from §1 |
| Mender's Twine | Whenever you Consume a card, heal 1 HP. | all | — |
| Scout's Map | Fights and Elites on the map say what they are before you arrive. | all | campaign only |
| Kennel Bell | Whenever you summon an ally, it gains 3 Barrier. | Rivet, Kesh, Mire, Ilvane | — |

**Uncommon**
| Boon | Text | For | Needs |
|---|---|---|---|
| Snareweave | Whenever one of your Traps springs, draw a card. | Vesper, Maren | — |
| Grave Candle | Whenever one of your allies dies, gain 1 Mana next turn. | Mire, Rivet, Kesh | — |
| Bloodletter's Cup | Whenever you lose HP to your own card, gain 2 Barrier. | Kesh, Mire | — |
| Second Wind | The first time each fight you fall to half HP, gain 10 Barrier. | all | a "below half HP" trigger |
| Flowing Sash | Whenever you change stance, gain 2 Barrier. | Solen | — |
| Star Chart | Whenever you spend Arcana, deal 3 damage to a random enemy. | Obsidia | — |

**Rare**
| Boon | Text | For | Needs |
|---|---|---|---|
| Butcher's Hook | Your attacks deal 25% more to Elites and Wardens. | all | an engine flag for "boss" enemies |
| Thrifty Quill | Whenever a card is created in your piles, gain 1 Barrier (up to 8 a turn). | Quill, Ilvane, Obsidia | a per-turn cap on a trigger |
| Ember of Resolve | +1 Resolve, once, when you take it. | all | campaign only |

**Legendary** (one per run, so these can define a run)
| Boon | Text | For | Needs |
|---|---|---|---|
| Snaremaster's Codex | You can hold 1 more Trap, and the first Trap that springs each turn springs twice. | Vesper, Maren | a per-side Trap cap; "springs twice" |
| Crown of the Pack | Your allies act twice at the end of the first turn of each fight. | Rivet, Kesh, Mire | — (`actAllies` at fightStart) |
| Heart of the Storm | Start each fight in the stance you last ended a fight in. | Solen | the campaign remembers the stance |

**Questions:** which to keep, cut or retune. Also, is restricting a Boon to some Riftwalkers (`for`) okay? It means the
Boon pool you see depends on who you play.

---

### 4. Riftwalker mastery

**What's tracked (Robert, 2026-10-27):** for each Riftwalker, the **highest Rift Tier you have cleared** (beaten that
Tier's Vorthax). Reaching a Tier and falling does not count. Kept with the profile on the server (D1, beside the
campaign board's runs) so it follows a signed-in player, and in the browser for guests.

**Showing it (Robert asked for a way to see mastery per Riftwalker)**
- **Character picker:** each Riftwalker's figure wears a small Tier badge ("Cleared X") in the colour of its glow band,
  and nothing for one never cleared.
- **A Mastery page** (linked from the home page and your profile): all ten Riftwalkers in a row with the Tier cleared,
  the next glow band ("3 more Tiers to violet") and the card back as it glows now.
- **In the Arena:** the opponent's name plate shows the Tier cleared on the Riftwalker they brought, and their card
  backs glow.

**The one reward agreed so far:** your **card backs glow** in a colour for each 5 Tiers on that Riftwalker: **V**
(ember), **X** (rift blue), **XV** (violet), **XX** (crimson-gold). The glow sits *on top of* whatever card back you
use, including ones bought in the Store, so it never replaces something you would buy. Your Arena opponent sees it,
and that's where the bragging is.

**Kept small on purpose:** nothing else is given free. Ideas held back until you decide:
- a mastery number on your name plate in the Arena (cheap, earned, shows off);
- a title at XX ("Riftbound").

Mastery counts only runs from the day it ships; earlier runs are not counted (Robert, 2026-10-27).

**Questions:** glow colours to be chosen with the card back art.

---

### 5. Arena: queue first, choose a deck before every game (built 2026-10-27, DECISIONS #307)

- You queue without choosing a deck (you need at least one saved deck). **Matchmaking uses your Arena rank**, not a deck's Tier.
- Before **each** game of the match both players pick one of their own saved decks, **blind** (neither sees the other's pick until the game starts), on a timer; when time runs out you keep the deck you last used.
- Decks can be **any of your Riftwalkers**: a match can see each player switch between up to 3 decks, or keep one.
- One saved deck is enough to play: it is simply picked for every game.

## Kept for later

- **Daily Rift:** everyone plays the same seed with the same Riftwalker and two or three twists, one attempt a day, on
  a daily board. The seeded engine and the boards would do most of the work. *(Robert, 2026-10-27: not now; keep it.)*
- **A guided first fight:** one scripted fight that introduces Mana, Barrier, Traps and allies one at a time.
  *(Robert, 2026-10-27: okay, but later.)*
- **Music:** Robert will work on it.

## Decided against (so they aren't proposed again)

- **A Codex:** the How to play pages already act as the glossary. *(Robert, 2026-10-27)*
- **A draft Arena or any Arena deck not built in the campaign:** you only play the Arena with your campaign decks; that
  is a core idea of the game. *(Robert, 2026-10-27)*
