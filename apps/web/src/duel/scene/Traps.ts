// Trap sigils and the reveal sequence. Presentation only: the scene shows what it is told (a card was set,
// a trap sprang) and never decides anything. A set trap is a sealed sigil on the floor with a card back
// hovering above it; when it springs the whole board stops for a beat: dim, charge, flip, light burst,
// name flash, then the effect (run by the caller) and the spent card dissolves.

import { Container, Sprite, Text, Texture } from 'pixi.js';
import { gsap } from 'gsap';
import type { CardDef } from '@sr/engine';
import { FACE_H, FACE_W, cardBackCanvas, cardFaceCanvas } from '../../art/cardFace';
import { color, ease, hex } from '../../design/tokens';
import type { EffectsProfile } from '../effects';
import { FLOOR_SQUASH, type SlotGeom } from './layout';
import { runeRingTexture } from './textures';
import type { SoundName } from './Monsters';

interface Trap {
  key: string;
  side: 'me' | 'opp';
  geom: SlotGeom;
  /** the running reveal, so remove()/destroy() can stop it cleanly */
  reveal: { tl: gsap.core.Timeline; resolve: () => void } | null;
  faceDown: boolean;
  root: Container;
  seal: Sprite;
  core: Sprite;
  ring: Sprite;
  card: Container;
  cardSprite: Sprite;
  cardW: number;
  hoverY: number;
  /** seal spin multiplier; ramps up while charging */
  spin: { v: number };
  phase: number;
  busy: number;
}

export interface TrapHost {
  container: Container;
  /** drawn above everything while a trap is springing */
  reveal: Container;
  dim: Sprite;
  fx: Container;
  glowTex: Texture;
  profile: () => EffectsProfile;
  sound: (name: SoundName) => void;
  slot: (key: string) => SlotGeom | undefined;
}

const MINE = color.cyan;
const THEIRS = '#ff5a86';

export class Traps {
  private readonly traps = new Map<string, Trap>();
  private selected: string | null = null;
  private readonly h: TrapHost;
  private destroyed = false;
  private readonly live = new Set<gsap.core.Animation>();
  private readonly pending = new Set<() => void>();
  private readonly texCache = new Map<HTMLCanvasElement, Texture>();
  private readonly ringTex: Texture;
  private slowTimer: number | null = null;

  private track<T extends gsap.core.Animation>(a: T): T {
    if (this.live.size > 150)
      for (const x of this.live) if (!x.isActive() && x.progress() === 1) this.live.delete(x);
    this.live.add(a);
    return a;
  }
  private readonly g = {
    to: (t: gsap.TweenTarget, v: gsap.TweenVars) => this.track(gsap.to(t, v)),
    fromTo: (t: gsap.TweenTarget, from: gsap.TweenVars, to: gsap.TweenVars) =>
      this.track(gsap.fromTo(t, from, to)),
    timeline: (v?: gsap.TimelineVars) => this.track(gsap.timeline(v)),
  };

  constructor(host: TrapHost) {
    this.h = host;
    this.ringTex = Texture.from(runeRingTexture(256, 'trap'));
    host.container.sortableChildren = true;
  }

  private tex(c: HTMLCanvasElement): Texture {
    let t = this.texCache.get(c);
    if (!t) {
      t = Texture.from(c);
      this.texCache.set(c, t);
    }
    return t;
  }

  has(key: string): boolean {
    return this.traps.has(key);
  }

  keys(side?: 'me' | 'opp'): string[] {
    return [...this.traps.values()].filter((t) => !side || t.side === side).map((t) => t.key);
  }

  // ---------------------------------------------------------------------------------------------
  /**
   * A face-down trap. The client never learns which card it is: no def is accepted or stored here.
   * (The card arrives with the reveal event; see reveal().)
   */
  setFaceDown(key: string): void {
    this.place(key, true);
  }

  /** A face-up card in a trap slot (a relic). Its identity is public, so the def is shown. */
  setFaceUp(key: string, def: CardDef): void {
    this.place(key, false, def);
  }

  private place(key: string, faceDown: boolean, def?: CardDef): void {
    const geom = this.h.slot(key);
    if (!geom || this.traps.has(key)) return;
    const p = this.h.profile();
    const tint = geom.side === 'me' ? MINE : THEIRS;
    const w = geom.width;

    const root = new Container();
    root.position.set(geom.x, geom.y);
    root.zIndex = geom.y;

    // everything that lies on the floor is drawn flat and squashed to match the camera
    const flat = new Container();
    flat.scale.set(1, FLOOR_SQUASH);

    const plate = new Sprite(this.h.glowTex);
    plate.anchor.set(0.5);
    plate.tint = hex(color.void);
    plate.alpha = 0.7;
    plate.scale.set((w * 1.2) / 128);

    const seal = new Sprite(this.ringTex);
    seal.anchor.set(0.5);
    seal.tint = hex(tint);
    seal.blendMode = 'add';
    seal.scale.set((w * 1.15) / 256);
    seal.alpha = faceDown ? 0.95 : 0.55;

    const core = new Sprite(this.h.glowTex);
    core.anchor.set(0.5);
    core.tint = hex(tint);
    core.blendMode = 'add';
    core.scale.set((w * 1.5) / 128);
    core.alpha = faceDown ? 0.55 : 0.2;

    // selection ring (gold pool of light), hidden until selected
    const ring = new Sprite(this.h.glowTex);
    ring.anchor.set(0.5);
    ring.tint = hex(color.goldLight);
    ring.blendMode = 'add';
    ring.alpha = 0;
    ring.scale.set((w * 1.7) / 128);

    flat.addChild(plate, ring, core, seal);

    // the hovering card
    const cardW = w * 0.72;
    const src = faceDown ? cardBackCanvas(tint) : def ? cardFaceCanvas(def) : cardBackCanvas(tint);
    const cardSprite = new Sprite(this.tex(src));
    cardSprite.anchor.set(0.5, 1);
    cardSprite.scale.set(cardW / FACE_W);
    const card = new Container();
    card.addChild(cardSprite);
    const hoverY = -w * 0.2;
    card.position.set(0, hoverY);

    root.addChild(flat, card);
    this.h.container.addChild(root);

    const t: Trap = {
      key,
      side: geom.side,
      geom,
      reveal: null,
      faceDown,
      root,
      seal,
      core,
      ring,
      card,
      cardSprite,
      cardW,
      hoverY,
      spin: { v: 1 },
      phase: Math.random() * Math.PI * 2,
      busy: 0,
    };
    this.traps.set(key, t);
    this.playSet(t, p);
  }

  private playSet(t: Trap, p: EffectsProfile): void {
    this.h.sound('trapSet');
    t.busy++;
    t.seal.alpha = 0;
    t.core.alpha = 0;
    t.card.alpha = 0;
    const sealAlpha = t.faceDown ? 0.95 : 0.55;
    const coreAlpha = t.faceDown ? 0.55 : 0.2;
    const tl = this.g.timeline({ onComplete: () => void t.busy-- });
    // the seal draws itself in, spinning, while the card settles from above
    tl.fromTo(
      t.seal.scale,
      { x: 0.2, y: 0.2 },
      { x: t.seal.scale.x, y: t.seal.scale.y, duration: 0.5, ease: ease.out.gsap },
      0,
    );
    tl.to(t.seal, { alpha: sealAlpha, duration: 0.35, ease: ease.out.gsap }, 0);
    tl.fromTo(t.core, { alpha: 1 }, { alpha: coreAlpha, duration: 0.6, ease: ease.out.gsap }, 0.1);
    tl.fromTo(
      t.card,
      { y: t.hoverY - (p.still ? 0 : 46) },
      { y: t.hoverY, duration: 0.45, ease: ease.pop.gsap },
      0.1,
    );
    tl.to(t.card, { alpha: 1, duration: 0.25, ease: ease.out.gsap }, 0.1);
    if (!p.still)
      this.sparks(
        t.geom.x,
        t.geom.y - 4,
        Math.min(6, p.particles / 10),
        hex(t.side === 'me' ? MINE : THEIRS),
        50,
      );
  }

  /** True when the trap exists and is idle, i.e. may be sprung. */
  canReveal(key: string): boolean {
    const t = this.traps.get(key);
    return !!t && t.busy === 0;
  }

  select(key: string | null): void {
    if (key && this.traps.get(key)?.reveal) return;
    if (this.selected === key) return;
    const prev = this.selected ? this.traps.get(this.selected) : undefined;
    if (prev)
      this.g.to(prev.ring, { alpha: 0, duration: 0.25, ease: ease.out.gsap, overwrite: true });
    this.selected = key && this.traps.has(key) ? key : null;
    const cur = this.selected ? this.traps.get(this.selected) : undefined;
    if (cur) {
      this.h.sound('select');
      this.g.to(cur.ring, { alpha: 0.8, duration: 0.3, ease: ease.out.gsap, overwrite: true });
    }
  }

  remove(key: string): void {
    const t = this.traps.get(key);
    if (!t) return;
    if (this.selected === key) this.selected = null;
    if (t.reveal) {
      // stop a reveal in flight: no callbacks may touch the objects we are about to destroy
      const { tl, resolve } = t.reveal;
      t.reveal = null;
      tl.kill();
      this.pending.delete(resolve);
      this.endSlowMo();
      this.g.to(this.h.dim, { alpha: 0, duration: 0.2, overwrite: true });
      resolve();
    }
    gsap.killTweensOf([t.root, t.card, t.cardSprite, t.seal, t.core, t.ring, t.seal.scale, t.spin]);
    t.root.destroy({ children: true });
    this.traps.delete(key);
  }

  // ---------------------------------------------------------------------------------------------
  /**
   * The reveal. `def` is the card that was face down (from the event, not stored client-side as a secret).
   * `onEffect` fires at the moment the effect should land, so the caller can run its visuals in sync.
   * Resolves when the trap has been spent and the board is back to normal.
   */
  reveal(key: string, def: CardDef, onEffect?: () => void): Promise<void> {
    const t = this.traps.get(key);
    if (!t || t.busy > 0) return Promise.resolve();
    const p = this.h.profile();
    const still = p.still;
    const reduced = p.mode === 'reduced';
    return new Promise((resolve) => {
      this.pending.add(resolve);
      t.busy++;
      if (this.selected === key) this.select(null);
      // lift the trap above the board for the moment it springs
      this.h.reveal.addChild(t.root);
      const faceTex = this.tex(cardFaceCanvas(def));
      const liftY = -Math.min(140, t.geom.width * 1.1);
      // the revealed card flies to the middle of the board at a fixed, generous size
      const stageW = 190;
      const bigScale = stageW / t.cardW;
      const cardX = 960 - t.geom.x;
      const cardY = 560 - t.geom.y;
      const centreY = 560 - stageW * (FACE_H / FACE_W) * 0.5;

      this.h.sound('trapCharge');
      this.g.to(this.h.dim, {
        alpha: 0.62,
        duration: still ? 0.12 : 0.3,
        ease: ease.out.gsap,
        overwrite: true,
      });
      if (!still) {
        // slow-mo for the charge: real-time timer restores it so it can never get stuck
        gsap.globalTimeline.timeScale(0.35);
        this.slowTimer = window.setTimeout(() => this.endSlowMo(), 650);
      }

      const tl = this.g.timeline({
        onComplete: () => {
          if (this.destroyed) return;
          this.pending.delete(resolve);
          t.reveal = null;
          // only remove the trap we sprang, never a new one that took the slot meanwhile
          if (this.traps.get(key) === t) this.remove(key);
          resolve();
        },
      });
      t.reveal = { tl, resolve };

      // 1. charge: the seal spins up, the core swells, the card rises and trembles
      tl.to(t.spin, { v: still ? 1 : 9, duration: 0.5, ease: ease.in.gsap }, 0);
      tl.to(t.core, { alpha: 1, duration: 0.5, ease: ease.in.gsap }, 0);
      tl.to(
        t.core.scale,
        { x: t.core.scale.x * 1.5, y: t.core.scale.y * 1.5, duration: 0.5, ease: ease.in.gsap },
        0,
      );
      tl.to(t.card, { y: t.hoverY + liftY, duration: 0.5, ease: ease.out.gsap }, 0);
      tl.to(t.card.scale, { x: 1.25, y: 1.25, duration: 0.5, ease: ease.out.gsap }, 0);
      if (!still) {
        for (let i = 0; i < 8; i++) {
          tl.to(
            t.card,
            { x: (i % 2 ? 1 : -1) * (2 + i * 0.7), duration: 0.05, ease: ease.snap.gsap },
            i * 0.06,
          );
        }
        tl.to(t.card, { x: 0, duration: 0.05 }, 0.5);
      }

      // 2. flip: squeeze to a line, swap the texture, open to the face
      tl.to(t.card.scale, { x: 0.02, duration: still ? 0.06 : 0.12, ease: ease.in.gsap }, 0.55);
      tl.call(() => {
        t.cardSprite.texture = faceTex;
        t.cardSprite.scale.set(t.cardW / FACE_W);
        t.cardSprite.anchor.set(0.5, 1);
      });
      tl.to(t.card.scale, { x: bigScale, y: bigScale, duration: 0.3, ease: ease.pop.gsap });
      tl.to(t.card, { x: cardX, y: cardY, duration: 0.3, ease: ease.out.gsap }, '<');

      // 3. light burst + shockwave
      tl.call(() => this.burst(p, 960, centreY, reduced));
      // 4. name flash
      tl.call(() => this.nameFlash(def, still));
      // 5. the effect lands
      tl.call(
        () => {
          this.h.sound('trapEffect');
          onEffect?.();
        },
        [],
        '+=0.75',
      );
      // 6. the spent card dissolves, the seal fades, the board comes back
      tl.to(t.card, { alpha: 0, y: '-=40', duration: 0.5, ease: ease.in.gsap }, '+=0.45');
      tl.to([t.seal, t.core], { alpha: 0, duration: 0.5, ease: ease.out.gsap }, '<');
      tl.to(this.h.dim, { alpha: 0, duration: 0.35, ease: ease.out.gsap }, '<');
      tl.call(
        () => {
          this.h.sound('trapSpent');
          if (!still) this.sparks(960, centreY, reduced ? 6 : 16, hex(color.violetGlow), 120, true);
        },
        [],
        '<',
      );
    });
  }

  private endSlowMo(): void {
    if (this.slowTimer !== null) window.clearTimeout(this.slowTimer);
    this.slowTimer = null;
    gsap.globalTimeline.timeScale(1);
  }

  /** Radial light burst, expanding shockwave ring and rays. */
  private burst(p: EffectsProfile, cx: number, y: number, reduced: boolean): void {
    this.h.sound('trapReveal');
    // no flashes or shockwaves under prefers-reduced-motion
    if (p.still) return;
    const flash = new Sprite(this.h.glowTex);
    flash.anchor.set(0.5);
    flash.tint = 0xffffff;
    flash.blendMode = 'add';
    flash.position.set(cx, y);
    flash.scale.set(0.6);
    flash.alpha = 1;
    this.h.fx.addChild(flash);
    this.g.to(flash.scale, { x: 7, y: 7, duration: 0.55, ease: ease.snap.gsap });
    this.g.to(flash, {
      alpha: 0,
      duration: 0.55,
      ease: ease.in.gsap,
      onComplete: () => void flash.destroy(),
    });

    const shock = new Sprite(this.ringTex);
    shock.anchor.set(0.5);
    shock.tint = hex(color.violetGlow);
    shock.blendMode = 'add';
    shock.position.set(cx, y + 130);
    shock.scale.set(0.2, 0.2 * FLOOR_SQUASH);
    shock.alpha = 1;
    this.h.fx.addChild(shock);
    const reach = 14;
    this.g.to(shock.scale, {
      x: reach,
      y: reach * FLOOR_SQUASH,
      duration: 0.7,
      ease: ease.out.gsap,
    });
    this.g.to(shock, {
      alpha: 0,
      duration: 0.7,
      ease: ease.in.gsap,
      onComplete: () => void shock.destroy(),
    });

    if (!p.still) this.sparks(cx, y, reduced ? 8 : 22, hex(color.goldLight), 260);
  }

  /** The big name card: slides in wide, snaps to size, holds, then the sequence fades it. */
  private nameFlash(def: CardDef, still: boolean): void {
    const title = new Text({
      text: def.name.toUpperCase(),
      style: {
        fontFamily: 'Cinzel, serif',
        fontWeight: '900',
        fontSize: 84,
        letterSpacing: 10,
        fill: 0xfff1c4,
        stroke: { color: 0x1a1030, width: 10, join: 'round' },
        dropShadow: { color: 0x8f5bff, blur: 18, distance: 0, alpha: 0.95 },
      },
    });
    title.anchor.set(0.5);
    title.resolution = 2;
    title.position.set(960, 236);
    title.alpha = 0;
    this.h.reveal.addChild(title);
    const sub = new Text({
      text: 'TRAP SPRUNG',
      style: {
        fontFamily: 'Cinzel, serif',
        fontWeight: '700',
        fontSize: 26,
        letterSpacing: 18,
        fill: 0x36e0ff,
      },
    });
    sub.anchor.set(0.5);
    sub.resolution = 2;
    sub.position.set(960, 184);
    sub.alpha = 0;
    this.h.reveal.addChild(sub);
    const tl = this.g.timeline({
      onComplete: () => {
        title.destroy();
        sub.destroy();
      },
    });
    tl.fromTo(
      title.scale,
      { x: still ? 1 : 1.5, y: still ? 1 : 1.5 },
      { x: 1, y: 1, duration: 0.3, ease: ease.snap.gsap },
      0,
    );
    tl.to(title, { alpha: 1, duration: 0.12 }, 0);
    tl.to(sub, { alpha: 1, duration: 0.25, ease: ease.out.gsap }, 0.1);
    tl.to([title, sub], { alpha: 0, duration: 0.4, ease: ease.in.gsap }, 1.35);
    tl.to(title, { y: title.y - 18, duration: 1.7, ease: ease.out.gsap }, 0);
  }

  private sparks(
    x: number,
    y: number,
    n: number,
    tint: number,
    spread: number,
    rise = false,
  ): void {
    const count = Math.max(0, Math.round(n));
    for (let i = 0; i < count; i++) {
      const s = new Sprite(this.h.glowTex);
      s.anchor.set(0.5);
      s.tint = i % 3 === 0 ? hex(color.cyan) : tint;
      s.blendMode = 'add';
      s.position.set(
        x + (Math.random() - 0.5) * spread * 0.4,
        y + (Math.random() - 0.5) * spread * 0.3,
      );
      const sc = 0.08 + Math.random() * 0.14;
      s.scale.set(sc);
      this.h.fx.addChild(s);
      const dur = 0.6 + Math.random() * 0.6;
      this.g.to(s, {
        x: s.x + (Math.random() - 0.5) * spread * 2,
        y: s.y - (rise ? 40 + Math.random() * spread : (Math.random() - 0.3) * spread),
        alpha: 0,
        duration: dur,
        ease: ease.out.gsap,
        onComplete: () => void s.destroy(),
      });
      this.g.to(s.scale, { x: 0, y: 0, duration: dur, ease: ease.in.gsap });
    }
  }

  // ---------------------------------------------------------------------------------------------
  /** Idle life: the rune seal turns and breathes, the card hovers. */
  tick(t: number, dt: number, still: boolean): void {
    if (still) return;
    for (const tr of this.traps.values()) {
      tr.seal.rotation += dt * 0.32 * tr.spin.v;
      if (tr.busy > 0) continue;
      const w = Math.sin(t * 1.9 + tr.phase);
      if (tr.faceDown) {
        tr.core.alpha = 0.5 + 0.18 * w;
        tr.seal.alpha = 0.88 + 0.1 * Math.sin(t * 1.3 + tr.phase);
      }
      tr.card.y = tr.hoverY - 3 - 3.5 * Math.sin(t * 1.15 + tr.phase);
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.endSlowMo();
    for (const a of this.live) a.kill();
    this.live.clear();
    for (const t of this.traps.values()) {
      gsap.killTweensOf([
        t.root,
        t.card,
        t.card.scale,
        t.cardSprite,
        t.seal,
        t.seal.scale,
        t.core,
        t.core.scale,
        t.ring,
        t.spin,
      ]);
    }
    gsap.killTweensOf(this.h.dim);
    this.traps.clear();
    this.texCache.clear();
    for (const done of [...this.pending]) done();
    this.pending.clear();
  }
}
