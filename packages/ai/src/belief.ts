// The AI's belief state: a playable GameState rebuilt from viewFor() only. Everything the AI
// cannot see (the opponent's hand, both decks' contents, face-down enemy cards) is replaced by
// placeholder cards, so simulations can never depend on hidden information ("no peeking").

import {
  DEFAULT_RULES,
  seedRng,
  type CardDb,
  type CardDef,
  type CardInstance,
  type GameState,
  type GameView,
  type InstanceId,
  type PlayerId,
  type PlayerState,
} from '@sr/engine';

const blank = (id: string, extra: Partial<CardDef>): CardDef => ({
  id,
  name: id,
  realm: 'neutral',
  type: 'spell',
  rarity: 'common',
  cost: 99,
  abilities: [],
  text: '',
  collectible: false,
  ...extra,
});

/** Stand-ins for cards the AI cannot see. A hidden unit is assumed to be a plain 2/2. */
export const PLACEHOLDERS: CardDef[] = [
  blank('AI-UNKNOWN', {}),
  blank('AI-UNKNOWN-UNIT', { type: 'unit', cost: 2, power: 2, guard: 2 }),
  blank('AI-UNKNOWN-TRAP', { type: 'trap', cost: 99 }),
];

export function withPlaceholders(db: CardDb): CardDb {
  return { ...db, ...Object.fromEntries(PLACEHOLDERS.map((c) => [c.id, c])) };
}

function placeholderInstance(id: InstanceId, p: PlayerId, zone: 'hand' | 'deck'): CardInstance {
  return {
    id,
    cardId: 'AI-UNKNOWN',
    baseCardId: 'AI-UNKNOWN',
    owner: p,
    controller: p,
    zone,
    faceDown: false,
    setTurn: 0,
    arrivedTurn: 0,
    attackedTurn: 0,
    damage: 0,
    tempGuard: 0,
    buffs: [],
    granted: [],
    shield: false,
    veiled: false,
    stunTurn: 0,
    corrode: 0,
    wardTurn: 0,
    charges: 0,
    echoed: false,
    usedTurn: {},
  };
}

export function beliefFromView(view: GameView, seed: string): GameState {
  const cards: Record<InstanceId, CardInstance> = {};
  for (const [id, c] of Object.entries(view.cards)) {
    const copy: CardInstance = JSON.parse(JSON.stringify(c)) as CardInstance;
    if (copy.cardId === '?') {
      // a face-down enemy card: unit row = a hidden unit, backrow = a hidden Trap
      const id2 = copy.zone === 'units' ? 'AI-UNKNOWN-UNIT' : 'AI-UNKNOWN-TRAP';
      copy.cardId = id2;
      copy.baseCardId = id2;
    }
    cards[id] = copy;
  }

  const players = view.players.map((rp, p) => {
    const pid = p as PlayerId;
    let hand: InstanceId[];
    if (rp.hand) hand = [...rp.hand];
    else {
      hand = Array.from({ length: rp.handCount }, (_, i) => `ai-h${p}-${i}`);
      for (const id of hand) cards[id] = placeholderInstance(id, pid, 'hand');
    }
    // the top of the deck may be known (Scry prompt); the rest is unknown
    const known =
      view.pending && view.pending.player === pid && view.pending.kind === 'scry'
        ? [...view.pending.cards]
        : [];
    const unknown = Array.from(
      { length: Math.max(0, rp.deckCount - known.length) },
      (_, i) => `ai-d${p}-${i}`,
    );
    for (const id of unknown) cards[id] = placeholderInstance(id, pid, 'deck');
    const ps: PlayerState = {
      essence: rp.essence,
      maxEssence: rp.maxEssence,
      aether: rp.aether,
      tempAether: rp.tempAether,
      maxAether: rp.maxAether,
      resonance: rp.resonance,
      fatigue: rp.fatigue,
      deck: [...known, ...unknown],
      hand,
      units: [...rp.units],
      backrow: [...rp.backrow],
      rift: rp.rift,
      void: [...rp.void],
      beyond: [...rp.beyond],
      sigil: rp.sigil,
      mulliganed: true,
      once: {},
      lastSpell: null,
      revealedHandTurn: 0,
    };
    return ps;
  }) as [PlayerState, PlayerState];

  return {
    v: 1,
    seed,
    rng: seedRng(seed),
    rules: { ...DEFAULT_RULES },
    turn: view.turn,
    active: view.active,
    first: view.first,
    phase: view.phase,
    players,
    cards,
    nextId: 1_000_000,
    nextLinkId: 1_000_000,
    chain: JSON.parse(JSON.stringify(view.chain)) as GameState['chain'],
    window: view.window ? { ...view.window } : null,
    tasks: [],
    triggers: [],
    delayed: [],
    pending: view.pending
      ? (JSON.parse(JSON.stringify(view.pending)) as GameState['pending'])
      : null,
    winner: view.winner,
  };
}
