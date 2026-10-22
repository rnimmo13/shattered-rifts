// One-line descriptions of game events for the duel log. Pure: reads names from the card database and the
// (already redacted) view, so a hidden card is never named.

import type { GameEvent, GameView, InstanceId, PlayerId } from '@sr/engine';
import { CARD_DB } from '@sr/content';
import { HUMAN } from './session';

const who = (p: PlayerId): string => (p === HUMAN ? 'You' : 'Enemy');
const whose = (p: PlayerId): string => (p === HUMAN ? 'Your' : "Enemy's");

function name(cardId: string): string {
  if (cardId === '?') return 'a hidden card';
  return CARD_DB[cardId]?.name ?? cardId;
}

function nameOfId(view: GameView, id: InstanceId): string {
  return name(view.cards[id]?.cardId ?? '?');
}

/** Returns the log line for an event, or null for events that don't need one. */
export function describeEvent(e: GameEvent, view: GameView): string | null {
  switch (e.type) {
    case 'turnStarted':
      return `Turn ${e.turn}: ${e.player === HUMAN ? 'Your turn' : "Enemy's turn"}`;
    case 'cardPlayed':
      return `${who(e.player)} played ${name(e.cardId)}`;
    case 'unitSummoned':
      return e.token
        ? `${whose(e.player)} ${name(e.cardId)} appears`
        : `${whose(e.player)} ${name(e.cardId)} enters`;
    case 'trapSet':
      return `${who(e.player)} set a trap`;
    case 'ambushSet':
      return `${who(e.player)} set an ambush`;
    case 'flipped':
      return `${whose(e.player)} ${name(e.cardId)} flips up`;
    case 'attackDeclared':
      return `${nameOfId(view, e.attackerId)} attacks ${e.target === 'face' ? 'directly' : nameOfId(view, e.target)}`;
    case 'chainLinkAdded':
      return e.kind === 'trap'
        ? `${who(e.player)} sprang ${name(e.cardId)}`
        : e.kind === 'spell'
          ? `${who(e.player)} cast ${name(e.cardId)}`
          : null;
    case 'damageDealt': {
      const t =
        typeof e.target === 'string'
          ? nameOfId(view, e.target)
          : e.target.player === HUMAN
            ? 'you'
            : 'the enemy';
      return `${e.amount} damage to ${t}`;
    }
    case 'healed': {
      const t =
        typeof e.target === 'string'
          ? nameOfId(view, e.target)
          : e.target.player === HUMAN
            ? 'you'
            : 'the enemy';
      return `${t} healed ${e.amount}`;
    }
    case 'unitDestroyed':
      return `${whose(e.player)} ${name(e.cardId)} is destroyed`;
    case 'cardDestroyed':
      return `${whose(e.player)} ${name(e.cardId)} is destroyed`;
    case 'unitBanished':
      return `${whose(e.player)} ${name(e.cardId)} is banished`;
    case 'negated':
      return 'An effect was negated';
    case 'fatigue':
      return `${who(e.player)} took ${e.amount} fatigue damage`;
    case 'gameOver':
      return e.winner === 'draw'
        ? 'The duel is a draw'
        : e.winner === HUMAN
          ? 'You win!'
          : 'You lose';
    default:
      return null;
  }
}
