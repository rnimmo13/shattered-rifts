// Hidden-information redaction. The opponent never sees your hand, deck order, face-down cards,
// the PRNG state, or pending prompts' contents (01_GAME_DESIGN §6, DECISIONS #38).

import type { CardInstance, GameEvent, GameState, InstanceId, PlayerId } from './types';
import { clone } from './util';

export const HIDDEN = '?';

export interface RedactedPlayer {
  essence: number;
  maxEssence: number;
  aether: number;
  tempAether: number;
  maxAether: number;
  resonance: number;
  fatigue: number;
  deckCount: number;
  hand: InstanceId[] | null;
  handCount: number;
  units: (InstanceId | null)[];
  backrow: (InstanceId | null)[];
  rift: InstanceId | null;
  void: InstanceId[];
  beyond: InstanceId[];
  sigil: InstanceId | null;
}

export interface GameView {
  viewer: PlayerId;
  turn: number;
  active: PlayerId;
  first: PlayerId;
  phase: GameState['phase'];
  winner: GameState['winner'];
  players: [RedactedPlayer, RedactedPlayer];
  /** Every card the viewer can see. Face-down enemy cards appear with cardId '?'. */
  cards: Record<InstanceId, CardInstance>;
  chain: GameState['chain'];
  window: GameState['window'];
  /** Only the viewer's own prompt (the opponent just sees that they're deciding). */
  pending: GameState['pending'];
  opponentDeciding: boolean;
  /** Layered stats for every unit the viewer can see face-up (or owns face-down). */
  stats: Record<InstanceId, ViewStats>;
}

export interface ViewStats {
  power: number;
  guard: number;
  maxGuard: number;
  keywords: string[];
}

export function viewFor(
  s: GameState,
  viewer: PlayerId,
  statsOf?: (id: InstanceId) => ViewStats,
): GameView {
  const cards: Record<InstanceId, CardInstance> = {};
  const show = (id: InstanceId | null) => {
    if (!id) return;
    const c = s.cards[id];
    if (!c) return;
    const copy = clone(c);
    if (c.faceDown && c.controller !== viewer) {
      copy.cardId = HIDDEN;
      copy.baseCardId = HIDDEN;
    }
    cards[id] = copy;
  };
  const players = s.players.map((ps, p) => {
    const own = p === viewer;
    if (own) ps.hand.forEach(show);
    ps.units.forEach(show);
    ps.backrow.forEach(show);
    show(ps.rift);
    show(ps.sigil);
    ps.void.forEach(show);
    ps.beyond.forEach(show);
    const r: RedactedPlayer = {
      essence: ps.essence,
      maxEssence: ps.maxEssence,
      aether: ps.aether,
      tempAether: ps.tempAether,
      maxAether: ps.maxAether,
      resonance: ps.resonance,
      fatigue: ps.fatigue,
      deckCount: ps.deck.length,
      hand: own ? [...ps.hand] : null,
      handCount: ps.hand.length,
      units: [...ps.units],
      backrow: [...ps.backrow],
      rift: ps.rift,
      void: [...ps.void],
      beyond: [...ps.beyond],
      sigil: ps.sigil,
    };
    return r;
  }) as [RedactedPlayer, RedactedPlayer];
  for (const link of s.chain) show(link.sourceId); // spells/traps on the chain are public
  const mine = s.pending?.player === viewer;
  // the viewer may look at the cards their own prompt is about (Scry: the top of their deck)
  if (mine && s.pending?.kind === 'scry') s.pending.cards.forEach(show);
  if (mine && s.pending?.kind === 'chooseCards') s.pending.from.forEach(show);
  return {
    viewer,
    turn: s.turn,
    active: s.active,
    first: s.first,
    phase: s.phase,
    winner: s.winner,
    players,
    cards,
    chain: clone(s.chain),
    window: s.window ? { ...s.window } : null,
    pending: mine ? clone(s.pending) : null,
    opponentDeciding: !!s.pending && !mine,
    stats: statsOf ? visibleStats(s, viewer, statsOf) : {},
  };
}

function visibleStats(
  s: GameState,
  viewer: PlayerId,
  statsOf: (id: InstanceId) => ViewStats,
): Record<InstanceId, ViewStats> {
  const out: Record<InstanceId, ViewStats> = {};
  for (const ps of s.players) {
    for (const id of ps.units) {
      const c = id ? s.cards[id] : undefined;
      if (!c || (c.faceDown && c.controller !== viewer)) continue;
      out[c.id] = statsOf(c.id);
    }
  }
  return out;
}

/** Redacts an event stream for one viewer (same rules as viewFor). */
export function eventsFor(events: readonly GameEvent[], viewer: PlayerId): GameEvent[] {
  return events.map((e) => {
    switch (e.type) {
      case 'cardDrawn':
        return e.player === viewer ? e : { ...e, id: HIDDEN, cardId: HIDDEN };
      case 'trapSet':
        return e.player === viewer ? e : { ...e, cardId: HIDDEN };
      case 'ambushSet':
        return e.player === viewer ? e : { ...e, cardId: HIDDEN };
      case 'cardToDeck':
        return e.player === viewer ? e : { ...e, cardId: HIDDEN };
      default:
        return e;
    }
  });
}
