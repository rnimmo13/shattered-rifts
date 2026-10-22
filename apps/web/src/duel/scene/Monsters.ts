// Monsters standing on the battlefield. Presentation only: they show whatever the caller tells them
// (summon, stats, attack, hit, die) and never decide anything. Each monster is a cut-out of its card art
// with a ground shadow, puppeted with transforms only: idle breathing, attack lunge, hit reaction, death.

import { Container, Graphics, Rectangle, Sprite, Text, Texture } from 'pixi.js';
import { gsap } from 'gsap';
import type { CardDef } from '@sr/engine';
import { cardArt, type Archetype } from '../../art/proceduralArt';
import { color, ease, hex } from '../../design/tokens';
import type { EffectsProfile } from '../effects';
import type { SlotGeom } from './layout';

export type SoundName =
  'summon' | 'attackWindup' | 'attackHit' | 'hit' | 'death' | 'buff' | 'select';

interface Badge {
  root: Container;
  text: Text;
  value: number;
  shown: { v: number };
}

interface Monster {
  key: string;
  def: CardDef;
  side: 'me' | 'opp';
  geom: SlotGeom;
  root: Container;
  body: Container;
  sprite: Sprite;
  flash: Sprite;
  shadow: Sprite;
  ring: Sprite;
  power: Badge;
  guard: Badge;
  phase: number;
  floater: boolean;
  /** pixel height of the sprite on the stage */
  height: number;
  dying: boolean;
  busy: number;
}

const FLOATERS: ReadonlySet<Archetype> = new Set(['drone', 'spirit', 'dragon', 'shade']);
const CUT_W = 420;
const CUT_H = 560;

const texCache = new Map<string, Texture>();
function cutoutTexture(def: CardDef): Texture {
  let t = texCache.get(def.id);
  if (!t) {
    t = Texture.from(cardArt(def).cutout);
    texCache.set(def.id, t);
  }
  return t;
}

const lerpColor = (a: number, b: number, t: number): number => {
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const r = Math.round(ar + (((b >> 16) & 255) - ar) * t);
  const g = Math.round(ag + (((b >> 8) & 255) - ag) * t);
  const bl = Math.round(ab + ((b & 255) - ab) * t);
  return (r << 16) | (g << 8) | bl;
};

export interface MonsterHost {
  container: Container;
  fx: Container;
  glowTex: Texture;
  profile: () => EffectsProfile;
  sound: (name: SoundName) => void;
  slot: (key: string) => SlotGeom | undefined;
}

export class Monsters {
  private readonly units = new Map<string, Monster>();
  private selected: string | null = null;
  private readonly h: MonsterHost;
  private destroyed = false;
  /** every tween/timeline we start, so destroy() can stop them all */
  private readonly live = new Set<gsap.core.Animation>();
  /** unresolved attack/die promises, resolved on destroy so callers never hang */
  private readonly pending = new Set<() => void>();

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

  constructor(host: MonsterHost) {
    this.h = host;
    host.container.sortableChildren = true;
  }

  /** A monster counts as present until it starts dying. */
  has(key: string): boolean {
    const m = this.units.get(key);
    return !!m && !m.dying;
  }

  stats(key: string): { power: number; guard: number } | null {
    const m = this.units.get(key);
    return m && !m.dying ? { power: m.power.value, guard: m.guard.value } : null;
  }

  keys(side?: 'me' | 'opp'): string[] {
    return [...this.units.values()]
      .filter((m) => !m.dying && (!side || m.side === side))
      .map((m) => m.key);
  }

  // ---------------------------------------------------------------------------------------------
  summon(key: string, def: CardDef, power: number, guard: number): void {
    const geom = this.h.slot(key);
    if (!geom || this.units.has(key)) return;
    const p = this.h.profile();
    const art = cardArt(def);
    const tex = cutoutTexture(def);
    const height = geom.width * 1.3;
    const k = height / CUT_H;

    const root = new Container();
    root.position.set(geom.x, geom.y + 4);
    root.zIndex = geom.y;

    const shadow = new Sprite(this.h.glowTex);
    shadow.anchor.set(0.5);
    shadow.tint = 0x000000;
    shadow.alpha = 0.6;
    shadow.scale.set((geom.width * 0.95) / 128, (geom.width * 0.95 * 0.3) / 128);
    shadow.position.set(0, -2);

    // selection ring: a soft gold pool of light at the feet
    const ring = new Sprite(this.h.glowTex);
    ring.anchor.set(0.5);
    ring.tint = hex(color.goldLight);
    ring.blendMode = 'add';
    ring.alpha = 0;
    ring.scale.set((geom.width * 1.25) / 128, (geom.width * 1.25 * 0.34) / 128);
    ring.position.set(0, -2);

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

    const r = Math.max(15, geom.width * 0.115);
    const power_ = this.badge(r, power, 'power');
    const guard_ = this.badge(r, guard, 'guard');
    power_.root.position.set(-geom.width * 0.36, -r * 0.2);
    guard_.root.position.set(geom.width * 0.36, -r * 0.2);

    root.addChild(shadow, ring, body, power_.root, guard_.root);
    this.h.container.addChild(root);

    const m: Monster = {
      key,
      def,
      side: geom.side,
      geom,
      root,
      body,
      sprite,
      flash,
      shadow,
      ring,
      power: power_,
      guard: guard_,
      phase: Math.random() * Math.PI * 2,
      floater: FLOATERS.has(art.archetype),
      height,
      dying: false,
      busy: 0,
    };
    this.units.set(key, m);
    this.playSummon(m, p);
  }

  private playSummon(m: Monster, p: EffectsProfile): void {
    this.h.sound('summon');
    const drop = p.still ? 0 : 90 + m.height * 0.25;
    m.body.alpha = 0;
    m.power.root.alpha = 0;
    m.guard.root.alpha = 0;
    m.shadow.alpha = 0;
    m.busy++;
    const tl = this.g.timeline({ onComplete: () => void m.busy-- });
    // fall in, land with a squash, settle with a little overshoot
    tl.fromTo(m.body, { y: -drop }, { y: 0, duration: 0.32, ease: ease.in.gsap }, 0);
    tl.to(m.body, { alpha: 1, duration: 0.16, ease: ease.out.gsap }, 0);
    tl.to(m.shadow, { alpha: 0.6, duration: 0.32, ease: ease.out.gsap }, 0);
    if (!p.still) {
      tl.to(m.body.scale, { x: 1.16, y: 0.82, duration: 0.07, ease: ease.out.gsap }, 0.32);
      tl.to(m.body.scale, { x: 1, y: 1, duration: 0.42, ease: ease.pop.gsap }, 0.39);
    }
    tl.to([m.power.root, m.guard.root], { alpha: 1, duration: 0.25, ease: ease.out.gsap }, 0.36);
    tl.call(() => this.landingBurst(m, p), [], 0.32);
  }

  /** A ring of rift light and a few motes where the monster lands. */
  private landingBurst(m: Monster, p: EffectsProfile): void {
    const colorHex = hex(color.violetGlow);
    const burst = new Sprite(this.h.glowTex);
    burst.anchor.set(0.5);
    burst.tint = colorHex;
    burst.blendMode = 'add';
    burst.position.set(m.geom.x, m.geom.y);
    burst.scale.set(0.2, 0.07);
    burst.alpha = 0.95;
    this.h.fx.addChild(burst);
    const w = m.geom.width * 2.4;
    this.g.to(burst.scale, { x: w / 128, y: (w * 0.34) / 128, duration: 0.5, ease: ease.out.gsap });
    this.g.to(burst, {
      alpha: 0,
      duration: 0.5,
      ease: ease.in.gsap,
      onComplete: () => void burst.destroy(),
    });
    if (!p.still) this.sparks(m.geom.x, m.geom.y - 6, Math.min(8, p.particles / 8), colorHex, 60);
  }

  // ---------------------------------------------------------------------------------------------
  private badge(r: number, value: number, kind: 'power' | 'guard'): Badge {
    const root = new Container();
    const g = new Graphics();
    const rim = hex(color.goldDark);
    const fill = kind === 'power' ? 0xc8481f : 0x1d6fb0;
    const hi = kind === 'power' ? 0xff9a5a : 0x6fd0ff;
    g.circle(0, 0, r + 3.5).fill({ color: 0x000000, alpha: 0.6 });
    g.circle(0, 0, r + 1.5).fill({ color: rim });
    g.circle(0, 0, r - 0.5).fill({ color: fill });
    g.circle(-r * 0.22, -r * 0.3, r * 0.55).fill({ color: hi, alpha: 0.35 });
    g.circle(0, 0, r - 0.5).stroke({ width: 1.5, color: hex(color.goldLight), alpha: 0.8 });
    const text = new Text({
      text: String(value),
      style: {
        fontFamily: 'Bebas Neue, Cinzel, sans-serif',
        fontSize: Math.round(r * 1.55),
        fill: 0xffffff,
        stroke: { color: 0x000000, width: Math.max(3, r * 0.22), join: 'round' },
      },
    });
    text.anchor.set(0.5, 0.52);
    text.resolution = 2;
    root.addChild(g, text);
    return { root, text, value, shown: { v: value } };
  }

  /** Tick a badge to a new number with a pop (up = bright pop, down = a punch). */
  private setBadge(b: Badge, value: number): void {
    if (value === b.value) return;
    const up = value > b.value;
    b.value = value;
    gsap.killTweensOf(b.shown);
    this.g.to(b.shown, {
      v: value,
      duration: 0.4,
      ease: ease.out.gsap,
      onUpdate: () => {
        b.text.text = String(Math.round(b.shown.v));
      },
    });
    gsap.killTweensOf(b.root.scale);
    this.g.fromTo(
      b.root.scale,
      { x: up ? 1.7 : 0.6, y: up ? 1.7 : 0.6 },
      { x: 1, y: 1, duration: 0.5, ease: ease.pop.gsap },
    );
  }

  setStats(key: string, power: number, guard: number): void {
    const m = this.units.get(key);
    if (!m) return;
    const buffed = power > m.power.value || guard > m.guard.value;
    this.setBadge(m.power, power);
    this.setBadge(m.guard, guard);
    if (buffed) {
      this.h.sound('buff');
      this.glowPulse(m, hex(color.emberGlow));
    }
  }

  private glowPulse(m: Monster, tint: number): void {
    m.flash.tint = tint;
    gsap.killTweensOf(m.flash);
    this.g.fromTo(
      m.flash,
      { alpha: 0.75 },
      {
        alpha: 0,
        duration: 0.5,
        ease: ease.out.gsap,
        onComplete: () => {
          m.flash.tint = 0xffffff;
        },
      },
    );
  }

  select(key: string | null): void {
    if (this.selected === key) return;
    const prev = this.selected ? this.units.get(this.selected) : undefined;
    if (prev)
      this.g.to(prev.ring, { alpha: 0, duration: 0.25, ease: ease.out.gsap, overwrite: true });
    this.selected = key && this.units.has(key) ? key : null;
    const cur = this.selected ? this.units.get(this.selected) : undefined;
    if (cur) {
      this.h.sound('select');
      this.g.to(cur.ring, { alpha: 0.85, duration: 0.3, ease: ease.out.gsap, overwrite: true });
    }
  }

  // ---------------------------------------------------------------------------------------------
  /**
   * Lunge at a target slot (or the opposing player when targetKey is null). `onImpact` fires at the moment
   * of contact so the caller can run the hit/damage visuals in sync. Resolves when the attacker is home.
   */
  attack(key: string, targetKey: string | null, onImpact?: () => void): Promise<void> {
    const m = this.units.get(key);
    if (!m || m.dying || m.busy > 0) return Promise.resolve();
    const tg = targetKey ? this.h.slot(targetKey) : undefined;
    const dir = m.side === 'me' ? -1 : 1;
    // face: aim at the middle of the enemy's back line
    const tx = tg ? tg.x : 960;
    const ty = tg ? tg.y : m.side === 'me' ? 420 : 900;
    const dx = tx - m.geom.x;
    const dy = ty - m.geom.y;
    const stop = 0.82;
    const p = this.h.profile();
    return new Promise((resolve) => {
      this.pending.add(resolve);
      m.busy++;
      m.root.zIndex = 5000;
      const back = p.still ? 0 : 26;
      const len = Math.hypot(dx, dy) || 1;
      const bx = (-dx / len) * back;
      const by = (-dy / len) * back;
      const tl = this.g.timeline({
        onComplete: () => {
          m.busy--;
          m.root.zIndex = m.geom.y;
          this.pending.delete(resolve);
          resolve();
        },
      });
      this.h.sound('attackWindup');
      // anticipation: crouch and pull back
      tl.to(m.root, { x: m.geom.x + bx, y: m.geom.y + 4 + by, duration: 0.2, ease: ease.out.gsap });
      tl.to(m.body.scale, { x: 1.1, y: 0.88, duration: 0.2, ease: ease.out.gsap }, '<');
      // lunge: fast and stretched
      tl.to(m.root, {
        x: m.geom.x + dx * stop,
        y: m.geom.y + 4 + dy * stop,
        duration: 0.13,
        ease: ease.in.gsap,
      });
      tl.to(m.body.scale, { x: 0.9, y: 1.16, duration: 0.13, ease: ease.in.gsap }, '<');
      tl.call(() => {
        this.h.sound('attackHit');
        onImpact?.();
      });
      // follow-through: squash into the hit, then spring home with overshoot
      tl.to(m.body.scale, { x: 1.18, y: 0.8, duration: 0.07, ease: ease.out.gsap });
      tl.to({}, { duration: 0.06 });
      tl.to(m.root, { x: m.geom.x, y: m.geom.y + 4, duration: 0.5, ease: ease.pop.gsap });
      tl.to(m.body.scale, { x: 1, y: 1, duration: 0.5, ease: ease.pop.gsap }, '<');
      void dir;
    });
  }

  // ---------------------------------------------------------------------------------------------
  /** Hit reaction: white flash, knockback away from the attacker, a shake, a floating number and the badge punch. */
  hit(key: string, amount: number, newGuard?: number): void {
    const m = this.units.get(key);
    if (!m || m.dying) return;
    const p = this.h.profile();
    this.h.sound('hit');
    gsap.killTweensOf(m.flash);
    m.flash.tint = 0xffffff;
    this.g.fromTo(m.flash, { alpha: 1 }, { alpha: 0, duration: 0.28, ease: ease.out.gsap });
    if (!p.still) {
      const away = m.side === 'me' ? 1 : -1;
      gsap.killTweensOf(m.body.position);
      m.busy++;
      const tl = this.g.timeline({
        onComplete: () => {
          m.busy--;
          m.body.position.set(0, 0);
        },
      });
      tl.to(m.body.position, { y: away * 14, duration: 0.07, ease: ease.snap.gsap });
      tl.to(m.body.scale, { x: 1.08, y: 0.92, duration: 0.07 }, '<');
      for (let i = 0; i < 5; i++) {
        tl.to(m.body.position, {
          x: (i % 2 ? 1 : -1) * (9 - i * 1.6),
          y: away * (7 - i),
          duration: 0.045,
        });
      }
      tl.to(m.body.position, { x: 0, y: 0, duration: 0.18, ease: ease.out.gsap });
      tl.to(m.body.scale, { x: 1, y: 1, duration: 0.2, ease: ease.pop.gsap }, '<');
    }
    if (amount > 0)
      this.floatText(m, `-${amount}`, hex(color.blood), 1 + Math.min(0.8, amount * 0.08));
    if (newGuard !== undefined) this.setBadge(m.guard, newGuard);
  }

  heal(key: string, amount: number): void {
    const m = this.units.get(key);
    if (!m) return;
    this.floatText(m, `+${amount}`, hex(color.heal), 1);
    this.glowPulse(m, hex(color.heal));
    this.setBadge(m.guard, m.guard.value + amount);
  }

  private floatText(m: Monster, text: string, tint: number, size: number): void {
    const t = new Text({
      text,
      style: {
        fontFamily: 'Bebas Neue, Cinzel, sans-serif',
        fontSize: 54,
        fill: tint,
        stroke: { color: 0x000000, width: 7, join: 'round' },
      },
    });
    t.anchor.set(0.5);
    t.resolution = 2;
    t.position.set(m.geom.x, m.geom.y - m.height * 0.62);
    t.zIndex = 9000;
    t.scale.set(0.3);
    this.h.fx.addChild(t);
    const drift = (Math.random() - 0.5) * 50;
    const tl = this.g.timeline({ onComplete: () => void t.destroy() });
    tl.to(t.scale, { x: size, y: size, duration: 0.2, ease: ease.pop.gsap });
    tl.to(t, { y: t.y - 70, x: t.x + drift, duration: 0.9, ease: ease.out.gsap }, 0);
    tl.to(t, { alpha: 0, duration: 0.3, ease: ease.in.gsap }, 0.65);
  }

  // ---------------------------------------------------------------------------------------------
  /** Death: drain the colour, crack apart into shards and dissolve into rift particles. */
  die(key: string): Promise<void> {
    const m = this.units.get(key);
    if (!m || m.dying) return Promise.resolve();
    m.dying = true;
    if (this.selected === key) this.select(null);
    const p = this.h.profile();
    this.h.sound('death');
    return new Promise((resolve) => {
      this.pending.add(resolve);
      const shardTex: Texture[] = [];
      const finish = () => {
        if (this.destroyed) return;
        this.pending.delete(resolve);
        for (const t of shardTex) t.destroy(false);
        gsap.killTweensOf([m.root, m.body, m.body.scale, m.body.position, m.flash, m.sprite]);
        m.root.destroy({ children: true });
        this.units.delete(key);
        resolve();
      };
      gsap.killTweensOf(m.body.position);
      m.body.position.set(0, 0);
      m.body.scale.set(1, 1);
      this.g.to([m.power.root, m.guard.root, m.ring], { alpha: 0, duration: 0.2 });
      const grey = { t: 0 };
      const full = 0xffffff;
      const dead = 0x4a4a66;
      this.g.to(grey, {
        t: 1,
        duration: 0.28,
        ease: ease.out.gsap,
        onUpdate: () => {
          m.sprite.tint = lerpColor(full, dead, grey.t);
        },
      });
      if (p.still || p.particles === 0) {
        this.g.to([m.body, m.shadow], { alpha: 0, duration: 0.5, delay: 0.25, onComplete: finish });
        return;
      }
      const reduced = p.mode === 'reduced';
      const cols = reduced ? 2 : 3;
      const rws = reduced ? 3 : 4;
      const source = m.sprite.texture.source;
      const k = m.sprite.scale.x;
      const shards: Sprite[] = [];
      const cw = CUT_W / cols;
      const ch = CUT_H / rws;
      for (let r = 0; r < rws; r++) {
        for (let c = 0; c < cols; c++) {
          const frame = new Rectangle(c * cw, r * ch, cw, ch);
          const tex = new Texture({ source, frame });
          shardTex.push(tex);
          const s = new Sprite(tex);
          s.anchor.set(0.5);
          s.scale.set(k);
          s.tint = dead;
          s.position.set((c * cw + cw / 2 - CUT_W / 2) * k, (r * ch + ch / 2 - CUT_H) * k);
          shards.push(s);
        }
      }
      const tl = this.g.timeline({ delay: 0.3, onComplete: finish });
      tl.call(() => {
        m.sprite.visible = false;
        m.flash.visible = false;
        for (const s of shards) m.body.addChild(s);
        this.sparks(
          m.geom.x,
          m.geom.y - m.height * 0.5,
          reduced ? 6 : 16,
          hex(color.violetGlow),
          m.height * 0.5,
          true,
        );
      });
      // a hard crack: the shards jolt apart, then drift, tumble and fall while fading
      shards.forEach((s, i) => {
        const outX = (s.x / (CUT_W * k * 0.5)) * 38 + (Math.random() - 0.5) * 18;
        const outY = (s.y / (CUT_H * k)) * 26;
        tl.to(
          s,
          {
            x: s.x + outX,
            y: s.y + outY - 10,
            rotation: (Math.random() - 0.5) * 0.7,
            duration: 0.16,
            ease: ease.snap.gsap,
          },
          0.01,
        );
        tl.to(
          s,
          {
            x: s.x + outX * 2.2,
            y: s.y + outY + 40 + Math.random() * 60,
            rotation: (Math.random() - 0.5) * 2.2,
            alpha: 0,
            duration: 0.75 + (i % 3) * 0.08,
            ease: ease.in.gsap,
          },
          0.17,
        );
      });
      tl.to(m.shadow, { alpha: 0, duration: 0.7 }, 0.2);
    });
  }

  /** Rift particles: small additive motes that fly outward and rise. Capped by the caller. */
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
        x + (Math.random() - 0.5) * spread * 0.5,
        y + (Math.random() - 0.5) * spread * 0.4,
      );
      const sc = 0.08 + Math.random() * 0.14;
      s.scale.set(sc);
      this.h.fx.addChild(s);
      const dur = 0.6 + Math.random() * 0.6;
      this.g.to(s, {
        x: s.x + (Math.random() - 0.5) * spread,
        y: s.y - (rise ? 40 + Math.random() * spread : Math.random() * 30),
        alpha: 0,
        duration: dur,
        ease: ease.out.gsap,
        onComplete: () => void s.destroy(),
      });
      this.g.to(s.scale, { x: 0, y: 0, duration: dur, ease: ease.in.gsap });
    }
  }

  // ---------------------------------------------------------------------------------------------
  /** Idle life: each monster breathes on its own phase; flyers also hover. */
  tick(t: number, still: boolean): void {
    if (still) return;
    for (const m of this.units.values()) {
      if (m.dying || m.busy > 0) continue;
      const w = Math.sin(t * 1.7 + m.phase);
      m.body.scale.set(1 - 0.009 * w, 1 + 0.02 * w);
      m.body.skew.x = 0.012 * Math.sin(t * 0.9 + m.phase * 1.3);
      m.body.position.y = m.floater ? -7 - 6 * Math.sin(t * 1.2 + m.phase) : 0;
      if (m.floater) m.shadow.alpha = 0.6 - 0.12 * Math.sin(t * 1.2 + m.phase);
    }
  }

  destroy(): void {
    this.destroyed = true;
    for (const a of this.live) a.kill();
    this.live.clear();
    for (const m of this.units.values()) {
      gsap.killTweensOf([
        m.root,
        m.body,
        m.body.scale,
        m.body.position,
        m.flash,
        m.sprite,
        m.shadow,
        m.ring,
        m.power.root,
        m.guard.root,
        m.power.root.scale,
        m.guard.root.scale,
        m.power.shown,
        m.guard.shown,
      ]);
    }
    this.units.clear();
    texCache.clear();
    for (const done of [...this.pending]) done();
    this.pending.clear();
  }
}
