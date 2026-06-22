// tower.js — Corporate Climb world assets (FAMILY B sharp-cubic, lib/prims palette).
// The vertical analogue of sky-leap's skyruins: instead of floating pillars along a
// forward rail, we stack office "desk ledges" up a tower, with a parallax glass
// facade behind and a rising LAYOFF TIDE (shredded pink-slip flood) below.
import * as THREE from 'three';
import { P, box, darken } from '../lib/prims.js';

// ── desk-ledge colour motif marching UP the tower. Muted corporate neutrals so the
//    single teal accent (and the gold executive floors) reads as the only saturate. ──
export const DESK_TONES = [
  darken(P.slate, 0.92), darken(P.steel, 0.78), P.panelD, darken(P.woodD, 1.0),
  P.stoneD, darken(P.blue, 0.46),
];

// Executive gold tone kicks in on the high floors (the C-suite glows).
const GOLD = 0xb8923a, GOLD_TOP = 0xd8b24c;

// ── one desk ledge the hero lands on. A chunky cantilevered slab (top the hero
//    stands on) + a front modesty panel + a little monitor + paper stack so each
//    rung reads as an actual workstation, not a blank box. `tier` (0..1) pushes the
//    high floors toward executive gold + glass. Returns a group whose userData
//    carries the accent mesh for the landing flash. ──
export function deskSlab(half, tone, idx, tier = 0){
  const g = new THREE.Group();
  const W = half * 2, D = 1.15, TOPH = 0.24;
  const exec = tier > 0.62;
  const top = exec ? GOLD_TOP : tone;
  const body = exec ? GOLD : darken(tone, 0.8);

  // desktop slab — top sits at y=0 (hero stands here)
  g.add(box(W, TOPH, D, top, 0, -TOPH / 2, 0));
  // front modesty panel (faces the camera, +z)
  g.add(box(W - 0.12, 0.62, 0.1, body, 0, -TOPH - 0.31, D / 2 - 0.06));
  // two stub legs
  g.add(box(0.16, 0.7, 0.16, darken(body, 0.7), -W / 2 + 0.22, -TOPH - 0.35, -D / 2 + 0.2));
  g.add(box(0.16, 0.7, 0.16, darken(body, 0.7),  W / 2 - 0.22, -TOPH - 0.35, -D / 2 + 0.2));

  // teal accent edge strip on the front lip — the one saturate (flashes on landing)
  const accentHex = exec ? P.gold : P.accent;
  const accent = box(W - 0.06, 0.07, 0.04, accentHex, 0, -0.04, D / 2 + 0.005,
    { e: accentHex, ei: 0.0 });
  g.add(accent);

  // a back-left monitor (dark screen w/ faint glow) + paper stack on the right —
  // workstation props so the desk reads instantly.
  const monX = -W / 2 + 0.34;
  g.add(box(0.46, 0.34, 0.05, P.ironD, monX, 0.2, -D / 2 + 0.18));        // screen
  g.add(box(0.36, 0.24, 0.02, exec ? 0x2a3a2a : 0x12303a, monX, 0.2, -D / 2 + 0.21,
    { e: exec ? 0x2f6f3a : 0x1d6f8a, ei: 0.5 }));                          // glow panel
  g.add(box(0.12, 0.14, 0.12, darken(P.ironM, 0.9), monX, 0.02, -D / 2 + 0.2)); // stand
  // paper stack
  g.add(box(0.3, 0.12, 0.36, P.white, W / 2 - 0.34, 0.06, -D / 2 + 0.34));
  g.add(box(0.28, 0.04, 0.34, P.panel, W / 2 - 0.34, 0.16, -D / 2 + 0.34));

  g.traverse(o => { if (o.isMesh){ o.castShadow = true; o.receiveShadow = true; } });
  g.userData.accentMesh = accent;
  g.userData.accentBase = accentHex;
  return g;
}

// ── one facade STOREY — a single row of office windows for the wall behind the play
//    column. The game spawns/recycles these keyed to ABSOLUTE world height (like the
//    desk rungs) so the wall never pops in and naturally VARIES with altitude:
//    low floors = cool blue-glass offices, mid = warm lit cubicles, high = gold
//    executive lobbies, plus the occasional dark mechanical/setback floor for rhythm.
//    `idx` is the absolute storey index; STOREY_H is the vertical pitch. ──
export const STOREY_H = 1.62;
const FAC_COLS = 8, FAC_CW = 1.02, FAC_GAPX = 0.16, FAC_CH = 1.2;
export const FACADE_W = FAC_COLS * (FAC_CW + FAC_GAPX);

// deterministic pseudo-random from an integer (no Math.random — keeps a storey stable
// across rebuilds and lets the look depend purely on height)
function hash(n){ const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); }

export function facadeStorey(idx){
  const g = new THREE.Group();
  const tier = Math.max(0, Math.min(1, idx / 56));     // 0 ground → 1 penthouse (~storey 56)
  const mechanical = (idx > 4 && idx % 9 === 0);        // periodic dark service floor
  // glass tint shifts up the tower: slate-blue → teal → warm gold
  const glass = mechanical ? 0x161d26
    : tier < 0.45 ? 0x223044
    : tier < 0.78 ? 0x214038
    : 0x3a3220;
  // lit-window warmth + how many are lit (busy mid-floors glow most)
  const litCol = tier > 0.78 ? 0xffd676 : tier > 0.45 ? 0xffcaa0 : 0x9fd0ee;
  const litRate = mechanical ? 0.06 : tier < 0.45 ? 0.28 : tier < 0.78 ? 0.5 : 0.34;
  const frame = tier > 0.78 ? 0x6b5320 : 0x141d29;

  for (let c = 0; c < FAC_COLS; c++){
    const x = (c - (FAC_COLS - 1) / 2) * (FAC_CW + FAC_GAPX);
    const lit = hash(idx * 31.7 + c * 7.3) < litRate;
    const col = lit ? litCol : glass;
    g.add(box(FAC_CW, FAC_CH, 0.12, col, x, 0, 0,
      lit ? { e: col, ei: tier > 0.78 ? 1.1 : 0.85, r: 0.6 } : { r: 0.5 }));
  }
  // floor slab band beneath the windows + a thin sill above
  g.add(box(FACADE_W + 0.5, 0.16, 0.18, frame, 0, -FAC_CH / 2 - STOREY_H * 0.18, 0.02));
  g.add(box(FACADE_W + 0.3, 0.05, 0.16, frame, 0, FAC_CH / 2 + 0.06, 0.02));
  // gold cornice ribs on executive floors
  if (tier > 0.82) g.add(box(FACADE_W + 0.7, 0.1, 0.22, 0xc8a23a, 0, -FAC_CH / 2 - STOREY_H * 0.18, 0.06, { e: 0xc8a23a, ei: 0.5 }));

  g.position.y = idx * STOREY_H;
  g.traverse(o => { if (o.isMesh){ o.castShadow = false; o.receiveShadow = false; o.frustumCulled = false; } });
  g.userData.idx = idx;
  return g;
}

// ── the LAYOFF TIDE — a churning flood of red HR doom rising from below. A wide
//    emissive slab body + a jagged top edge of "shredded pink-slip" teeth that the
//    game jitters each frame. Anchored at its TOP edge (y=0) so the game can place
//    it by tideY directly. ──
export function layoffTide(width = 26){
  const g = new THREE.Group();
  const BODY_H = 40;
  // main body (deep angry red, slightly emissive so it glows under the bloom)
  const body = box(width, BODY_H, 8, 0x8c1020, 0, -BODY_H / 2, 0, { e: 0x6a0a18, ei: 0.45, o: 0.94 });
  body.material.transparent = true;
  g.add(body);
  // brighter hot surface line just under the teeth
  g.add(box(width, 0.22, 8.2, 0xe23a4a, 0, -0.18, 0, { e: 0xff5a4a, ei: 1.1 }));
  // jagged shredded-paper teeth along the top edge — the game animates their y
  const TEETH = 30, tw = width / TEETH;
  const teeth = [];
  for (let i = 0; i < TEETH; i++){
    const x = (i - (TEETH - 1) / 2) * tw;
    const t = box(tw * 0.92, 0.5, 8.1, 0xc01f30, x, 0.12, 0, { e: 0xff4a52, ei: 0.7 });
    g.add(t);
    teeth.push(t);
  }
  g.userData.teeth = teeth;
  g.traverse(o => { if (o.isMesh){ o.castShadow = false; o.frustumCulled = false; } });
  return g;
}
