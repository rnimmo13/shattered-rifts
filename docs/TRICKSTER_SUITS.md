# Trickster: Suits, a playing-card build path (proposal, 2026-10-28)

**Status: built 2026-10-28 (DECISIONS #387), with Robert's changes:** "the suit pip shouldnt be on any cards, it should dynamically
show up somwhere around the character, to the left and top of the character model, and it should populate the pip for each of the
types when you play. if all we need to do is track 4 differnt types, then lets just show them and give them an effect when all 4 are
there." So:

- **No pips on the cards.** Four pips sit above and to the left of the Trickster (`SuitTrack.tsx`) and light as each suit is played
  that turn; the card being aimed or hovered shows which pip it would light.
- **All four lit is a Full Trick**, built into the trait (`HeroTrait.suits.fullTrick`): **5 damage to every enemy and draw 1**,
  once a turn. The Whole Deck adds to it.
- Differences from the card list below: **Card Sharp** is 8, and 8 more if all four suits are showing (only which suits are lit is
  kept, not the order, so "the first ♠" could not be asked); **Wild Card** Consumes (a free card that draws must, `balance.test.ts`;
  Wild Card+ Holds); **Masquerade** strikes every enemy for 3 per suit shown as the turn ends (no trigger exists for "a new suit");
  Flourish+ (10 damage) and Ace of Clubs+ (3 Exposed) have hand-written upgrades; the Trap engine cards (Trap Kit, Master Trapper,
  Trapper's Dividend, Gleeful Trapsmith, Trap Door, Curtain Call) are named ♣, and an Aura's status on "the target" reads as a debuff.
- Robert's other two questions were not answered, so the recommendations stand: Pick a Card replaces a Defend, and the six cards
  are retired. Both are easy to undo.

The design as proposed follows. Prices are from `docs/14_CARD_COSTING.md`, against the pool after the costing pass
(`docs/TRICKSTER_REVIEW.md`).

## 1. The idea

The Trickster is a stage magician with a deck of cards. **Every card has a suit**, and the Suits build path rewards playing a
spread of them in one turn: a turn that shows all four suits is a full trick. You plan the order of a turn, not just its damage, and
**Hold** keeps the missing suit for next turn.

| Suit | What it means | Typical cards |
|---|---|---|
| ♠ Spades | Attacks | Strike, Veil Strike, Death Mark, Blindside |
| ♥ Hearts | Barrier and protection | Defend, Shadow Cloak, Fade Back, Perfect Alibi |
| ♦ Diamonds | Cards, Mana and Foresee | Cold Read, Hidden Hand, Sleight of Hand, Saved Breath |
| ♣ Clubs | Traps and debuffs | every Trap, Mark Prey, Unmask, Cripple |

**A Wild card counts as every suit.**

**The suit comes from what a card does**, so no one has to tag 900 cards and a Neutral or Rift-crossed card has a suit too:

1. an Attack is ♠, a Trap is ♣;
2. otherwise the card's first effect decides: Barrier, healing, Ghostly or Steadfast is ♥; draw, Foresee, Mana or a cost cut is ♦;
   a debuff on an enemy is ♣;
3. an Aura takes the suit of what it does each time;
4. a card can name its suit to override the rule (the Wild cards, and any card the rule gets wrong).

Every card shows its suit as a pip in the corner (♠ ♣ in ink, ♥ ♦ in red), but only for the Trickster: other classes don't see
them. A row of four pips beside the Mana lights up as each suit is played that turn, so you can see at a glance what's missing.

Suits are not poker: there are no hands to score, only how many suits you've shown this turn and which ones. That keeps the cards
short and stays clear of Balatro.

## 2. What the engine needs

All small and generic, each with rules tests:

- **A suit per card** (`suitOf(card)`: the rule above plus an optional `suit` field, with `'wild'`).
- **Suits played this turn** on each side, cleared at the start of the turn. It is in the view, for the pip row.
- **Metrics:** `suits` (different suits played this turn, counting the card being played) and `spades`, `hearts`, `diamonds`,
  `clubs` (cards of that suit played this turn). They work with the existing `per`, `when` and `cheaperPer`.
- **A trigger, `allSuits`:** the first time in a turn that all four suits have been played. It is for Auras.

## 3. The Suits build path (replaces Patience)

The path holds 6 commons, 9 uncommons and 7 rares (DECISIONS #341): 10 cards it keeps from Patience and 12 new ones.

**How the "per suit" cards are priced:** a Suits deck shows about **2.5 suits** by the time a payoff is played (3 with planning, 4 on
a good turn); a payoff that needs 3 or more suits comes off about 50% of the time.

### Kept from Patience

| Card | Suit | Rarity |
|---|---|---|
| Cold Read, Weigh the Odds, Hidden Hand | ♦ | common |
| Patient Blade | ♠ | common |
| Shadow Cloak | ♥ | common |
| Fade Back | ♥ | uncommon |
| Long Con | ♠ | uncommon |
| Trick of the Light | ♦ | uncommon |
| Second Act, Pickpocket Master | ♦ | rare |

### New cards (12)

| Card | Cost, type, rarity, suit | Text | Points / budget |
|---|---|---|---|
| **Flourish** | 1, Attack, common, ♠ | Deal 7 damage. If you have played a ♥ this turn: gain 4 Barrier. | 7 + 0.6 x 4.8 = 9.9 / 10 |
| **Card Fan** | 1, Attack, uncommon, ♠ | Deal 4 (+3 per suit played this turn) damage. | 4 + 3 x 2.5 = 11.5 / 11.2 |
| **Card Sharp** | 1, Attack, uncommon, ♠ | Deal 7 damage. If it is the first ♠ you have played this turn: deal 7 more. | 7 + 0.6 x 7 = 11.2 / 11.2 |
| **Cut the Deck** | 1, Skill, uncommon, ♦ | Draw 2 cards. If you have played 3 or more suits this turn: gain 1 Mana. | 7 + 0.5 x 7 = 10.5 / 11.2 |
| **Queen of Hearts** | 1, Skill, uncommon, ♥ | Gain 5 (+2 per suit played this turn) Barrier. | (5 + 5) x 1.2 = 12 / 11.2 |
| **Ace of Clubs** | 1, Skill, uncommon, ♣ | Apply 2 Exposed and 1 Faltering. If you have played 3 or more suits this turn: draw 1 card. | 6 + 3 + 0.5 x 3.5 = 10.8 / 11.2 |
| **Wild Card** | 0, Skill, uncommon, Wild | Counts as every suit. Draw 1 card. | 4 + ~3 (fills a suit) = 7 / 6.7 |
| **Royal Flourish** | 2, Attack, rare, ♠ | Deal 7 damage for each suit you have played this turn (this one included). | 7 x 3 = 21; 28 with all four / 23.8 |
| **Showstopper** | 3, Attack, rare, ♠ | Deal 30 damage. Costs 1 less for each suit you have played this turn. | 30, usually for 1-2 Mana / 35 |
| **The Joker** | 1, Skill, rare, Wild | Counts as every suit. Add a random card from your pool to your hand; it costs 0 this turn. | ~9 + ~3 = 12 / 12.5 |
| **The Whole Deck** | 1, Aura, rare, ♦ | The first time each turn you have played all four suits: draw 2 cards, and next turn gain 1 Mana. | 11.5 a trick x ~2 tricks in 4 turns = 23 (1.15x of a rare's 2x) |
| **Masquerade** (reworked; id kept) | 2, Aura, rare, ♦ | Whenever you play a card of a suit you haven't played yet this turn: deal 3 damage to ALL enemies. | ~2.8 new suits a turn x 3.9 = 11 a turn, 44 in 4 turns (1.15x) |

**Checks (guide §8):**
- **Wild Card** is 0 Mana and draws, but it doesn't return itself, so it isn't a loop.
- **Showstopper** at 0 Mana needs 3 suits shown first, three cards spent. That is a fair 30.
- **Royal Flourish** tops out at 28.
- **Masquerade** pays at most 4 times a turn (once per suit).
- **The Joker's** free card is random.

### Leaves the path

| Card | Goes to | Why |
|---|---|---|
| Gleeful Trapsmith | **Traps** | It was a Trap payoff filed under Patience. |
| Saved Breath, Stolen Moment, Deep Pockets | glue (♦) | Mana for any build. |
| Frozen Moment, The Long Game | glue, **uncommon** | Not build-defining. The Long Game at 1 Mana is on an uncommon Aura's budget (16 against 15). |
| Banked Breath | retired into Patient Guard | "Keep your Mana" pulls against playing many suits. |
| Coiled Patience | retired into Masquerade | Same reason; Masquerade takes its place. |
| Sandbag | retired into Card Sharp | Same reason. |
| Waiting Game | retired into Card Fan | Hand size is the old Patience payoff. |
| Measured Breath | retired into Saved Breath | Two "+2 Mana next turn" cards. |
| Fade Away | retired into Between Worlds | Two Ghostly rares; it keeps the rare count in line. |

## 4. The starter deck

The starter has no ♦: 3 Strikes ♠, 4 Defends ♥, 2 Veil Strikes ♠ and Set the Web ♣. To show the mechanic from the first turn, one
Defend becomes a new basic:

| Card | Cost, type, suit | Text | Points |
|---|---|---|---|
| **Pick a Card** | 0, Skill, basic, ♦ | Foresee 2. | ~4.5 (75% of a 0-cost common) |

That leaves 3 Strikes, 3 Defends, 2 Veil Strikes, Set the Web and Pick a Card: all four suits, so a lucky first hand can show a full
trick.

The trait, **Lying in Wait** (6 Barrier and 2 more cards at the start of a fight, 4 Barrier every turn), helps every build path and
stays.

## 5. Totals

| | After the costing pass | After Suits |
|---|---|---|
| Trickster cards (own pool, basics included) | 78 | **85** (78 - 6 retired + 12 new + Pick a Card) |
| Common / uncommon / rare | 20 / 31 / 25 | **20 / 35 / 26** (the baselines: 20 / 35-36 / 24-27) |
| Build paths | Traps, Exposed, Patience | **Traps, Exposed, Suits** |

The uncommon gap the costing pass left (§6 of the review) closes.

## 6. Questions for Robert

1. **Suit pips on the cards only for the Trickster** (as proposed), or on every class's cards? Other classes would see suits that do
   nothing for them.
2. **Pick a Card in the starter** in place of a Defend: yes, or leave the starter alone?
3. **Retire six cards** (Banked Breath, Coiled Patience, Sandbag, Waiting Game, Measured Breath, Fade Away), or keep some as glue?
   Keeping them would leave the pool at 91 cards.
