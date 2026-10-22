// Writes the beam laser's `paints` and `parts` into beamlaser.model.json, keeping its `empties` (the
// muzzle) as they are. Run: node games/demo_audio/assets/guns/beamlaser.model.mjs
// It hangs on a side mount (class L): the node's origin is the torso's side, the pad's face 0.18 out in
// x, and the gun runs forward along z: a cradle bolted to the pad, a power box, a focusing tube in a
// stack of heat-sink rings, stepped lens rings, and a square shroud with the emitter's glow deep inside
// it, the muzzle empty at its mouth.
import { readFileSync, writeFileSync } from 'node:fs'
import { solids } from '../solids.mjs'

const file = new URL('./beamlaser.model.json', import.meta.url)
const model = JSON.parse(readFileSync(file, 'utf8'))
const { parts } = solids()

const paints = {
  hull: { colour: '#8a9299', roughness: 0.62, metalness: 0.35 },
  plate: { colour: '#9ba3a9', roughness: 0.55, metalness: 0.4 },
  hullDark: { colour: '#5b636b', roughness: 0.66, metalness: 0.35 },
  trim: { colour: '#1d2023', roughness: 0.7, metalness: 0.2 },
  joint: { colour: '#3a3f45', roughness: 0.5, metalness: 0.6 },
  steel: { colour: '#5f6b78', roughness: 0.5, metalness: 0.55 },
  chrome: { colour: '#c8ccd0', roughness: 0.22, metalness: 0.9 },
  cable: { colour: '#2a2a2a', roughness: 0.6, metalness: 0.4 },
  hazard: { colour: '#d9a521', roughness: 0.55, metalness: 0.25 },
  marker: { colour: '#ffb547', roughness: 0.3, metalness: 0, glow: 1.2 },
}

const N = 'body'
// a box from corner to corner, along z; `b` an optional far-end rectangle for a chamfer
const box = (paint, x0, x1, y0, y1, z0, z1, b) =>
  parts.push({ node: N, paint, loft: { axis: 'z', from: z0, to: z1, a: [(x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2], ...(b ? { b } : {}) } })
const tube = (paint, axis, from, to, at, r0, r1, sides) => parts.push({ node: N, paint, prism: { axis, from, to, at, r: [r0, r1], sides } })

const cx = 0.36 // the bore's x, the muzzle's
const cy = 0 // the bore's y

// ---- cradle: base plate on the pad, bolts, trunnion block ----
box('hullDark', 0.18, 0.21, -0.2, 0.2, -0.26, 0.3)
for (const y of [-0.16, 0.16]) for (const z of [-0.22, 0.03, 0.26]) tube('chrome', 'x', 0.21, 0.222, [y, z], 0.016, 0.014, 6)
box('joint', 0.21, 0.255, -0.12, 0.12, -0.2, 0.22)
tube('joint', 'x', 0.205, 0.26, [0, 0.01], 0.15, 0.15, 12)
tube('steel', 'x', 0.26, 0.27, [0, 0.01], 0.07, 0.06, 8)
// gussets from the plate up under the power box
for (const z of [-0.2, 0.18]) box('hullDark', 0.21, 0.27, -0.19, -0.13, z, z + 0.035)

// ---- power box: chamfered rear, armour cap, rear panel ----
box('hull', 0.26, 0.5, -0.2, 0.18, -0.29, 0.07)
box('hull', 0.29, 0.47, -0.17, 0.15, -0.325, -0.29, [0.38, -0.01, 0.12, 0.19])
box('plate', 0.28, 0.48, 0.18, 0.205, -0.26, 0.04, [0.38, 0.1925, 0.09, 0.0125])
box('plate', 0.5, 0.515, -0.16, 0.14, -0.25, 0.03)
// seams on the armour cap and the side plate
box('trim', 0.37, 0.39, 0.2, 0.208, -0.24, 0.02)
box('trim', 0.512, 0.518, -0.03, -0.02, -0.24, 0.02)
// lift lugs
for (const z of [-0.2, -0.02]) box('joint', 0.36, 0.4, 0.2, 0.235, z, z + 0.04)
// rear panel: trim face, vent slots, a recessed status lamp
box('trim', 0.31, 0.45, -0.14, 0.12, -0.335, -0.325)
for (const y of [-0.11, -0.08, -0.05, -0.02, 0.01]) box('steel', 0.32, 0.4, y, y + 0.015, -0.34, -0.335)
box('trim', 0.415, 0.445, 0.075, 0.105, -0.345, -0.335)
box('marker', 0.42, 0.44, 0.08, 0.1, -0.342, -0.338)
// hazard chevrons along the outer side
for (let i = 0; i < 6; i++) box(i % 2 ? 'trim' : 'hazard', 0.515, 0.52, -0.13, -0.09, -0.24 + i * 0.04, -0.2 + i * 0.04)

// ---- focusing tube and heat-sink stack ----
tube('hull', 'z', 0.07, 0.6, [cx, cy], 0.145, 0.14, 10)
tube('joint', 'z', 0.06, 0.1, [cx, cy], 0.175, 0.175, 10)
for (let z = 0.12; z < 0.47; z += 0.04) tube('steel', 'z', z, z + 0.014, [cx, cy], 0.19, 0.19, 10)
tube('joint', 'z', 0.48, 0.52, [cx, cy], 0.175, 0.17, 10)
// tie rods through the fins
for (const [j, k] of [[cx + 0.165, 0.04], [cx + 0.165, -0.04], [cx, -0.165], [cx - 0.12, -0.12]]) tube('chrome', 'z', 0.09, 0.51, [j, k], 0.011, 0.011, 6)

// ---- stepped lens rings ----
tube('joint', 'z', 0.6, 0.66, [cx, cy], 0.165, 0.16, 12)
tube('steel', 'z', 0.66, 0.72, [cx, cy], 0.13, 0.13, 12)
tube('trim', 'z', 0.72, 0.745, [cx, cy], 0.145, 0.145, 12)
tube('steel', 'z', 0.745, 0.8, [cx, cy], 0.118, 0.118, 12)
tube('joint', 'z', 0.8, 0.83, [cx, cy], 0.13, 0.13, 12)
tube('hull', 'z', 0.83, 0.9, [cx, cy], 0.105, 0.1, 12)
tube('trim', 'z', 0.9, 0.925, [cx, cy], 0.12, 0.12, 12)
// adjuster screws on the lens rings
for (const k of [-1, 1]) tube('chrome', 'y', k > 0 ? 0.13 : -0.13, k > 0 ? 0.15 : -0.15, [cx, 0.69], 0.012, 0.012, 6)
tube('chrome', 'x', cx + 0.13, cx + 0.15, [0, 0.77], 0.012, 0.012, 6)

// ---- shroud: four armour plates round the emitter, the glow deep inside ----
const s0 = 0.925
const s1 = 1.04
box('hullDark', cx - 0.11, cx + 0.11, 0.085, 0.11, s0, s1)
box('hullDark', cx - 0.11, cx + 0.11, -0.11, -0.085, s0, s1)
box('hullDark', cx - 0.11, cx - 0.085, -0.085, 0.085, s0, s1)
box('hullDark', cx + 0.085, cx + 0.11, -0.085, 0.085, s0, s1)
// a black lip at the mouth
box('trim', cx - 0.115, cx + 0.115, 0.105, 0.115, s1 - 0.02, s1)
box('trim', cx - 0.115, cx + 0.115, -0.115, -0.105, s1 - 0.02, s1)
box('trim', cx - 0.115, cx - 0.105, -0.105, 0.105, s1 - 0.02, s1)
box('trim', cx + 0.105, cx + 0.115, -0.105, 0.105, s1 - 0.02, s1)
// inside: a black liner, the lens bezel, and the emitter's glow recessed 7 cm
tube('trim', 'z', s0, s0 + 0.02, [cx, cy], 0.085, 0.085, 12)
tube('chrome', 'z', s0 + 0.02, 0.955, [cx, cy], 0.065, 0.06, 12)
tube('marker', 'z', 0.955, 0.968, [cx, cy], 0.045, 0.04, 12)

// ---- coolant lines over the top, elbows into the power box and the first lens ring ----
for (const x of [cx - 0.06, cx + 0.06]) {
  box('steel', x - 0.025, x + 0.025, 0.2, 0.255, -0.2, -0.15)
  tube('cable', 'z', -0.15, 0.6, [x, 0.232], 0.018, 0.018, 8)
  box('steel', x - 0.025, x + 0.025, 0.155, 0.255, 0.6, 0.65)
  for (const z of [0.1, 0.3, 0.5]) box('joint', x - 0.026, x + 0.026, 0.205, 0.255, z, z + 0.02)
}
// power feed under the box from the cradle
tube('cable', 'z', -0.24, 0.1, [cx, -0.215], 0.022, 0.022, 8)
box('steel', cx - 0.035, cx + 0.035, -0.24, -0.19, 0.08, 0.13)
tube('cable', 'y', -0.22, -0.13, [cx, 0.105], 0.02, 0.02, 8)

writeFileSync(file, solids.write({ paints, ...model, paints, parts }))
console.log(`beamlaser: ${parts.length} parts`)
