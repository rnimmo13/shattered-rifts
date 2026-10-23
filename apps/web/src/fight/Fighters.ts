// The combatants on the stage: your hero and allies on the left, the enemies on the right, all standing on one line.
// Presentation only. It animates what the engine already decided (lunges, hits, deaths, summons) and reports where
// each figure is so the DOM overlay (HP bars, intents, statuses) can sit on top of it.

import { Container, Sprite, Texture } from 'pixi.js';
import { gsap } from 'gsap';
import { color, ease, hex } from '../design/tokens';
import type { EffectsProfile } from '../duel/effects';

export type FighterSide = 'a' | 'b';

/** Stage coordinates (1920x1080 reference). Slot 0 is the one nearest the centre. */
export const LINE_Y = 830;
export const HERO_X = 230;
const CENTRE = 960;
const ALLY_PITCH = 205;
const FOE_PITCH = 195;

export function slotX(side: FighterSide, slot: number, isHero: boolean): number {
  if (isHero) return HERO_X;
  return side === 'a' ? CENTRE - 150 - slot * ALLY_PITCH : CENTRE + 260 + slot * FOE_PITCH;
}

export interface FighterSpec {
  id: string;
  side: FighterSide;
  isHero: boolean;
  /** 0 = nearest the centre (allies and enemies); ignored for heroes */
  slot: number;
  canvas: HTMLCanvasElement;
  /** figure height in stage px */
  height: number;
}

interface Fighter {
  spec: FighterSpec;
  root: Container;
  body: Container;
  sprite: Sprite;
  flash: Sprite;
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

export class Fighters {
  private readonly all = new Map<string, Fighter>();
  private readonly live = new Set<gsap.core.Animation>();
  private destroyed = false;

  constructor(private readonly h: FighterHost) {}

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
      const x = slotX(spec.side, spec.slot, spec.isHero);
      const f = this.all.get(spec.id);
      if (!f) {
        this.add(spec, x, !opts.instant);
      } else if (!f.dying) {
        f.spec = spec;
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
    root.addChild(shadow, aura, ring, body);
    this.h.container.addChild(root);
    this.h.container.sortableChildren = true;
    const f: Fighter = {
      spec,
      root,
      body,
      sprite,
      flash,
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

  private remove(id: string): void {
    const f = this.all.get(id);
    if (!f) return;
    gsap.killTweensOf([f.root, f.body, f.body.scale, f.sprite, f.flash]);
    f.root.destroy({ children: true });
    this.all.delete(id);
  }

  // --- animation -------------------------------------------------------------------------------------------

  /** Lunge at a target (a figure, or a point in front of the attacker) and call `onHit` at contact. */
  attack(id: string, targetId: string | null, onHit?: () => void): Promise<void> {
    const f = this.all.get(id);
    const t = targetId ? this.all.get(targetId) : undefined;
    if (!f || f.dying || this.h.profile().still) {
      onHit?.();
      return Promise.resolve();
    }
    const dir = f.spec.side === 'a' ? 1 : -1;
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
      tl.to(f.root, { x: f.x - dir * 24, duration: 0.16, ease: ease.out.gsap });
      tl.to(f.body.scale, { x: 1.08, y: 0.9, duration: 0.16 }, '<');
      tl.to(f.root, { x: f.x + dx, duration: 0.12, ease: ease.in.gsap });
      tl.to(f.body.scale, { x: 0.92, y: 1.12, duration: 0.12 }, '<');
      tl.call(() => {
        this.h.sound('attackHit');
        onHit?.();
        resolve(); // the caller carries on at contact; the figure springs home on its own
      });
      tl.to(f.body.scale, { x: 1.14, y: 0.84, duration: 0.07 });
      tl.to({}, { duration: 0.05 });
      tl.to(f.root, { x: f.x, duration: 0.4, ease: ease.pop.gsap });
      tl.to(f.body.scale, { x: 1, y: 1, duration: 0.4, ease: ease.pop.gsap }, '<');
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
      ]);
    this.all.clear();
  }
}
