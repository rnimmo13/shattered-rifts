/* eslint-disable */
// Vendored from assets-src/heroes/sun-knight-2d/runtime/knight_anims.js, wrapped as an ES module (see knight2d.js). Logic unchanged.
const scope = {};
/* Sun Knight 2D — animation clips. Times in seconds; distances in illustration pixels (knight ~1320 px tall).
 * Arms are authored as WORLD angles of each segment (deg, 0 = pointing right, 90 = down) so a pose reads directly:
 *   arm(upper, fore, sword)  for the sword arm,  shield(upper, fore, hand) for the shield arm.
 * Feet are IK targets: offsets of each ankle from its rest position (+x forward, +y down), a = foot tilt (deg).
 */
(function (global) {
  'use strict';
  const U0 = 155.8, F0 = 54.4, S0 = -41.0;      // rest world angles: upper arm, forearm, sword
  const FU0 = 80.9, FF0 = 4.4;                  // shield arm rest
  const arm = (u, f, s) => ({ n_shoulder: { w: u - U0 }, n_elbow: { w: f - F0 }, n_wrist: { w: s - S0 } });
  const shield = (u, f, hd = 0) => ({ f_shoulder: { w: u - FU0 }, f_elbow: { w: f - FF0 }, f_hand: { r: hd } });
  const P = (o) => {                            // build a pose: {hips:{x,y,r}, waist, chest, neck, arm:[..], sh:[..], n:{}, f:{}, fx:{}}
    const b = {};
    if (o.root) b.root = o.root;
    if (o.hips) b.hips = o.hips;
    if (o.waist) b.waist = { r: o.waist };
    if (o.chest !== undefined) b.chest = typeof o.chest === 'number' ? { r: o.chest } : o.chest;
    if (o.neck !== undefined) b.neck = { r: o.neck };
    Object.assign(b, arm(...(o.arm || [U0, F0, S0])), shield(...(o.sh || [FU0, FF0, 0])));
    if (o.bones) Object.assign(b, o.bones);
    return { bones: b, feet: { n: o.n || {}, f: o.f || {} }, fx: o.fx || {} };
  };
  const REST = { arm: [U0, F0, S0], sh: [FU0, FF0, 0] };
  const K = (t, ease, o) => ({ t, ease, pose: P(o) });

  const clips = {};

  // ---------------------------------------------------------------- IDLE: guarded breathing loop
  clips.idle = {
    loop: true, duration: 2.6,
    keys: [
      K(0, 'sine', { ...REST }),
      K(1.3, 'sine', { hips: { x: -3, y: 9 }, waist: 0.8, chest: { r: -1.4, sy: 1.012, sx: 1.006 }, neck: 1.8,
        arm: [157.0, 57.5, -38.0], sh: [82.6, 6.5, -1.5] }),
      K(2.6, 'sine', { ...REST }),
    ],
  };

  // ---------------------------------------------------------------- STRIKE: passing lunge + stab (right arm, right leg)
  // Passing lunge. The right (near) leg starts behind, swings through and plants far forward with the knee over the
  // ankle; the left (far) leg stays planted and straightens behind. The pelvis twists (hip pivots slide toward
  // each other) so the legs open into a clean lunge instead of crossing.
  const TW = (n, f) => ({ n_hip: { x: n }, f_hip: { x: f } });
  clips.strike = {
    duration: 1.16, next: 'idle',
    events: [{ t: 0.41, fx: 'impact', name: 'hit' }],
    keys: [
      K(0, 'inOut', { ...REST }),
      // wind-up: sink back onto the rear leg, draw the blade back to the hip with the point levelled
      K(0.22, 'inOut', { hips: { x: -45, y: 26, r: -2 }, waist: -3, chest: -6, neck: 4,
        arm: [128, 22, -6], sh: [62, -10, -4], n: { x: -10 }, f: { x: 0 } }),
      // right foot leaves the ground and turns to point forward as it starts to swing
      K(0.28, 'in2', { hips: { x: 60, y: 30, r: 1 }, waist: 1, chest: 1, neck: 1, bones: TW(30, -20),
        arm: [104, 14, -4], sh: [56, -18, -4], n: { x: 230, y: -90, a: 4 }, f: { x: 0 }, fx: { trail: 0.4, nfwd: 1 } }),
      // passing: the right foot swings past the planted left foot, knee driving forward
      K(0.34, 'linear', { hips: { x: 170, y: 40, r: 2 }, waist: 3, chest: 5, neck: -2, bones: TW(70, -50),
        arm: [80, 10, -2], sh: [50, -26, -4], n: { x: 560, y: -105, a: -6 }, f: { x: -10, y: -14, a: 10 }, fx: { trail: 0.7, nfwd: 1 } }),
      // plant + full extension (impact): front shin vertical, toe pointing at the target, back leg long with the
      // heel up and the weight on the ball of the foot
      K(0.41, 'out', { hips: { x: 330, y: 90, r: 4 }, waist: 5, chest: 9, neck: -5, bones: TW(140, -60),
        arm: [22, 3, 1], sh: [42, -32, -6], n: { x: 882, y: 0, a: 0 }, f: { x: -229, y: -43, a: 22 }, fx: { trail: 1, nfwd: 1 } }),
      K(0.55, 'out', { hips: { x: 338, y: 96, r: 5 }, waist: 5, chest: 10, neck: -5, bones: TW(142, -62),
        arm: [18, 1, 2], sh: [42, -34, -6], n: { x: 882, y: 0, a: 0 }, f: { x: -229, y: -43, a: 22 }, fx: { trail: 0, nfwd: 1 } }),
      // recover: push off the front foot, it lifts and comes back past the left leg
      K(0.78, 'inOut', { hips: { x: 150, y: 40, r: 1 }, waist: 1, chest: 2, neck: 0, bones: TW(60, -45),
        arm: [118, 40, -26], sh: [66, -16, -2], n: { x: 470, y: -90, a: 0 }, f: { x: -40, y: -10, a: 8 }, fx: { nfwd: 1 } }),
      K(0.88, 'inOut', { hips: { x: 40, y: 22 }, chest: 0, neck: 1, bones: TW(15, -10), arm: [150, 50, -34], sh: [78, 2, 0],
        n: { x: 120, y: -50, a: 0 }, f: { x: 0 }, fx: { nfwd: 0 } }),
      K(0.98, 'out', { hips: { x: -8, y: 12 }, chest: -1, neck: 1, arm: [158, 56, -39], sh: [81, 5, 0], n: { x: 0 }, f: { x: 0 } }),
      K(1.16, 'inOut', { ...REST }),
    ],
  };

  // ---------------------------------------------------------------- AURA: crouch, explosive sword-to-sky
  clips.aura = {
    duration: 1.5, next: 'idle',
    events: [{ t: 0.29, fx: 'aura', name: 'aura' }],
    keys: [
      K(0, 'inOut', { ...REST }),
      K(0.17, 'inOut', { hips: { x: -12, y: 46, r: 2 }, waist: 3, chest: 7, neck: 8,
        arm: [132, 92, 24], sh: [96, 18, 4], f: { x: 0 } }),
      K(0.29, 'outBack', { hips: { x: 4, y: -12, r: -2 }, waist: -4, chest: { r: -9, sy: 1.02 }, neck: -12,
        arm: [-100, -95, -91], sh: [68, -24, -6], n: { x: 35 }, fx: { rim: 0.75, aura: 1, pillar: 1, glow: 1, white: 0.18 } }),
      K(0.45, 'inOut', { hips: { x: 2, y: -8, r: -2 }, waist: -3, chest: { r: -8, sy: 1.015 }, neck: -10,
        arm: [-102, -96, -91], sh: [70, -22, -6], n: { x: 35 }, fx: { rim: 0.55, aura: 1, pillar: 0.75, glow: 0.9, flutter: 0.6 } }),
      K(1.0, 'inOut', { hips: { x: 0, y: -6, r: -2 }, waist: -2, chest: { r: -7, sy: 1.01 }, neck: -9,
        arm: [-101, -95, -90], sh: [71, -20, -5], n: { x: 35 }, fx: { rim: 0.35, aura: 0.6, pillar: 0.25, glow: 0.5, flutter: 0.4 } }),
      K(1.28, 'inOut', { hips: { x: -4, y: 10 }, chest: -1, neck: 2, arm: [160, 62, -34], sh: [82, 6, 0], n: { x: 0 },
        fx: { rim: 0.1, aura: 0.1, glow: 0.1 } }),
      K(1.5, 'inOut', { ...REST }),
    ],
  };

  // ---------------------------------------------------------------- HIT: take the blow behind the shield
  clips.hit = {
    duration: 0.75, next: 'idle',
    events: [{ t: 0.0, fx: 'hit', name: 'hit' }],
    keys: [
      K(0, 'out', { ...REST }),
      K(0.07, 'out', { root: { x: -46 }, hips: { y: 22, r: -3 }, waist: -3, chest: -7, neck: -9,
        arm: [170, 76, -18], sh: [44, -52, -12], n: { x: 6 }, f: { x: 0 } }),
      K(0.22, 'out', { root: { x: -34 }, hips: { y: 30, r: 1 }, waist: 2, chest: 4, neck: 10,
        arm: [168, 72, -15], sh: [40, -56, -12] }),
      K(0.48, 'inOut', { root: { x: -10 }, hips: { y: 14 }, chest: 1, neck: 4, arm: [161, 62, -30], sh: [66, -16, -5] }),
      K(0.75, 'inOut', { ...REST }),
    ],
  };

  // ---------------------------------------------------------------- DEATH: recoil, buckle, fall backward
  clips.death = {
    duration: 2.2,
    events: [{ t: 0.0, fx: 'hit', name: 'hit' }, { t: 0.98, fx: 'thud', k: 24, at: [[540, 470, 'chest'], [560, 820, 'hips'], [430, 560, 'n_wrist']], name: 'land' },
      { t: 1.22, fx: 'shake', k: 5 }],
    keys: [
      K(0, 'out', { ...REST }),
      // recoil from the killing blow
      K(0.08, 'out', { root: { x: -35 }, hips: { y: 10, r: -6 }, waist: -6, chest: -14, neck: -18,
        arm: [196, 130, 40], sh: [112, 60, 12] }),
      // stagger a step back, knees going
      K(0.36, 'inOut', { root: { x: -50 }, hips: { x: -70, y: 50, r: -12 }, waist: -8, chest: -16, neck: -12,
        arm: [185, 150, 90], sh: [78, -6, 8], n: { x: -80 }, f: { x: -50 } }),
      // topple: gravity takes over (accelerating), arms lag behind the falling body
      K(0.60, 'in2', { root: { x: -50 }, hips: { x: -150, y: 150, r: -38 }, waist: -10, chest: -14, neck: -8,
        arm: [170, 160, 140], sh: [60, 20, 10], n: { x: -60 }, f: { x: -40 }, fx: { shieldBehind: 1 } }),
      K(0.86, 'in', { root: { x: -50 }, hips: { x: -210, y: 290, r: -78 }, waist: -6, chest: -6, neck: -4,
        arm: [150, 172, 168], sh: [-40, -30, 0], n: { x: 420, y: -60, a: -50 }, f: { x: -20, y: -30, a: -40 },
        bones: { pauldron: { x: 50 }, f_hand: { w: 70, sx: 0.55 } }, fx: { shieldBehind: 1, tabHang: 0.5, shadowW: 250 } }),
      // impact
      K(0.98, 'in', { root: { x: -50 }, hips: { x: -220, y: 335, r: -88 }, waist: -3, chest: -3, neck: -12,
        arm: [176, 182, 178], sh: [-30, -12, 0], n: { x: 650, y: 84, a: -80 }, f: { x: -32, y: 22, a: -70 },
        bones: { pauldron: { x: 70 }, f_hand: { w: 90, sx: 0.36, y: 30 } }, fx: { shieldBehind: 1, tabHang: 0.45, shadowW: 420 } }),
      // bounce + settle (armour weight)
      K(1.10, 'out', { root: { x: -50 }, hips: { x: -221, y: 314, r: -86 }, waist: -4, chest: -5, neck: -16,
        arm: [172, 177, 170], sh: [-34, -16, 0], n: { x: 650, y: 52, a: -74 }, f: { x: -32, y: 0, a: -64 },
        bones: { pauldron: { x: 70 }, f_hand: { w: 90, sx: 0.36, y: 30 } }, fx: { shieldBehind: 1, tabHang: 0.45, shadowW: 420 } }),
      K(1.24, 'in2', { root: { x: -50 }, hips: { x: -220, y: 335, r: -88 }, waist: -3, chest: -3, neck: -13,
        arm: [176, 182, 179], sh: [-30, -12, 0], n: { x: 650, y: 84, a: -80 }, f: { x: -32, y: 22, a: -70 },
        bones: { pauldron: { x: 70 }, f_hand: { w: 90, sx: 0.36, y: 30 } }, fx: { shieldBehind: 1, tabHang: 0.45, shadowW: 420 } }),
      K(2.2, 'linear', { root: { x: -50 }, hips: { x: -220, y: 335, r: -88 }, waist: -3, chest: -3, neck: -14,
        arm: [176, 182, 179], sh: [-30, -12, 0], n: { x: 650, y: 84, a: -80 }, f: { x: -32, y: 22, a: -70 },
        bones: { pauldron: { x: 70 }, f_hand: { w: 90, sx: 0.36, y: 30 } }, fx: { shieldBehind: 1, tabHang: 0.45, shadowW: 420 } }),
    ],
  };

  global.KNIGHT_CLIPS = clips;
})(scope);

export const KNIGHT_CLIPS = scope.KNIGHT_CLIPS;
