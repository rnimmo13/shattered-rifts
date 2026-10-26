// The combatants on the stage: your hero and allies on the left, the enemies on the right, all standing on one line.
// Presentation only. It animates what the engine already decided (lunges, hits, deaths, summons) and reports where
// each figure is so the DOM overlay (HP bars, intents, statuses) can sit on top of it.

import { Container, Sprite, Texture } from 'pixi.js';
import { gsap } from 'gsap';
import { color, ease, hex } from '../design/tokens';
import type { EffectsProfile } from '../duel/effects';
import type { CardDef } from '@sr/combat';
import type { AttackSpec } from './attackStyles';
import {
  MOTION_KIND,
  WEAPON_LOOK,
  fxFrames,
  weaponFor,
  weaponTexture,
  type FxId,
  type WeaponId,
  type WeaponLook,
} from './weaponArt';
import {
  burst,
  clawMarks,
  hammerPound,
  impact,
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
const ALLY_PITCH = 195;
/** how far each line stands back from the centre: the gap between the two sides */
const ALLY_BACK = 250;
const FOE_BACK = 340;
/** the right-most a foe may stand (its figure and plate must stay on the stage) */
const FOE_RIGHT = 1800;
const FOE_PITCH = 195;

export function slotX(
  side: FighterSide,
  slot: number,
  isHero: boolean,
  count = 4,
  flying = false,
): number {
  if (isHero) return HERO_X;
  // a crowd packs closer so it still fits on the stage (and the plates under it are narrowed to match)
  const pitch = count <= 4 ? FOE_PITCH : Math.max(104, Math.floor(640 / (count - 1)));
  // (a very long line starts a little further left so its last figure and plate stay on the stage)
  const crowdStart = CENTRE + 260 - Math.max(0, count - 6) * 40;
  const start =
    count <= 4 ? Math.min(CENTRE + FOE_BACK, FOE_RIGHT - (count - 1) * pitch) : crowdStart;
  // flyers hover in their own row, a half step along, so they fill the gaps above the ground line instead of queueing behind it
  // (toward the centre on both sides, so the last foe's figure and plate still fit on the stage)
  const half = flying ? -(side === 'a' ? ALLY_PITCH : pitch) / 2 : 0;
  return (side === 'a' ? CENTRE - ALLY_BACK - slot * ALLY_PITCH : start + slot * pitch) + half;
}

export interface FighterSpec {
  id: string;
  side: FighterSide;
  isHero: boolean;
  /** 0 = nearest the centre (allies and enemies); ignored for heroes */
  slot: number;
  /** how many non-hero units stand on this side */
  count: number;
  /** where it stands (stage x), from the side's measured layout; without one the fixed slots (slotX) are used */
  x?: number;
  canvas: HTMLCanvasElement;
  /** figure height in stage px */
  height: number;
  /** a flyer hovers this many stage px above the floor (its shadow stays on the ground); 0 or absent = stands */
  hover?: number;
  /** how its attacks look (a slash, a shot, a spell...): presentation only */
  attack: AttackSpec;
  /** a Riftwalker's id (`HeroDef.id`), so it can swing its own weapon (weaponArt.ts) */
  hero?: string;
  /** something that floats beside the figure while `on` (a blade in her hand): a cut-out and where it hovers, in figure pixels */
  prop?: { canvas: HTMLCanvasElement; x: number; y: number; on: boolean };
}

interface Fighter {
  spec: FighterSpec;
  root: Container;
  /** carries the body up to the figure's hover height and bobs it; the shadow stays on the floor */
  air: Container;
  body: Container;
  shadow: Sprite;
  contact: Sprite;
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
  /** a tighter, darker blob than glowTex, for the shadow under a figure's feet */
  contactTex?: Texture;
  profile: () => EffectsProfile;
  sound: (name: string) => void;
}

/**
 * Melee timings per style (before the 1.5x speed-up). A melee attacker stays at its place (DECISIONS #248): it winds up (a lean
 * back of `back` px, tilted, lifted for a heavy blow), strikes (a short step of `step` px towards the target), and the blow itself
 * appears on the target: a slash, claw marks, a thrust, a hammer brought down.
 */
const MELEE = {
  lunge: { back: 10, step: 22, wind: 0.14, rush: 0.1, tilt: 0.08, lift: 0 },
  slash: { back: 14, step: 26, wind: 0.18, rush: 0.1, tilt: 0.3, lift: 0 },
  stab: { back: 8, step: 30, wind: 0.1, rush: 0.07, tilt: 0.06, lift: 0 },
  claw: { back: 12, step: 24, wind: 0.13, rush: 0.09, tilt: 0.16, lift: -6 },
  smash: { back: 12, step: 14, wind: 0.3, rush: 0.12, tilt: 0.28, lift: -22 },
};

/** A weapon picture ready to swing. */
interface Wielded {
  id: WeaponId;
  tex: Texture;
  look: WeaponLook;
}

/** How a weapon is held through a melee blow (radians, 0 = pointing at the target; negative = raised): start, wind-up, blow. */
const MELEE_POSE: Partial<
  Record<
    WeaponLook['motion'],
    { from: number; raise: number; to: number; fromX: number; toX: number }
  >
> & {
  swing: { from: number; raise: number; to: number; fromX: number; toX: number };
} = {
  swing: { from: -0.9, raise: -2.1, to: 0.7, fromX: 0, toX: 10 },
  slam: { from: -0.8, raise: -2.4, to: 0.45, fromX: 0, toX: 6 },
  thrust: { from: 0.15, raise: 0.05, to: 0, fromX: -10, toX: 46 },
};
/** How a weapon is held for a shot, a throw or a spell: its start and where it points when it goes off. */
const RANGED_POSE: Partial<Record<WeaponLook['motion'], { from: number; aim: number }>> & {
  fire: { from: number; aim: number };
} = {
  fire: { from: 0.5, aim: 0 },
  throw: { from: -1.4, aim: -0.3 },
  raise: { from: 0.2, aim: -0.9 },
};

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
    return { x: f.root.x, y: f.root.y, h: f.spec.height + (f.spec.hover ?? 0), w: f.width };
  }

  /** Where a figure stands when at rest (its slot), unaffected by a lunge in progress. */
  home(id: string): { x: number; y: number; h: number; w: number; hover: number } | null {
    const f = this.all.get(id);
    return f
      ? {
          x: f.x,
          y: LINE_Y,
          h: f.spec.height + (f.spec.hover ?? 0),
          w: f.width,
          hover: f.spec.hover ?? 0,
        }
      : null;
  }

  /**
   * Which figure is under this stage point, if any (the nearest wins). When aiming, `among` names the figures that can be chosen: only
   * those are looked at, and with a roomier reach (a little beyond the figure on every side), so a click that is close still finds its
   * target, and a figure that cannot be chosen never gets in the way of one that can.
   */
  hitTest(x: number, y: number, among?: ReadonlySet<string>): string | null {
    let best: string | null = null;
    let bestD = Infinity;
    const roomy = among !== undefined && among.size > 0;
    for (const f of this.all.values()) {
      if (f.dying) continue;
      if (roomy && !among.has(f.spec.id)) continue;
      const reach = roomy ? f.width * 0.55 + 40 : f.width * 0.55;
      const slack = roomy ? 40 : 0;
      const dx = Math.abs(x - f.root.x);
      if (
        dx <= reach &&
        y <= f.root.y + 24 + slack &&
        y >= f.root.y - f.spec.height - (f.spec.hover ?? 0) - 10 - slack &&
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
      const x =
        spec.x ?? slotX(spec.side, spec.slot, spec.isHero, spec.count, (spec.hover ?? 0) > 0);
      const f = this.all.get(spec.id);
      if (!f) {
        this.add(spec, x, !opts.instant);
      } else if (!f.dying) {
        const resized =
          Math.abs(f.spec.height - spec.height) > 0.5 || (f.spec.hover ?? 0) !== (spec.hover ?? 0);
        f.spec = spec;
        if (resized) this.resize(f);
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
    root.zIndex = LINE_Y + (spec.hover ? 1 : 0);

    const hover = spec.hover ?? 0;
    const w = spec.canvas.width * k;
    // two shadows pin a figure to the floor: a wide soft one, and a small dark one hugging the feet
    const shadow = new Sprite(this.h.glowTex);
    shadow.anchor.set(0.5);
    shadow.tint = 0x000000;
    shadow.alpha = hover ? 0.3 : 0.6;
    shadow.scale.set((w * 1.15) / 128, (w * 1.15 * 0.24) / 128);
    shadow.position.y = 2;
    const contact = new Sprite(this.h.contactTex ?? this.h.glowTex);
    contact.anchor.set(0.5);
    contact.tint = 0x000000;
    contact.alpha = hover ? 0.32 : 1;
    contact.scale.set((w * 0.8) / 128, (w * 0.8 * 0.2) / 128);
    contact.position.y = 6;

    const tint = spec.side === 'a' ? color.cyan : '#ff5a86';
    const aura = new Sprite(this.h.glowTex);
    aura.anchor.set(0.5, 0.5);
    aura.tint = hex(tint);
    aura.blendMode = 'add';
    aura.alpha = spec.isHero ? 0.24 : 0.14;
    aura.scale.set((w * 1.1) / 128, (w * 1.1 * 0.34) / 128);

    const ring = new Sprite(this.h.glowTex);
    ring.anchor.set(0.5);
    ring.tint = 0xff4a6e;
    ring.blendMode = 'add';
    ring.alpha = 0;
    ring.scale.set((w * 1.3) / 128, (w * 1.3 * 0.4) / 128);

    const air = new Container();
    air.y = -hover;
    const body = new Container();
    air.addChild(body);
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
      prop.position.set(
        (spec.prop.x - spec.canvas.width / 2) * k,
        (spec.prop.y - spec.canvas.height) * k,
      );
      prop.alpha = spec.prop.on ? 1 : 0;
      prop.visible = spec.prop.on;
      body.addChild(prop);
    }
    root.addChild(shadow, contact, aura, ring, air);
    this.h.container.addChild(root);
    this.h.container.sortableChildren = true;
    const f: Fighter = {
      spec,
      root,
      air,
      body,
      shadow,
      contact,
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

  /** The side's line was measured again (a figure joined or left and the rest were shrunk or let grow): resize to match. */
  private resize(f: Fighter): void {
    const spec = f.spec;
    const k = spec.height / spec.canvas.height;
    const w = spec.canvas.width * k;
    f.sprite.scale.set(k);
    f.flash.scale.set(k);
    f.shadow.scale.set((w * 1.15) / 128, (w * 1.15 * 0.24) / 128);
    f.contact.scale.set((w * 0.8) / 128, (w * 0.8 * 0.2) / 128);
    f.aura.scale.set((w * 1.1) / 128, (w * 1.1 * 0.34) / 128);
    f.ring.scale.set((w * 1.3) / 128, (w * 1.3 * 0.4) / 128);
    if (f.prop && spec.prop) {
      f.prop.scale.set(k);
      f.prop.position.x = (spec.prop.x - spec.canvas.width / 2) * k;
    }
    f.width = w;
    f.air.y = -(spec.hover ?? 0);
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
      this.track(
        gsap.to(p, { alpha: 0, duration: 0.25, onComplete: () => void (p.visible = false) }),
      );
    }
  }

  private remove(id: string): void {
    const f = this.all.get(id);
    if (!f) return;
    gsap.killTweensOf([
      f.root,
      f.air,
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
  /** `card`: the card that made the attack, when a hero played one (it picks the weapon: KP's hammer or his shotgun...) */
  attack(
    id: string,
    targetId: string | null,
    onHit?: () => void,
    card?: CardDef | null,
  ): Promise<void> {
    const f = this.all.get(id);
    const t = targetId ? this.all.get(targetId) : undefined;
    if (!f || f.dying || this.h.profile().still) {
      onHit?.();
      return Promise.resolve();
    }
    const dir = f.spec.side === 'a' ? 1 : -1;
    // a hero with a weapon picture swings it, and the weapon decides the style (a hammer slams, a shotgun fires)
    const wid = f.spec.hero ? weaponFor(f.spec.hero, card) : null;
    const tex = wid ? weaponTexture(wid) : undefined;
    const weapon = wid && tex ? { id: wid, tex, look: WEAPON_LOOK[wid] } : null;
    const spec: AttackSpec = weapon
      ? { ...f.spec.attack, kind: MOTION_KIND[weapon.look.motion] }
      : f.spec.attack;
    const kind = spec.kind;
    return kind === 'shoot' || kind === 'throw' || kind === 'cast'
      ? this.rangedAttack(f, t, dir, spec, weapon, onHit)
      : this.meleeAttack(f, t, dir, spec, weapon, onHit);
  }

  /**
   * The weapon for one attack, turning about its grip and mirrored for a hero facing left: in the hero's hand (a gun, a throw, a
   * staff), or `at` a point on the stage (a melee blow lands on its target, as the drawn effects always did).
   */
  private wield(
    f: Fighter,
    w: Wielded,
    dir: number,
    at?: Pt,
  ): { holder: Container; sprite: Sprite } {
    const holder = new Container();
    if (at) holder.position.set(at.x, at.y);
    else holder.position.set(dir * f.width * 0.26, -f.spec.height * 0.5);
    holder.scale.x = dir;
    holder.alpha = 0;
    const sprite = new Sprite(w.tex);
    sprite.anchor.set(w.look.grip[0], w.look.grip[1]);
    sprite.scale.set((f.spec.height * w.look.size) / Math.max(1, w.tex.width));
    holder.addChild(sprite);
    if (at) {
      holder.zIndex = 6050;
      this.h.container.addChild(holder);
    } else f.air.addChild(holder);
    return { holder, sprite };
  }

  /** A painted effect played frame by frame at a point (`flip`: drawn facing left), then gone. */
  private frames(
    id: FxId,
    at: Pt,
    size: number,
    flip = false,
    anchor: [number, number] = [0.5, 0.5],
  ): void {
    const tex = fxFrames(id);
    if (!tex?.length) return;
    const s = new Sprite(tex[0]);
    s.anchor.set(anchor[0], anchor[1]);
    s.position.set(at.x, at.y);
    s.scale.set(
      (flip ? -1 : 1) * (size / Math.max(1, tex[0]?.width ?? 1)),
      size / Math.max(1, tex[0]?.height ?? 1),
    );
    s.zIndex = 6100;
    this.h.container.addChild(s);
    const step = 0.05;
    const tl = this.track(gsap.timeline({ onComplete: () => void (s.destroyed || s.destroy()) }));
    tex.forEach((t, i) => {
      tl.call(
        () => {
          if (!s.destroyed) s.texture = t;
        },
        [],
        i * step,
      );
    });
    tl.to({}, { duration: step });
  }

  private fxCtx(): FxCtx {
    return { parent: this.h.container, track: (a) => this.track(a) };
  }

  /** The middle of a figure's body, where effects land. */
  private chest(f: Fighter, dx = 0): Pt {
    return { x: f.root.x + dx, y: f.root.y - (f.spec.hover ?? 0) - f.spec.height * 0.55 };
  }

  /** Strike from where it stands: the same beats for every melee style, with a different windup, pose and effect on the target. */
  private meleeAttack(
    f: Fighter,
    t: Fighter | undefined,
    dir: number,
    spec: AttackSpec,
    weapon: Wielded | null,
    onHit?: () => void,
  ): Promise<void> {
    const kind = spec.kind;
    const m =
      kind === 'slash' || kind === 'stab' || kind === 'claw' || kind === 'smash'
        ? MELEE[kind]
        : MELEE.lunge;
    const dx = dir * m.step;
    return new Promise((resolve) => {
      f.busy++;
      f.root.zIndex = 5000;
      const tl = this.track(
        gsap.timeline({
          onComplete: () => {
            f.busy--;
            f.root.zIndex = LINE_Y + (f.spec.hover ? 1 : 0);
            resolve(); // (already resolved at contact; harmless)
          },
        }),
      );
      tl.timeScale(1.5);
      this.h.sound('attackWindup');
      // the weapon: raised during the wind-up, brought down (or driven forward) in the rush, gone after the blow
      // (on the target: the grip just short of it, so the blow comes down across it)
      const strike = t
        ? { x: t.root.x - dir * t.width * 0.45, y: this.chest(t).y - t.spec.height * 0.12 }
        : { x: f.root.x + dir * 120, y: this.chest(f).y };
      const held = weapon ? this.wield(f, weapon, dir, strike) : null;
      if (held && weapon) {
        // (its own timeline at the same pace, so the blow's beats on the main one are not moved)
        const pose = MELEE_POSE[weapon.look.motion] ?? MELEE_POSE.swing;
        held.sprite.rotation = pose.from;
        held.sprite.x = pose.fromX;
        const wt = this.track(
          gsap.timeline({
            onComplete: () =>
              void (held.holder.destroyed || held.holder.destroy({ children: true })),
          }),
        );
        wt.timeScale(1.5);
        wt.to(held.holder, { alpha: 1, duration: m.wind * 0.5 }, 0);
        wt.to(held.sprite, { rotation: pose.raise, duration: m.wind, ease: ease.out.gsap }, 0);
        wt.to(
          held.sprite,
          { rotation: pose.to, x: pose.toX, duration: m.rush, ease: ease.in.gsap },
          m.wind,
        );
        wt.to(held.holder, { alpha: 0, duration: 0.2 }, m.wind + m.rush + 0.12);
      }
      tl.to(f.root, { x: f.x - dir * m.back, duration: m.wind, ease: ease.out.gsap });
      tl.to(f.body.scale, { x: 1.08, y: 0.9, duration: m.wind }, '<');
      if (m.tilt) tl.to(f.body, { rotation: -dir * m.tilt, y: m.lift, duration: m.wind }, '<');
      tl.to(f.root, { x: f.x + dx, duration: m.rush, ease: ease.in.gsap });
      tl.to(f.body.scale, { x: 0.92, y: 1.12, duration: m.rush }, '<');
      if (m.tilt) tl.to(f.body, { rotation: dir * m.tilt * 0.9, y: 0, duration: m.rush }, '<');
      tl.call(() => {
        this.h.sound('attackHit');
        // the weapon picture replaces the drawn blow; the painted dust or sparks land with it
        if (weapon) this.meleeFrames(f, t, dir, spec);
        else this.meleeFx(f, t, dir, spec);
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

  /** The painted effect where a weapon blow lands: a burst of dust at the feet for a slam, sparks at the chest for a blade. */
  private meleeFrames(f: Fighter, t: Fighter | undefined, dir: number, spec: AttackSpec): void {
    const size = Math.max(120, Math.min(240, (t?.spec.height ?? 220) * 0.8));
    if (spec.kind === 'smash') {
      const feet = t ? { x: t.root.x, y: t.root.y } : { x: f.root.x + dir * 90, y: f.root.y };
      this.frames('impact', feet, size * 1.2, false, [0.5, 0.82]);
    } else {
      const at = t ? this.chest(t) : { x: f.root.x + dir * 80, y: this.chest(f).y };
      this.frames('spark', at, size);
    }
  }

  /** What appears on the target at the moment a melee blow lands. */
  private meleeFx(f: Fighter, t: Fighter | undefined, dir: number, spec: AttackSpec): void {
    const { kind, tint, hits = 1 } = spec;
    const c = this.fxCtx();
    const at = t
      ? this.chest(t)
      : { x: f.root.x + dir * 70, y: f.root.y - (f.spec.hover ?? 0) - f.spec.height * 0.55 };
    const size = Math.max(70, Math.min(150, (t?.spec.height ?? 220) * 0.55));
    switch (kind) {
      case 'slash':
        // (a cut across the target, and for a single blow a second, fainter one crossing it)
        for (let i = 0; i < Math.max(hits, 1); i++)
          slashArc(c, at, dir, tint, {
            tilt: i % 2 ? 0.55 : -0.55,
            size: size * 1.15,
            delay: i * 0.09,
          });
        if (hits <= 1) slashArc(c, at, -dir, tint, { tilt: 0.4, size: size * 0.8, delay: 0.06 });
        burst(c, at, tint, 6, 40);
        break;
      case 'claw':
        clawMarks(c, at, dir, tint);
        burst(c, at, tint, 5, 34);
        break;
      case 'stab':
        void streak(
          c,
          { x: at.x - dir * 120, y: at.y },
          { x: at.x + dir * 20, y: at.y },
          tint,
          0.08,
          5,
        );
        burst(c, at, tint, 6, 36);
        break;
      case 'smash':
        // a hammer (or wrench, or maul) comes down on the target
        hammerPound(c, at, { x: t?.root.x ?? at.x, y: t?.root.y ?? f.root.y }, dir, tint, size);
        break;
      default:
        impact(c, at, tint, size);
        break;
    }
  }

  /** Shoot, throw or cast from where it stands: the figure keeps its place and the effect travels to the target. */
  private rangedAttack(
    f: Fighter,
    t: Fighter | undefined,
    dir: number,
    spec: AttackSpec,
    weapon: Wielded | null,
    onHit?: () => void,
  ): Promise<void> {
    const { kind, tint, hits = 1 } = spec;
    const held = weapon ? this.wield(f, weapon, dir) : null;
    // with a weapon in hand, the shot leaves from its far end (the muzzle, the knife, the staff's head)
    const tip = (): Pt | null => {
      if (!held || held.holder.destroyed || !weapon) return null;
      const s = held.sprite;
      const reach = s.width * (1 - weapon.look.grip[0]);
      const g = held.holder.toGlobal({
        x: s.x + Math.cos(s.rotation) * reach,
        y: s.y + Math.sin(s.rotation) * reach,
      });
      return this.h.container.toLocal(g);
    };
    const from = this.chest(f, dir * f.width * 0.3);
    const to = t ? this.chest(t) : { x: f.root.x + dir * 340, y: from.y };
    const c = this.fxCtx();
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    return new Promise((resolve) => {
      f.busy++;
      const tl = this.track(gsap.timeline({ onComplete: () => void f.busy-- }));
      tl.timeScale(1.5);
      this.h.sound('attackWindup');
      if (held && weapon) {
        // (its own timeline at the same pace, so the shot's beats on the main one are not moved)
        const pose = RANGED_POSE[weapon.look.motion] ?? RANGED_POSE.fire;
        held.sprite.rotation = pose.from;
        const wt = this.track(
          gsap.timeline({
            onComplete: () =>
              void (held.holder.destroyed || held.holder.destroy({ children: true })),
          }),
        );
        wt.timeScale(1.5);
        wt.to(held.holder, { alpha: 1, duration: 0.08 }, 0);
        wt.to(held.sprite, { rotation: pose.aim, duration: 0.14, ease: ease.out.gsap }, 0);
        wt.to(held.holder, { alpha: 0, duration: 0.22 }, 0.55);
      }
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
          const muzzle = tip();
          if (held && weapon?.look.motion === 'fire') {
            // the kick of the gun, and the painted flash and smoke at its muzzle
            this.track(
              gsap.fromTo(
                held.sprite,
                { x: -18, rotation: -0.22 },
                { x: 0, rotation: 0, duration: 0.3, ease: ease.out.gsap },
              ),
            );
            if (muzzle) this.frames('muzzle', muzzle, 150, dir < 0, [0.12, 0.5]);
          }
          if (held && weapon?.look.motion === 'raise' && muzzle) this.frames('cast', muzzle, 130);
          if (kind === 'shoot') {
            puff(c, muzzle ?? from, tint, 22, 0.12);
            const runs: Promise<void>[] = [];
            for (let i = 0; i < hits; i++) {
              const off = (i - (hits - 1) / 2) * 15;
              runs.push(
                streak(
                  c,
                  muzzle ?? from,
                  { x: to.x, y: to.y + off },
                  tint,
                  Math.max(0.1, dist / 3800),
                  3,
                ),
              );
            }
            void Promise.all(runs).then(land);
          } else if (kind === 'throw' && held && weapon) {
            // the knife itself leaves the hand and spins to the target
            const start = muzzle ?? from;
            held.holder.alpha = 0;
            const k = new Sprite(weapon.tex);
            k.anchor.set(0.5);
            k.scale.set(held.sprite.scale.x * dir, held.sprite.scale.y);
            k.position.set(start.x, start.y);
            k.zIndex = 6000;
            this.h.container.addChild(k);
            const time = Math.max(0.16, dist / 2400);
            this.track(
              gsap.to(k, {
                x: to.x,
                y: to.y,
                rotation: dir * Math.PI * 4,
                duration: time,
                ease: 'none',
              }),
            );
            this.track(
              gsap.delayedCall(time, () => {
                if (!k.destroyed) k.destroy();
                this.frames('spark', to, 140);
                land();
              }),
            );
          } else if (kind === 'throw') {
            void thrownBlade(c, from, to, tint, Math.max(0.16, dist / 2400)).then(land);
          } else {
            void orb(c, muzzle ?? from, to, tint, Math.max(0.2, dist / 1800)).then(() => {
              if (held) this.frames('cast', to, 170);
              land();
            });
          }
        } catch {
          land();
        }
      });
      // a gun kicks back as it fires; a thrower or caster follows through
      if (kind === 'shoot')
        tl.fromTo(
          f.body.position,
          { x: -dir * 16 },
          { x: 0, duration: 0.25, ease: ease.out.gsap, immediateRender: false },
          '<',
        );
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
      const hover = f.spec.hover ?? 0;
      if (hover) {
        // a flyer rides on the air: it drifts up and down while its shadow on the floor breathes the other way
        const b = Math.sin(t * 1.3 + f.phase);
        f.air.y = -hover + b * 9;
        f.contact.alpha = 0.32 - 0.06 * b;
        f.shadow.alpha = 0.3 - 0.05 * b;
      }
      f.sprite.scale.y = (f.spec.height / f.spec.canvas.height) * (1 + 0.014 * w);
      f.aura.alpha = (f.spec.isHero ? 0.2 : 0.1) + 0.06 * Math.sin(t * 1.9 + f.phase);
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
