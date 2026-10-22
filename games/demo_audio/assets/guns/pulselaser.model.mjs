// Writes the pulse laser's `paints` and `parts` into pulselaser.model.json, keeping its `empties` (the
// muzzle) as they are. Run: node games/demo_audio/assets/guns/pulselaser.model.mjs
// It hangs on a side mount (class R, the small pad): the pad's face is 0.18 out in x and the gun runs
// forward along z: a cradle bolted to the pad, a chunky capacitor bank with four capacitor cans, a ring
// of charge coils, and a stubby emitter whose glow sits back inside its shroud, the muzzle at its mouth.
import { readFileSync, writeFileSync } from 'node:fs'
import { solids } from '../solids.mjs'

const file = new URL('./pulselaser.model.json', import.meta.url)
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
const box = (paint, x0, x1, y0, y1, z0, z1, b) =>
  parts.push({ node: N, paint, loft: { axis: 'z', from: z0, to: z1, a: [(x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2], ...(b ? { b } : {}) } })
const tube = (paint, axis, from, to, at, r0, r1, sides) => parts.push({ node: N, paint, prism: { axis, from, to, at, r: [r0, r1], sides } })

const cx = 0.34 // the bore's x, the muzzle's

// ---- cradle on the small pad ----
box('hullDark', 0.18, 0.205, -0.14, 0.14, -0.14, 0.14)
for (const y of [-0.11, 0.11]) for (const z of [-0.11, 0.11]) tube('chrome', 'x', 0.205, 0.217, [y, z], 0.013, 0.011, 6)
box('joint', 0.205, 0.235, -0.09, 0.09, -0.12, 0.12)
tube('joint', 'x', 0.2, 0.24, [0, 0], 0.1, 0.1, 10)

// ---- capacitor bank: chamfered block, armour cap, side cans ----
box('hull', 0.23, 0.45, -0.13, 0.12, -0.17, 0.2)
box('hull', 0.25, 0.43, -0.11, 0.1, -0.2, -0.17, [0.34, -0.005, 0.11, 0.125])
box('hull', 0.25, 0.43, -0.11, 0.1, 0.2, 0.23)
box('plate', 0.24, 0.44, 0.12, 0.14, -0.14, 0.17, [0.34, 0.13, 0.08, 0.01])
box('trim', 0.33, 0.35, 0.135, 0.145, -0.12, 0.15)
// four capacitor cans standing on the outer face and underside
for (const z of [-0.12, -0.02, 0.08]) {
  tube('steel', 'x', 0.45, 0.48, [-0.05, z + 0.04], 0.04, 0.04, 10)
  tube('chrome', 'x', 0.48, 0.488, [-0.05, z + 0.04], 0.028, 0.028, 10)
}
for (const z of [-0.13, 0.03]) tube('steel', 'y', -0.13, -0.16, [cx, z + 0.05], 0.05, 0.05, 10)
// rear panel: vents and a recessed charge lamp
box('trim', 0.27, 0.41, -0.09, 0.08, -0.208, -0.2)
for (const y of [-0.07, -0.045, -0.02, 0.005]) box('steel', 0.28, 0.36, y, y + 0.013, -0.212, -0.208)
box('trim', 0.375, 0.4, 0.045, 0.07, -0.216, -0.208)
box('marker', 0.38, 0.395, 0.05, 0.065, -0.214, -0.21)
// hazard band on the outer face
for (let i = 0; i < 4; i++) box(i % 2 ? 'trim' : 'hazard', 0.45, 0.455, 0.05, 0.09, -0.14 + i * 0.035, -0.105 + i * 0.035)
// feed cables from the cradle into the bank
tube('cable', 'z', -0.16, 0.18, [0.3, -0.145], 0.016, 0.016, 8)
box('steel', 0.28, 0.32, -0.16, -0.12, 0.17, 0.2)

// ---- charge coils: a ring of windings round the core ----
tube('joint', 'z', 0.23, 0.27, [cx, 0], 0.115, 0.115, 12)
tube('steel', 'z', 0.27, 0.5, [cx, 0], 0.06, 0.06, 10)
for (let z = 0.28; z < 0.48; z += 0.032) {
  tube('chrome', 'z', z, z + 0.018, [cx, 0], 0.1, 0.1, 12)
  tube('joint', 'z', z + 0.018, z + 0.032, [cx, 0], 0.085, 0.085, 12)
}
// four spine rods holding the coil ring
for (const [j, k] of [[cx + 0.105, 0], [cx - 0.105, 0], [cx, 0.105], [cx, -0.105]]) tube('hullDark', 'z', 0.25, 0.5, [j, k], 0.016, 0.016, 6)
tube('joint', 'z', 0.48, 0.52, [cx, 0], 0.115, 0.11, 12)

// ---- stubby emitter and shroud ----
tube('hull', 'z', 0.52, 0.6, [cx, 0], 0.085, 0.08, 10)
tube('trim', 'z', 0.6, 0.615, [cx, 0], 0.09, 0.09, 10)
const s0 = 0.615
const s1 = 0.73
box('hullDark', cx - 0.08, cx + 0.08, 0.06, 0.08, s0, s1)
box('hullDark', cx - 0.08, cx + 0.08, -0.08, -0.06, s0, s1)
box('hullDark', cx - 0.08, cx - 0.06, -0.06, 0.06, s0, s1)
box('hullDark', cx + 0.06, cx + 0.08, -0.06, 0.06, s0, s1)
box('trim', cx - 0.085, cx + 0.085, 0.075, 0.085, s1 - 0.015, s1)
box('trim', cx - 0.085, cx + 0.085, -0.085, -0.075, s1 - 0.015, s1)
tube('trim', 'z', s0, s0 + 0.015, [cx, 0], 0.06, 0.06, 10)
tube('chrome', 'z', s0 + 0.015, 0.655, [cx, 0], 0.045, 0.04, 10)
tube('marker', 'z', 0.655, 0.665, [cx, 0], 0.03, 0.027, 10)

writeFileSync(file, solids.write({ paints, ...model, paints, parts }))
console.log(`pulselaser: ${parts.length} parts`)
