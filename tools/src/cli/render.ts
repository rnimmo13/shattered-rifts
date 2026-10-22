// Text rendering for the CLI duel: board, chain, events and action descriptions.
// Everything is rendered from one viewer's perspective (or 'all' for AI-vs-AI spectating).

import {
  HIDDEN,
  type Action,
  type CardDb,
  type CardInstance,
  type Engine,
  type GameEvent,
  type GameState,
  type InstanceId,
  type PlayerId,
} from '@sr/engine';

export type Viewer = PlayerId | 'all';

export interface Seat {
  name: string;
  character: string;
}

const KW_LABEL: Record<string, string> = {
  guardian: 'Guardian',
  blitz: 'Blitz',
  shield: 'Shield',
  ward: 'Ward',
  pierce: 'Pierce',
  lifebind: 'Lifebind',
  veiled: 'Veiled',
};

export class Renderer {
  /** instanceId → cardId, for naming cards that have since moved (only what the viewer saw). */
  private names = new Map<InstanceId, string>();
  private linkLabels = new Map<string, string>();
  /** Chain length when the current chain was last extended (only narrate resolution for real chains). */
  private pendingChainLen = 0;

  constructor(
    private readonly engine: Engine,
    private readonly db: CardDb,
    private readonly seats: [Seat, Seat],
    private readonly viewer: Viewer,
  ) {}

  /** Visible cards for the viewer. */
  private visible(s: GameState): Record<InstanceId, CardInstance> {
    return this.viewer === 'all' ? s.cards : this.engine.viewFor(s, this.viewer).cards;
  }

  remember(s: GameState): void {
    for (const [id, c] of Object.entries(this.visible(s)))
      if (c.cardId !== HIDDEN) this.names.set(id, c.cardId);
  }

  who(p: PlayerId): string {
    return `P${p + 1}`;
  }

  cardName(cardId: string | undefined): string {
    if (!cardId || cardId === HIDDEN) return 'a face-down card';
    return this.db[cardId]?.name ?? cardId;
  }

  nameOf(id: InstanceId | 'face' | undefined, s: GameState, defender?: PlayerId): string {
    if (id === 'face')
      return defender === undefined ? 'the Riftwalker' : `${this.who(defender)} (Riftwalker)`;
    if (!id) return '?';
    const c = this.visible(s)[id];
    if (c && c.cardId !== HIDDEN) return this.cardName(c.cardId);
    return this.cardName(this.names.get(id));
  }

  unitLabel(s: GameState, c: CardInstance): string {
    const vis = this.visible(s)[c.id];
    if (!vis || vis.cardId === HIDDEN) return '[face-down]';
    const st = this.statsOf(s, c);
    const tags: string[] = [];
    if (c.faceDown) tags.push('set');
    for (const k of st.keywords) if (KW_LABEL[k]) tags.push(KW_LABEL[k]);
    if (c.stunTurn === s.turn) tags.push('Stunned');
    if (c.corrode) tags.push(`Corrode ${c.corrode}`);
    if (c.zone === 'units' && c.arrivedTurn >= s.turn && !st.keywords.has('blitz'))
      tags.push('arriving');
    if (c.attackedTurn === s.turn) tags.push('exhausted');
    const d = this.db[c.cardId];
    const stats = d?.type === 'unit' || d?.type === 'token' ? ` ${st.power}/${st.guard}` : '';
    return `${this.cardName(c.cardId)}${stats}${tags.length ? ` [${tags.join(', ')}]` : ''}`;
  }

  private statsOf(s: GameState, c: CardInstance) {
    // a player's client only knows what its view shows; the spectator (AI vs AI) sees everything
    const st =
      this.viewer === 'all'
        ? this.engine.stats(s, c.id)
        : this.engine.viewFor(s, this.viewer).stats[c.id];
    if (!st) return { power: 0, guard: 0, maxGuard: 0, keywords: new Set<string>() };
    return { ...st, keywords: new Set<string>(st.keywords) };
  }

  board(s: GameState): string {
    const lines: string[] = [];
    const bar = '─'.repeat(78);
    const top: PlayerId = this.viewer === 1 ? 0 : 1;
    const bottom: PlayerId = top === 0 ? 1 : 0;
    const playerBlock = (p: PlayerId, mirror: boolean) => {
      const ps = s.players[p];
      const seat = this.seats[p];
      const header = `${this.who(p)} ${seat.character.padEnd(20)} Essence ${String(ps.essence).padStart(2)}  Mana ${ps.mana}/${ps.maxMana}${
        ps.tempMana ? ` (+${ps.tempMana} temp)` : ''
      }  Resonance ${ps.resonance}  Hand ${ps.hand.length}  Deck ${ps.deck.length}  Void ${ps.void.length}`;
      const back = ps.backrow
        .map((id) => (id ? this.unitLabel(s, s.cards[id] as CardInstance) : null))
        .filter(Boolean);
      const units = ps.units
        .map((id, i) => (id ? `${i + 1}) ${this.unitLabel(s, s.cards[id] as CardInstance)}` : null))
        .filter(Boolean);
      const rift = ps.rift ? `   Rift: ${this.cardName(s.cards[ps.rift]?.cardId)}` : '';
      const backLine = `   Backrow: ${back.length ? back.join('  |  ') : '—'}${rift}`;
      const unitLine = `   Units:   ${units.length ? units.join('   ') : '—'}`;
      // the opponent's backrow is on the outside, units face the Rift line
      return mirror ? [header, backLine, unitLine] : [header, unitLine, backLine];
    };
    lines.push(
      bar,
      ...playerBlock(top, true),
      '   ' + '~ '.repeat(36),
      ...playerBlock(bottom, false),
    );
    if (this.viewer !== 'all') {
      const hand = s.players[this.viewer].hand.map((id) => {
        const c = s.cards[id] as CardInstance;
        const d = this.db[c.cardId];
        return `${this.cardName(c.cardId)} (${d?.cost ?? '?'})`;
      });
      lines.push(`   Hand:    ${hand.join(', ') || '—'}`);
    }
    if (s.chain.length) lines.push(`   Chain:   ${this.chainLine(s)}`);
    lines.push(bar);
    return lines.join('\n');
  }

  chainLine(s: GameState): string {
    return s.chain
      .map(
        (l, i) =>
          `${i + 1}. ${this.who(l.controller)} ${this.linkLabel(s, l.kind, l.cardId, l.event.targetId, l.controller)}${l.negated ? ' (NEGATED)' : ''}`,
      )
      .join('  ▸  ');
  }

  private linkLabel(
    s: GameState,
    kind: string,
    cardId: string,
    target: InstanceId | 'face' | undefined,
    controller: PlayerId,
  ): string {
    const name = this.cardName(cardId);
    switch (kind) {
      case 'attack':
        return `attack: ${name} → ${this.nameOf(target, s, controller === 0 ? 1 : 0)}`;
      case 'summon':
        return `summon: ${name}`;
      case 'trap':
        return `TRAP: ${name}`;
      case 'flip':
        return `flip: ${name}`;
      default:
        return name;
    }
  }

  /** One readable line per interesting event (redacted for the viewer). */
  events(before: GameState, after: GameState, raw: GameEvent[]): string[] {
    this.remember(before);
    this.remember(after);
    const evs = this.viewer === 'all' ? raw : this.engine.eventsFor(raw, this.viewer);
    const out: string[] = [];
    const s = after;
    const n = (id: InstanceId | 'face' | undefined, def?: PlayerId) => this.nameOf(id, s, def);
    for (const e of evs) {
      switch (e.type) {
        case 'turnStarted':
          out.push(
            '',
            `══ Turn ${e.turn} — ${this.who(e.player)} (${this.seats[e.player].character}) ══`,
          );
          break;
        case 'mulliganed':
          out.push(`${this.who(e.player)} mulligans ${e.count} card${e.count === 1 ? '' : 's'}.`);
          break;
        case 'cardDrawn':
          out.push(
            e.cardId === HIDDEN
              ? `${this.who(e.player)} draws a card.`
              : `${this.who(e.player)} draws ${this.cardName(e.cardId)}.`,
          );
          break;
        case 'cardBurned':
          out.push(`${this.who(e.player)}'s hand is full: ${this.cardName(e.cardId)} burns.`);
          break;
        case 'fatigue':
          out.push(`${this.who(e.player)} draws from an empty deck: Fatigue ${e.amount}.`);
          break;
        case 'cardPlayed':
          out.push(
            `${this.who(e.player)} plays ${this.cardName(e.cardId)}${e.echo ? ' (Echo)' : ''}.`,
          );
          break;
        case 'unitSummoned':
          if (e.token) out.push(`  ${this.who(e.player)} summons ${this.cardName(e.cardId)}.`);
          break;
        case 'trapSet':
          out.push(
            `${this.who(e.player)} sets ${e.cardId === HIDDEN ? 'a card face-down' : `${this.cardName(e.cardId)} face-down`}.`,
          );
          break;
        case 'ambushSet':
          out.push(
            `${this.who(e.player)} sets ${e.cardId === HIDDEN ? 'a unit face-down' : `${this.cardName(e.cardId)} as an Ambush`}.`,
          );
          break;
        case 'flipped':
          out.push(`  ${this.who(e.player)}'s face-down unit flips: ${this.cardName(e.cardId)}!`);
          break;
        case 'attackDeclared':
          out.push(
            `${this.who(e.player)}: ${n(e.attackerId)} attacks ${n(e.target, e.player === 0 ? 1 : 0)}.`,
          );
          break;
        case 'chainLinkAdded': {
          this.pendingChainLen = e.index;
          const label =
            e.kind === 'trap'
              ? `⚠ TRAP! ${this.who(e.player)} springs ${this.cardName(e.cardId)}`
              : e.kind === 'attack'
                ? `${this.who(e.player)}'s attack`
                : `${this.who(e.player)}: ${this.cardName(e.cardId)}${e.kind === 'summon' ? ' (summon)' : ''}`;
          this.linkLabels.set(e.linkId, `${label}`);
          if (e.kind !== 'attack' || e.index > 1)
            out.push(
              `  [Chain link ${e.index}] ${label}${e.targets.length ? ` → ${e.targets.map((t) => n(t)).join(', ')}` : ''}`,
            );
          else out.push(`  [Chain link ${e.index}] the attack`);
          break;
        }
        case 'chainLinkResolving':
          if (e.index > 1 || this.pendingChainLen > 1)
            out.push(`  ▸ link ${e.index} resolves: ${this.linkLabels.get(e.linkId) ?? '?'}`);
          break;
        case 'chainLinkResolved':
          break;
        case 'negated':
          out.push(`  ✖ ${this.linkLabels.get(e.linkId) ?? 'a link'} is NEGATED.`);
          break;
        case 'fizzled':
          out.push(
            `  ~ ${this.linkLabels.get(e.linkId) ?? 'a link'} fizzles (what it needed is gone).`,
          );
          break;
        case 'damageDealt':
          out.push(
            `    ${typeof e.target === 'object' ? `${this.who(e.target.player)}` : n(e.target)} takes ${e.amount} damage.`,
          );
          break;
        case 'healed':
          out.push(
            `    ${typeof e.target === 'object' ? this.who(e.target.player) : n(e.target)} restores ${e.amount}.`,
          );
          break;
        case 'shieldPopped':
          out.push(`    ${n(e.id)}'s Shield pops.`);
          break;
        case 'keywordGranted':
          out.push(`    ${n(e.id)} gains ${KW_LABEL[e.keyword] ?? e.keyword}.`);
          break;
        case 'statusApplied':
          out.push(
            `    ${n(e.id)} is ${e.status === 'stunned' ? 'Stunned' : e.status === 'corroded' ? 'Corroded' : 'Warded'}.`,
          );
          break;
        case 'unitDestroyed':
          out.push(
            `    ${this.cardName(e.cardId)} shatters${e.cause === 'devoured' ? ' (Devoured)' : ''}.`,
          );
          break;
        case 'cardDestroyed':
          out.push(`    ${this.cardName(e.cardId)} is destroyed.`);
          break;
        case 'returnedToHand':
          out.push(`    ${this.cardName(e.cardId)} returns to ${this.who(e.player)}'s hand.`);
          break;
        case 'evolved':
          out.push(`    ${this.cardName(e.from)} EVOLVES into ${this.cardName(e.to)}!`);
          break;
        case 'assembled':
          out.push(`    ${n(e.id)} Assembles ${this.cardName(this.names.get(e.absorbedId))}.`);
          break;
        case 'discarded':
          out.push(`    ${this.who(e.player)} discards ${this.cardName(e.cardId)}.`);
          break;
        case 'relicBroken':
          out.push(`    ${this.cardName(e.cardId)} breaks.`);
          break;
        case 'riftChanged':
          out.push(`  The Rift shifts: ${this.cardName(e.cardId)}.`);
          break;
        case 'scried':
          out.push(`  ${this.who(e.player)} scries (${e.top} top, ${e.bottom} bottom).`);
          break;
        case 'cardToDeck':
          out.push(
            `  ${this.who(e.player)} puts ${e.cardId === HIDDEN ? 'a card' : this.cardName(e.cardId)} on top of their deck.`,
          );
          break;
        case 'gameOver':
          out.push(
            '',
            e.winner === 'draw'
              ? '★ The duel is a DRAW.'
              : `★ ${this.who(e.winner)} (${this.seats[e.winner].character}) WINS!`,
          );
          break;
        default:
          break;
      }
    }
    return out;
  }

  describe(s: GameState, a: Action): string {
    const nm = (id: InstanceId) => this.nameOf(id, s);
    const tgt = (ts: InstanceId[][]) => {
      const flat = ts.flat();
      return flat.length ? ` → ${flat.map(nm).join(', ')}` : '';
    };
    const cost = (id: InstanceId) => this.db[s.cards[id]?.cardId ?? '']?.cost ?? 0;
    switch (a.type) {
      case 'play': {
        const extras = [
          a.overclock ? 'Overclock' : '',
          a.echo ? 'Echo' : '',
          a.ascend ? `Ascend: destroy ${a.ascend.map(nm).join(' + ')}` : '',
          a.declined?.length ? 'decline the optional effect' : '',
        ].filter(Boolean);
        return `Play ${nm(a.card)} (${cost(a.card)})${tgt(a.targets)}${extras.length ? ` [${extras.join(', ')}]` : ''}`;
      }
      case 'setTrap':
        return `Set ${nm(a.card)} face-down`;
      case 'setAmbush':
        return `Set ${nm(a.card)} as an Ambush (1)`;
      case 'flip':
        return `Flip ${nm(a.unit)} (${Math.max(0, cost(a.unit) - 1)})${tgt(a.targets)}`;
      case 'attack':
        return `Attack with ${nm(a.attacker)} → ${a.target === 'face' ? 'the enemy Riftwalker' : nm(a.target)}`;
      case 'activateTrap':
        return `⚠ Spring ${nm(a.card)} (${cost(a.card)})${tgt(a.targets)}`;
      case 'activate':
        return `Activate ${nm(a.card)}${tgt(a.targets)}`;
      case 'pass':
        return 'Pass';
      case 'endTurn':
        return 'End turn';
      case 'chooseTargets':
        return `Target: ${a.targets.flat().map(nm).join(', ') || 'nothing'}`;
      case 'chooseOptional':
        return a.accept ? 'Yes' : 'No';
      case 'scry':
        return `Top: ${a.top.map(nm).join(', ') || '—'}  |  Bottom: ${a.bottom.map(nm).join(', ') || '—'}`;
      case 'chooseCards': {
        const purpose = s.pending?.kind === 'chooseCards' ? s.pending.purpose : 'topdeck';
        if (a.cards.length === 0) return purpose === 'topdeck' ? 'Choose nothing' : 'Do nothing';
        const names = a.cards.map(nm).join(', ');
        if (purpose === 'setTrap') return `Set ${names} face-down`;
        if (purpose === 'destroySet') return `Destroy ${names}`;
        return `Put ${names} on top of your deck`;
      }
      case 'mulligan':
        return a.cards.length ? `Mulligan: ${a.cards.map(nm).join(', ')}` : 'Keep hand';
      case 'concede':
        return 'Concede';
    }
  }
}
