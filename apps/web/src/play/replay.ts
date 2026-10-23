// Replays one Batch of engine events on the battlefield scene. The rules have already resolved; this only
// shows what happened, in order (golden rules 3 and 4). After the events play, reconcile() makes sure the
// scene matches the final view exactly, so a missed or unknown event can never leave the board wrong.

import type { CardDef, GameEvent, GameView } from '@sr/engine';
import { CARD_DB } from '@sr/content';
import type { BattlefieldScene } from '../duel/scene/BattlefieldScene';
import type { Batch } from './session';
import { HUMAN } from './session';
import { describeEvent } from './log';
import { keyResolver, sideOf, trapKey, unitKey } from './slots';

/** What the replay needs from the HUD (DOM) layer. */
export interface HudBus {
  banner(text: string, tone: 'me' | 'opp' | 'neutral'): Promise<void>;
  playerHit(player: 0 | 1, amount: number, kind: 'damage' | 'heal'): void;
  log(line: string): void;
}

export interface ReplayEnv {
  scene: BattlefieldScene;
  hud: HudBus;
  /** 1 = normal; larger is faster. */
  speed: () => number;
  cancelled: () => boolean;
}

/** Events that are the visible consequences of damage; they play together at the moment of impact. */
const IMPACT: ReadonlySet<GameEvent['type']> = new Set([
  'damageDealt',
  'shieldPopped',
  'unitDestroyed',
  'cardDestroyed',
  'healed',
  'statsChanged',
]);

/** Events that end an impact group (something new is about to be shown). */
const STOPPERS: ReadonlySet<GameEvent['type']> = new Set([
  'attackDeclared',
  'turnStarted',
  'cardPlayed',
  'unitSummoned',
  'trapSet',
  'ambushSet',
  'flipped',
  'chainLinkAdded',
  'gameOver',
]);

const defOf = (cardId: string): CardDef | undefined =>
  cardId === '?' ? undefined : CARD_DB[cardId];

export async function replayBatch(b: Batch, env: ReplayEnv): Promise<void> {
  const { scene, hud } = env;
  const key = keyResolver(b.before, b.after);
  const wait = (ms: number) =>
    new Promise<void>((r) => window.setTimeout(r, Math.max(0, ms / Math.max(0.25, env.speed()))));
  const background: Promise<unknown>[] = [];
  const consumed = new Set<number>();
  const logView = b.after;

  /** The immediate visual for an impact-type event (no waiting). */
  const impact = (e: GameEvent): void => {
    switch (e.type) {
      case 'damageDealt': {
        if (typeof e.target === 'string') {
          const k = key(e.target);
          if (k && scene.monsters.has(k)) scene.monsters.hit(k, e.amount);
        } else hud.playerHit(e.target.player, e.amount, 'damage');
        break;
      }
      case 'healed': {
        if (typeof e.target === 'string') {
          const k = key(e.target);
          if (k && scene.monsters.has(k)) scene.monsters.heal(k, e.amount);
        } else hud.playerHit(e.target.player, e.amount, 'heal');
        break;
      }
      case 'statsChanged': {
        const k = key(e.id);
        if (k && scene.monsters.has(k)) scene.monsters.setStats(k, e.power, e.guard);
        break;
      }
      case 'unitDestroyed': {
        const k = key(e.id);
        if (k && scene.monsters.has(k)) background.push(scene.monsters.die(k));
        break;
      }
      case 'cardDestroyed': {
        const k = key(e.id);
        if (k && scene.traps.has(k)) scene.traps.remove(k);
        break;
      }
      default:
        break;
    }
  };

  for (let i = 0; i < b.events.length; i++) {
    if (env.cancelled()) return;
    if (consumed.has(i)) continue;
    const e = b.events[i] as GameEvent;
    const line = describeEvent(e, logView);
    if (line) hud.log(line);

    switch (e.type) {
      case 'turnStarted':
        await hud.banner(e.player === HUMAN ? 'Your turn' : "Enemy's turn", sideOf(e.player));
        break;

      case 'cardPlayed': {
        const d = defOf(e.cardId);
        if (d && (d.type === 'spell' || d.type === 'rift')) {
          scene.onSound('cast');
          await scene.traps.cast(d, sideOf(e.player));
        }
        break;
      }

      case 'unitSummoned': {
        const d = defOf(e.cardId);
        const k = unitKey(e.player, e.slot);
        if (d && !scene.monsters.has(k)) {
          const st = b.after.stats[e.id];
          scene.monsters.summon(k, d, st?.power ?? d.power ?? 0, st?.guard ?? d.guard ?? 0);
          await wait(260);
        }
        break;
      }

      case 'trapSet': {
        const k = key(e.id);
        if (k && !scene.traps.has(k)) {
          scene.traps.setFaceDown(k);
          await wait(320);
        }
        break;
      }

      case 'ambushSet': {
        const k = unitKey(e.player, e.slot);
        if (!scene.traps.has(k) && !scene.monsters.has(k)) {
          scene.traps.setFaceDown(k);
          await wait(320);
        }
        break;
      }

      case 'flipped': {
        const d = defOf(e.cardId);
        const k = key(e.id);
        if (d && k && scene.traps.has(k)) {
          await scene.traps.reveal(k, d);
          const st = b.after.stats[e.id];
          if (!scene.monsters.has(k))
            scene.monsters.summon(k, d, st?.power ?? d.power ?? 0, st?.guard ?? d.guard ?? 0);
        }
        break;
      }

      case 'attackDeclared': {
        const from = key(e.attackerId);
        if (!from || !scene.monsters.has(from)) break;
        const to = e.target === 'face' ? null : (key(e.target) ?? null);
        // collect the consequences that follow, up to the next thing worth showing
        const group: number[] = [];
        for (let j = i + 1; j < b.events.length; j++) {
          const n = (b.events[j] as GameEvent).type;
          if (STOPPERS.has(n)) break;
          if (IMPACT.has(n)) group.push(j);
        }
        group.forEach((j) => consumed.add(j));
        await scene.monsters.attack(from, to, () => {
          for (const j of group) {
            const ev = b.events[j] as GameEvent;
            impact(ev);
            const l = describeEvent(ev, logView);
            if (l) hud.log(l);
          }
        });
        await wait(180);
        break;
      }

      case 'chainLinkAdded': {
        if (e.kind === 'trap') {
          const d = defOf(e.cardId);
          const k = key(e.sourceId);
          if (d && k && scene.traps.has(k)) await scene.traps.reveal(k, d);
        } else if (e.kind === 'spell') {
          // already flourished by cardPlayed when cast from hand; Echo/ability casts get no extra beat
        }
        break;
      }

      case 'unitBanished': {
        const k = key(e.id);
        if (k && scene.monsters.has(k)) background.push(scene.monsters.vanish(k));
        break;
      }

      case 'damageDealt':
      case 'healed':
      case 'statsChanged':
      case 'unitDestroyed':
      case 'cardDestroyed':
        impact(e);
        await wait(e.type === 'unitDestroyed' ? 220 : 120);
        break;

      case 'gameOver':
        await wait(600);
        break;

      default:
        break;
    }
  }

  await Promise.all(background);
  if (!env.cancelled()) await reconcile(scene, b.after, env);
}

/** Make the scene match a view exactly: summon what's missing, remove what's gone, fix stats and sigils. */
export async function reconcile(
  scene: BattlefieldScene,
  view: GameView,
  env: Pick<ReplayEnv, 'cancelled'>,
): Promise<void> {
  const leaving: Promise<unknown>[] = [];
  /** work that must wait until the old monster has faded (Evolve / transform) */
  const after: (() => void)[] = [];
  const wantMonster = new Set<string>();
  const wantSigil = new Set<string>();

  view.players.forEach((ps, p) => {
    const player = p as 0 | 1;
    ps.units.forEach((id, i) => {
      if (!id) return;
      const c = view.cards[id];
      if (!c) return;
      const k = unitKey(player, i);
      if (c.faceDown) {
        // an Ambush (yours or the enemy's): a sealed sigil in a unit slot
        wantSigil.add(k);
        if (!scene.traps.has(k)) scene.traps.setFaceDown(k);
        return;
      }
      const d = defOf(c.cardId);
      if (!d) return;
      wantMonster.add(k);
      const st = view.stats[id];
      const power = st?.power ?? d.power ?? 0;
      const guard = st?.guard ?? d.guard ?? 0;
      const present = scene.monsters.defOf(k);
      if (present && present !== d.id) {
        // an Evolve or transform changed what stands here
        leaving.push(scene.monsters.vanish(k));
        after.push(() => scene.monsters.summon(k, d, power, guard));
      } else if (!present) {
        scene.monsters.summon(k, d, power, guard);
      } else {
        const cur = scene.monsters.stats(k);
        if (cur && (cur.power !== power || cur.guard !== guard))
          scene.monsters.setStats(k, power, guard);
      }
    });
    ps.backrow.forEach((id, i) => {
      if (!id) return;
      const c = view.cards[id];
      if (!c) return;
      const k = trapKey(player, i);
      wantSigil.add(k);
      if (scene.traps.has(k)) return;
      const d = defOf(c.cardId);
      if (c.faceDown || !d) scene.traps.setFaceDown(k);
      else scene.traps.setFaceUp(k, d);
    });
  });

  for (const k of scene.monsters.keys()) {
    if (!wantMonster.has(k)) leaving.push(scene.monsters.vanish(k));
  }
  for (const k of scene.traps.keys()) {
    if (!wantSigil.has(k) && scene.traps.canReveal(k)) scene.traps.remove(k);
  }
  await Promise.all(leaving);
  if (!env.cancelled()) for (const fn of after) fn();
}
