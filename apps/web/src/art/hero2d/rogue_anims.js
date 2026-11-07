/* eslint-disable */
// Copied from assets-src/heroes/rogue-2d/runtime/rogue_anims.js by apps/web/scripts/sync-hero-rigs.mjs (do not edit here: edit the source and run it).
// The original attaches ROGUE_CLIPS to window; this copy runs the same code against a private scope object and exports them.
const scope = {};
/* Rogue (assassin) 2D — animation clips for Hero2D. Times in seconds, distances in illustration px (rogue ~1500 px tall).
 * Arms are authored as WORLD angles of each segment (deg, 0 = right, 90 = down):
 *   near(upper, fore, dagger) — the low arm with the reverse-grip dagger,
 *   far(upper, fore, hand)    — the raised arm the floating dagger hovers over.
 * Feet are IK targets: ankle offsets from rest (+x toward the enemy, +y down), a = foot tilt.
 * The floating dagger is its own bone ('float', child of the far hand); 'w' sets its world angle, sx/sy 0 hides it.
 */
(function (global) {
  'use strict';
  const NU = 112.7, NF = 108.4, ND = 115.6;     // rest world angles, near arm
  const FU = 42.9, FF = -15.5, FH = -60.7;      // far arm
  const near = (u, f, d) => ({ n_shoulder: { w: u - NU }, n_elbow: { w: f - NF }, n_wrist: { w: d - ND } });
  const far = (u, f, h) => ({ f_shoulder: { w: u - FU }, f_elbow: { w: f - FF }, f_hand: { w: h - FH } });
  const P = o => {
    const b = {};
    if (o.root) b.root = o.root;
    if (o.hips) b.hips = o.hips;
    if (o.waist !== undefined) b.waist = { r: o.waist };
    if (o.chest !== undefined) b.chest = typeof o.chest === 'number' ? { r: o.chest } : o.chest;
    if (o.neck !== undefined) b.neck = { r: o.neck };
    Object.assign(b, near(...(o.near || [NU, NF, ND])), far(...(o.far || [FU, FF, FH])));
    if (o.float) b.float = o.float;
    if (o.bones) Object.assign(b, o.bones);
    return { bones: b, feet: { n: o.n || {}, f: o.f || {} }, fx: o.fx || {} };
  };
  const K = (t, ease, o) => ({ t, ease, pose: P(o) });
  const REST = {};
  const clips = {};

  // ------------------------------------------------------------ IDLE: loose, cocky stance; the dagger hovers and bobs
  clips.idle = {
    loop: true, duration: 2.4,
    keys: [
      K(0, 'sine', { float: { y: 0, r: 0 } }),
      K(1.2, 'sine', { hips: { x: 2, y: 8 }, waist: 0.6, chest: { r: -1.2, sy: 1.012, sx: 1.005 }, neck: 2,
        near: [114, 110, 117], far: [41, -18, -63], float: { y: -18, r: 5 } }),
      K(2.4, 'sine', { float: { y: 0, r: 0 } }),
    ],
  };

  // ------------------------------------------------------------ STRIKE: commanded dagger. The floating dagger never
  // touches his hand. He cocks the hand back beside his head while the dagger turns on its own to aim, then thrusts the
  // open hand out at the enemy and the dagger launches in a straight line. Arm moves stay small and snappy so the
  // painted arm never has to bend far from how it was drawn.
  const REL = { ax: 150, ay: 150 };         // where the dagger hangs, ahead of his hand, while it aims
  const TGT = { ax: 1060, ay: 290 };        // impact point (offset from the dagger's rest position)
  const AIM = 116 + Math.atan2(TGT.ay - REL.ay, TGT.ax - REL.ax) * 180 / Math.PI;   // world rotation pointing at TGT
  const aimed = (o = {}) => ({ abs: 1, wa: AIM, ...REL, ...o });
  const COCK = [72, -58, -88], THRUST = [16, 2, -24];
  clips.strike = {
    duration: 1.05, next: 'idle',
    events: [{ t: 0.3, fx: 'puff', name: 'launch' }, { t: 0.39, fx: 'impact', name: 'hit' }, { t: 0.64, fx: 'puff', name: 'reform' }],
    keys: [
      K(0, 'inOut', {}),
      // cock: weight settles back, the hand pulls in beside his head; the dagger swings round to aim and slides out ahead
      K(0.17, 'inOut', { hips: { x: -26, y: 16, r: -2 }, waist: -2, chest: { r: -7 }, neck: 5,
        near: [106, 100, 108], far: COCK, float: aimed(), n: { x: -8 }, f: { x: -4, y: -8, a: 4 } }),
      // short hold while the dagger draws back a hair, charging
      K(0.24, 'inOut', { hips: { x: -32, y: 20, r: -3 }, waist: -3, chest: { r: -9 }, neck: 6,
        near: [104, 98, 106], far: [COCK[0] + 3, COCK[1] - 3, COCK[2] - 2], float: aimed({ ax: 138, ay: 146 }),
        n: { x: -10 }, f: { x: -4, y: -10, a: 4 } }),
      // thrust: hips and chest drive forward, the open hand shoots out at the target
      K(0.3, 'in2', { hips: { x: 30, y: 12, r: 2 }, waist: 3, chest: { r: 7 }, neck: -3,
        near: [122, 118, 124], far: THRUST, float: aimed(), n: { x: 8 }, f: { x: 50, y: 0 }, fx: { trail4: 1 } }),
      // the dagger flies on command, straight and point first; the hand holds out with a slight overshoot
      K(0.39, 'linear', { hips: { x: 42, y: 15, r: 2 }, waist: 3, chest: { r: 8 }, neck: -4,
        near: [124, 120, 126], far: [THRUST[0] - 4, THRUST[1] - 2, THRUST[2] - 4], float: { abs: 1, wa: AIM, ...TGT },
        n: { x: 12 }, f: { x: 60, y: 0 }, fx: { trail: 1 } }),
      K(0.4, 'hold', { hips: { x: 42, y: 15, r: 2 }, waist: 3, chest: { r: 8 }, neck: -4,
        near: [124, 120, 126], far: [THRUST[0] - 4, THRUST[1] - 2, THRUST[2] - 4], float: { abs: 1, wa: AIM, ...TGT, sx: 0, sy: 0 },
        n: { x: 12 }, f: { x: 60 } }),
      K(0.56, 'inOut', { hips: { x: 34, y: 12, r: 1 }, waist: 2, chest: { r: 5 }, neck: -2,
        near: [120, 116, 122], far: THRUST, float: { sx: 0, sy: 0 }, n: { x: 10 }, f: { x: 48 } }),
      K(0.78, 'outBack', { hips: { x: 6, y: 3 }, chest: 0, far: [42, -15, -60], float: { sx: 1, sy: 1 }, n: { x: 0 }, f: { x: 0 } }),
      K(1.05, 'inOut', {}),
    ],
  };

  // ------------------------------------------------------------ AURA: gather, then fling the arm skyward; the dagger spins
  clips.aura = {
    duration: 1.45, next: 'idle',
    events: [{ t: 0.3, fx: 'aura', name: 'aura' }],
    keys: [
      K(0, 'inOut', {}),
      K(0.16, 'inOut', { hips: { x: -6, y: 40, r: 2 }, waist: 3, chest: 7, neck: 7,
        near: [104, 96, 110], far: [80, 160, 120], float: { r: -20 } }),
      K(0.3, 'outBack', { hips: { x: 0, y: -14, r: -2 }, waist: -3, chest: { r: -8, sy: 1.02 }, neck: -12,
        near: [140, 135, 150], far: [-12, -40, -72], float: { r: 180, y: -30 },
        fx: { rim: 0.35, aura: 1, glow: 1, white: 0.06 } }),
      K(0.65, 'linear', { hips: { x: 0, y: -10, r: -2 }, waist: -3, chest: { r: -8, sy: 1.015 }, neck: -11,
        near: [140, 135, 150], far: [-13, -41, -74], float: { r: 540, y: -40 }, fx: { rim: 0.28, aura: 1, glow: 0.9, flutter: 0.5 } }),
      K(1.0, 'out', { hips: { x: 0, y: -6, r: -1 }, waist: -2, chest: { r: -6, sy: 1.01 }, neck: -9,
        near: [138, 132, 146], far: [-11, -39, -72], float: { r: 720, y: -30 }, fx: { rim: 0.15, aura: 0.6, glow: 0.5, flutter: 0.3 } }),
      K(1.25, 'inOut', { hips: { y: 8 }, chest: -1, neck: 2, far: [44, -14, -60], float: { r: 720 }, fx: { aura: 0.1, glow: 0.1 } }),
      K(1.45, 'inOut', { float: { r: 720 } }),
    ],
  };

  // ------------------------------------------------------------ HIT: the blow lands from the right. Instant snap back with
  // the head whipping, a short freeze (hit-stop), the throwing arm jerks in to cover, then a hunched rebound and a glare.
  const SNAP = { root: { x: -58 }, hips: { x: -10, y: 26, r: -7 }, waist: -6, chest: { r: -16, sx: 0.97 }, neck: -22,
    near: [128, 140, 150], far: [150, 172, 195], float: { abs: 1, ax: -12, ay: 8, wa: 22 }, n: { x: -8 }, f: { x: -40, y: -10, a: 4 } };
  clips.hit = {
    duration: 0.8, next: 'idle',
    events: [{ t: 0.0, fx: 'hit', name: 'hit' }],
    keys: [
      K(0, 'out', {}),
      K(0.045, 'out', SNAP),
      K(0.1, 'linear', { ...SNAP, root: { x: -64 }, neck: -24, float: { abs: 1, ax: -18, ay: 14, wa: 30 } }),
      // rebound: hunches forward over the hit, head down, glaring
      K(0.26, 'out', { root: { x: -40 }, hips: { x: 4, y: 34, r: 2 }, waist: 3, chest: { r: 7, sx: 1 }, neck: 12,
        near: [112, 104, 112], far: [120, 120, 140], float: { abs: 1, ax: -34, ay: 22, wa: 8 }, n: { x: 0 }, f: { x: -30, a: 0 } }),
      K(0.5, 'inOut', { root: { x: -14 }, hips: { y: 12 }, chest: 1, neck: 4, near: [114, 110, 118], far: [56, 8, -45], float: { abs: 0.25, ax: -14, ay: 10, wa: -3 } }),
      K(0.8, 'inOut', {}),
    ],
  };

  // ------------------------------------------------------------ DEATH: the killing blow snaps him back and the dagger
  // shatters; he staggers two steps, his knees go, and he topples backward, lands, bounces once and goes still.
  const lie = { root: { x: -60 }, hips: { x: -300, y: 640, r: -88 }, waist: -2, chest: -2, neck: -10,
    bones: { coatL1: { r: -40, sx: 0.5 }, coatL2: { r: -12, sx: 0.65 }, coatR1: { r: 28, sx: 0.6 }, coatR2: { r: 10, sx: 0.7 }, sash1: { r: 20 } },
    near: [168, 176, 186], far: [15, 5, 10], float: { sx: 0, sy: 0 },
    n: { x: 592, y: 72, a: -4 }, f: { x: -60, y: 60, a: -16 }, fx: { tabHang: 0, shadowW: 380 } };
  clips.death = {
    duration: 2.4,
    events: [{ t: 0.0, fx: 'hit', name: 'hit' }, { t: 0.06, fx: 'puff', name: 'dagger_shatters' },
      { t: 1.06, fx: 'thud', k: 22, at: [[60, 1565, 'root'], [420, 1565, 'root']], name: 'land' }, { t: 1.3, fx: 'shake', k: 5 }],
    keys: [
      K(0, 'out', {}),
      // recoil, bigger than a normal hit
      K(0.06, 'out', { root: { x: -60 }, hips: { x: -10, y: 20, r: -9 }, waist: -8, chest: { r: -20, sx: 0.97 }, neck: -26,
        near: [150, 175, 190], far: [10, -40, -70], float: { r: 60, sx: 0.3, sy: 0.3 }, f: { x: -40, y: -20 } }),
      K(0.12, 'linear', { root: { x: -66 }, hips: { x: -12, y: 22, r: -10 }, waist: -8, chest: { r: -21, sx: 0.97 }, neck: -27,
        near: [152, 177, 192], far: [8, -42, -72], float: { sx: 0, sy: 0 }, f: { x: -40, y: -20 } }),
      // stagger: the front foot steps back past the other...
      K(0.36, 'inOut', { root: { x: -80 }, hips: { x: -70, y: 40, r: -8 }, waist: -6, chest: -14, neck: -12,
        near: [140, 160, 175], far: [40, 10, -20], float: { sx: 0, sy: 0 }, n: { x: -60 }, f: { x: -190, y: -60, a: 6 } }),
      K(0.5, 'out', { root: { x: -80 }, hips: { x: -130, y: 56, r: -10 }, waist: -6, chest: -12, neck: -8,
        near: [138, 150, 170], far: [50, 30, 0], float: { sx: 0, sy: 0 }, n: { x: -70 }, f: { x: -230, y: 0, a: 0 } }),
      // ...the knees give out and he sinks
      K(0.74, 'in2', { root: { x: -80 }, hips: { x: -150, y: 250, r: -10 }, waist: 2, chest: { r: 8 }, neck: 20,
        near: [118, 108, 120], far: [80, 75, 60], float: { sx: 0, sy: 0 }, n: { x: 40, y: 0 }, f: { x: -230, y: 0, a: 0 } }),
      // topple backward, gathering speed; the arms trail behind the body
      K(0.92, 'in2', { root: { x: -70 }, hips: { x: -230, y: 470, r: -50 }, waist: -4, chest: -8, neck: -4,
        near: [175, 165, 165], far: [30, 10, 0], float: { sx: 0, sy: 0 }, n: { x: 300, y: -40, a: -20 }, f: { x: -250, y: -30, a: -10 },
        bones: { coatL1: { r: -20, sx: 0.8 } }, fx: { tabHang: 0.4 } }),
      K(1.06, 'in', lie),
      // bounce: the shoulders lift a touch and fall again; the head and arm settle a beat later
      K(1.18, 'out', { ...lie, hips: { x: -302, y: 612, r: -85 }, neck: -16, near: [160, 168, 176], n: { x: 592, y: 50, a: -2 } }),
      K(1.32, 'in2', { ...lie, neck: -8 }),
      K(1.5, 'inOut', { ...lie, neck: -12, near: [172, 180, 190] }),
      K(2.4, 'linear', { ...lie, neck: -12, near: [172, 180, 190] }),
    ],
  };
  global.ROGUE_CLIPS = clips;
})(scope);

export const ROGUE_CLIPS = scope.ROGUE_CLIPS;
