// The two Riftwalkers on the battlefield: yours at the front left, the enemy's at the back right. Presentation only.
// They breathe, flinch when their owner takes damage, pop when they cast, and collapse or stand tall at the end.
// An avatar is also the target for attacking the player directly.

import { Container, Sprite, Texture } from 'pixi.js';
import { gsap } from 'gsap';
import { color, ease, hex } from '../../design/tokens';
import type { EffectsProfile } from '../effects';
import { AVATAR_POS, FLOOR_SQUASH } from './layout';

export type AvatarSide = 'me' | 'opp';

interface Avatar {
  side: AvatarSide;
  root: Container;
  body: Container;
  sprite: Sprite;
  flash: Sprite;
  aura: Sprite;
  target: Sprite;
  height: number;
  width: number;
  phase: number;
  targetable: boolean;
  down: boolean;
}

export interface AvatarHost {
  container: Container;
  glowTex: Texture;
  profile: () => EffectsProfile;
}

export class Avatars {
  private readonly list = new Map<AvatarSide, Avatar>();
  private destroyed = false;
  private readonly live = new Set<gsap.core.Animation>();

  constructor(private readonly h: AvatarHost) {}

  private track<T extends gsap.core.Animation>(a: T): T {
    if (this.live.size > 80) for (const x of this.live) if (x.progress() === 1) this.live.delete(x);
    this.live.add(a);
    return a;
  }

  /** Place a Riftwalker. `canvas` is their cut-out (same format as a monster's). */
  set(side: AvatarSide, canvas: HTMLCanvasElement): void {
    this.list.get(side)?.root.destroy({ children: true });
    const pos = AVATAR_POS[side];
    const tex = Texture.from(canvas);
    const k = pos.h / canvas.height;
    const root = new Container();
    root.position.set(pos.x, pos.y);

    const shadow = new Sprite(this.h.glowTex);
    shadow.anchor.set(0.5);
    shadow.tint = 0x000000;
    shadow.alpha = 0.6;
    shadow.scale.set((pos.h * 0.9) / 128, (pos.h * 0.9 * 0.3) / 128);

    const tint = side === 'me' ? color.cyan : '#ff5a86';
    const aura = new Sprite(this.h.glowTex);
    aura.anchor.set(0.5);
    aura.tint = hex(tint);
    aura.blendMode = 'add';
    aura.alpha = 0.5;
    aura.scale.set((pos.h * 1.15) / 128, (pos.h * 1.15 * FLOOR_SQUASH) / 128);

    // a pulsing ring that shows "you can attack this player"
    const target = new Sprite(this.h.glowTex);
    target.anchor.set(0.5);
    target.tint = 0xff4a6e;
    target.blendMode = 'add';
    target.alpha = 0;
    target.scale.set((pos.h * 1.5) / 128, (pos.h * 1.5 * 0.5) / 128);
    target.position.y = -pos.h * 0.45;

    const body = new Container();
    const sprite = new Sprite(tex);
    sprite.anchor.set(0.5, 1);
    sprite.scale.set(k);
    const flash = new Sprite(tex);
    flash.anchor.set(0.5, 1);
    flash.scale.set(k);
    flash.tint = 0xffffff;
    flash.blendMode = 'add';
    flash.alpha = 0;
    body.addChild(sprite, flash);

    root.addChild(shadow, aura, target, body);
    this.h.container.addChild(root);
    this.list.set(side, {
      side,
      root,
      body,
      sprite,
      flash,
      aura,
      target,
      height: pos.h,
      width: canvas.width * k,
      phase: side === 'me' ? 0.4 : 2.1,
      targetable: false,
      down: false,
    });
    // arrive with a little drop-in
    if (!this.h.profile().still) {
      root.alpha = 0;
      this.track(gsap.fromTo(root, { alpha: 0 }, { alpha: 1, duration: 0.5, ease: ease.out.gsap }));
      this.track(gsap.fromTo(body, { y: -30 }, { y: 0, duration: 0.5, ease: ease.pop.gsap }));
    }
  }

  /** Where an attack on this player lands (stage coordinates). */
  facePos(side: AvatarSide): { x: number; y: number } {
    const p = AVATAR_POS[side];
    return { x: p.x, y: p.y - p.h * 0.45 };
  }

  /** Which avatar (if any) is under a point in stage coordinates. */
  hitTest(x: number, y: number): AvatarSide | null {
    for (const a of this.list.values()) {
      const p = AVATAR_POS[a.side];
      if (Math.abs(x - p.x) <= a.width * 0.45 && y <= p.y + 10 && y >= p.y - a.height)
        return a.side;
    }
    return null;
  }

  setTargetable(side: AvatarSide, on: boolean): void {
    const a = this.list.get(side);
    if (!a || a.targetable === on) return;
    a.targetable = on;
    if (!on) this.track(gsap.to(a.target, { alpha: 0, duration: 0.2, overwrite: true }));
  }

  /** The owner took damage: flash, recoil, shake. */
  flinch(side: AvatarSide, amount: number): void {
    const a = this.list.get(side);
    if (!a || a.down) return;
    const p = this.h.profile();
    gsap.killTweensOf(a.flash);
    a.flash.tint = 0xffffff;
    this.track(
      gsap.fromTo(a.flash, { alpha: 0.95 }, { alpha: 0, duration: 0.3, ease: ease.out.gsap }),
    );
    if (p.still) return;
    const away = side === 'me' ? -1 : 1;
    const hard = Math.min(1.6, 0.6 + amount * 0.14);
    gsap.killTweensOf(a.body.position);
    const tl = this.track(gsap.timeline({ onComplete: () => void a.body.position.set(0, 0) }));
    tl.to(a.body.position, { x: away * 16 * hard, duration: 0.06, ease: ease.snap.gsap });
    for (let i = 0; i < 4; i++)
      tl.to(a.body.position, { x: (i % 2 ? 1 : -1) * 7 * hard, duration: 0.04 });
    tl.to(a.body.position, { x: 0, duration: 0.18, ease: ease.out.gsap });
  }

  /** The owner cast a spell: a quick swell and a burst of light. */
  cast(side: AvatarSide): void {
    const a = this.list.get(side);
    if (!a || a.down || this.h.profile().still) return;
    gsap.killTweensOf(a.body.scale);
    this.track(
      gsap.fromTo(
        a.body.scale,
        { x: 1, y: 1 },
        { x: 1.07, y: 1.07, duration: 0.12, yoyo: true, repeat: 1, ease: ease.out.gsap },
      ),
    );
    gsap.killTweensOf(a.aura);
    this.track(
      gsap.fromTo(a.aura, { alpha: 1 }, { alpha: 0.5, duration: 0.5, ease: ease.out.gsap }),
    );
  }

  /** The duel ended: the loser crumples, the winner stands tall. */
  finish(winner: AvatarSide | null): void {
    for (const a of this.list.values()) {
      const lost = winner !== null && a.side !== winner;
      if (lost) {
        a.down = true;
        gsap.killTweensOf([a.body, a.body.position, a.sprite]);
        this.track(
          gsap.to(a.body, {
            rotation: a.side === 'me' ? -0.35 : 0.35,
            y: 22,
            duration: 0.6,
            ease: ease.in.gsap,
          }),
        );
        this.track(gsap.to(a.sprite, { alpha: 0.55, duration: 0.6 }));
        this.track(gsap.to(a.aura, { alpha: 0, duration: 0.5 }));
      } else if (winner !== null && !this.h.profile().still) {
        this.track(gsap.to(a.aura, { alpha: 1, duration: 0.6, ease: ease.out.gsap }));
      }
    }
  }

  tick(t: number, still: boolean): void {
    if (this.destroyed) return;
    for (const a of this.list.values()) {
      if (a.targetable) a.target.alpha = 0.35 + 0.35 * Math.sin(t * 5);
      if (still || a.down) continue;
      const w = Math.sin(t * 1.5 + a.phase);
      a.body.scale.y = 1 + 0.014 * w;
      a.body.skew.x = 0.01 * Math.sin(t * 0.8 + a.phase);
      a.aura.alpha = 0.42 + 0.14 * Math.sin(t * 1.9 + a.phase);
    }
  }

  destroy(): void {
    this.destroyed = true;
    for (const x of this.live) x.kill();
    this.live.clear();
    for (const a of this.list.values()) {
      gsap.killTweensOf([
        a.root,
        a.body,
        a.body.position,
        a.body.scale,
        a.sprite,
        a.flash,
        a.aura,
        a.target,
      ]);
    }
    this.list.clear();
  }
}
