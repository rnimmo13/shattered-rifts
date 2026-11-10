// The combatants on the stage: your hero and allies on the left, the enemies on the right, all standing on one line.
// Presentation only. It animates what the engine already decided (lunges, hits, deaths, summons) and reports where
// each figure is so the DOM overlay (HP bars, intents, statuses) can sit on top of it.

import { Container, Sprite, Texture } from 'pixi.js';
import { gsap } from 'gsap';
import { color, ease, hex } from '../design/tokens';
import type { EffectsProfile } from '../duel/effects';
import type { CardDef } from '@sr/combat';
import type { AttackSpec, CardMotion } from './attackStyles';
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
  skyfall,
  slashArc,
  streak,
  thrownBlade,
  type FxCtx,
  type Pt,
} from './attackFx';
import { HeroSprite, loadRig, type Facing } from './heroSprite';

export type FighterSide = 'a' | 'b';
export type { Facing } from './heroSprite';

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
  /** the row it stands on (stage y of its feet); LINE_Y without one. A phone held upright puts the enemies on a row behind (DECISIONS #443) */
  y?: number;
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
  /** a hero drawn by a 2D rig (heroSprite.ts) once it has loaded; `canvas` is shown until then, and stays if it cannot load */
  rig?: { id: string; facing: Facing };
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
  /** the row it stands on (stage y) */
  y: number;
  width: number;
  phase: number;
  dying: boolean;
  targetable: boolean;
  busy: number;
  /** the animated rig drawing this figure, once loaded (DECISIONS #676) */
  rig: HeroSprite | null;
}

export interface FighterHost {
  container: Container;
  glowTex: Texture;
  /** a tighter, darker blob than glowTex, for the shadow under a figure's feet */
  contactTex?: Texture;
  profile: () => EffectsProfile;
  sound: (name: string) => void;
  /** something changed at once, not by a tween: on Low graphics the board is drawn again for this long (DECISIONS #570) */
  wake?: (ms: number) => void;
  /** canvas pixels per stage pixel (the board's scale times its resolution): a rig draws at this density, at most 2 per CSS px */
  pixelScale?: () => number;
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
  /** the figure the aiming arrow is locked onto */
  private locked: string | null = null;
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
          y: f.y,
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
      const height = f.spec.height + (f.spec.hover ?? 0);
      const distance =
        (dx / reach) ** 2 + ((y - (f.root.y - height / 2)) / Math.max(1, height / 2)) ** 2;
      if (
        dx <= reach &&
        y <= f.root.y + 24 + slack &&
        y >= f.root.y - f.spec.height - (f.spec.hover ?? 0) - 10 - slack &&
        distance < bestD
      ) {
        best = f.spec.id;
        bestD = distance;
      }
    }
    return best;
  }

  /** Make the set of figures match `list`: add new ones (with a pop-in), slide existing ones to their slots. */
  sync(list: FighterSpec[], opts: { instant?: boolean } = {}): void {
    this.h.wake?.(150);
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
        // (a Thrall grown big enough changes figure, DECISIONS #445)
        const restyled = f.spec.canvas !== spec.canvas;
        const resized =
          restyled ||
          Math.abs(f.spec.height - spec.height) > 0.5 ||
          (f.spec.hover ?? 0) !== (spec.hover ?? 0);
        // (a rig draws its own frames: the picture behind it is only its stand-in)
        if (restyled && !f.rig) {
          const tex = Texture.from(spec.canvas);
          f.sprite.texture = tex;
          f.flash.texture = tex;
        }
        f.spec = spec;
        if (resized) this.resize(f);
        this.showProp(f, opts.instant === true);
        if (Math.abs(f.x - x) > 1) {
          f.x = x;
          gsap.killTweensOf(f.root, 'x');
          if (opts.instant || this.h.profile().still) f.root.x = x;
          else this.track(gsap.to(f.root, { x, duration: 0.35, ease: ease.out.gsap }));
        }
        // (a new row: the screen was turned, and the line moves to the layout for it)
        const y = spec.y ?? LINE_Y;
        if (Math.abs(f.y - y) > 1) {
          f.y = y;
          f.root.zIndex = y + (spec.hover ? 1 : 0);
          gsap.killTweensOf(f.root, 'y');
          if (opts.instant || this.h.profile().still) f.root.y = y;
          else this.track(gsap.to(f.root, { y, duration: 0.35, ease: ease.out.gsap }));
        }
      }
    }
  }

  private add(spec: FighterSpec, x: number, animate: boolean): void {
    const k = spec.height / spec.canvas.height;
    const tex = Texture.from(spec.canvas);
    const root = new Container();
    const y = spec.y ?? LINE_Y;
    root.position.set(x, y);
    root.zIndex = y + (spec.hover ? 1 : 0);

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
      y,
      width: w,
      phase: (this.all.size * 1.7) % 6.28,
      dying: false,
      targetable: false,
      busy: 0,
      rig: null,
    };
    this.all.set(spec.id, f);
    if (spec.rig) this.loadRigFor(f, spec.rig.id, spec.rig.facing);
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
    const w = f.rig ? f.rig.widthFor(spec.height) : spec.canvas.width * k;
    if (f.rig) this.fitRig(f, f.rig);
    else {
      f.sprite.scale.set(k);
      f.flash.scale.set(k);
    }
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
    f.rig?.dispose();
    f.rig = null;
    this.all.delete(id);
  }

  // --- rigged heroes (DECISIONS #676) ---------------------------------------------------------------------

  /** canvas px per stage px for a rig: the board's own density, never past 2 device px a CSS px */
  private rigDensity(): number {
    return Math.max(0.25, this.h.pixelScale?.() ?? 1);
  }

  /** Load the rig; once it is in (and the figure is still on the stage), it draws the figure instead of its picture. */
  private loadRigFor(f: Fighter, id: string, facing: Facing): void {
    void loadRig(id).then((assets) => {
      // (not once the fight is over: a beaten hero's picture has already slumped)
      if (!assets || this.destroyed || this.ended || this.all.get(f.spec.id) !== f || f.dying)
        return;
      const rig = HeroSprite.create(id, assets, facing);
      if (!rig) return;
      f.rig = rig;
      f.sprite.texture = rig.texture;
      f.flash.texture = rig.texture;
      f.flash.alpha = 0;
      // (its canvas, its feet on the spot, and the shadows sized to its wider stance)
      this.resize(f);
      rig.render();
      this.h.wake?.(200);
    });
  }

  /**
   * Size a rig's canvas to the figure's height, the board's density and the current clip's frame, with its feet on the figure's
   * spot. A resized canvas is blank, so it is drawn again at once (or a still board would show nothing until the next clip).
   */
  private fitRig(f: Fighter, rig: HeroSprite): void {
    const changed = rig.resize(f.spec.height, this.rigDensity());
    const a = rig.anchor;
    for (const s of [f.sprite, f.flash]) {
      s.anchor.set(a.x, a.y);
      s.scale.set(rig.stageScale);
    }
    if (changed) {
      rig.render();
      this.h.wake?.(100);
    }
  }

  /** Resolves when a strike or aura already under way has finished, so the next clip never snaps from mid-lunge to rest. */
  private afterClip(rig: HeroSprite): Promise<void> {
    const left = rig.clip === 'strike' || rig.clip === 'aura' ? rig.remaining : 0;
    if (left <= 0.02) return Promise.resolve();
    return new Promise((resolve) => void this.track(gsap.delayedCall(left, resolve)));
  }

  /** Play a rig's clip, keep the board drawing through it (Low graphics), and say when its named moment comes. */
  private rigPlay(
    rig: HeroSprite,
    clip: 'strike' | 'aura' | 'hit' | 'death',
    moment?: { name: string; at: () => void; within: number },
    onEnd?: () => void,
    /** the weapon the card swings (DECISIONS #715) */
    variant?: string,
  ): void {
    let done = false;
    const fire = (): void => {
      if (done) return;
      done = true;
      moment?.at();
    };
    rig.play(clip, {
      onEvent: (e) => {
        if (moment && e.name === moment.name) fire();
      },
      ...(onEnd ? { onEnd } : {}),
      ...(variant ? { variant } : {}),
    });
    this.h.wake?.(clip === 'death' ? 2400 : 1600);
    // (the moment always comes, even if the rig is not drawn to it; gsap keeps the same game speed the rig does. A model that knows
    // when its moment comes, as a video model's measured strike, is waited for a little past it)
    const known = rig.momentIn?.(clip, variant);
    if (moment)
      this.track(
        gsap.delayedCall(
          known !== undefined ? Math.max(moment.within, known + 0.2) : moment.within,
          fire,
        ),
      );
  }

  // --- animation -------------------------------------------------------------------------------------------

  /** Attack the target in the figure's own style (a slash, a shot, a spell...) and call `onHit` at contact. */
  /** `card`: the card that made the attack, when a hero played one (it picks the weapon: KP's hammer or his shotgun...) */
  /** `motion` and `foes`: a Spell is cast, not swung, and a card that hits every enemy plays across all of `foes` (DECISIONS #565) */
  attack(
    id: string,
    targetId: string | null,
    onHit?: () => void,
    card?: CardDef | null,
    motion?: CardMotion,
    foes?: readonly string[],
  ): Promise<void> {
    const f = this.all.get(id);
    if (!f || f.dying || this.h.profile().still) {
      onHit?.();
      return Promise.resolve();
    }
    const all = (foes ?? [])
      .map((x) => this.all.get(x))
      .filter((x): x is Fighter => !!x && !x.dying);
    const spread = motion?.aoe && all.length > 1 ? all : null;
    // (a sweep comes first to the nearest of them; a card with no target and one enemy left goes at that one)
    const t = spread
      ? spread.reduce((m, x) => (Math.abs(x.x - f.x) < Math.abs(m.x - f.x) ? x : m))
      : targetId
        ? this.all.get(targetId)
        : all.length === 1
          ? all[0]
          : undefined;
    const dir = f.spec.side === 'a' ? 1 : -1;
    // a rigged hero strikes with its own animation: the blow (and the damage after it) lands on the clip's impact
    if (f.rig)
      return this.rigStrike(
        f,
        f.rig,
        t,
        dir,
        onHit,
        spread,
        f.spec.hero ? (weaponFor(f.spec.hero, card) ?? undefined) : undefined,
      );
    // a hero with a weapon picture swings it, and the weapon decides the style (a hammer slams, a shotgun fires)
    const wid = f.spec.hero ? weaponFor(f.spec.hero, card) : null;
    const tex = wid ? weaponTexture(wid) : undefined;
    let weapon = wid && tex ? { id: wid, tex, look: WEAPON_LOOK[wid] } : null;
    let spec: AttackSpec = weapon
      ? { ...f.spec.attack, kind: MOTION_KIND[weapon.look.motion] }
      : f.spec.attack;
    // a Spell from a hero who swings a blade is cast from the hand instead (one who casts already keeps the staff)
    if (motion?.spell && spec.kind !== 'shoot' && spec.kind !== 'throw' && spec.kind !== 'cast') {
      weapon = null;
      spec = { kind: 'cast', tint: motion.spellTint ?? spec.tint };
    }
    const kind = spec.kind;
    return kind === 'shoot' || kind === 'throw' || kind === 'cast'
      ? this.rangedAttack(f, t, dir, spec, weapon, onHit, spread)
      : this.meleeAttack(f, t, dir, spec, weapon, onHit, spread);
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
  ): boolean {
    const tex = fxFrames(id);
    if (!tex?.length) return false;
    const s = new Sprite(tex[0]);
    s.anchor.set(anchor[0], anchor[1]);
    s.position.set(at.x, at.y);
    const k = size / Math.max(1, tex[0]?.width ?? 1, tex[0]?.height ?? 1);
    s.scale.set((flip ? -1 : 1) * k, k);
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
    return true;
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
    spread: Fighter[] | null = null,
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
            f.root.zIndex = f.y + (f.spec.hover ? 1 : 0);
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
        // (no painted frames, say one of them failed to load: the drawn blow instead, so a hit never looks like nothing)
        // (the hit must always land, even if an effect fails to draw)
        try {
          if (spread) this.sweepFx(f, spread, dir, spec, weapon !== null);
          else if (!weapon || !this.meleeFrames(f, t, dir, spec)) this.meleeFx(f, t, dir, spec);
        } finally {
          onHit?.();
          resolve(); // the caller carries on at contact; the figure springs home on its own
        }
      });
      tl.to(f.body.scale, { x: 1.14, y: 0.84, duration: 0.07 });
      tl.to({}, { duration: 0.05 });
      tl.to(f.root, { x: f.x, duration: 0.4, ease: ease.pop.gsap });
      tl.to(f.body.scale, { x: 1, y: 1, duration: 0.4, ease: ease.pop.gsap }, '<');
      if (m.tilt) tl.to(f.body, { rotation: 0, y: 0, duration: 0.4, ease: ease.pop.gsap }, '<');
    });
  }

  /**
   * A rigged hero's attack: the strike clip plays where it stands (it steps into the thrust itself), and at its impact (0.41s) the blow
   * appears on the target and `onHit` runs, so the damage shows then and not when the card was played. Resolves at the impact.
   */
  private rigStrike(
    f: Fighter,
    rig: HeroSprite,
    t: Fighter | undefined,
    dir: number,
    onHit?: () => void,
    spread: Fighter[] | null = null,
    /** the weapon the card swings, for a model with its own clip for it (DECISIONS #715) */
    variant?: string,
  ): Promise<void> {
    // (a strike or aura still under way finishes first)
    return this.afterClip(rig).then(
      () =>
        new Promise((resolve) => {
          f.busy++;
          f.root.zIndex = 5000;
          let ended = false;
          const end = (): void => {
            if (ended) return;
            ended = true;
            f.busy--;
            if (!f.root.destroyed) f.root.zIndex = f.y + (f.spec.hover ? 1 : 0);
          };
          this.h.sound('attackWindup');
          const spec: AttackSpec = { ...f.spec.attack, kind: 'stab' };
          this.rigPlay(
            rig,
            'strike',
            {
              name: 'hit',
              within: 0.6,
              at: () => {
                this.h.sound('attackHit');
                try {
                  // (a figure taken off the stage meanwhile has nothing left to draw on)
                  if (!f.root.destroyed && this.all.get(f.spec.id) === f) {
                    if (spread) this.sweepFx(f, spread, dir, spec, true);
                    else if (!this.meleeFrames(f, t, dir, spec)) this.meleeFx(f, t, dir, spec);
                  }
                } finally {
                  onHit?.();
                  resolve();
                }
              },
            },
            end,
            variant,
          );
          // (the clip ends on its own; this only frees the figure if it never gets drawn to its end)
          this.track(gsap.delayedCall(1.4, end));
        }),
    );
  }

  /** The painted effect where a weapon blow lands: a burst of dust at the feet for a slam, sparks at the chest for a blade. */
  private meleeFrames(f: Fighter, t: Fighter | undefined, dir: number, spec: AttackSpec): boolean {
    const size = Math.max(120, Math.min(240, (t?.spec.height ?? 220) * 0.8));
    if (spec.kind === 'smash') {
      const feet = t ? { x: t.root.x, y: t.root.y } : { x: f.root.x + dir * 90, y: f.root.y };
      return this.frames('impact', feet, size * 1.2, false, [0.5, 0.82]);
    }
    const at = t ? this.chest(t) : { x: f.root.x + dir * 80, y: this.chest(f).y };
    return this.frames('spark', at, size);
  }

  /**
   * A blow that hits every enemy: one flat cut runs through them all, nearest first, with a streak along the line it follows
   * (and the painted sparks on each, with a weapon in hand).
   */
  private sweepFx(
    f: Fighter,
    foes: Fighter[],
    dir: number,
    spec: AttackSpec,
    painted: boolean,
  ): void {
    const c = this.fxCtx();
    const line = [...foes].sort((p, q) => Math.abs(p.x - f.x) - Math.abs(q.x - f.x));
    const at = line.map((x) => this.chest(x));
    const first = at[0];
    const last = at[at.length - 1];
    if (first && last)
      void streak(
        c,
        { x: first.x - dir * 90, y: first.y },
        { x: last.x + dir * 90, y: last.y },
        spec.tint,
        0.16,
        6,
      );
    line.forEach((x, i) => {
      const p = at[i]!;
      const size = Math.max(80, Math.min(160, x.spec.height * 0.6));
      slashArc(c, p, dir, spec.tint, { tilt: 0.1, size: size * 1.3, delay: i * 0.05 });
      this.track(
        gsap.delayedCall(i * 0.05, () => {
          burst(c, p, spec.tint, 6, 40);
          if (painted) this.frames('spark', p, size);
        }),
      );
    });
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
    spread: Fighter[] | null = null,
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
        // (on aim before it goes off: a shot leaves at about 0.08 into the beat)
        wt.to(held.sprite, { rotation: pose.aim, duration: 0.07, ease: ease.out.gsap }, 0);
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
          if (spread) {
            if (held && kind === 'throw') held.holder.alpha = 0;
            if (held && weapon?.look.motion === 'fire' && muzzle)
              this.frames('muzzle', muzzle, 150, dir < 0, [0.12, 0.5]);
            // (the hit lands when the last of them does, or in 1.5 s at the latest: the fight never waits on a lost tween)
            void Promise.race([
              this.spreadShot(f, spread, dir, spec, muzzle ?? from, held ? weapon : null),
              new Promise<void>((done) => setTimeout(done, 1500)),
            ])
              .catch(() => undefined)
              .then(() => {
                try {
                  this.h.sound('attackHit');
                } finally {
                  onHit?.();
                  resolve();
                }
              });
            return;
          }
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
                // (the hit lands whatever happens to the picture)
                try {
                  if (!k.destroyed) k.destroy();
                  this.frames('spark', to, 140);
                } finally {
                  land();
                }
              }),
            );
          } else if (kind === 'throw') {
            void thrownBlade(c, from, to, tint, Math.max(0.16, dist / 2400)).then(land);
          } else {
            void orb(c, muzzle ?? from, to, tint, Math.max(0.2, dist / 1800)).then(() => {
              try {
                if (held) this.frames('cast', to, 170);
              } finally {
                land();
              }
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

  /**
   * A ranged card that hits every enemy: a spell rains on each of them from above after a flare in the hand, a gun or a thrower
   * sends one shot or knife to each. Resolves when the last has landed.
   */
  private spreadShot(
    f: Fighter,
    foes: Fighter[],
    dir: number,
    spec: AttackSpec,
    from: Pt,
    weapon: Wielded | null,
  ): Promise<void> {
    const c = this.fxCtx();
    const { kind, tint } = spec;
    const runs = foes.map((x, i) => {
      const to = this.chest(x);
      const dist = Math.hypot(to.x - from.x, to.y - from.y);
      if (kind === 'cast') return skyfall(c, to, dir, tint, 0.08 + i * 0.07);
      if (kind === 'shoot')
        return streak(c, from, to, tint, Math.max(0.1, dist / 3800), 3).then(() =>
          burst(c, to, tint, 5, 30),
        );
      if (weapon) {
        const k = new Sprite(weapon.tex);
        k.anchor.set(0.5);
        k.scale.set(
          ((f.spec.height * weapon.look.size) / Math.max(1, weapon.tex.width)) * dir,
          (f.spec.height * weapon.look.size) / Math.max(1, weapon.tex.width),
        );
        k.position.set(from.x, from.y);
        k.zIndex = 6000;
        this.h.container.addChild(k);
        const time = Math.max(0.16, dist / 2400);
        return new Promise<void>((done) => {
          this.track(
            gsap.to(k, {
              x: to.x,
              y: to.y,
              rotation: dir * Math.PI * 4,
              duration: time,
              delay: i * 0.04,
              ease: 'none',
              onComplete: () => {
                try {
                  if (!k.destroyed) k.destroy();
                  this.frames('spark', to, 140);
                } finally {
                  done();
                }
              },
            }),
          );
        });
      }
      // (knives leave 40 ms apart, as with the weapon picture)
      return new Promise<void>((done) => {
        this.track(gsap.delayedCall(i * 0.04, done));
      })
        .then(() => thrownBlade(c, from, to, tint, Math.max(0.16, dist / 2400)))
        .then(() => burst(c, to, tint, 6, 36));
    });
    if (kind === 'cast') {
      puff(c, from, tint, 46, 0.22);
      ring(c, from, tint, 50, 50);
    }
    return Promise.all(runs).then(() => undefined);
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

  /**
   * A hero plays a card that is not an Attack (an Aura, a Skill, a Trap). A rigged hero raises its aura and this resolves at the
   * flare (0.29s), so what the card gives shows then; any other figure does `act` and it resolves at once.
   */
  cast(id: string, tintColor: string = color.goldLight): Promise<void> {
    const f = this.all.get(id);
    const rig = f?.rig;
    if (!f || !rig || f.dying || this.h.profile().still || rig.clip === 'death') {
      this.act(id, tintColor);
      return Promise.resolve();
    }
    // (a strike or aura still under way finishes first, so he never snaps from mid-lunge to rest)
    return this.afterClip(rig).then(
      () =>
        new Promise<void>((resolve) => {
          this.rigPlay(rig, 'aura', {
            name: 'aura',
            within: 0.45,
            at: () => {
              this.pulse(id, tintColor);
              resolve();
            },
          });
        }),
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
    if (f.rig) {
      // (it flinches behind its shield, flash and shake drawn by the rig; a strike or aura under way is not cut short)
      if (!this.h.profile().still && (f.rig.clip === 'idle' || f.rig.clip === 'hit'))
        this.rigPlay(f.rig, 'hit');
      return;
    }
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
    // a rigged hero falls and stays down (its last frame held), and this resolves as it lands
    if (f.rig && f.spec.isHero) return this.rigFall(f, f.rig);
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

  /** A rigged hero's death: the clip plays and holds its last frame; resolves at its 'land' moment (~1s), with a thud. */
  private rigFall(f: Fighter, rig: HeroSprite): Promise<void> {
    if (f.dying) return Promise.resolve();
    f.dying = true;
    gsap.killTweensOf([f.body, f.body.position, f.body.scale, f.root]);
    if (this.h.profile().still) {
      // (no motion: the last frame at once)
      rig.play('death');
      // (the runtime takes at most 1/20 s a step)
      for (let i = 0; i < 50; i++) rig.update(0.05);
      rig.render();
      this.h.wake?.(100);
      return Promise.resolve();
    }
    this.h.sound('death');
    return new Promise((resolve) => {
      this.rigPlay(rig, 'death', {
        name: 'land',
        within: 1.3,
        at: () => {
          this.h.sound('attackHit');
          resolve();
        },
      });
    });
  }

  /** Light a ring under the figures that can be targeted. */
  setTargetable(ids: ReadonlySet<string> | null): void {
    this.h.wake?.(150);
    for (const f of this.all.values()) {
      const on = ids?.has(f.spec.id) === true;
      if (f.targetable === on) continue;
      f.targetable = on;
      if (!on) this.track(gsap.to(f.ring, { alpha: 0, duration: 0.15, overwrite: true }));
    }
  }

  /** Emphasise one figure (the one under the pointer while aiming): it grows a little and its ring burns bright. */
  setHover(id: string | null): void {
    this.locked = id;
    this.h.wake?.(150);
    for (const f of this.all.values()) {
      const k = f.spec.id === id ? 1.05 : 1;
      if (f.busy === 0 && !f.dying)
        gsap.to(f.root.scale, { x: k, y: k, duration: 0.12, overwrite: true });
    }
  }

  tick(t: number, still: boolean): void {
    if (this.destroyed) return;
    // (on becoming still, every figure settles back to rest once instead of freezing mid-breath)
    if (still && !this.wasStill) this.settle();
    this.wasStill = still;
    const dt = this.lastT === null ? 0 : Math.max(0, Math.min(0.1, t - this.lastT));
    this.lastT = t;
    for (const f of this.all.values()) {
      if (f.rig) this.tickRig(f, f.rig, dt, still);
      if (f.targetable) {
        const lit = f.spec.id === this.locked;
        // (steady when nothing may move: reduced motion, or Low graphics, which draws the board only now and then)
        f.ring.alpha = lit ? 0.95 : still ? 0.55 : 0.32 + 0.3 * Math.sin(t * 5);
        const w = f.width * (lit ? 1.6 : 1.3);
        f.ring.scale.set(w / 128, (w * 0.4) / 128);
        f.ring.tint = lit ? 0xffe39a : 0xff4a6e;
      }
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
      // (a rig breathes in its own idle clip)
      if (!f.rig) f.sprite.scale.y = (f.spec.height / f.spec.canvas.height) * (1 + 0.014 * w);
      f.aura.alpha = (f.spec.isHero ? 0.2 : 0.1) + 0.06 * Math.sin(t * 1.9 + f.phase);
      if (f.prop?.visible && f.spec.prop) {
        const k = f.spec.height / f.spec.canvas.height;
        f.prop.y = (f.spec.prop.y - f.spec.canvas.height) * k + Math.sin(t * 1.8 + f.phase) * 7 * k;
        f.prop.rotation = Math.sin(t * 1.1 + f.phase) * 0.05;
      }
    }
  }

  private wasStill = false;
  private lastT: number | null = null;
  /** the fight is over (finish was called): a rig that arrives late is not put on */
  private ended = false;

  /**
   * One frame of a rig: it moves at the game's own pace (the speed setting and its hit-stop holds are gsap's time scale, which the
   * fallbacks in rigPlay follow too), its canvas follows the board's density and the current clip's frame, and it is drawn. Nothing
   * moves while the tab is hidden; when the board must hold still (reduced motion, Low graphics) only a clip a card started plays
   * on, and the idle pose holds.
   */
  private tickRig(f: Fighter, rig: HeroSprite, dt: number, still: boolean): void {
    if (typeof document !== 'undefined' && document.hidden) return;
    // (and a video model's fade from a clip back to the idle runs to its end, or the clip's last frame would stay over the idle)
    const moving = !still || (rig.clip !== 'idle' && !rig.finished) || !!rig.fading;
    if (moving) rig.update(dt * gsap.globalTimeline.timeScale());
    // (after the update: a clip that just began or ended gets its own frame before it is drawn; a new canvas is drawn by fitRig)
    this.fitRig(f, rig);
    if (moving) rig.render();
  }

  /** Every figure at rest: the idle breathing and a flyer's bob at their middle. */
  private settle(): void {
    for (const f of this.all.values()) {
      if (f.dying || f.busy > 0) continue;
      const hover = f.spec.hover ?? 0;
      if (hover) {
        f.air.y = -hover;
        f.contact.alpha = 0.32;
        f.shadow.alpha = 0.3;
      }
      if (!f.rig) f.sprite.scale.y = f.spec.height / f.spec.canvas.height;
      f.aura.alpha = f.spec.isHero ? 0.2 : 0.1;
      if (f.prop && f.spec.prop) {
        const k = f.spec.height / f.spec.canvas.height;
        f.prop.y = (f.spec.prop.y - f.spec.canvas.height) * k;
        f.prop.rotation = 0;
      }
    }
    this.h.wake?.(100);
  }

  /** The fight ended: the loser crumples, the winner stands tall. */
  finish(winner: FighterSide | 'draw' | null): void {
    if (winner !== null) this.ended = true;
    for (const f of this.all.values()) {
      if (winner === null || f.dying) continue;
      if (f.spec.isHero && winner !== 'draw' && f.spec.side !== winner && f.rig) {
        // (a rigged hero falls in its death clip and stays down)
        void this.rigFall(f, f.rig);
        continue;
      }
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
    // (each rig's own GL context is let go)
    for (const f of this.all.values()) f.rig?.dispose();
    this.all.clear();
  }
}
