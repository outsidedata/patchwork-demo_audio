// Writes the point defense's `paints` and `parts` into pd.model.json, keeping its `empties` as they are.
// Run: node games/demo_audio/assets/guns/pd.model.mjs
// A top module: a turret ring from y 0.12, a yoke rising from it, a small head between the yoke arms
// at y 0.33 with a sensor eye on top and twin short barrels ending at the `muzzle` empty (z 0.36).
import { readFileSync, writeFileSync } from 'node:fs'
import { solids } from '../solids.mjs'

const file = new URL('./pd.model.json', import.meta.url)
const model = JSON.parse(readFileSync(file, 'utf8'))
const { parts, both } = solids()

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
  eye: { colour: '#ff3a2a', roughness: 0.15, metalness: 0.2, glow: 1.6 },
  lens: { colour: '#7fd4ff', roughness: 0.15, metalness: 0.2, glow: 0.6 },
}

const B = 'body'
const up = (paint, y0, y1, r0, r1, sides = 12, at = [0, 0]) => parts.push({ node: B, paint, prism: { axis: 'y', from: y0, to: y1, at, r: [r0, r1], sides } })
const box = (paint, cx, cy, hx, hy, z0, z1, b) => parts.push({ node: B, paint, loft: { axis: 'z', from: z0, to: z1, a: [cx, cy, hx, hy], ...(b ? { b } : {}) } })
const tube = (paint, cx, cy, r0, r1, z0, z1, sides = 8) => parts.push({ node: B, paint, prism: { axis: 'z', from: z0, to: z1, at: [cx, cy], r: [r0, r1], sides } })

// ---- turret ring: base flange, bolts, hazard band, slewing ring ----
up('hullDark', 0.12, 0.15, 0.145, 0.14)
for (let i = 0; i < 8; i++) {
  const a = (i / 8) * Math.PI * 2 + Math.PI / 8
  up('chrome', 0.15, 0.158, 0.009, 0.007, 6, [Math.cos(a) * 0.125, Math.sin(a) * 0.125])
}
up('hazard', 0.15, 0.165, 0.115, 0.115)
up('joint', 0.165, 0.19, 0.11, 0.105)
up('trim', 0.19, 0.195, 0.1, 0.1)
up('hull', 0.195, 0.23, 0.105, 0.095)

// ---- yoke: two arms rising either side of the head, trunnion caps ----
both(s => [
  { node: B, paint: 'hull', loft: { axis: 'y', from: 0.22, to: 0.37, a: [0.09 * s, 0, 0.018, 0.06], b: [0.09 * s, 0.01, 0.015, 0.045] } },
  { node: B, paint: 'trim', loft: { axis: 'y', from: 0.23, to: 0.35, a: [0.109 * s, 0, 0.002, 0.03] } },
  { node: B, paint: 'joint', prism: { axis: 'x', from: 0.065 * s, to: 0.115 * s, at: [0.33, 0], r: [0.03, 0.03], sides: 10 } },
  { node: B, paint: 'chrome', prism: { axis: 'x', from: 0.115 * s, to: 0.122 * s, at: [0.33, 0], r: [0.016, 0.016], sides: 8 } },
])
parts.push({ node: B, paint: 'cable', prism: { axis: 'y', from: 0.23, to: 0.3, at: [0.06, -0.05], r: [0.008, 0.008], sides: 6 } })

// ---- head: a wedge housing between the arms ----
box('hull', 0, 0.33, 0.07, 0.05, -0.09, 0.08)
box('hull', 0, 0.33, 0.07, 0.05, 0.08, 0.13, [0, 0.325, 0.06, 0.035])
box('hullDark', 0, 0.33, 0.06, 0.04, -0.1, -0.09)
box('plate', 0, 0.383, 0.06, 0.004, -0.07, 0.09)
box('trim', 0, 0.388, 0.05, 0.002, 0.0, 0.01)
box('trim', 0, 0.388, 0.05, 0.002, -0.04, -0.03)
box('hazard', 0, 0.282, 0.05, 0.003, 0.06, 0.1)
box('marker', 0.04, 0.34, 0.03, 0.006, -0.105, -0.1)

// ---- sensor eye on top, offset: housing, glowing lens ----
box('hullDark', -0.03, 0.4, 0.025, 0.018, -0.02, 0.08)
tube('trim', -0.03, 0.4, 0.016, 0.016, 0.08, 0.09, 10)
tube('eye', -0.03, 0.4, 0.011, 0.011, 0.09, 0.093, 10)
box('lens', 0.03, 0.392, 0.012, 0.006, 0.07, 0.08)

// ---- twin short barrels: shroud collars, barrels, flash hiders ----
for (const x of [0.025, -0.025]) {
  tube('joint', x, 0.33, 0.022, 0.022, 0.13, 0.17, 8)
  tube('steel', x, 0.33, 0.015, 0.014, 0.17, 0.33, 8)
  tube('trim', x, 0.33, 0.019, 0.019, 0.24, 0.255, 8)
  tube('chrome', x, 0.33, 0.018, 0.018, 0.33, 0.36, 6)
  tube('trim', x, 0.33, 0.008, 0.008, 0.36, 0.361, 6)
}

model.paints = paints
model.parts = parts
writeFileSync(file, solids.write({ paints: model.paints, empties: model.empties, parts: model.parts }))
console.log(`pd: ${parts.length} parts`)
