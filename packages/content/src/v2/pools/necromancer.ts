// Dorian Blackthorn, the necromancer (Gloomfen). He is the Slay the Spire 2 Necrobinder on purpose, for now (Robert, 2026-10-28: "close
// copies of the originals, but obviously change names and keep our theme, i will adjust things going forward, but we need good
// baselines right now"): one card for every Necrobinder card under an original name, and nothing else. Each card's comment names the
// Necrobinder card it imitates; numbers, costs and rarities are hers (StS2 v0.111.0, spire-codex.com) unless a comment says why not.
// The only Necrobinder cards missing are Strike and Defend (his are the Neutral ones) and Forbidden Grimoire (it removes a card from
// your deck after the fight: the fight engine has no piece for that). The tokens Gravesoul (her Soul) and Baleful Glance (her
// Sweeping Gaze) are hers too.
//
// Her one companion, Osty, is his Thralls, several at once ("lets keep our ability to summon multiple minions"):
//   - Summon N is Raise Dead N: a Bone Thrall rises with N HP; with every companion slot taken, the healthiest gains N max HP
//     instead (#684).
//   - Since #684 Thralls also strike on their own (Osty does not): the cards that make Osty attack make EACH companion strike ("Your companions
//     each deal 6 damage"), and what reads Osty's HP reads each Thrall's own.
//   - "Osty heals" grows every Thrall (a heal on a companion grows it anyway, DECISIONS #356); "Osty dies" sacrifices each one.
// Her Doom is his Fate (id doom), Ethereal is Fleeting, Retain is Hold, Exhaust is Consume, Strength is Might (a loss of it is Sapped,
// since Might cannot go below 0), Weak is Faltering, Vulnerable is Exposed, Block is Barrier, Intangible is Ghostly.
//
// The headings below are only a first sort:
//   Fate    - curse enemies with Fate, then cash it in
//   Thralls - raise Thralls, grow them, and command them to strike
//   Souls   - Gravesouls and Fleeting cards: draw, Mana, and what grows with them
// Numbers assume 3 Mana and a 5-card hand.

import type { CardDef, Op } from '@sr/combat';
import {
  addTo,
  barrier,
  command,
  copySelf,
  dmg,
  doomNow,
  draw,
  drawNext,
  exhaustN,
  exhaustTop,
  fetchCards,
  forge,
  growHp,
  lose,
  loseHpScaled,
  mana,
  manaNext,
  mark,
  on,
  per,
  pool,
  raise,
  raiseColossus,
  scaled,
  spreadDebuffs,
  status,
  statusTheirs,
  when,
} from '../build';

const g = pool('necromancer', 'gloomfen');

/** her "Osty Attacks": the cards that make the Thralls strike (Squeeze counts them) */
const CMD = { tags: ['command'] };
/** a companion gives itself up (Bone Shards: "Osty dies") */
const DIES: Op = { op: 'sacrifice', self: true };
/** a Command for the Bone Thralls alone (#684) */
const thralls = (...ops: Op[]): Op => ({ op: 'command', ops, unit: 'bone-thrall' });

export const NECROMANCER: CardDef[] = [
  // --- basics and tokens ---
  // (Bodyguard)
  g('basic', 'raise-thrall', 'Raise Thrall', 'skill', 1, 'none', [raise(5)]),
  // (a hit that curses: a third class basic, Robert 2026-10-30)
  g('basic', 'marked-for-the-grave', 'Marked for the Grave', 'attack', 1, 'foe', [
    dmg(6),
    status('doom', 4, 'target'),
  ]),
  // (Unleash: each Thrall strikes for 6 plus its own HP. 4 plus half its HP since #691: with Thralls that strike and grow, two copies
  // in the starter came to ~2.2x a basic's budget; now (4 + ~2.5) x 1.6 companions ≈ 10.4, 130%; upgraded 6 + half, +31%)
  g(
    'basic',
    'off-the-leash',
    'Off the Leash',
    'attack',
    1,
    'foe',
    [command(scaled(dmg(4), per('hp', 0.5)))],
    { ...CMD, up: { effects: [command(scaled(dmg(6), per('hp', 0.5)))] } },
  ),
  // (Soul: the token most of the Souls cards make)
  g('common', 'gravesoul', 'Gravesoul', 'skill', 0, 'none', [draw(2)], {
    exhaust: true,
    source: 'token',
    tags: ['soul'],
    up: { effects: [draw(3)] },
  }),
  // (Sweeping Gaze: the token Sentry Mode makes)
  g(
    'common',
    'baleful-glance',
    'Baleful Glance',
    'attack',
    0,
    'none',
    // (11 since #691, to bring Ever Watchful to A: ~18 a Glance over three turns, 54 against a 2-Mana rare Aura's 38)
    [command(dmg(11, 'randomFoe'))],
    { exhaust: true, ethereal: true, source: 'token', ...CMD },
  ),

  // --- Thralls ---
  // (Afterlife)
  g('common', 'after-the-end', 'After the End', 'skill', 1, 'none', [raise(6)], {
    exhaust: true,
    up: { effects: [raise(9)] },
  }),
  // (Flatten)
  g('common', 'bone-crush', 'Bone Crush', 'attack', 2, 'foe', [command(dmg(12))], {
    ...CMD,
    freeIf: { by: 'allyStrikes', atLeast: 1 },
    up: { effects: [command(dmg(16))] },
  }),
  // (Invoke)
  g(
    'common',
    'call-at-dusk',
    'Call at Dusk',
    'skill',
    1,
    'none',
    [on('turnStart', [raise(2), mana(2)], { times: 1 })],
    // (Consume since #710: a card that gives more Mana than it costs is spent, Robert)
    { exhaust: true, up: { effects: [on('turnStart', [raise(3), mana(3)], { times: 1 })] } },
  ),
  // (Poke)
  g('common', 'knucklebone', 'Knucklebone', 'attack', 0, 'foe', [command(dmg(6))], CMD),
  // (Pull Aggro)
  g('common', 'bone-bulwark', 'Bone Bulwark', 'skill', 2, 'none', [raise(5), barrier(8)], {
    up: { effects: [raise(6), barrier(10)] },
  }),
  // (Snap)
  g('common', 'bone-snap', 'Bone Snap', 'attack', 1, 'foe', [command(dmg(7)), mark('retain')], CMD),
  // (Bone Shards: each Thrall strikes every enemy and dies, and you gain 9 Barrier for each)
  g(
    'uncommon',
    'bone-rain',
    'Bone Rain',
    'attack',
    // (2 Mana since #691: fresh 3-HP Thralls cost almost nothing to give up, so at 1 it came to ~195%; ~21.6 with ~1.6 Thralls, 101%;
    // upgraded 10 Barrier and 11 to all, +28%)
    2,
    'none',
    // (its Thralls only, #684: a Grave Colossus is never given up to it, and only a Thrall given up pays the Barrier)
    [thralls(barrier(9, 'hero'), dmg(9, 'allFoes'), DIES)],
    {
      ...CMD,
      up: { effects: [thralls(barrier(10, 'hero'), dmg(11, 'allFoes'), DIES)] },
    },
  ),
  // (Calcify. Marrow reaches every companion hit, the end-of-turn strikes too: Marrow 4 for 1 was ~48 over four turns, ~320%. Since
  // #691 2 Mana, Marrow 2 and Raise 5: ~32 against a 2-Mana uncommon Aura's 28.5, 112%; upgraded it costs 1, ~+28%)
  g('uncommon', 'calcify', 'Ossify', 'power', 2, 'none', [status('marrow', 2), raise(5)], {
    up: { cost: 1 },
  }),
  // (Cleanse: the top card of your draw pile is consumed, as there is no choosing from the draw pile)
  g('uncommon', 'bone-sift', 'Bone Sift', 'skill', 1, 'none', [raise(5), exhaustTop(1)]),
  // (Fetch)
  g(
    'uncommon',
    'bone-toss',
    'Bone Toss',
    'attack',
    0,
    'foe',
    [command(dmg(3)), when('samePlayed', { atMost: 0 }, [draw(1)])],
    { ...CMD, up: { effects: [command(dmg(6)), when('samePlayed', { atMost: 0 }, [draw(1)])] } },
  ),
  // (High Five)
  g(
    'uncommon',
    'grasping-hands',
    'Grasping Hands',
    'attack',
    2,
    'none',
    // (9 since #691: ~24 a cast, 113%; upgraded 11 and 3 Exposed, +30%)
    [command(dmg(9, 'allFoes')), status('exposed', 2, 'allFoes')],
    { ...CMD, up: { effects: [command(dmg(11, 'allFoes')), status('exposed', 3, 'allFoes')] } },
  ),
  // (Legion of Bone: "ALL players Summon 6". Alone, "all players" was only you, a 2-Mana After the End; it raises two Thralls
  // instead, as it would for a pair of players: 2 x Raise 6 is ~20 points against a 2-cost uncommon's ~26 with Consume, docs/14)
  g(
    'uncommon',
    'army-of-the-drowned',
    'Army of the Drowned',
    'skill',
    2,
    'none',
    [raise(6, 'bone-thrall', 2)],
    {
      exhaust: true,
    },
  ),
  // (Rattle: harder for every other time your Thralls have struck this turn)
  g(
    'uncommon',
    'rattle-the-bones',
    'Rattle the Bones',
    'attack',
    1,
    'foe',
    // (6 + 2 a strike since #691: ~12 a cast, 109%; upgraded 8 + 2, +26%)
    [command(scaled(dmg(6), per('allyStrikes', 2)))],
    {
      ...CMD,
      up: { effects: [command(scaled(dmg(8), per('allyStrikes', 2)))] },
    },
  ),
  // (Right Hand Hand)
  // (3 since #691, and it comes back once a turn: 4.8 + ~3 for the return, 116%; upgraded 4, +21%, the nearest whole number)
  g('uncommon', 'helping-hand', 'Helping Hand', 'attack', 0, 'foe', [command(dmg(3))], {
    ...CMD,
    recallOnCost: 2,
    up: { effects: [command(dmg(4))] },
  }),
  // (Sic 'Em: whenever a Thrall hits it this turn, another rises)
  g(
    'uncommon',
    'seize-them',
    'Seize Them',
    'attack',
    1,
    'foe',
    // (Command 4 and Quarry 2 since #691: the end-of-turn strikes hit the quarry too, so 5 and Quarry 3 came to ~150-195%; now
    // ~110-137%; upgraded Quarry 3, ~+30%)
    [command(dmg(4)), status('quarry', 2, 'target', true)],
    { ...CMD, up: { effects: [command(dmg(4)), status('quarry', 3, 'target', true)] } },
  ),
  // (Spur. Raise 3 and +3 max HP to all since #691: 12.7, 113%; upgraded Raise 4 and +4, +31%)
  g('uncommon', 'goad', 'Goad', 'skill', 1, 'none', [raise(3), growHp(3, 'allAllies')], {
    retain: true,
    up: { effects: [raise(4), growHp(4, 'allAllies')] },
  }),
  // (Necro Mastery)
  g(
    'rare',
    'shared-agony',
    'Shared Agony',
    'power',
    2,
    'none',
    [raise(5), on('allyHurt', [loseHpScaled(per('lost'), 'allFoes')])],
    // (upgraded it costs 1 since #691, ~+35% on an engine Aura: Raise 8 was only +7%)
    { up: { cost: 1 } },
  ),
  // (was Reanimate, Raise 20 and Consume. Since #684 it summons the Grave Colossus: 18 HP (22 upgraded), Taunt, 2 slots, strikes for
  // 2 + 1 per 4 max HP and takes half of a Command. ~40 points (21.6 HP + 3 body + 6 x ~2.5 acts) less ~5 for its second slot: a
  // 3-Mana rare's 35)
  // (Raise Colossus, Robert 2026-11-07: with no room for another, the Colossus standing gains the HP instead: HP only, no Might, unlike
  // the Engineer's Salvage. Grown, it is ~22 points (18 sticky HP and +4.5 a hit), under the summon's ~35, never a dead draw)
  // (22 since #691, a rare in A: 26.4 HP + 3 + ~7.5 a hit x 3 less 5 ≈ 47, 134%; upgraded 29, +29%)
  g('rare', 'grave-colossus', 'Grave Colossus', 'skill', 3, 'none', [raiseColossus(22)], {
    up: { effects: [raiseColossus(29)] },
  }),
  // (Robert 2026-11-08, DECISIONS #688: a death curses every enemy. Cut the same day after 0.229: 3 + half its max HP to ALL fed on the
  // Thrall raised every turn and hit whole packs, Fleshcraft once per enemy per death. Now a quarter of its max HP, no flat part, at most 3
  // times a turn: a fresh 3-HP Thrall gives nothing, a grown 20-HP one 5 Fate to all, a 40-HP Colossus 10. ~3 deaths of ~16 HP over four
  // turns is ~12 Fate to all, ~11 points against a 2-Mana rare Aura's ~33 on one enemy, ~2-3x that against a group; upgraded it costs 1.
  // Released companions (making way for a Colossus) do not die, so do not count.)
  // (#691: a quarter at 2 Mana came to ~29%. Now 1 Mana and half, still 3 a turn: ~5 deaths of ~12 HP over four turns is 30 Fate to
  // all, ~27 against a 1-Mana rare Aura's 20, 135%; upgraded two thirds, +33%)
  g(
    'rare',
    'grave-debt',
    'Grave Debt',
    'power',
    1,
    'none',
    [
      on('allyDies', [scaled(status('doom', 0, 'allFoes'), per('diedMaxHp', 0.5))], {
        perTurnLimit: 3,
      }),
    ],
    {
      up: {
        effects: [
          on('allyDies', [scaled(status('doom', 0, 'allFoes'), per('diedMaxHp', 2 / 3))], {
            perTurnLimit: 3,
          }),
        ],
      },
    },
  ),
  // (a smaller Colossus that is consumed, Robert 2026-11-07: 14 HP (16.8) + 3 body + its ~5 hit over two or three turns, less ~5 for
  // its second slot, ~26 against a 2-Mana uncommon's ~21 with Consume's +25%, ~27; upgraded 18)
  g('uncommon', 'raise-colossus', 'Raise Colossus', 'skill', 2, 'none', [raiseColossus(14)], {
    exhaust: true,
    up: { effects: [raiseColossus(18)] },
  }),
  // (Sacrifice: the chosen Thrall dies, and you gain twice its max HP as Barrier)
  g(
    'rare',
    'fen-offering',
    'Fen Offering',
    'skill',
    1,
    'ally',
    // (draw 1 since #691: ~17, 136%; upgraded 4 more Barrier, +28%, in place of costing 0)
    [scaled(barrier(0), per('maxHp', 2, 'target')), { op: 'sacrifice' }, draw(1)],
    {
      retain: true,
      // (one op, so the preview shows no number until a companion is aimed at)
      up: { effects: [scaled(barrier(4), per('maxHp', 2, 'target')), { op: 'sacrifice' }, draw(1)] },
    },
  ),
  // (Sentry Mode)
  g(
    'rare',
    'ever-watchful',
    'Ever Watchful',
    'power',
    2,
    'none',
    [on('turnStart', [addTo('baleful-glance')])],
    { up: { cost: 1 } },
  ),
  // (Squeeze was every companion striking for 20 + 5 per Command card in the deck: with Thralls that strike, four of them dealt 300 on
  // turn 2. Now the hero's own blow, growing with the Commands played this fight: Robert 2026-11-08, DECISIONS #687)
  g(
    'rare',
    'death-grip',
    'Death Grip',
    'attack',
    // (2 Mana, 10 + 6 a Command, after Robert found it useless next to The Drowned King: ~22/58/100 on turns 2/6/10, #689.
    // A finisher since #696, Robert: 8 + 4 a Command, double against an enemy at half HP or less. ~24 by turn 4, ~48 at half HP:
    // ~36 on average, 152%; late, ~48 and ~96 to finish. Upgraded 10 + 5, +25%)
    2,
    'foe',
    [
      {
        ...scaled(dmg(8), { by: 'tagPlayed', tag: 'command', mult: 4 }),
        finisher: { belowPct: 50, mult: 2 },
      } as Op,
    ],
    {
      up: {
        effects: [
          {
            ...scaled(dmg(10), { by: 'tagPlayed', tag: 'command', mult: 5 }),
            finisher: { belowPct: 50, mult: 2 },
          } as Op,
        ],
      },
    },
  ),
  // (Protector, an Ancient card in her game: here a Rare)
  // (every companion striking for 10 + its max HP for 1 Mana was ~60 mid-fight and ~130 with four grown Thralls once they grew and
  // multiplied, #684; now only the healthiest strikes, for 2 Mana: ~30 from a 20-HP Thrall, ~50 from a 40-HP one, a Colossus at half
  // like every Command. Robert 2026-11-08, DECISIONS #689)
  g(
    'rare',
    'the-drowned-king',
    'The Drowned King',
    'attack',
    2,
    'foe',
    // (15 + max HP since #691, a rare in A: ~31 from a 16-HP Thrall, 131%; upgraded 16 + 1.5x max HP, +29%)
    [{ op: 'command', ops: [scaled(dmg(15), per('maxHp'))], healthiest: true }],
    {
      ...CMD,
      up: {
        effects: [{ op: 'command', ops: [scaled(dmg(16), per('maxHp', 1.5))], healthiest: true }],
      },
    },
  ),
  // --- blood and bone: HP and consumed cards grow the dead (#684) ---
  // (lose 5 HP (-7.5), Raise Dead 10 (12, +3 when it brings a new Thrall), and Grave Chill's first-HP-lost growth (~4.8): ~9.3 into a
  // full board, ~12.3 with a slot free: ~11, a 1-Mana uncommon. 12 priced at ~14.7, over budget: review of #684)
  g('uncommon', 'blood-offering', 'Blood Offering', 'skill', 1, 'none', [lose(5), raise(10)], {
    up: { effects: [lose(5), raise(13)] },
  }),
  // (each companion +3 max HP for the card consumed (~7 at two companions), Grave Chill's 3 Fate for it, and a weak card gone: a 0-Mana
  // uncommon. Nothing consumed, nothing grows)
  g(
    'uncommon',
    'bone-feast',
    'Bone Feast',
    'skill',
    0,
    'none',
    [exhaustN(1), scaled(growHp(0), per('exhaustedNow', 3))],
    { up: { effects: [exhaustN(1), scaled(growHp(0), per('exhaustedNow', 4))] } },
  ),
  // (an Aura: each turn lose 3 HP (-4.5), Raise Dead 5 (6, +3 when it brings a Thrall) and Grave Chill's growth (~4.8): ~6.3 a turn,
  // ~25 over four turns against a 2-Mana uncommon Aura's ~28)
  g(
    'uncommon',
    'grave-tithe',
    'Grave Tithe',
    'power',
    2,
    'none',
    // (lose 2 since #691: ~7.8 a turn, ~31, 109%; upgraded Raise 7, +31%)
    [on('turnStart', [lose(2), raise(5)])],
    { up: { effects: [on('turnStart', [lose(2), raise(7)])] } },
  ),

  // --- Fate ---
  // (Blight Strike)
  g(
    'common',
    'rot-strike',
    'Rot Strike',
    'attack',
    1,
    'foe',
    [dmg(8), scaled(status('doom', 0, 'target'), per('dealt'))],
    { up: { effects: [dmg(10), scaled(status('doom', 0, 'target'), per('dealt'))] } },
  ),
  // (Negative Pulse)
  g(
    'common',
    'creeping-end',
    'Creeping End',
    'skill',
    1,
    'none',
    [barrier(5), status('doom', 7, 'allFoes')],
    { up: { effects: [barrier(6), status('doom', 11, 'allFoes')] } },
  ),
  // (Scourge)
  g(
    'common',
    'tolling-bell',
    'Tolling Bell',
    'skill',
    1,
    'foe',
    [status('doom', 13, 'target'), draw(1)],
    { up: { effects: [status('doom', 16, 'target'), draw(2)] } },
  ),
  // (Countdown)
  g(
    'uncommon',
    'inevitable',
    'Inevitable',
    'power',
    1,
    'none',
    [on('turnStart', [status('doom', 6, 'randomFoe')])],
    { up: { effects: [on('turnStart', [status('doom', 9, 'randomFoe')])] } },
  ),
  // (Death's Door)
  g(
    'uncommon',
    'at-the-threshold',
    'At the Threshold',
    'skill',
    1,
    'none',
    // (5, and 5 + 5 more if you cursed this turn, since #691: Grave Chill's Fate makes the "if" true most turns, ~13.8, 123%;
    // upgraded 7 and 6 + 6, +29%)
    [barrier(5), when('doomedTurn', { atLeast: 1 }, [barrier(5), barrier(5)])],
    { up: { effects: [barrier(7), when('doomedTurn', { atLeast: 1 }, [barrier(6), barrier(6)])] } },
  ),
  // (Deathbringer)
  g(
    'uncommon',
    'the-final-hour',
    'The Final Hour',
    'skill',
    2,
    'none',
    [status('doom', 21, 'allFoes'), status('faltering', 1, 'allFoes')],
    { up: { effects: [status('doom', 26, 'allFoes'), status('faltering', 1, 'allFoes')] } },
  ),
  // (No Escape: 10 Fate, and 5 more for every 10 already on it)
  g(
    'uncommon',
    'last-rites',
    'Last Rites',
    'skill',
    1,
    'foe',
    [
      {
        op: 'status',
        status: 'doom',
        amount: 10,
        to: 'target',
        scale: { by: 'doom', mult: 5, of: 'target', step: 10 },
      },
    ],
    {
      up: {
        effects: [
          {
            op: 'status',
            status: 'doom',
            amount: 15,
            to: 'target',
            scale: { by: 'doom', mult: 5, of: 'target', step: 10 },
          },
        ],
      },
    },
  ),
  // (Shroud)
  g(
    'uncommon',
    'burial-shroud',
    'Burial Shroud',
    'power',
    1,
    'none',
    // (the first 2 curses each turn since #691: Grave Chill's Fate on every consumed card made it ~160%; ~17, 115%; upgraded the
    // first 3, ~+25%)
    [on('doomFoe', [barrier(2)], { perTurnLimit: 2 })],
    {
      up: { effects: [on('doomFoe', [barrier(2)], { perTurnLimit: 3 })] },
    },
  ),
  // (Sleight of Flesh. Once a turn since #691: Grave Chill curses on every consumed card, once per enemy, so 9 a debuff with no limit
  // was ~108 over four turns, ~380%. 8 once a turn, 32, 112%; upgraded 10, +25%)
  g(
    'uncommon',
    'fleshcraft',
    'Fleshcraft',
    'power',
    2,
    'none',
    [on('debuffFoe', [dmg(8, 'target')], { perTurnLimit: 1 })],
    {
      up: { effects: [on('debuffFoe', [dmg(10, 'target')], { perTurnLimit: 1 })] },
    },
  ),
  // (Borrowed Time; 5 Mana, not 4: with every card 1 dearer, 4 came to about nothing, DECISIONS #397. Since #691 the debt is paid next
  // turn instead: +4 Mana now, 2 less next turn, Consume: ~11.6, 104%; upgraded 1 less next turn, +34%. A turn never starts below 0)
  g(
    'uncommon',
    'toll-in-advance',
    'Toll in Advance',
    'skill',
    1,
    'none',
    [mana(4), manaNext(-2)],
    {
      exhaust: true,
      up: { effects: [mana(4), manaNext(-1)] },
    },
  ),
  // (Debilitate)
  g(
    'uncommon',
    'wither',
    'Wither',
    'attack',
    1,
    'foe',
    [dmg(10), status('debilitated', 2, 'target')],
    {
      up: { effects: [dmg(12), status('debilitated', 3, 'target')] },
    },
  ),
  // (Putrefy)
  g(
    'uncommon',
    'fester',
    'Fester',
    'skill',
    1,
    'foe',
    // (1 Faltering since #691: 11.1, 99%; upgraded back to 2, +33%)
    [status('faltering', 1, 'target'), status('exposed', 2, 'target')],
    {
      exhaust: true,
      up: { effects: [status('faltering', 2, 'target'), status('exposed', 2, 'target')] },
    },
  ),
  // (End of Days)
  g(
    'rare',
    'the-last-toll',
    'The Last Toll',
    'skill',
    // (2 Mana and 32 since #691: 31.8 against a 2-Mana rare's 23.75, 134%; upgraded 43, +30%)
    2,
    'none',
    [status('doom', 32, 'allFoes'), doomNow('allFoes')],
    { up: { effects: [status('doom', 43, 'allFoes'), doomNow('allFoes')] } },
  ),
  // (Oblivion: this turn every card you play curses that enemy. 4 since #691: ~3.5 cards x 4 x 0.7 ≈ 9.8, 131%; upgraded 5, +25%)
  g(
    'rare',
    'mark-of-ending',
    'Mark of Ending',
    'skill',
    0,
    'foe',
    [on('play', [status('doom', 4, 'target')], { temp: true, pin: true })],
    { up: { effects: [on('play', [status('doom', 5, 'target')], { temp: true, pin: true })] } },
  ),
  // (Reaper Form. 2 Mana since #691: Commands count as Attacks, ~60 over four turns against 38, ~158%; upgraded Opening hand, ~+35%)
  g('rare', 'reapers-mantle', "Reaper's Mantle", 'power', 2, 'none', [status('reaping', 1)], {
    up: { innate: true },
  }),
  // (Time's Up. Fate + 5 since #691: ~32 mid-fight, 135%; upgraded Fate + 15, +31%)
  g(
    'rare',
    'final-reckoning',
    'Final Reckoning',
    'attack',
    2,
    'foe',
    [scaled(dmg(5), per('doom', 1, 'target'))],
    { exhaust: true, up: { effects: [scaled(dmg(15), per('doom', 1, 'target'))] } },
  ),
  // (Misery; upgraded 8 and Hold since #691: 9 and Hold was +40%)
  g('rare', 'spreading-rot', 'Spreading Rot', 'attack', 0, 'foe', [dmg(7), spreadDebuffs], {
    up: { retain: true, effects: [dmg(8), spreadDebuffs] },
  }),
  // (Shared Fate. You lose 2 HP since #691, not 2 Sapped: a Command deck never felt its own Sapped, an attack deck lost more than it
  // gained (40-173%). 2 Sapped on the enemy for the fight (10.8) - 3 + 2.1 ≈ 9.9, 132%, and the HP lost feeds Grave Chill; upgraded no
  // HP loss, +30%)
  g(
    'rare',
    'common-grave',
    'Common Grave',
    'skill',
    0,
    'foe',
    [lose(2), status('sapped', 2, 'target')],
    {
      exhaust: true,
      up: { effects: [status('sapped', 2, 'target')] },
    },
  ),
  // (Neurosurge)
  g(
    'rare',
    'soul-tithe',
    'Soul Tithe',
    'power',
    0,
    'none',
    [
      mana(1),
      manaNext(2),
      draw(2),
      on('turnStart', [
        scaled(status('doom', 0, 'self'), {
          by: 'maxHp',
          of: 'self',
          mult: 0.02,
          min: 3,
          round: 'ceil',
        }),
      ]),
    ],
    {
      // (upgraded since #691: its Fate on you is at least 2 a turn, not 3, besides the third Mana next turn: +31%)
      up: {
        effects: [
          mana(1),
          manaNext(3),
          draw(2),
          on('turnStart', [
            scaled(status('doom', 0, 'self'), {
              by: 'maxHp',
              of: 'self',
              mult: 0.02,
              min: 2,
              round: 'ceil',
            }),
          ]),
        ],
      },
    },
  ),

  // --- Souls and Fleeting cards ---
  // (Grave Warden)
  g('common', 'barrow-keeper', 'Barrow Keeper', 'skill', 1, 'none', [
    barrier(8),
    addTo('gravesoul', 1, 'draw'),
  ]),
  // (Reave)
  g(
    'common',
    'soul-rend',
    'Soul Rend',
    'attack',
    1,
    'foe',
    [dmg(9), addTo('gravesoul', 1, 'draw')],
    {
      up: { effects: [dmg(11), addTo('gravesoul+', 1, 'draw')] },
    },
  ),
  // (Defile)
  g('common', 'desecrate', 'Desecrate', 'attack', 1, 'foe', [dmg(13)], {
    ethereal: true,
    up: { effects: [dmg(17)] },
  }),
  // (Defy)
  g(
    'common',
    'grave-defiance',
    'Grave Defiance',
    'skill',
    1,
    'foe',
    [barrier(6), status('faltering', 1, 'target')],
    { ethereal: true, up: { effects: [barrier(9), status('faltering', 1, 'target')] } },
  ),
  // (Fear)
  g(
    'common',
    'cold-dread',
    'Cold Dread',
    'attack',
    1,
    'foe',
    [dmg(7), status('exposed', 1, 'target')],
    {
      ethereal: true,
      up: { effects: [dmg(8), status('exposed', 2, 'target')] },
    },
  ),
  // (Sculpting Strike: a random card in your hand, as there is no choosing a card for a keyword)
  g('common', 'wraith-strike', 'Wraith Strike', 'attack', 1, 'foe', [dmg(9), mark('ethereal')]),
  // (Wisp)
  g('common', 'marsh-light', 'Marsh Light', 'skill', 0, 'none', [mana(1)], { exhaust: true }),
  // (Capture Spirit)
  g(
    'uncommon',
    'bottled-soul',
    'Bottled Soul',
    'skill',
    1,
    'foe',
    // (2 Gravesouls since #691: 11.9, 106%; upgraded 3, +35%)
    [lose(3, 'target'), addTo('gravesoul', 2, 'draw')],
    { up: { effects: [lose(3, 'target'), addTo('gravesoul', 3, 'draw')] } },
  ),
  // (Dirge: an X card's "+" is one more X here, DECISIONS: every X card upgrades that way)
  g(
    'uncommon',
    'dirge',
    'Lament',
    'skill',
    0,
    'none',
    [raise(3, 'bone-thrall', 0, per('x')), addTo('gravesoul', 0, 'draw', per('x'))],
    { x: true, exhaust: true },
  ),
  // (Haunt)
  g(
    'uncommon',
    'restless-spirits',
    'Restless Spirits',
    'power',
    1,
    'none',
    [
      on(
        'play',
        [scaled(lose(4, 'randomFoe'), { by: 'tagExhaustedBeforePlay', tag: 'soul', step: 3 })],
        { tag: 'soul', ownTurn: true, perTurnLimit: 3, afterLimit: [lose(1, 'randomFoe')] },
      ),
    ],
    {
      up: {
        effects: [
          on(
            'play',
            [scaled(lose(6, 'randomFoe'), { by: 'tagExhaustedBeforePlay', tag: 'soul', step: 3 })],
            { tag: 'soul', ownTurn: true, perTurnLimit: 3, afterLimit: [lose(2, 'randomFoe')] },
          ),
        ],
      },
    },
  ),
  // (Lethality)
  // (30% since #691: a Command's every companion hit takes the bonus, so 50% was ~180%; ~16, 108%; upgraded 40%, +33%)
  g('uncommon', 'killing-chill', 'Killing Chill', 'power', 1, 'none', [status('lethality', 30)], {
    ethereal: true,
    up: { effects: [status('lethality', 40)] },
  }),
  // (Pagestorm)
  g(
    'uncommon',
    'grimoire-gale',
    'Grimoire Gale',
    'power',
    1,
    'none',
    [on('draw', [draw(1)], { ethereal: true })],
    { up: { cost: 0 } },
  ),
  // (Parse)
  g('uncommon', 'spectral-ledger', 'Spectral Ledger', 'skill', 1, 'none', [draw(3)], {
    ethereal: true,
  }),
  // (Pull from Below)
  g(
    'uncommon',
    'drag-under',
    'Drag Under',
    'attack',
    1,
    'foe',
    [scaled(dmg(0), per('etherealPlayed', 5))],
    { up: { effects: [scaled(dmg(0), per('etherealPlayed', 7))] } },
  ),
  // (Severance)
  g(
    'uncommon',
    'sever-the-thread',
    'Sever the Thread',
    'attack',
    2,
    'foe',
    // (11 since #691: 25.4, 119%; upgraded 18 unchanged, +28%)
    [
      dmg(11),
      addTo('gravesoul', 1, 'draw'),
      addTo('gravesoul', 1, 'hand'),
      addTo('gravesoul', 1, 'discard'),
    ],
    {
      up: {
        effects: [
          dmg(18),
          addTo('gravesoul', 1, 'draw'),
          addTo('gravesoul', 1, 'hand'),
          addTo('gravesoul', 1, 'discard'),
        ],
      },
    },
  ),
  // (Enfeebling Touch: the enemy hits 8 softer through its next turn)
  g(
    'uncommon',
    'withering-touch',
    'Withering Touch',
    'skill',
    1,
    'foe',
    [statusTheirs('sapped', 8, 'target')],
    { ethereal: true, up: { effects: [statusTheirs('sapped', 11, 'target')] } },
  ),
  // (Veilpiercer)
  g('uncommon', 'veilpiercer', 'Soul Lance', 'attack', 1, 'foe', [
    dmg(10),
    status('freeethereal', 1),
  ]),
  // (Danse Macabre)
  g(
    'uncommon',
    'dance-of-bones',
    'Dance of Bones',
    'power',
    1,
    'none',
    [on('play', [barrier(4)], { minCost: 2 })],
    { up: { effects: [on('play', [barrier(6)], { minCost: 2 })] } },
  ),
  // (Death March)
  g(
    'uncommon',
    'funeral-march',
    'Funeral March',
    'attack',
    1,
    'foe',
    // (7 since #691: ~13, 116%; upgraded 8 + 6, +31%)
    [scaled(dmg(7), per('drawnTurn', 4))],
    { up: { effects: [scaled(dmg(8), per('drawnTurn', 6))] } },
  ),
  // (Delay. 14 Barrier since #691: 20.8, 98%; upgraded 16 and 2 Mana next turn, +31%)
  g(
    'uncommon',
    'stay-of-execution',
    'Stay of Execution',
    'skill',
    2,
    'none',
    [barrier(14), manaNext(1)],
    {
      up: { effects: [barrier(16), manaNext(2)] },
    },
  ),
  // (Dredge: random cards, as there is no choosing from the discard pile)
  g('uncommon', 'dredge', 'Grave Digging', 'skill', 1, 'none', [fetchCards(3)], {
    exhaust: true,
    up: { retain: true },
  }),
  // (Melancholy)
  g('uncommon', 'mourning', 'Mourning', 'skill', 3, 'none', [barrier(13)], {
    cheaperPer: { by: 'deaths', mult: 1 },
    up: { effects: [barrier(17)] },
  }),
  // (Banshee's Cry)
  // (36 since #691: ~47 at ~3 Mana mid-fight, 134%; upgraded 47 at the same cost, +31%, in place of costing 7)
  g('rare', 'wailing-cry', 'Wailing Cry', 'attack', 9, 'none', [dmg(36, 'allFoes')], {
    cheaperPer: { by: 'etherealPlayed', mult: 2 },
    up: { effects: [dmg(47, 'allFoes')] },
  }),
  // (Call of the Void. Opening hand since #691, so it has a fifth turn: ~30, 150%; upgraded the card found costs 1 less that turn,
  // ~+33%)
  g(
    'rare',
    'whispers-beyond',
    'Whispers Beyond',
    'power',
    1,
    'none',
    [on('turnStart', [{ op: 'discover', ethereal: true }])],
    {
      innate: true,
      up: { effects: [on('turnStart', [{ op: 'discover', ethereal: true, cheaper: 1 }])] },
    },
  ),
  // (Demesne. 2 Mana, not Fleeting, and draw 1 when played since #691: ~49, 129%; upgraded it costs 1, ~+30%)
  g(
    'rare',
    'phylactery',
    'Phylactery',
    'power',
    // (1 more Mana since #710: an Aura that gives Mana every turn, Robert: "cards that give mana ever turn need to probably be a bit costlier")
    3,
    'none',
    [draw(1), on('turnStart', [mana(1), draw(1)])],
    { up: { cost: 2 } },
  ),
  // (Devour Life. Raise 3 a Soul since #691: ~27, 135%; upgraded Raise 4, +29%)
  g(
    'rare',
    'soul-harvest',
    'Soul Harvest',
    'power',
    1,
    'none',
    [on('play', [raise(3)], { tag: 'soul' })],
    { up: { effects: [on('play', [raise(4)], { tag: 'soul' })] } },
  ),
  // (Eidolon: Ghostly 2 lasts through the enemy's turn, as her Intangible 1 does; 6 cards, not 9: a hand of 9 almost never happened, DECISIONS #397.
  // Since #691 1 Mana, 3 cards are enough and you draw 1 next turn: the hand left after paying is ~4, so 6 almost never happened either.
  // Ghostly ~13 + Grave Chill 8.4 - the cards ~6 + 3.5 ≈ 19, 151%; upgraded Ghostly 3, +32%)
  g(
    'rare',
    'ghostform',
    'Spirit Walk',
    'skill',
    1,
    'none',
    [exhaustN(99), when('exhaustedNow', { atLeast: 3 }, [status('ghostly', 2)]), drawNext(1)],
    {
      up: {
        effects: [
          exhaustN(99),
          when('exhaustedNow', { atLeast: 3 }, [status('ghostly', 3)]),
          drawNext(1),
        ],
      },
    },
  ),
  // (Eradicate)
  g(
    'rare',
    'oblivion',
    'Unmaking',
    'attack',
    0,
    'foe',
    [{ op: 'damage', amount: 11, hits: 0, to: 'target', scale: { by: 'x', into: 'hits' } }],
    { x: true, retain: true },
  ),
  // (Glimpse Beyond: "ALL players add 3 Souls"; alone, it is you)
  // (draw 1 since #691: 17.7, 142%; upgraded 4 Gravesouls and Hold, +32%)
  g(
    'rare',
    'gather-souls',
    'Gather Souls',
    'skill',
    1,
    'none',
    [addTo('gravesoul', 3, 'draw'), draw(1)],
    {
      exhaust: true,
      up: { retain: true, effects: [addTo('gravesoul', 4, 'draw'), draw(1)] },
    },
  ),
  // (Hang: every Gallows deals double to an enemy for each Gallows already played on it)
  g(
    'rare',
    'gallows',
    'Gallows',
    'attack',
    1,
    'foe',
    [scaled(dmg(10), per('bonus')), forge('gallows', 6)],
    {
      up: { effects: [scaled(dmg(13), per('bonus')), forge('gallows', 8)] },
    },
  ),
  // (Seance: a random card of your draw pile, as there is no choosing from it)
  g(
    'rare',
    'call-the-departed',
    'Call the Departed',
    'skill',
    1,
    'none',
    // (since #691 two Gravesouls to your hand and one to your draw pile: turning a random card of the draw pile into one was ~24%.
    // ~16.2, 130%; upgraded it costs 0 and is consumed, ~+30%)
    [addTo('gravesoul', 2, 'hand'), addTo('gravesoul', 1, 'draw')],
    { ethereal: true, up: { cost: 0, exhaust: true } },
  ),
  // (Soul Storm)
  g(
    'rare',
    'requiem',
    'Requiem',
    'attack',
    1,
    'foe',
    [scaled(dmg(9), { by: 'tagExhausted', tag: 'soul', mult: 2 }), draw(1)],
    {
      // (11 + 3 a Soul since #691: 12 + 2 was +17%; +28%)
      up: { effects: [scaled(dmg(11), { by: 'tagExhausted', tag: 'soul', mult: 3 }), draw(1)] },
    },
  ),
  // (Spirit of Ash)
  g(
    'rare',
    'ashfall',
    'Ashfall',
    'power',
    1,
    'none',
    // (6 since #691: ~29, 144%; upgraded 8, +33%)
    [on('play', [barrier(6)], { ethereal: true })],
    {
      up: { effects: [on('play', [barrier(8)], { ethereal: true })] },
    },
  ),
  // (The Scythe: hers grows for the rest of the run; ours for the rest of the fight, as the campaign has no piece to keep it)
  // (no Consume, Robert 2026-11-07: a card that grows has to come round again. A growing card is priced at ~90% of its budget on the
  // first play plus 1.2 for each point it grows (docs/14 §3): 16 + 5 x 1.2 = 22 against a 2-Mana rare's ~24; upgraded 20 + 6)
  g(
    'rare',
    'reaping-scythe',
    'Reaping Scythe',
    'attack',
    2,
    'foe',
    // (22, grows 7 since #691: 22 + 8.4 ≈ 30, 128%; upgraded 28, grows 9, +28%)
    [scaled(dmg(22), per('bonus')), forge('reaping-scythe', 7)],
    { up: { effects: [scaled(dmg(28), per('bonus')), forge('reaping-scythe', 9)] } },
  ),
  // (Transfigure. Since #691 you choose the card in your hand: a random one was ~96%; ~16, 129%; upgraded no Consume and Hold, ~+35%)
  g(
    'rare',
    'echo-of-the-dead',
    'Echo of the Dead',
    'skill',
    1,
    'none',
    [{ op: 'mark', flag: 'replay', costUp: 1, pick: true }],
    {
      exhaust: true,
      up: { exhaust: false, retain: true },
    },
  ),
  // (Undeath)
  g('rare', 'unquiet-rest', 'Unquiet Rest', 'skill', 0, 'none', [barrier(7), copySelf('discard')], {
    up: { effects: [barrier(9), copySelf('discard')] },
  }),

  // --- glue ---
  // (Drain Power)
  g(
    'common',
    'leech-lore',
    'Leech Lore',
    'attack',
    1,
    'foe',
    [dmg(10), { op: 'upgrade', scope: 'discard', amount: 2 }],
    { up: { effects: [dmg(12), { op: 'upgrade', scope: 'discard', amount: 3 }] } },
  ),
  // (Graveblast: a random card, as there is no choosing from the discard pile)
  g('common', 'grave-robbery', 'Grave Robbery', 'attack', 1, 'foe', [dmg(6), fetchCards(1)], {
    exhaust: true,
    up: { exhaust: false, effects: [dmg(8), fetchCards(1)] },
  }),
  // (Reap)
  g('common', 'harvest', 'Harvest', 'attack', 3, 'foe', [dmg(27)], {
    retain: true,
    up: { effects: [dmg(33)] },
  }),
  // (Sow)
  g('common', 'scatter-ashes', 'Scatter Ashes', 'attack', 1, 'none', [dmg(8, 'allFoes')], {
    retain: true,
  }),
  // (Bury)
  // (48 since #691: 116%; upgraded 62, +29%)
  g('uncommon', 'entomb', 'Entomb', 'attack', 4, 'foe', [dmg(48)], { up: { effects: [dmg(62)] } }),
  // (Friendship: Might cannot go below 0, so the 2 Might lost was 2 Sapped. Since #691 your healthiest companion loses 3 HP each turn
  // instead: a Command deck never felt its own Sapped (~187%). 28 for the Mana less ~14.4 of companion HP ≈ 13.6, 91%; upgraded 2 HP,
  // +35%)
  g(
    'uncommon',
    'bonded-dead',
    'Bonded Dead',
    'power',
    // (1 more Mana since #710: an Aura that gives Mana every turn, Robert: "cards that give mana ever turn need to probably be a bit costlier")
    2,
    'none',
    [on('turnStart', [mana(1), lose(3, 'biggestAlly')])],
    { up: { effects: [on('turnStart', [mana(1), lose(2, 'biggestAlly')])] } },
  ),
];
