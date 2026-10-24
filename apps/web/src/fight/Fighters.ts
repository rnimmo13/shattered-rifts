// The combatants on the stage: your hero and allies on the left, the enemies on the right, all standing on one line.
// Presentation only. It animates what the engine already decided (lunges, hits, deaths, summons) and reports where
// each figure is so the DOM overlay (HP bars, intents, statuses) can sit on top of it.

import { Container, Sprite, Texture } from 'pixi.js';
import { gsap } from 'gsap';
import { color, ease, hex } from '../design/tokens';
import type { EffectsProfile } from '../duel/effects';
import { loadSpriteFx, playSpriteFx, type FxName } from './spriteFx';
import type { AttackSpec } from './attackStyles';
import {
  burst,
  clawMarks,
  orb,
  puff,
  ring,
  slashArc,
  streak,
  thrownBlade,
  type FxCtx,
  type Pt,
} from './attackFx';

export type FighterSide = 'a' | 'b';

/** Stage coordinates (1920x1080 reference). Slot 0 is the one nearest the centre. */
export const LINE_Y = 830;
export const HERO_X = 230;
const CENTRE = 960;
const ALLY_PITCH = 205;
const FOE_PITCH = 195;

export function slotX(side: FighterSide, slot: number, isHero: boolean, count = 4): number {
  if (isHero) return HERO_X;
  // a crowd packs closer so it still fits on the stage (and the plates under it are narrowed to match)
  const pitch = count <= 4 ? FOE_PITCH : Math.max(104, Math.floor(640 / (count - 1)));
  // (a very long line starts a little further left so its last figure and plate stay on the stage)
  const start = CENTRE + 260 - Math.max(0, count - 6) * 40;
  return side === 'a' ? CENTRE - 150 - slot * ALLY_PITCH : start + slot * pitch;
}

export interface FighterSpec {
  id: string;
  side: FighterSide;
  isHero: boolean;
  /** 0 = nearest the centre (allies and enemies); ignored for heroes */
  slot: number;
  /** how many non-hero units stand on this side (a big crowd stands closer together) */
  count: number;
  canvas: HTMLCanvasElement;
  /** figure height in stage px */
  height: number;
  /** how its attacks look (a slash, a shot, a spell...): presentation only */
  attack: AttackSpec;
  /** something that floats beside the figure while `on` (a blade in her hand): a cut-out and where it hovers, in figure pixels */
  prop?: { canvas: HTMLCanvasElement; x: number; y: number; on: boolean };
}

interface Fighter {
  spec: FighterSpec;
  root: Container;
  body: Container;
  sprite: Sprite;
  flash: Sprite;
  prop: Sprite | null;
  /** whether the prop is shown (or fading in) as of the last sync */
  propOn: boolean;
  ring: Sprite;
  aura: Sprite;
  x: number;
  width: number;
  phase: number;
  dying: boolean;
  targetable: boolean;
  busy: number;
}

export interface FighterHost {
  container: Container;
  glowTex: Texture;
  profile: () => EffectsProfile;
  sound: (name: string) => void;
}

/** Melee timings per style (before the 1.5x speed-up): the pull-back, the rush, the lean angle and a jump for heavy blows. */
const MELEE = {
  lunge: { back: 24, wind: 0.16, rush: 0.12, tilt: 0, lift: 0 },
  slash: { back: 30, wind: 0.2, rush: 0.12, tilt: 0.3, lift: 0 },
  stab: { back: 14, wind: 0.1, rush: 0.08, tilt: 0.06, lift: 0 },
  claw: { back: 22, wind: 0.14, rush: 0.1, tilt: 0.14, lift: -8 },
  smash: { back: 20, wind: 0.34, rush: 0.14, tilt: 0.24, lift: -46 },
};

export class Fighters {
  private readonly all = new Map<string, Fighter>();
  private readonly live = new Set<gsap.core.Animation>();
  private destroyed = false;

  constructor(private readonly h: FighterHost) {
    void loadSpriteFx();
  }

  private track<T extends gsap.core.Animation>(a: T): T {
    if (this.live.size > 120)
      for (const x of this.live) if (x.progress() === 1) this.live.delete(x);
    this.live.add(a);
    return a;
  }

  has(id: string): boolean {
    return this.all.has(id);
  }

  /** Stage position of a figure (feet), its height, and where its head and chest are. */
  anchor(id: string): { x: number; y: number; h: number; w: number } | null {
    const f = this.all.get(id);
    if (!f) return null;
    return { x: f.root.x, y: f.root.y, h: f.spec.height, w: f.width };
  }

  /** Where a figure stands when at rest (its slot), unaffected by a lunge in progress. */
  home(id: string): { x: number; y: number; h: number; w: number } | null {
    const f = this.all.get(id);
    return f ? { x: f.x, y: LINE_Y, h: f.spec.height, w: f.width } : null;
  }

  /** Which figure is under this stage point, if any (the nearest wins). */
  hitTest(x: number, y: number): string | null {
    let best: string | null = null;
    let bestD = Infinity;
    for (const f of this.all.values()) {
      if (f.dying) continue;
      const dx = Math.abs(x - f.root.x);
      if (
        dx <= f.width * 0.55 &&
        y <= f.root.y + 24 &&
        y >= f.root.y - f.spec.height - 10 &&
        dx < bestD
      ) {
        best = f.spec.id;
        bestD = dx;
      }
    }
    return best;
  }

  /** Make the set of figures match `list`: add new ones (with a pop-in), slide existing ones to their slots. */
  sync(list: FighterSpec[], opts: { instant?: boolean } = {}): void {
    const keep = new Set(list.map((s) => s.id));
    for (const f of [...this.all.values()])
      if (!keep.has(f.spec.id) && !f.dying) this.remove(f.spec.id);
    for (const spec of list) {
      const x = slotX(spec.side, spec.slot, spec.isHero, spec.count);
      const f = this.all.get(spec.id);
      if (!f) {
        this.add(spec, x, !opts.instant);
      } else if (!f.dying) {
        f.spec = spec;
        this.showProp(f, opts.instant === true);
        if (Math.abs(f.x - x) > 1) {
          f.x = x;
          gsap.killTweensOf(f.root, 'x');
          if (opts.instant || this.h.profile().still) f.root.x = x;
          else this.track(gsap.to(f.root, { x, duration: 0.35, ease: ease.out.gsap }));
        }
      }
    }
  }

  private add(spec: FighterSpec, x: number, animate: boolean): void {
    const k = spec.height / spec.canvas.height;
    const tex = Texture.from(spec.canvas);
    const root = new Container();
    root.position.set(x, LINE_Y);
    root.zIndex = LINE_Y;

    const shadow = new Sprite(this.h.glowTex);
    shadow.anchor.set(0.5);
    shadow.tint = 0x000000;
    shadow.alpha = 0.55;
    const w = spec.canvas.width * k;
    shadow.scale.set((w * 0.95) / 128, (w * 0.95 * 0.24) / 128);

    const tint = spec.side === 'a' ? color.cyan : '#ff5a86';
    const aura = new Sprite(this.h.glowTex);
    aura.anchor.set(0.5, 0.5);
    aura.tint = hex(tint);
    aura.blendMode = 'add';
    aura.alpha = spec.isHero ? 0.42 : 0.22;
    aura.scale.set((w * 1.1) / 128, (w * 1.1 * 0.34) / 128);

    const ring = new Sprite(this.h.glowTex);
    ring.anchor.set(0.5);
    ring.tint = 0xff4a6e;
    ring.blendMode = 'add';
    ring.alpha = 0;
    ring.scale.set((w * 1.3) / 128, (w * 1.3 * 0.4) / 128);

    const body = new Container();
    const sprite = new Sprite(tex);
    sprite.anchor.set(0.5, 1);
    sprite.scale.set(k);
    const flash = new Sprite(tex);
    flash.anchor.set(0.5, 1);
    flash.scale.set(k);
    flash.blendMode = 'add';
    flash.alpha = 0;
    body.addChild(sprite, flash);
    let prop: Sprite | null = null;
    if (spec.prop) {
      prop = new Sprite(Texture.from(spec.prop.canvas));
      prop.anchor.set(0.5);
      prop.scale.set(k);
      prop.position.set((spec.prop.x - spec.canvas.width / 2) * k, (spec.prop.y - spec.canvas.height) * k);
      prop.alpha = spec.prop.on ? 1 : 0;
      prop.visible = spec.prop.on;
      body.addChild(prop);
    }
    root.addChild(shadow, aura, ring, body);
    this.h.container.addChild(root);
    this.h.container.sortableChildren = true;
    const f: Fighter = {
      spec,
      root,
      body,
      sprite,
      flash,
      prop,
      propOn: spec.prop?.on === true,
      ring,
      aura,
      x,
      width: w,
      phase: (this.all.size * 1.7) % 6.28,
      dying: false,
      targetable: false,
      busy: 0,
    };
    this.all.set(spec.id, f);
    if (animate && !this.h.profile().still) {
      root.alpha = 0;
      this.track(gsap.to(root, { alpha: 1, duration: 0.25 }));
      this.track(
        gsap.fromTo(
          body.scale,
          { x: 0.2, y: 0.2 },
          { x: 1, y: 1, duration: 0.45, ease: ease.pop.gsap },
        ),
      );
      this.track(gsap.fromTo(body, { y: -40 }, { y: 0, duration: 0.45, ease: ease.pop.gsap }));
      this.h.sound('summon');
    }
  }

  /** Fade a floating prop in or out to match the spec (the blade comes only while she holds one). */
  private showProp(f: Fighter, instant: boolean): void {
    const want = f.spec.prop?.on === true;
    const p = f.prop;
    // compare with where the last fade was heading (not `visible`, which lags behind a fade-out in progress)
    if (!p || f.propOn === want) return;
    f.propOn = want;
    gsap.killTweensOf(p);
    if (instant || this.h.profile().still) {
      p.visible = want;
      p.alpha = want ? 1 : 0;
      return;
    }
    if (want) {
      p.visible = true;
      this.track(gsap.fromTo(p, { alpha: 0 }, { alpha: 1, duration: 0.3 }));
    } else {
      this.track(gsap.to(p, { alpha: 0, duration: 0.25, onComplete: () => void (p.visible = false) }));
    }
  }

  private remove(id: string): void {
    const f = this.all.get(id);
    if (!f) return;
    gsap.killTweensOf([
      f.root,
      f.body,
      f.body.position,
      f.body.scale,
      f.sprite,
      f.flash,
      ...(f.prop ? [f.prop] : []),
    ]);
    f.root.destroy({ children: true });
    this.all.delete(id);
  }

  // --- animation -------------------------------------------------------------------------------------------

  /** Attack the target in the figure's own style (a slash, a shot, a spell...) and call `onHit` at contact. */
  attack(id: string, targetId: string | null, onHit?: () => void): Promise<void> {
    const f = this.all.get(id);
    const t = targetId ? this.all.get(targetId) : undefined;
    if (!f || f.dying || this.h.profile().still) {
      onHit?.();
      return Promise.resolve();
    }
    const dir = f.spec.side === 'a' ? 1 : -1;
    const kind = f.spec.attack.kind;
    return kind === 'shoot' || kind === 'throw' || kind === 'cast'
      ? this.rangedAttack(f, t, dir, onHit)
      : this.meleeAttack(f, t, dir, onHit);
  }

  private fxCtx(): FxCtx {
    return { parent: this.h.container, track: (a) => this.track(a) };
  }

  /** The middle of a figure's body, where effects land. */
  private chest(f: Fighter, dx = 0): Pt {
    return { x: f.root.x + dx, y: f.root.y - f.spec.height * 0.55 };
  }

  /** Rush at the target: the same beats for every melee style, with a different windup, pose and effect at contact. */
  private meleeAttack(
    f: Fighter,
    t: Fighter | undefined,
    dir: number,
    onHit?: () => void,
  ): Promise<void> {
    const kind = f.spec.attack.kind;
    const m = kind === 'slash' || kind === 'stab' || kind === 'claw' || kind === 'smash' ? MELEE[kind] : MELEE.lunge;
    const dx = t ? (t.root.x - f.root.x) * 0.78 : dir * 160;
    return new Promise((resolve) => {
      f.busy++;
      f.root.zIndex = 5000;
      const tl = this.track(
        gsap.timeline({
          onComplete: () => {
            f.busy--;
            f.root.zIndex = LINE_Y;
            resolve(); // (already resolved at contact; harmless)
          },
        }),
      );
      tl.timeScale(1.5);
      this.h.sound('attackWindup');
      tl.to(f.root, { x: f.x - dir * m.back, duration: m.wind, ease: ease.out.gsap });
      tl.to(f.body.scale, { x: 1.08, y: 0.9, duration: m.wind }, '<');
      if (m.tilt) tl.to(f.body, { rotation: -dir * m.tilt, y: m.lift, duration: m.wind }, '<');
      tl.to(f.root, { x: f.x + dx, duration: m.rush, ease: ease.in.gsap });
      tl.to(f.body.scale, { x: 0.92, y: 1.12, duration: m.rush }, '<');
      if (m.tilt) tl.to(f.body, { rotation: dir * m.tilt * 0.9, y: 0, duration: m.rush }, '<');
      tl.call(() => {
        this.h.sound('attackHit');
        this.meleeFx(f, t, dir);
        onHit?.();
        resolve(); // the caller carries on at contact; the figure springs home on its own
      });
      tl.to(f.body.scale, { x: 1.14, y: 0.84, duration: 0.07 });
      tl.to({}, { duration: 0.05 });
      tl.to(f.root, { x: f.x, duration: 0.4, ease: ease.pop.gsap });
      tl.to(f.body.scale, { x: 1, y: 1, duration: 0.4, ease: ease.pop.gsap }, '<');
      if (m.tilt) tl.to(f.body, { rotation: 0, y: 0, duration: 0.4, ease: ease.pop.gsap }, '<');
    });
  }

  /** What appears on the target at the moment a melee blow lands. */
  private meleeFx(f: Fighter, t: Fighter | undefined, dir: number): void {
    const { kind, tint, hits = 1 } = f.spec.attack;
    const c = this.fxCtx();
    const at = t ? this.chest(t) : { x: f.root.x + dir * 70, y: f.root.y - f.spec.height * 0.55 };
    const size = Math.max(70, Math.min(150, (t?.spec.height ?? 220) * 0.55));
    switch (kind) {
      case 'slash':
        for (let i = 0; i < hits; i++)
          slashArc(c, at, dir, tint, { tilt: i % 2 ? 0.55 : -0.55, size, delay: i * 0.09 });
        burst(c, at, tint, 6, 40);
        break;
      case 'claw':
        clawMarks(c, at, dir, tint);
        burst(c, at, tint, 5, 34);
        break;
      case 'stab':
        void streak(c, { x: at.x - dir * 120, y: at.y }, { x: at.x + dir * 20, y: at.y }, tint, 0.08, 5);
        burst(c, at, tint, 6, 36);
        break;
      case 'smash':
        ring(c, { x: t?.root.x ?? at.x, y: t?.root.y ?? f.root.y }, tint, 90, 26);
        burst(c, at, tint, 9, 58);
        break;
      default:
        break;
    }
  }

  /** Shoot, throw or cast from where it stands: the figure keeps its place and the effect travels to the target. */
  private rangedAttack(
    f: Fighter,
    t: Fighter | undefined,
    dir: number,
    onHit?: () => void,
  ): Promise<void> {
    const { kind, tint, hits = 1 } = f.spec.attack;
    const from = this.chest(f, dir * f.width * 0.3);
    const to = t ? this.chest(t) : { x: f.root.x + dir * 340, y: from.y };
    const c = this.fxCtx();
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    return new Promise((resolve) => {
      f.busy++;
      const tl = this.track(gsap.timeline({ onComplete: () => void f.busy-- }));
      tl.timeScale(1.5);
      this.h.sound('attackWindup');
      // the pose: a hold for a gun, a wind-up for a throw or a spell
      if (kind === 'shoot') {
        tl.to({}, { duration: 0.08 });
      } else {
        tl.to(f.body.scale, { x: 1.06, y: 0.94, duration: 0.14 });
        tl.to(f.body, { rotation: -dir * 0.1, duration: 0.14 }, '<');
        if (kind === 'cast') tl.call(() => puff(c, from, tint, 26, 0.2), [], '<');
        if (kind === 'cast') tl.to({}, { duration: 0.12 });
      }
      tl.call(() => {
        // the hit must always land (the fight waits on it), even if an effect fails to draw
        const land = (): void => {
          try {
            this.h.sound('attackHit');
            burst(c, to, tint, kind === 'shoot' ? 5 : 8, kind === 'shoot' ? 30 : 44);
            if (kind === 'cast') ring(c, to, tint, 60, 60);
          } finally {
            onHit?.();
            resolve();
          }
        };
        try {
          if (kind === 'shoot') {
            puff(c, from, tint, 22, 0.12);
            const runs: Promise<void>[] = [];
            for (let i = 0; i < hits; i++) {
              const off = (i - (hits - 1) / 2) * 15;
              runs.push(streak(c, from, { x: to.x, y: to.y + off }, tint, Math.max(0.1, dist / 3800), 3));
            }
            void Promise.all(runs).then(land);
          } else if (kind === 'throw') {
            void thrownBlade(c, from, to, tint, Math.max(0.16, dist / 2400)).then(land);
          } else {
            void orb(c, from, to, tint, Math.max(0.2, dist / 1800)).then(land);
          }
        } catch {
          land();
        }
      });
      // a gun kicks back as it fires; a thrower or caster follows through
      if (kind === 'shoot') tl.fromTo(f.body.position, { x: -dir * 16 }, { x: 0, duration: 0.25, ease: ease.out.gsap, immediateRender: false }, '<');
      tl.to(f.body.scale, { x: 1, y: 1, duration: 0.2, ease: ease.pop.gsap }, '<');
      tl.to(f.body, { rotation: 0, duration: 0.2, ease: ease.pop.gsap }, '<');
    });
  }

  /** A non-attacking action (casting, guarding, summoning): a quick hop and glow. */
  act(id: string, tintColor: string = color.goldLight): void {
    const f = this.all.get(id);
    if (!f || f.dying || this.h.profile().still) return;
    gsap.killTweensOf(f.body.scale);
    this.track(
      gsap.fromTo(
        f.body.scale,
        { x: 1, y: 1 },
        { x: 1.08, y: 1.08, duration: 0.12, yoyo: true, repeat: 1 },
      ),
    );
    this.pulse(id, tintColor);
  }

  /** A sprite-sheet effect at a figure's feet (ground effects sit in front, others behind). Resolves when it ends. */
  vfx(id: string, name: FxName, o: { scale?: number; from?: number; rate?: number; behind?: boolean } = {}): Promise<void> {
    const f = this.all.get(id);
    if (!f || this.destroyed || this.h.profile().still) return Promise.resolve();
    return playSpriteFx(
      this.h.container,
      name,
      { x: f.root.x, y: f.root.y, scale: o.scale, from: o.from, rate: o.rate, zIndex: f.root.y + (o.behind ? -1 : 2) },
      (a) => this.track(a),
    );
  }

  /** A soft coloured flash over a figure: buffs, heals, debuffs. */
  pulse(id: string, tintColor: string): void {
    const f = this.all.get(id);
    if (!f || f.dying) return;
    f.flash.tint = hex(tintColor);
    gsap.killTweensOf(f.flash);
    this.track(
      gsap.fromTo(f.flash, { alpha: 0.7 }, { alpha: 0, duration: 0.5, ease: ease.out.gsap }),
    );
  }

  /** Damage taken: white flash, knockback, shake. */
  hit(id: string, amount: number): void {
    const f = this.all.get(id);
    if (!f || f.dying) return;
    f.flash.tint = 0xffffff;
    gsap.killTweensOf(f.flash);
    this.track(
      gsap.fromTo(f.flash, { alpha: 0.95 }, { alpha: 0, duration: 0.28, ease: ease.out.gsap }),
    );
    if (this.h.profile().still || f.busy > 0) return;
    const away = f.spec.side === 'a' ? -1 : 1;
    const hard = Math.min(1.6, 0.6 + amount * 0.07);
    const tl = this.track(gsap.timeline({ onComplete: () => void (f.body.position.x = 0) }));
    tl.to(f.body.position, { x: away * 16 * hard, duration: 0.06, ease: ease.snap.gsap });
    for (let i = 0; i < 4; i++)
      tl.to(f.body.position, { x: (i % 2 ? 1 : -1) * 6 * hard, duration: 0.04 });
    tl.to(f.body.position, { x: 0, duration: 0.16, ease: ease.out.gsap });
  }

  /** Defeated: sink, fade, and leave the stage. Resolves when it is gone. */
  die(id: string): Promise<void> {
    const f = this.all.get(id);
    if (!f) return Promise.resolve();
    f.dying = true;
    if (this.h.profile().still) {
      this.remove(id);
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      gsap.killTweensOf([f.body, f.body.position, f.body.scale, f.root]);
      this.h.sound('death');
      const tl = this.track(
        gsap.timeline({
          onComplete: () => {
            this.remove(id);
            resolve();
          },
        }),
      );
      tl.to(f.body, {
        rotation: f.spec.side === 'a' ? -0.4 : 0.4,
        y: 26,
        duration: 0.3,
        ease: ease.in.gsap,
      });
      tl.to(f.root, { alpha: 0, duration: 0.35 }, '<0.1');
    });
  }

  /** Light a ring under the figures that can be targeted. */
  setTargetable(ids: ReadonlySet<string> | null): void {
    for (const f of this.all.values()) {
      const on = ids?.has(f.spec.id) === true;
      if (f.targetable === on) continue;
      f.targetable = on;
      if (!on) this.track(gsap.to(f.ring, { alpha: 0, duration: 0.15, overwrite: true }));
    }
  }

  /** Emphasise one figure (the one under the pointer while aiming). */
  setHover(id: string | null): void {
    for (const f of this.all.values()) {
      const k = f.spec.id === id ? 1.05 : 1;
      if (f.busy === 0 && !f.dying)
        gsap.to(f.root.scale, { x: k, y: k, duration: 0.12, overwrite: true });
    }
  }

  tick(t: number, still: boolean): void {
    if (this.destroyed) return;
    for (const f of this.all.values()) {
      if (f.targetable) f.ring.alpha = 0.32 + 0.3 * Math.sin(t * 5);
      if (still || f.dying || f.busy > 0) continue;
      const w = Math.sin(t * 1.5 + f.phase);
      f.sprite.scale.y = (f.spec.height / f.spec.canvas.height) * (1 + 0.014 * w);
      f.aura.alpha = (f.spec.isHero ? 0.36 : 0.18) + 0.1 * Math.sin(t * 1.9 + f.phase);
      if (f.prop?.visible && f.spec.prop) {
        const k = f.spec.height / f.spec.canvas.height;
        f.prop.y = (f.spec.prop.y - f.spec.canvas.height) * k + Math.sin(t * 1.8 + f.phase) * 7 * k;
        f.prop.rotation = Math.sin(t * 1.1 + f.phase) * 0.05;
      }
    }
  }

  /** The fight ended: the loser crumples, the winner stands tall. */
  finish(winner: FighterSide | 'draw' | null): void {
    for (const f of this.all.values()) {
      if (winner === null || f.dying) continue;
      if (f.spec.isHero && winner !== 'draw' && f.spec.side !== winner) {
        gsap.killTweensOf([f.body, f.sprite]);
        this.track(
          gsap.to(f.body, {
            rotation: f.spec.side === 'a' ? -0.35 : 0.35,
            y: 22,
            duration: 0.6,
            ease: ease.in.gsap,
          }),
        );
        this.track(gsap.to(f.sprite, { alpha: 0.55, duration: 0.6 }));
      }
    }
  }

  destroy(): void {
    this.destroyed = true;
    for (const x of this.live) x.kill();
    this.live.clear();
    for (const f of this.all.values())
      gsap.killTweensOf([
        f.root,
        f.root.scale,
        f.body,
        f.body.position,
        f.body.scale,
        f.sprite,
        f.flash,
        f.ring,
        ...(f.prop ? [f.prop] : []),
      ]);
    this.all.clear();
  }
}
