// Writes the chaingun's `paints` and `parts` into chaingun.model.json, keeping its `empties` and `spin`
// as they are. Run: node games/demo_audio/assets/guns/chaingun.model.mjs
// A side module: a cradle on the mount pad (x 0..0.18), the gun along +z round the axis x 0.35, y 0.
// The `barrels` piece (six barrels, their clamps and the muzzle ring) is what `spin` turns, so all of
// it is round the axis and its middle lies on it.
import { readFileSync, writeFileSync } from 'node:fs'
import { solids } from '../solids.mjs'

const file = new URL('./chaingun.model.json', import.meta.url)
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
  rubber: { colour: '#232323', roughness: 0.92, metalness: 0.05 },
  cable: { colour: '#2a2a2a', roughness: 0.6, metalness: 0.4 },
  hazard: { colour: '#d9a521', roughness: 0.55, metalness: 0.25 },
  brass: { colour: '#b8893a', roughness: 0.4, metalness: 0.8 },
  marker: { colour: '#ffb547', roughness: 0.3, metalness: 0, glow: 1.2 },
}

const X = 0.35
const B = 'body'
const S = 'barrels'
const box = (paint, cx, cy, hx, hy, z0, z1, node = B) => parts.push({ node, paint, loft: { axis: 'z', from: z0, to: z1, a: [cx, cy, hx, hy] } })
const tube = (paint, cx, cy, r0, r1, z0, z1, sides = 8, node = B) => parts.push({ node, paint, prism: { axis: 'z', from: z0, to: z1, at: [cx, cy], r: [r0, r1], sides } })

// ---- cradle: a base plate on the pad, two cheeks up to the trunnion, a pin through ----
parts.push({ node: B, paint: 'hullDark', loft: { axis: 'x', from: 0.17, to: 0.19, a: [0, 0.05, 0.17, 0.25] } })
parts.push({ node: B, paint: 'trim', loft: { axis: 'x', from: 0.168, to: 0.17, a: [0, 0.05, 0.15, 0.23] } })
for (const z of [-0.15, 0.25]) for (const y of [-0.13, 0.13]) parts.push({ node: B, paint: 'chrome', prism: { axis: 'x', from: 0.19, to: 0.2, at: [y, z], r: [0.014, 0.012], sides: 6 } })
parts.push({ node: B, paint: 'joint', loft: { axis: 'x', from: 0.19, to: 0.21, a: [-0.03, 0.05, 0.1, 0.15], b: [-0.03, 0.05, 0.08, 0.13] } })
parts.push({ node: B, paint: 'hazard', loft: { axis: 'x', from: 0.19, to: 0.2, a: [0.155, 0.05, 0.006, 0.18] } })
parts.push({ node: B, paint: 'hazard', loft: { axis: 'x', from: 0.19, to: 0.2, a: [-0.155, 0.05, 0.006, 0.18] } })

// ---- receiver: the main housing, stepped, with a top rail and side seams ----
box('hull', X, 0, 0.15, 0.15, -0.22, 0.32)
parts.push({ node: B, paint: 'hull', loft: { axis: 'z', from: 0.32, to: 0.42, a: [X, 0, 0.15, 0.15], b: [X, 0, 0.13, 0.13] } })
parts.push({ node: B, paint: 'hullDark', loft: { axis: 'z', from: -0.25, to: -0.22, a: [X, 0, 0.13, 0.13], b: [X, 0, 0.15, 0.15] } })
box('plate', X, 0.155, 0.12, 0.012, -0.18, 0.36)
box('plate', X + 0.155, 0, 0.012, 0.12, -0.18, 0.3)
box('plate', X - 0.155, 0, 0.012, 0.12, -0.18, 0.3)
box('trim', X, 0.168, 0.025, 0.006, -0.16, 0.34)
for (const z of [-0.12, -0.04, 0.04, 0.12, 0.2, 0.28]) box('trim', X, 0.174, 0.03, 0.008, z, z + 0.025)
for (const s of [1, -1]) {
  box('trim', X + 0.168 * s, 0.06, 0.004, 0.004, -0.18, 0.3)
  box('trim', X + 0.168 * s, -0.06, 0.004, 0.004, -0.18, 0.3)
  for (const z of [-0.14, 0.24]) for (const y of [-0.09, 0.09]) parts.push({ node: B, paint: 'chrome', prism: { axis: 'x', from: X + 0.165 * s, to: X + 0.175 * s, at: [y, z], r: [0.01, 0.01], sides: 6 } })
}
box('hazard', X + 0.168, -0.02, 0.004, 0.02, 0.0, 0.12)
box('marker', X + 0.172, 0.11, 0.004, 0.012, 0.3, 0.34)
// under-slung sight/sensor block
box('hullDark', X, -0.17, 0.07, 0.03, -0.1, 0.2)
box('trim', X, -0.2, 0.05, 0.006, -0.08, 0.18)

// ---- motor housing at the back, a drum with cooling fins, a cable to the cradle ----
tube('steel', X, 0, 0.11, 0.11, -0.4, -0.25, 12)
for (const z of [-0.38, -0.34, -0.3]) tube('trim', X, 0, 0.12, 0.12, z, z + 0.015, 12)
tube('joint', X, 0, 0.08, 0.06, -0.44, -0.4, 12)
tube('chrome', X, 0, 0.03, 0.03, -0.46, -0.44, 8)
parts.push({ node: B, paint: 'cable', prism: { axis: 'x', from: 0.19, to: X - 0.08, at: [-0.08, -0.33], r: [0.018, 0.018], sides: 6 } })

// ---- belt feed: a box on the outboard flank, a belt chute curving up into the receiver top ----
box('hullDark', X + 0.0, 0.24, 0.1, 0.075, -0.2, 0.12)
box('plate', X + 0.0, 0.318, 0.09, 0.006, -0.18, 0.1)
box('trim', X - 0.1, 0.24, 0.006, 0.07, -0.2, 0.12)
box('trim', X + 0.1, 0.24, 0.006, 0.07, -0.2, 0.12)
box('hazard', X + 0.104, 0.27, 0.004, 0.02, -0.15, 0.05)
parts.push({ node: B, paint: 'chrome', loft: { axis: 'x', from: X - 0.03, to: X + 0.03, a: [0.326, -0.04, 0.008, 0.03] } })
// the belt: a run of rounds over the box lid into the feed throat
for (let i = 0; i < 6; i++) {
  const z = 0.13 + i * 0.035
  const y = 0.24 - i * 0.012
  parts.push({ node: B, paint: 'brass', prism: { axis: 'x', from: X - 0.05, to: X + 0.05, at: [y, z], r: [0.013, 0.013], sides: 6 } })
  parts.push({ node: B, paint: 'cable', loft: { axis: 'z', from: z - 0.016, to: z + 0.016, a: [X, y - 0.016, 0.06, 0.004] } })
}
box('joint', X, 0.18, 0.07, 0.03, 0.32, 0.38)

// ---- front bearing and barrel support housing (fixed) ----
tube('hullDark', X, 0, 0.14, 0.13, 0.42, 0.52, 12)
tube('trim', X, 0, 0.145, 0.145, 0.45, 0.47, 12)
tube('joint', X, 0, 0.1, 0.1, 0.52, 0.56, 12)

// ---- the spinning cluster: centre spindle, six barrels, clamp rings, muzzle ring ----
tube('steel', X, 0, 0.035, 0.035, 0.56, 1.36, 8, S)
const R = 0.07
for (let i = 0; i < 6; i++) {
  const a = (i / 6) * Math.PI * 2
  const cx = X + Math.cos(a) * R
  const cy = Math.sin(a) * R
  tube('steel', cx, cy, 0.024, 0.024, 0.56, 0.75, 8, S)
  tube('joint', cx, cy, 0.021, 0.021, 0.75, 1.36, 8, S)
  tube('chrome', cx, cy, 0.018, 0.018, 1.36, 1.4, 8, S)
  tube('trim', cx, cy, 0.009, 0.009, 1.4, 1.401, 8, S)
}
tube('hull', X, 0, 0.11, 0.11, 0.56, 0.62, 12, S)
tube('plate', X, 0, 0.105, 0.105, 0.86, 0.9, 12, S)
tube('trim', X, 0, 0.108, 0.108, 0.875, 0.885, 12, S)
tube('plate', X, 0, 0.102, 0.102, 1.12, 1.16, 12, S)
tube('hull', X, 0, 0.106, 0.11, 1.3, 1.36, 12, S)
tube('trim', X, 0, 0.112, 0.112, 1.32, 1.335, 12, S)

model.paints = paints
model.parts = parts
writeFileSync(file, solids.write({ paints: model.paints, empties: model.empties, spin: model.spin, parts: model.parts }))
console.log(`chaingun: ${parts.length} parts`)
