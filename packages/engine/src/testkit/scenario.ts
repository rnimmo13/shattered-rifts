// Fluent scenario builder for rules and card tests (07_TECH_ARCHITECTURE §5):
//
//   scenario(db).p1.board('AUR-04').p2.set('WYL-11')
//     .p1.attack('AUR-04', 'p2-face').p2.respond('WYL-11').resolve()
//     .expect((t) => expect(t.void(1)).toContain('AUR-04'));
//
// Every action goes through legalActions()/applyAction(), so tests only ever make legal moves.
// Card refs: 'AUR-04' (in the acting player's zones), 'p2:WYL-02', 'p2:WYL-02#1' (2nd copy), 'p1-face'.

import type {
  Action,
  Rules,
  CardDb,
  CardInstance,
  GameEvent,
  GameState,
  InstanceId,
  PlayerId,
} from '../types';
import { createEngine, type Engine } from '../engine';
import { syncBackrow } from '../board';
import { newInstance, place, type Rt } from '../rt';
import { computeStats, initEnterStatuses, type Stats } from '../stats';
import { stableStringify } from '../util';

interface PlayerSpec {
  hand: string[];
  board: string[];
  set: string[];
  ambush: string[];
  relics: string[];
  rift: string | null;
  deck: string[];
  void: string[];
  aether: number;
  maxAether: number;
  essence: number;
  sigil: string | null;
}

const emptySpec = (): PlayerSpec => ({
  hand: [],
  board: [],
  set: [],
  ambush: [],
  relics: [],
  rift: null,
  deck: [],
  void: [],
  aether: 10,
  maxAether: 10,
  essence: 30,
  sigil: null,
});

export interface ScenarioOptions {
  seed?: string;
  /** Turn number to start on (default 3: board units are ready, set cards are activatable). */
  turn?: number;
  /** Who is active at the start (default p1). */
  active?: 1 | 2;
  rules?: Partial<Rules>;
}

type TargetArg = string | string[];

export interface PlayOptions {
  /** One ref per slot (string) or several refs per slot (string[]). */
  targets?: TargetArg[];
  overclock?: boolean;
  /** Decline all optional abilities ("you may"). */
  decline?: boolean;
  echo?: boolean;
  ascend?: string[];
}

export class Scenario {
  readonly engine: Engine;
  private specs: [PlayerSpec, PlayerSpec] = [emptySpec(), emptySpec()];
  private _state: GameState | null = null;
  readonly events: GameEvent[] = [];
  readonly actions: Action[] = [];
  /** Events from the most recent action only. */
  lastEvents: GameEvent[] = [];
  private actor: PlayerId = 0;

  constructor(
    readonly db: CardDb,
    private readonly opts: ScenarioOptions = {},
  ) {
    this.engine = createEngine(db);
  }

  // --- scoping ---------------------------------------------------------------------------
  get p1(): this {
    this.actor = 0;
    return this;
  }
  get p2(): this {
    this.actor = 1;
    return this;
  }

  // --- setup (only before the first action) ------------------------------------------------
  private setup(fn: (s: PlayerSpec) => void): this {
    if (this._state) throw new Error('Scenario setup must come before actions');
    fn(this.specs[this.actor]);
    return this;
  }
  hand(...ids: string[]) {
    return this.setup((s) => s.hand.push(...ids));
  }
  board(...ids: string[]) {
    return this.setup((s) => s.board.push(...ids));
  }
  /** Face-down Trap(s) in the backrow, set on an earlier turn (ready). */
  set(...ids: string[]) {
    return this.setup((s) => s.set.push(...ids));
  }
  /** Face-down Ambush unit(s), set on an earlier turn. */
  ambush(...ids: string[]) {
    return this.setup((s) => s.ambush.push(...ids));
  }
  relic(...ids: string[]) {
    return this.setup((s) => s.relics.push(...ids));
  }
  rift(id: string) {
    return this.setup((s) => (s.rift = id));
  }
  /** Deck, top card first. */
  deck(...ids: string[]) {
    return this.setup((s) => s.deck.push(...ids));
  }
  voidCards(...ids: string[]) {
    return this.setup((s) => s.void.push(...ids));
  }
  aether(n: number, max = Math.max(n, 1)) {
    return this.setup((s) => {
      s.aether = n;
      s.maxAether = max;
    });
  }
  /** Current Essence (max stays 30). */
  essence(n: number) {
    return this.setup((s) => (s.essence = n));
  }
  sigil(id: string) {
    return this.setup((s) => (s.sigil = id));
  }

  // --- state ---------------------------------------------------------------------------------
  get state(): GameState {
    if (!this._state) this._state = this.build();
    return this._state;
  }

  private build(): GameState {
    const turn = this.opts.turn ?? 3;
    const active: PlayerId = this.opts.active === 2 ? 1 : 0;
    const s = this.engine.createGame({
      seed: this.opts.seed ?? 'scenario',
      players: [{ deck: [] }, { deck: [] }],
      first: turn % 2 === 1 ? active : ((1 - active) as PlayerId),
      rules: { ...this.opts.rules, openingHand: 0 },
    });
    const rt: Rt = { s, db: this.db, ev: [] };
    s.pending = null;
    s.phase = 'main';
    s.turn = turn;
    s.active = active;
    for (const p of [0, 1] as const) {
      const spec = this.specs[p];
      const ps = s.players[p];
      ps.mulliganed = true;
      ps.essence = spec.essence; // current only; max stays at the starting value
      ps.aether = spec.aether;
      ps.maxAether = spec.maxAether;
      const add = (cardId: string, zone: CardInstance['zone']) => {
        const c = newInstance(rt, cardId, p, zone);
        return c;
      };
      // Rift and Sigil first: statics like Rift: The Hollow Veil change the backrow size
      if (spec.rift) place(rt, add(spec.rift, 'rift'));
      if (spec.sigil) place(rt, add(spec.sigil, 'sigil'));
      syncBackrow(rt);
      for (const id of spec.deck) place(rt, add(id, 'deck'), { position: 'bottom' });
      for (const id of spec.hand) place(rt, add(id, 'hand'));
      for (const id of spec.void) place(rt, add(id, 'void'));
      for (const id of spec.board) {
        const c = add(id, 'units');
        initEnterStatuses(rt, c);
        place(rt, c);
      }
      for (const id of spec.ambush) {
        const c = add(id, 'units');
        c.faceDown = true;
        place(rt, c);
      }
      for (const id of spec.set) {
        const c = add(id, 'backrow');
        c.faceDown = true;
        place(rt, c);
      }
      for (const id of spec.relics) {
        const c = add(id, 'backrow');
        c.charges = this.db[id]?.params?.charges ?? 0;
        place(rt, c);
      }
    }
    return s;
  }

  // --- refs ------------------------------------------------------------------------------------
  /** Resolves a card ref to an instance id. Searches field, then hand, backrow, void, deck. */
  id(ref: string, defaultPlayer: PlayerId = this.actor): InstanceId {
    const m = /^(?:p([12]):)?([A-Z0-9-]+?)(?:#(\d+))?$/.exec(ref);
    if (!m) throw new Error(`Bad card ref: ${ref}`);
    const p: PlayerId = m[1] ? ((Number(m[1]) - 1) as PlayerId) : defaultPlayer;
    const cardId = m[2] as string;
    const nth = m[3] ? Number(m[3]) : 0;
    const ps = this.state.players[p];
    const order = [
      ...ps.units,
      ...ps.backrow,
      ps.rift,
      ...ps.hand,
      ...ps.void,
      ...ps.deck,
      ps.sigil,
    ];
    const ids = order.filter((x): x is InstanceId => {
      if (!x) return false;
      const c = this.state.cards[x];
      return !!c && (c.cardId === cardId || c.baseCardId === cardId);
    });
    // chain-zone cards (spells/traps waiting to resolve)
    for (const l of this.state.chain) {
      const c = this.state.cards[l.sourceId];
      if (c && c.zone === 'chain' && c.cardId === cardId && c.owner === p) ids.push(c.id);
    }
    const id = ids[nth];
    if (!id) throw new Error(`No ${cardId} #${nth} for p${p + 1}`);
    return id;
  }

  private targetIds(t: TargetArg | undefined): InstanceId[] {
    if (t === undefined) return [];
    const refs = Array.isArray(t) ? t : [t];
    return refs.map((r) => this.id(r, (1 - this.actor) as PlayerId));
  }

  private refToTarget(ref: string): InstanceId | 'face' {
    if (/^p[12]-face$/.test(ref) || ref === 'face') return 'face';
    return this.id(ref, (1 - this.actor) as PlayerId);
  }

  // --- actions -------------------------------------------------------------------------------
  legal(p: PlayerId = this.actor): Action[] {
    return this.engine.legalActions(this.state, p);
  }

  act(a: Action): this {
    const { state, events } = this.engine.applyAction(this.state, a);
    this._state = state;
    this.events.push(...events);
    this.lastEvents = events;
    this.actions.push(a);
    return this;
  }

  private pick(pred: (a: Action) => boolean, what: string): this {
    const matches = this.legal().filter(pred);
    if (matches.length === 0) {
      const legal = this.legal()
        .map((a) => stableStringify(a))
        .join('\n  ');
      throw new Error(`No legal action for ${what} (p${this.actor + 1}). Legal:\n  ${legal}`);
    }
    if (matches.length > 1) {
      throw new Error(
        `Ambiguous ${what}: ${matches.length} matches:\n  ${matches.map((a) => stableStringify(a)).join('\n  ')}`,
      );
    }
    return this.act(matches[0] as Action);
  }

  private targetsMatch(actual: InstanceId[][], wanted: TargetArg[] | undefined): boolean {
    if (wanted === undefined) return true;
    const want = wanted.map((t) => this.targetIds(t));
    const norm = (x: InstanceId[][]) =>
      stableStringify(x.filter((ids, i) => ids.length > 0 || want[i]?.length));
    return norm(actual) === norm(want);
  }

  play(ref: string, o: PlayOptions = {}): this {
    const id = this.id(ref);
    const ascend = o.ascend?.map((r) => this.id(r));
    return this.pick((a) => {
      if (a.type !== 'play' || a.card !== id) return false;
      if (!!a.overclock !== !!o.overclock) return false;
      if (!!a.echo !== !!o.echo) return false;
      if (o.decline !== undefined && (a.declined ?? []).length > 0 !== o.decline) return false;
      if (stableStringify(a.ascend ?? null) !== stableStringify(ascend ?? null)) return false;
      return this.targetsMatch(a.targets, o.targets);
    }, `play ${ref}`);
  }

  setTrap(ref: string): this {
    const id = this.id(ref);
    return this.pick((a) => a.type === 'setTrap' && a.card === id, `set ${ref}`);
  }

  setAmbush(ref: string): this {
    const id = this.id(ref);
    return this.pick((a) => a.type === 'setAmbush' && a.card === id, `ambush ${ref}`);
  }

  flip(ref: string, targets?: TargetArg[]): this {
    const id = this.id(ref);
    return this.pick(
      (a) => a.type === 'flip' && a.unit === id && this.targetsMatch(a.targets, targets),
      `flip ${ref}`,
    );
  }

  attack(attacker: string, target: string): this {
    const aid = this.id(attacker);
    const tid = this.refToTarget(target);
    return this.pick(
      (a) => a.type === 'attack' && a.attacker === aid && a.target === tid,
      `attack ${attacker}→${target}`,
    );
  }

  /** Spring a set Trap or cast a Swift spell in the open response window. */
  respond(ref: string, targets?: TargetArg[]): this {
    const id = this.id(ref);
    return this.pick(
      (a) =>
        ((a.type === 'activateTrap' && a.card === id) || (a.type === 'play' && a.card === id)) &&
        this.targetsMatch(a.targets, targets),
      `respond ${ref}`,
    );
  }

  activate(ref: string, ability = 0, targets?: TargetArg[]): this {
    const id = this.id(ref);
    return this.pick(
      (a) =>
        a.type === 'activate' &&
        a.card === id &&
        (ability < 0 || a.ability === ability) &&
        this.targetsMatch(a.targets, targets),
      `activate ${ref}`,
    );
  }

  pass(): this {
    return this.pick((a) => a.type === 'pass', 'pass');
  }

  endTurn(): this {
    return this.pick((a) => a.type === 'endTurn', 'end turn');
  }

  /** Answer a chooseTargets prompt. */
  choose(...targets: TargetArg[]): this {
    return this.pick(
      (a) => a.type === 'chooseTargets' && this.targetsMatch(a.targets, targets),
      'choose targets',
    );
  }

  accept(yes = true): this {
    return this.pick((a) => a.type === 'chooseOptional' && a.accept === yes, 'optional');
  }

  scry(top: string[], bottom: string[]): this {
    const t = top.map((r) => this.id(r));
    const b = bottom.map((r) => this.id(r));
    return this.pick(
      (a) =>
        a.type === 'scry' &&
        stableStringify(a.top) === stableStringify(t) &&
        stableStringify(a.bottom) === stableStringify(b),
      'scry',
    );
  }

  chooseCards(...refs: string[]): this {
    const ids = refs.map((r) => this.id(r));
    return this.pick(
      (a) => a.type === 'chooseCards' && stableStringify(a.cards) === stableStringify(ids),
      'choose cards',
    );
  }

  /** Both players pass until the chain is empty (stops at prompts). */
  resolve(): this {
    for (let guard = 0; guard < 500; guard++) {
      const s = this.state;
      if (!s.window || s.pending || s.winner !== null) return this;
      const prev = this.actor;
      this.actor = s.window.priority;
      this.pass();
      this.actor = prev;
    }
    throw new Error('resolve(): chain did not finish');
  }

  expect(fn: (t: this) => void): this {
    fn(this);
    return this;
  }

  // --- inspection ----------------------------------------------------------------------------
  private ps(p: 1 | 2) {
    return this.state.players[p === 1 ? 0 : 1];
  }

  card(ref: string): CardInstance {
    const c = this.state.cards[this.id(ref)];
    if (!c) throw new Error(`No card ${ref}`);
    return c;
  }

  /** Is this card on the field (unit row, backrow or rift)? */
  onField(ref: string): boolean {
    try {
      const c = this.card(ref);
      return c.zone === 'units' || c.zone === 'backrow' || c.zone === 'rift';
    } catch {
      return false;
    }
  }

  stats(ref: string): Stats {
    return computeStats({ s: this.state, db: this.db, ev: [] }, this.card(ref));
  }

  private cardIds(ids: (InstanceId | null)[]): string[] {
    return ids.filter((x): x is InstanceId => !!x).map((x) => this.state.cards[x]?.cardId ?? '?');
  }
  units(p: 1 | 2): string[] {
    return this.cardIds(this.ps(p).units);
  }
  backrow(p: 1 | 2): string[] {
    return this.cardIds(this.ps(p).backrow);
  }
  handCards(p: 1 | 2): string[] {
    return this.cardIds(this.ps(p).hand);
  }
  void(p: 1 | 2): string[] {
    return this.cardIds(this.ps(p).void);
  }
  beyond(p: 1 | 2): string[] {
    return this.cardIds(this.ps(p).beyond);
  }
  deckCards(p: 1 | 2): string[] {
    return this.cardIds(this.ps(p).deck);
  }
  essenceOf(p: 1 | 2): number {
    return this.ps(p).essence;
  }
  aetherOf(p: 1 | 2): { aether: number; temp: number; max: number } {
    const ps = this.ps(p);
    return { aether: ps.aether, temp: ps.tempAether, max: ps.maxAether };
  }
  resonanceOf(p: 1 | 2): number {
    return this.ps(p).resonance;
  }
  eventTypes(): string[] {
    return this.events.map((e) => e.type);
  }
}

export function scenario(db: CardDb, opts?: ScenarioOptions): Scenario {
  return new Scenario(db, opts);
}
