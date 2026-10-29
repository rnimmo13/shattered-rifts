// The battle log: what happened in the fight, in words. Pure: it turns engine events into short lines and never decides anything.
// Noise (draws, Mana ticks, intents, pile shuffles) is left out; what a player wants to look back at is who played what, what hit
// whom for how much, and what changed (statuses, Barrier, deaths, stances, Traps). Units are named with a number when there is more
// than one of a kind ("Gilded Squire 2"), and damage that is not an attack (a Trap, Thorns) says what caused it.

import {
  OVERFLOW_NAME,
  forgeWord,
  type CardId,
  type CombatDb,
  type CombatEvent,
  type CombatState,
  type Side,
  type StatusId,
} from '@sr/combat';
import { STATUS_INFO } from './info';

export type LogTone = 'mine' | 'foe' | 'turn' | 'plain';

export interface LogLine {
  id: number;
  text: string;
  tone: LogTone;
  /** the card this line is about (one played, a Trap that sprang, an Aura started): the log can show it */
  card?: CardId;
}

/** What the log needs to know to name things. */
export interface LogContext {
  db: CombatDb;
  /** the side the viewer plays */
  me: Side;
  /** a unit's name (units that have since fallen included), numbered when there are several of a kind */
  nameOf: (unit: string) => string;
  /** which side a unit fights on */
  sideOf: (unit: string) => Side | null;
  /** a player's name for a side ("You", or the opponent's name) */
  who: (side: Side) => string;
  /** which unit definition a unit is (to name an enemy's move); absent: moves are named from their id */
  defOf?: (unit: string) => string | null;
}

/**
 * Remembers every unit seen in the fight, so the fallen can still be named, and numbers those that share a name ("Gilded Squire 1",
 * "Gilded Squire 2") in the order they appeared.
 */
export class Namer {
  private units = new Map<string, { base: string; side: Side; n: number; def: string | null }>();
  private counts = new Map<string, number>();

  constructor(
    private readonly me: Side,
    /** what the opponent's hero is called in a PvP match (null in PvE, where the hero has its own name) */
    private readonly foeHero: string | null,
  ) {}

  register(id: string, base: string, side: Side, def: string | null = null): void {
    if (this.units.has(id)) return;
    const key = `${side}|${base}`;
    const n = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, n);
    this.units.set(id, { base, side, n, def });
  }

  /** Learn every unit in a state (heroes are named for who plays them). */
  learn(s: CombatState): void {
    for (const side of ['a', 'b'] as const)
      for (const u of s.sides[side].units) {
        const hero = u.kind === 'hero';
        const base = hero ? (side === this.me ? 'You' : (this.foeHero ?? u.name)) : u.name;
        this.register(u.id, base, side, u.def);
      }
  }

  nameOf(id: string): string {
    const u = this.units.get(id);
    if (!u) return 'Someone';
    const several = (this.counts.get(`${u.side}|${u.base}`) ?? 1) > 1;
    return several ? `${u.base} ${u.n}` : u.base;
  }

  sideOf(id: string): Side | null {
    return this.units.get(id)?.side ?? null;
  }

  defOf(id: string): string | null {
    return this.units.get(id)?.def ?? null;
  }
}

const STANCE_NAME: Record<string, string> = { calm: 'Serene', wrath: 'Fury', radiant: 'Radiant' };

const pretty = (id: string): string =>
  id.replace(/[-_]+/g, ' ').replace(/^./, (c) => c.toUpperCase());

const statusName = (id: StatusId): string => STATUS_INFO[id]?.name ?? pretty(id);
const cardName = (db: CombatDb, id: CardId): string => db.cards[id]?.name ?? pretty(id);

/** "You gain" but "Goblin gains": the verb agrees with whoever is named. */
const verb = (name: string, plain: string, third: string): string =>
  `${name} ${name === 'You' ? plain : third}`;

/** How a hit or a heal moved the target's HP: " (HP 40 → 31)", or nothing when it did not move or is not known. */
const hpChange = (hp: number | undefined, change: number): string =>
  hp === undefined || change === 0 ? '' : ` (HP ${hp - change} → ${hp})`;

/** "Slash (9)", or "Flurry (4×3)" for a move that hits several times. */
const withDamage = (name: string, damage: number | undefined, hits: number | undefined): string =>
  damage === undefined ? name : `${name} (${(hits ?? 1) > 1 ? `${damage}×${hits}` : damage})`;

/** Named as the one something happens to: "hits you", not "hits You". */
const obj = (name: string): string => (name === 'You' ? 'you' : name);

/**
 * A describer for one fight's events, fed in order. It remembers a little (which Trap has just sprung, who has just been hit) so that
 * damage which is not an attack can say what it came from.
 */
export function createDescriber(c: LogContext): (e: CombatEvent) => Omit<LogLine, 'id'> | null {
  const tone = (side: Side | null): LogTone =>
    side === null ? 'plain' : side === c.me ? 'mine' : 'foe';
  /** a Trap that has just sprung: what it does next is its doing, not its owner's attack */
  let trap: { name: string } | null = null;
  /** the last attack that landed: Thorns answer it at once */
  let lastHit: { source: string | null; target: string } | null = null;

  /** an enemy's move by its own name ("Slash"), or from its id when the unit's definition is not known */
  const moveName = (unit: string, move: string): string => {
    const d = c.defOf?.(unit);
    const b = d ? c.db.units[d]?.brain : undefined;
    return (b?.kind === 'enemy' ? b.moves[move]?.name : undefined) ?? pretty(move);
  };

  return (e) => {
    switch (e.type) {
      case 'turnStart':
        trap = null;
        lastHit = null;
        return {
          text: e.side === c.me ? 'Your turn' : `${c.who(e.side)}'s turn`,
          tone: 'turn',
        };
      case 'play': {
        trap = null;
        lastHit = null;
        const target = e.target ? ` on ${obj(c.nameOf(e.target))}` : '';
        return {
          text: `${c.who(e.side)} ${e.side === c.me ? 'play' : 'plays'} ${cardName(c.db, e.def)}${target}`,
          tone: tone(e.side),
          card: e.def,
        };
      }
      case 'potion':
        return {
          text: `${c.who(e.side)} ${e.side === c.me ? 'use' : 'uses'} ${c.db.potions[e.potion]?.name ?? 'a potion'}`,
          tone: tone(e.side),
        };
      // (the Shaman's command, DECISIONS #418)
      case 'command':
        return {
          text: `${c.who(e.side)} ${e.side === c.me ? 'command' : 'commands'} the ${c.db.totems?.[e.spirit]?.name ?? 'totem'}${e.empowered ? ' (empowered)' : ''}`,
          tone: tone(e.side),
        };
      case 'act':
        trap = null;
        lastHit = null;
        return e.move
          ? {
              text: `${verb(c.nameOf(e.unit), 'use', 'uses')} ${withDamage(moveName(e.unit, e.move), e.damage, e.hits)}`,
              tone: tone(c.sideOf(e.unit)),
            }
          : null;
      case 'skip':
        return {
          text: `${verb(c.nameOf(e.unit), 'are', 'is')} stunned and lose${c.nameOf(e.unit) === 'You' ? '' : 's'} the turn`,
          tone: tone(c.sideOf(e.unit)),
        };
      case 'damage': {
        const to = obj(c.nameOf(e.target));
        const soaked = e.blocked > 0 ? ` (${e.blocked} blocked)` : '';
        const result = e.shielded
          ? 'shielded, no damage'
          : e.lost > 0
            ? `${e.lost} damage${soaked}`
            : `no damage${soaked}`;
        const by = e.source ? c.nameOf(e.source) : null;
        // damage that answers an attack at once, from the one who was just hit, is Thorns
        const thorns =
          e.kind === 'direct' &&
          lastHit !== null &&
          e.source === lastHit.target &&
          e.target === lastHit.source;
        let text: string;
        let side: Side | null;
        if (e.overflow) {
          text = `${OVERFLOW_NAME} carries through to ${to}: ${result}`;
          side = e.source ? c.sideOf(e.source) : null;
        } else if (trap) {
          text = `${trap.name} hits ${to}: ${result}`;
          side = e.source ? c.sideOf(e.source) : c.sideOf(e.target);
        } else if (thorns) {
          text = `Thorns hurt ${to}: ${result}`;
          side = e.source ? c.sideOf(e.source) : null;
        } else if (by) {
          text = `${verb(by, 'hit', 'hits')} ${to}: ${result}`;
          side = c.sideOf(e.source as string);
        } else {
          text = `${c.nameOf(e.target) === 'You' ? 'You take' : `${to} takes`} ${result}`;
          side = c.sideOf(e.target);
        }
        if (e.kind === 'attack') lastHit = { source: e.source, target: e.target };
        return { text: `${text}${hpChange(e.hp, -e.lost)}`, tone: tone(side) };
      }
      case 'barrier':
        return {
          text: `${verb(c.nameOf(e.target), 'gain', 'gains')} ${e.amount} Barrier`,
          tone: tone(c.sideOf(e.target)),
        };
      case 'heal':
        return {
          text: `${verb(c.nameOf(e.target), 'heal', 'heals')} ${e.amount}${hpChange(e.hp, e.amount)}`,
          tone: tone(c.sideOf(e.target)),
        };
      case 'status': {
        if (e.amount === 0) return null;
        const name = statusName(e.status);
        return {
          text:
            e.amount > 0
              ? `${verb(c.nameOf(e.target), 'gain', 'gains')} ${e.amount} ${name}${e.total !== e.amount ? ` (now ${e.total})` : ''}`
              : `${verb(c.nameOf(e.target), 'lose', 'loses')} ${-e.amount} ${name}`,
          tone: tone(c.sideOf(e.target)),
        };
      }
      case 'summon':
        return {
          text: `${c.who(e.side)} ${e.side === c.me ? 'summon' : 'summons'} ${c.db.units[e.def]?.name ?? pretty(e.def)}`,
          tone: tone(e.side),
        };
      case 'died':
        return {
          text: e.released
            ? `${c.nameOf(e.unit)} ${c.nameOf(e.unit) === 'You' ? 'are' : 'is'} released`
            : verb(c.nameOf(e.unit), 'fall', 'falls'),
          tone: tone(c.sideOf(e.unit)),
        };
      case 'stance':
        return {
          text:
            e.stance === 'none'
              ? `${verb(c.nameOf(e.unit), 'leave', 'leaves')} ${c.nameOf(e.unit) === 'You' ? 'your' : 'their'} stance`
              : `${verb(c.nameOf(e.unit), 'enter', 'enters')} ${STANCE_NAME[e.stance] ?? pretty(e.stance)}`,
          tone: tone(c.sideOf(e.unit)),
        };
      case 'suits':
        // (only the Full Trick is worth a line: the pips show the rest)
        return e.full
          ? {
              text: `${c.who(e.side)} ${e.side === c.me ? 'make' : 'makes'} a Full Trick: all four suits this turn`,
              tone: tone(e.side),
            }
          : null;
      case 'snareSet':
        return {
          text: `${c.who(e.side)} ${e.side === c.me ? 'set' : 'sets'} a Trap`,
          tone: tone(e.side),
        };
      case 'snareSprung': {
        const name = cardName(c.db, e.card);
        trap = { name };
        return {
          text: `${e.side === c.me ? 'Your' : `${c.who(e.side)}'s`} Trap triggered: ${name}`,
          tone: tone(e.side),
          card: e.card,
        };
      }
      case 'power':
        return {
          text: `${c.who(e.side)} ${e.side === c.me ? 'start' : 'starts'} ${cardName(c.db, e.card)}`,
          tone: tone(e.side),
          card: e.card,
        };
      case 'forge':
        return {
          text: `${cardName(c.db, e.card)}: ${forgeWord(c.db, e.card)} +${e.amount}`,
          tone: tone(e.side),
        };
      case 'phase':
        return {
          text: `${verb(c.nameOf(e.unit), 'rise', 'rises')} into ${e.left > 0 ? 'a new' : 'its last'} phase`,
          tone: tone(c.sideOf(e.unit)),
        };
      case 'gameOver':
        return {
          text:
            e.winner === 'draw' ? 'The fight is a draw' : e.winner === c.me ? 'Victory' : 'Defeat',
          tone: 'turn',
        };
      default:
        return null;
    }
  };
}

/** Keep the log to a sensible length (the oldest lines go first). */
export const LOG_LIMIT = 400;
