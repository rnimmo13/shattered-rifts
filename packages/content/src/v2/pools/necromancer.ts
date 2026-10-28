// Dorian Blackthorn, the necromancer (Gloomfen). He is the Slay the Spire 2 Necrobinder on purpose, for now (Robert, 2026-10-28: "close
// copies of the originals, but obviously change names and keep our theme, i will adjust things going forward, but we need good
// baselines right now"): one card for every Necrobinder card under an original name, and nothing else. Each card's comment names the
// Necrobinder card it imitates; numbers, costs and rarities are hers (StS2 v0.111.0, spire-codex.com) unless a comment says why not.
// The only Necrobinder cards missing are Strike and Defend (his are the Neutral ones) and Forbidden Grimoire (it removes a card from
// your deck after the fight: the fight engine has no piece for that). The tokens Gravesoul (her Soul) and Baleful Glance (her
// Sweeping Gaze) are hers too.
//
// Her one companion, Osty, is his Thralls, several at once ("lets keep our ability to summon multiple minions"):
//   - Summon N is Raise N: a Bone Thrall rises with N HP; with all three companion slots taken, the weakest gains N max HP instead.
//   - Thralls do not act on their own (Osty does not): the cards that make Osty attack make EACH Thrall strike ("Your companions
//     each deal 6 damage"), and what reads Osty's HP reads each Thrall's own.
//   - "Osty heals" grows every Thrall (a heal on a companion grows it anyway, DECISIONS #356); "Osty dies" sacrifices each one.
// Her Doom is his Fate (id doom), Ethereal is Fleeting, Retain is Hold, Exhaust is Consume, Strength is Might (a loss of it is Sapped,
// since Might cannot go below 0), Weak is Faltering, Vulnerable is Exposed, Block is Barrier, Intangible is Ghostly.
//
// Build paths are hidden for now (DECISIONS #365) and the headings below are only a first sort:
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
  costTax,
  dmg,
  doomNow,
  draw,
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
/** X hits of a damage effect */
const xHits = (amount: number): Op => ({
  op: 'damage',
  amount,
  hits: 0,
  to: 'target',
  scale: { by: 'x', into: 'hits' },
});

export const NECROMANCER: CardDef[] = [
  // --- basics and tokens ---
  // (Bodyguard)
  g('basic', 'raise-thrall', 'Raise Thrall', 'skill', 1, 'none', [raise(5)]),
  // (Unleash: each Thrall strikes for 6 plus its own HP)
  g(
    'basic',
    'off-the-leash',
    'Off the Leash',
    'attack',
    1,
    'foe',
    [command(scaled(dmg(6), per('hp')))],
    CMD,
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
    [command(dmg(10, 'randomFoe'))],
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
    { up: { effects: [on('turnStart', [raise(3), mana(3)], { times: 1 })] } },
  ),
  // (Poke)
  g('common', 'knucklebone', 'Knucklebone', 'attack', 0, 'foe', [command(dmg(6))], CMD),
  // (Pull Aggro)
  g('common', 'bone-bulwark', 'Bone Bulwark', 'skill', 2, 'none', [raise(4), barrier(7)], {
    up: { effects: [raise(5), barrier(9)] },
  }),
  // (Snap)
  g('common', 'bone-snap', 'Bone Snap', 'attack', 1, 'foe', [command(dmg(7)), mark('retain')], CMD),
  // (Bone Shards: each Thrall strikes every enemy and dies, and you gain 9 Barrier for each)
  g(
    'uncommon',
    'bone-rain',
    'Bone Rain',
    'attack',
    1,
    'none',
    [scaled(barrier(0), per('allies', 9)), command(dmg(9, 'allFoes'), DIES)],
    {
      ...CMD,
      up: { effects: [scaled(barrier(0), per('allies', 12)), command(dmg(12, 'allFoes'), DIES)] },
    },
  ),
  // (Calcify)
  g('uncommon', 'calcify', 'Ossify', 'power', 1, 'none', [status('marrow', 4)], {
    up: { effects: [status('marrow', 6)] },
  }),
  // (Cleanse: the top card of your draw pile is consumed, as there is no choosing from the draw pile)
  g('uncommon', 'bone-sift', 'Bone Sift', 'skill', 1, 'none', [raise(3), exhaustTop(1)]),
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
    [command(dmg(11, 'allFoes')), status('exposed', 2, 'allFoes')],
    { ...CMD, up: { effects: [command(dmg(13, 'allFoes')), status('exposed', 3, 'allFoes')] } },
  ),
  // (Legion of Bone: "ALL players Summon 6"; alone, it is you)
  g('uncommon', 'army-of-the-drowned', 'Army of the Drowned', 'skill', 2, 'none', [raise(6)], {
    exhaust: true,
  }),
  // (Rattle: one more hit for every other time your Thralls have struck this turn)
  g(
    'uncommon',
    'rattle-the-bones',
    'Rattle the Bones',
    'attack',
    1,
    'foe',
    [command(scaled(dmg(7), per('allyStrikes', 1, undefined, 'hits')))],
    {
      ...CMD,
      up: { effects: [command(scaled(dmg(9), per('allyStrikes', 1, undefined, 'hits')))] },
    },
  ),
  // (Right Hand Hand)
  g('uncommon', 'helping-hand', 'Helping Hand', 'attack', 0, 'foe', [command(dmg(4))], {
    ...CMD,
    recallOnCost: 2,
    up: { effects: [command(dmg(6))] },
  }),
  // (Sic 'Em: whenever a Thrall hits it this turn, another rises)
  g(
    'uncommon',
    'seize-them',
    'Seize Them',
    'attack',
    1,
    'foe',
    [command(dmg(5)), status('quarry', 3, 'target', true)],
    { ...CMD, up: { effects: [command(dmg(6)), status('quarry', 4, 'target', true)] } },
  ),
  // (Spur)
  g('uncommon', 'goad', 'Goad', 'skill', 1, 'none', [raise(3), growHp(5, 'allAllies')], {
    retain: true,
    up: { effects: [raise(5), growHp(7, 'allAllies')] },
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
    { up: { effects: [raise(8), on('allyHurt', [loseHpScaled(per('lost'), 'allFoes')])] } },
  ),
  // (Reanimate)
  g('rare', 'grave-colossus', 'Grave Colossus', 'skill', 3, 'none', [raise(20)], {
    exhaust: true,
    up: { effects: [raise(25)] },
  }),
  // (Sacrifice: the chosen Thrall dies, and you gain twice its max HP as Barrier)
  g(
    'rare',
    'fen-offering',
    'Fen Offering',
    'skill',
    1,
    'ally',
    [scaled(barrier(0), per('maxHp', 2, 'target')), { op: 'sacrifice' }],
    { retain: true, up: { cost: 0 } },
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
  // (Squeeze: 25, and 5 more for every other Command card in your deck; the count includes this one, so the base is 20, and the
  // upgrade's 30 +6 each is 24 +6)
  g(
    'rare',
    'death-grip',
    'Death Grip',
    'attack',
    3,
    'foe',
    [command(scaled(dmg(20), { by: 'tagDeck', tag: 'command', mult: 5 }))],
    {
      ...CMD,
      up: { effects: [command(scaled(dmg(24), { by: 'tagDeck', tag: 'command', mult: 6 }))] },
    },
  ),
  // (Protector, an Ancient card in her game: here a Rare)
  g(
    'rare',
    'the-drowned-king',
    'The Drowned King',
    'attack',
    1,
    'foe',
    [command(scaled(dmg(10), per('maxHp')))],
    { ...CMD, up: { cost: 0, effects: [command(scaled(dmg(15), per('maxHp')))] } },
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
    [barrier(6), when('doomedTurn', { atLeast: 1 }, [barrier(6), barrier(6)])],
    { up: { effects: [barrier(7), when('doomedTurn', { atLeast: 1 }, [barrier(7), barrier(7)])] } },
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
    [on('doomFoe', [barrier(2)])],
    {
      up: { effects: [on('doomFoe', [barrier(3)])] },
    },
  ),
  // (Sleight of Flesh)
  g(
    'uncommon',
    'fleshcraft',
    'Fleshcraft',
    'power',
    2,
    'none',
    [on('debuffFoe', [dmg(9, 'target')])],
    {
      up: { effects: [on('debuffFoe', [dmg(13, 'target')])] },
    },
  ),
  // (Borrowed Time)
  g('uncommon', 'toll-in-advance', 'Toll in Advance', 'skill', 1, 'none', [mana(4), costTax(1)], {
    up: { effects: [mana(6), costTax(1)] },
  }),
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
    [status('faltering', 2, 'target'), status('exposed', 2, 'target')],
    { exhaust: true },
  ),
  // (End of Days)
  g(
    'rare',
    'the-last-toll',
    'The Last Toll',
    'skill',
    3,
    'none',
    [status('doom', 29, 'allFoes'), doomNow('allFoes')],
    { up: { effects: [status('doom', 37, 'allFoes'), doomNow('allFoes')] } },
  ),
  // (Oblivion: this turn every card you play curses that enemy)
  g(
    'rare',
    'mark-of-ending',
    'Mark of Ending',
    'skill',
    0,
    'foe',
    [on('play', [status('doom', 3, 'target')], { temp: true, pin: true })],
    { up: { effects: [on('play', [status('doom', 4, 'target')], { temp: true, pin: true })] } },
  ),
  // (Reaper Form)
  g('rare', 'reapers-mantle', "Reaper's Mantle", 'power', 3, 'none', [status('reaping', 1)], {
    up: { retain: true },
  }),
  // (Time's Up)
  g(
    'rare',
    'final-reckoning',
    'Final Reckoning',
    'attack',
    2,
    'foe',
    [scaled(dmg(0), per('doom', 1, 'target'))],
    { exhaust: true, up: { retain: true } },
  ),
  // (Misery)
  g('rare', 'spreading-rot', 'Spreading Rot', 'attack', 0, 'foe', [dmg(7), spreadDebuffs], {
    up: { retain: true, effects: [dmg(9), spreadDebuffs] },
  }),
  // (Shared Fate: you lose 2 Might's worth and so does the enemy, for the fight)
  g(
    'rare',
    'common-grave',
    'Common Grave',
    'skill',
    0,
    'foe',
    [status('sapped', 2, 'self'), status('sapped', 2, 'target')],
    {
      exhaust: true,
      up: { effects: [status('sapped', 2, 'self'), status('sapped', 3, 'target')] },
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
    [mana(3), draw(2), on('turnStart', [status('doom', 3, 'self')])],
    { up: { effects: [mana(4), draw(2), on('turnStart', [status('doom', 3, 'self')])] } },
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
    [lose(3, 'target'), addTo('gravesoul', 3, 'draw')],
    { up: { effects: [lose(4, 'target'), addTo('gravesoul', 4, 'draw')] } },
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
    [on('play', [lose(6, 'randomFoe')], { tag: 'soul' })],
    { up: { effects: [on('play', [lose(8, 'randomFoe')], { tag: 'soul' })] } },
  ),
  // (Lethality)
  g('uncommon', 'killing-chill', 'Killing Chill', 'power', 1, 'none', [status('lethality', 50)], {
    ethereal: true,
    up: { effects: [status('lethality', 75)] },
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
    [
      dmg(13),
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
    [scaled(dmg(8), per('drawnTurn', 4))],
    { up: { effects: [scaled(dmg(8), per('drawnTurn', 6))] } },
  ),
  // (Delay)
  g(
    'uncommon',
    'stay-of-execution',
    'Stay of Execution',
    'skill',
    2,
    'none',
    [barrier(11), manaNext(1)],
    {
      up: { effects: [barrier(13), manaNext(2)] },
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
  g('rare', 'wailing-cry', 'Wailing Cry', 'attack', 9, 'none', [dmg(33, 'allFoes')], {
    cheaperPer: { by: 'etherealPlayed', mult: 2 },
    up: { cost: 7 },
  }),
  // (Call of the Void)
  g(
    'rare',
    'whispers-beyond',
    'Whispers Beyond',
    'power',
    1,
    'none',
    [on('turnStart', [{ op: 'discover', ethereal: true }])],
    { up: { innate: true } },
  ),
  // (Demesne)
  g('rare', 'phylactery', 'Phylactery', 'power', 3, 'none', [on('turnStart', [mana(1), draw(1)])], {
    ethereal: true,
    up: { cost: 2 },
  }),
  // (Devour Life)
  g(
    'rare',
    'soul-harvest',
    'Soul Harvest',
    'power',
    1,
    'none',
    [on('play', [raise(1)], { tag: 'soul' })],
    { up: { effects: [on('play', [raise(2)], { tag: 'soul' })] } },
  ),
  // (Eidolon: Ghostly 2 lasts through the enemy's turn, as her Intangible 1 does)
  g(
    'rare',
    'ghostform',
    'Spirit Walk',
    'skill',
    2,
    'none',
    [exhaustN(99), when('exhaustedNow', { atLeast: 9 }, [status('ghostly', 2)])],
    { up: { cost: 1 } },
  ),
  // (Eradicate)
  g('rare', 'oblivion', 'Unmaking', 'attack', 0, 'foe', [xHits(11)], { x: true, retain: true }),
  // (Glimpse Beyond: "ALL players add 3 Souls"; alone, it is you)
  g('rare', 'gather-souls', 'Gather Souls', 'skill', 1, 'none', [addTo('gravesoul', 3, 'draw')], {
    exhaust: true,
  }),
  // (Hang: every Gallows deals double to an enemy for each Gallows already played on it)
  g('rare', 'gallows', 'Gallows', 'attack', 1, 'foe', [dmg(10), status('noose', 1, 'target')], {
    tags: ['noose'],
    up: { effects: [dmg(13), status('noose', 1, 'target')] },
  }),
  // (Seance: a random card of your draw pile, as there is no choosing from it)
  g(
    'rare',
    'call-the-departed',
    'Call the Departed',
    'skill',
    1,
    'none',
    [{ op: 'transform', into: 'gravesoul', from: 'draw', amount: 1 }],
    { ethereal: true, up: { cost: 0 } },
  ),
  // (Soul Storm)
  g(
    'rare',
    'requiem',
    'Requiem',
    'attack',
    1,
    'foe',
    [scaled(dmg(9), { by: 'tagExhausted', tag: 'soul', mult: 2 })],
    { up: { effects: [scaled(dmg(9), { by: 'tagExhausted', tag: 'soul', mult: 3 })] } },
  ),
  // (Spirit of Ash)
  g(
    'rare',
    'ashfall',
    'Ashfall',
    'power',
    1,
    'none',
    [on('play', [barrier(4)], { ethereal: true })],
    {
      up: { effects: [on('play', [barrier(5)], { ethereal: true })] },
    },
  ),
  // (The Scythe: hers grows for the rest of the run; ours for the rest of the fight, as the campaign has no piece to keep it)
  g(
    'rare',
    'reaping-scythe',
    'Reaping Scythe',
    'attack',
    2,
    'foe',
    [scaled(dmg(13), per('bonus')), forge('reaping-scythe', 4)],
    { exhaust: true, up: { effects: [scaled(dmg(13), per('bonus')), forge('reaping-scythe', 5)] } },
  ),
  // (Transfigure: a random card in your hand)
  g('rare', 'echo-of-the-dead', 'Echo of the Dead', 'skill', 1, 'none', [mark('replay', 1)], {
    exhaust: true,
    up: { exhaust: false },
  }),
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
  g('common', 'grave-robbery', 'Grave Robbery', 'attack', 1, 'foe', [dmg(4), fetchCards(1)], {
    exhaust: true,
    up: { exhaust: false, effects: [dmg(6), fetchCards(1)] },
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
  g('uncommon', 'entomb', 'Entomb', 'attack', 4, 'foe', [dmg(52)], { up: { effects: [dmg(63)] } }),
  // (Friendship: Might cannot go below 0, so the 2 Might lost is 2 Sapped)
  g(
    'uncommon',
    'bonded-dead',
    'Bonded Dead',
    'power',
    1,
    'none',
    [status('sapped', 2, 'self'), on('turnStart', [mana(1)])],
    { up: { effects: [status('sapped', 1, 'self'), on('turnStart', [mana(1)])] } },
  ),
];
