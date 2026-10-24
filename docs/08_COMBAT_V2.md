# Shattered Rifts: Combat v2 (Slay-the-Spire-style)

> **Status: design, approved in direction by Robert on 2026-10-23.** The details below are my proposals with defaults;
> items marked **(confirm)** are the ones I want a second opinion on. Decision log: `docs/DECISIONS.md` #86.
> This supersedes the duel rules in `01_GAME_DESIGN.md §3` for runs **and** PvP. The old engine stays in the repo until
> the new one replaces it (see §10).

Robert's brief: *"full Slay-the-Spire style runs, combat and mechanics ... build a variant that includes PvP."* Some
Riftwalkers specialise in summons and some enemies do as well; some characters have no companions, some have companion
cards that buff them, some have companions that fight and defend for them. Side-to-side combat, the Riftwalker is a
character in the fight, and with one enemy you should not have to aim.

## 1. Pillars

1. **Fast and readable.** A normal fight is 1–3 minutes. Everything the enemy is about to do is shown above its head.
2. **Every turn is a small puzzle** with a clear best line, not a chain of prompts. **No response windows**: nothing
   interrupts your turn.
3. **Your Riftwalker is a person on the field**, not a life counter. Their deck, Sigil and companions are who they are.
4. **Traps survive, as Traps.** The trap-driven identity of the game stays, but Traps fire automatically (§6), so
   they add surprise without stopping the game.
5. **One engine for runs and PvP.** Enemies are scripted "players" that telegraph; a PvP opponent is a human (or AI)
   playing cards. Same rules, same cards, same animations.
6. **Original IP.** Mechanics like energy, block and intents are generic; our names, cards, art and look are our own
   (we do not reuse Slay the Spire's card names or its status names).

## 2. The field (side to side)

```
  YOUR SIDE                                         ENEMY SIDE
  Hero  Ally1  Ally2  Ally3          |          Enemy1  Enemy2  Enemy3  Enemy4
  [HP]  [HP]   [HP]   [HP]         centre         [HP]    [HP]    [HP]    [HP]
        intent arrows above enemies ->  (what each will do next turn)
  Traps: face-down sigils on the ground below your side (max 3)
```

- The **hero** stands at the far end of their side; **allies** (companions/minions) stand between hero and centre
  (max **3**). The enemy side mirrors this: up to **4 enemies** (bosses are 1–3 with summons).
- **One enemy: no aiming.** If a card has exactly one legal target it is played on drop. With several, you drop the
  card on the one you want (or click it). Cards that hit "all enemies" or "a random enemy" never ask.
- Everyone has **HP** and **Barrier** (§4) shown on a bar under the figure; **intents** float above enemies.

## 3. Turn structure

1. Barrier you had falls away, unless you are **Fortified**, which keeps 75% of it (rounded down).
1. Barrier you had falls away (unless a card says it stays).
2. Gain **Mana** equal to your max (base **3**); draw up to **5** cards (hand limit 10).
3. Play cards in any order, as many as you can pay for. Allies act automatically when you press **End turn**
   (§5), unless a card tells one to act now.
4. End turn: unspent Mana is lost, your hand is discarded (except **Retain** cards), end-of-turn effects fire.

**Enemy turn**
1. Their old Barrier falls.
2. Each enemy performs the **intent it was showing**, left to right. Enemy allies/summons act the same way.
3. Each enemy then chooses and shows its next intent.

*"Mana" is our word for the play resource (decision #72), and its base is 3 per turn (confirm).*
Hand is **5 cards**, deck is **20+**, reshuffle the discard pile when the draw pile is empty. First turn of a fight:
draw 5, +1 draw for the second player in PvP (§8).

## 4. Stats and statuses

- **HP**: 0 = defeated. **Damage**: the number on an attack. **Barrier**: absorbs damage first, then goes away on
  your next turn (our word for block).
- A small, own-named status set (each has a number of turns or stacks):

| Status | Effect |
|---|---|
| **Exposed** | Takes 50% more damage from attacks. |
| **Faltering** | Deals 25% less damage with attacks. |
| **Might** | +1 damage per stack on every attack (permanent for the fight). |
| **Bleed** | Takes damage equal to stacks at the start of its turn, then loses 1 stack. |
| **Stunned** | Skips its next action (its intent is cancelled). |
| **Thorns** | Deals stacks damage back to anything that hits it with an attack. |
| **Shielded** | Ignores the next instance of damage, then pops. |

- Damage order: Might adds, Faltering/Exposed multiply, **Barrier** takes the hit first, then **HP**.

## 5. Allies (companions and minions)

- An ally has **HP** and a **role** with a visible intent like an enemy's, but chosen by its card:
  **Fighter** (attacks the front-most or lowest-HP enemy), **Guard** (gains Barrier for you / takes hits for you),
  **Support** (heals or buffs), or **Fixed** (a one-off effect when it arrives, then it is just a body).
- Allies act when you press **End turn**, left to right, before the enemy turn. Enemies choose their targets by
  their own rule (default: minions first, front-most first, then the hero; some prefer the lowest-HP target; **Taunt** allies must be hit first).
- Allies are **summoned by cards** (they cost Mana like any card) or **granted by a Sigil** at the start of a fight.
- Enemy summoners add enemies to their side the same way (up to 4).

### How Riftwalkers differ (confirm)
| Riftwalker | Companions | Style |
|---|---|---|
| **Ser Maren Ashcourt** (Aurelion) | **None.** A few cards give an ally **Shielded**; mostly Barrier and retaliation. | Sturdy: Barrier, Thorns, punish attackers. |
| **Rivet** (Nexus) | **Fighting drones.** Starts each fight with one Drone (Sigil); many cards make more and upgrade them. | Go wide, then Assemble. |
| **Kesh the Unfed** (Wyldmaw) | **Buffed, not summoned.** Cards give his Pack (1–2 pups, from one card) Might and feed them. | Hit hard, hurt yourself, snowball. |
| **Vesper Nightlace** (Umbral) | **None** (shadows are Traps, not bodies). | Traps, Exposed/Faltering, bluffing. |

| **Quill** (Umbral) | **None.** Shivs are cards, not bodies. | Shivs, Bleed, discard (docs/09). |
| **Ilvane** (Nexus-9) | **None.** Runes sit in a row. | Channel, evoke, Resonance. |
| **Sehra** (Aurelion) | **None.** | Stances and Mantra. |
| **Obsidia** (The Hollow Crown; id astra) | **None.** | Arcana and the Obsidian Blade. |

See `09_ROSTER.md` for the lanes of all eight and the rules every pool follows.

Enemies mirror this: Aurelion enemies stack Shielded and Barrier; Nexus enemies bring Drones; Wyldmaw enemies come in
packs; Umbral enemies set Traps of their own and debuff.

## 6. Traps (our traps)

- A **Trap** is a face-down card set from your hand (costs its Mana to set). It shows as a sealed sigil.
- It has a **trigger** printed on it ("when an enemy attacks you", "when you take 10+ damage", "when an enemy
  gains Barrier"). When the trigger happens it **springs automatically**, with the reveal animation, and its effect
  resolves at once. No window, no choice, no waiting.
- Max **3** Traps set; a sprung Trap is spent. Against the AI you can read intents and set the right Trap;
  against a human it is bluffing. Enemies can have Traps too (shown as sealed sigils on their side).
- Because intents are visible, Traps are *planning* tools against enemies and *reads* in PvP.

## 7. Enemies and intents

- Each enemy has **HP**, a **move set**, and a **pattern**: *cycle*, *weighted random*, or *phases* (changes at HP
  thresholds). Its **next move is shown** as an icon plus a number: Attack (damage × hits), Defend (Barrier), Buff,
  Debuff, Summon, Stun, or Unknown (only on veiled bosses).
- **Elites** have more HP and a nastier pattern; **Wardens** (bosses) have phases, signature mechanics and Omens
  (telegraphed countdowns, as in `03_CAMPAIGN.md §4`) that now simply become their intents.
- Enemy stats are data in `packages/content`, not code.

## 8. PvP

> **Built (DECISIONS #161):** the first playable version is described in `11_PVP.md`. The bullets below are the design it follows; the turn clock is 75 s with two missed turns forfeiting, and the second player's head start is the engine's (+1 Mana, +1 card on their first turn).

- Two heroes, each with their run deck and Sigil, each with up to 3 allies and 3 Traps. Turns **alternate**; your turn
  is the player turn in §3, and during it you pick targets on the other side (hero or ally; Taunt applies).
- No intents (the opponent is a person); you see their board, their Traps as sealed sigils, and their hand size.
- The second player draws 1 extra card on their first turn and gets 1 free Mana of "Rift Spark" on turn 1 (confirm,
  balance later). Turn timer 60 s with a bank.
- The engine is the same, so the existing PvP plans (ghosts, seasons, tournaments) still apply; only the duel rules change.

## 9. Campaign changes

Keeps the structure of `03_CAMPAIGN.md` (map, rewards, shrines, merchant, events, Wardens, Bank/Continue, Tiers):

- **HP persists between fights** like Slay the Spire (confirm): you start the run at the character's max HP, heal
  at Shrines (rest) and a little after elites. **Resolve** stays as the lives system: reaching 0 HP loses the fight and
  **1 Resolve** (2 for Elite/Warden) and you retry the fight at the HP you entered with; 0 Resolve = Rift Collapse.
- **Boons** (run relics) become much more important and are scheduled soon after combat is built.
- Rewards stay "pick 1 of 3 or skip"; Tempering becomes "upgrade a card" (a `+` version).

## 10. How we build it (milestones)

| | What | Notes |
|---|---|---|
| **C0** | This document + decision #86 | done |
| **C1** | `packages/combat`: pure, seeded engine: entities, turn loop, Mana/draw/discard, damage/Barrier/statuses, card effect DSL v2, allies, Traps, enemy intents. Unit + property tests, a CLI fight. | old engine untouched |
| **C2** | Content v2 in `packages/content`: card schema v2 + the four starter decks + ~25 cards each; ~15 enemies with intent patterns, 2 elites, 1 Warden to prove it. | rewrite of the 74 cards in the new model |
| **C3** | New fight screen: side-to-side Pixi scene (reuse monsters, avatars, juice, reveal), intents, targeting-by-drop, auto-aim, hand, HUD. | reuses most of `apps/web/src/duel` |
| **C4** | Campaign wired to the new fights (map/rewards/shrine/merchant already built), HP persistence, Resolve rules. | reuses `packages/campaign` |
| **C5** | Full enemy roster, all Wardens + Vorthax, Boons, upgrades, remaining Riftwalker cards. | |
| **C6** | PvP on the same engine (turn alternation, no intents). | after the PvE loop is fun |

The current duel (`#/play`, `#/run`) keeps working until C4 replaces it. The old engine/AI/tests are deleted at the end of
C4, not before.

## 11. Open questions (my defaults are in brackets)

1. Base Mana 3 and a 5-card hand. [yes]
2. HP persists between fights (StS) instead of resetting; Resolve as lives. [yes]
3. Allies act automatically on End turn, in order. [yes; Fighters hit the front-most enemy]
4. Companion mixes per Riftwalker as in §5. [as listed]
5. Status names (Exposed, Faltering, Might, Bleed, Stunned, Thorns, Shielded) and "Barrier". [as listed]
