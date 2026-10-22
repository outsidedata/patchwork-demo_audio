// Writes the missiles module's `paints` and `parts` into missiles.model.json, keeping its `empties` (and
// any spin, show or lights) as they are. Run: node games/demo_audio/assets/guns/missiles.model.mjs
// A side (R) module: drawn for +x from the pad face at x 0.18, mirrored by its node on the right, +z
// forward. A long armoured box of three cells in a row, each door swung up open over its cell so the
// missile's nose cone shows, the middle one on the muzzle empty [0.36, 0, 0.6].
import { readFileSync, writeFileSync } from 'node:fs'
import { solids } from '../solids.mjs'

const file = new URL('./missiles.model.json', import.meta.url)
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
  marker: { colour: '#ffb547', roughness: 0.3, metalness: 0, glow: 1.2 },
}

const N = 'body'
const box = (paint, c, h, b) => ({ node: N, paint, loft: { axis: 'z', from: c[2] - h[2], to: c[2] + h[2], a: [c[0], c[1], h[0], h[1]], ...(b ? { b: [c[0], c[1], b[0], b[1]] } : {}) } })
const rod = (paint, axis, from, to, at, r, sides = 8) => ({ node: N, paint, prism: { axis, from, to, at, r: Array.isArray(r) ? r : [r, r], sides } })

const cx = 0.36
const zb = -0.33 // the box's back
const zf = 0.47 // its front, where the cell frame starts
const cells = [cx - 0.105, cx, cx + 0.105]

// ---- cradle: plate on the pad, a rail saddle the box slides on, its locking bolts ----
parts.push(box('steel', [0.19, 0, 0.02], [0.01, 0.125, 0.16]))
for (const y of [-0.095, 0.095]) for (const z of [-0.11, 0.15]) parts.push(rod('chrome', 'x', 0.2, 0.212, [y, z], 0.013, 6))
parts.push(box('joint', [0.21, 0, 0.02], [0.012, 0.07, 0.2]))
for (const y of [-0.085, 0.085]) parts.push(box('hullDark', [0.212, y, 0.04], [0.008, 0.012, 0.36]))
parts.push(rod('steel', 'x', 0.2, 0.226, [0, 0.02], 0.055, 10))
parts.push(box('cable', [0.213, -0.07, -0.22], [0.01, 0.01, 0.08]))

// ---- the box ----
parts.push(box('hullDark', [0.226, 0, 0.07], [0.006, 0.118, 0.39]))
parts.push(box('hull', [cx, 0, (zb + zf) / 2], [0.155, 0.115, (zf - zb) / 2]))
// reinforcing ribs round it
for (const z of [-0.2, 0.0, 0.2, 0.38]) parts.push(box('hullDark', [cx, 0, z], [0.161, 0.121, 0.012]))
// tapered rear cap with the blast vents the motors exhaust through, and an umbilical
parts.push(box('hullDark', [cx, 0, zb - 0.015], [0.15, 0.11, 0.015], [0.138, 0.098]))
for (const x of cells) {
  parts.push(box('trim', [x, 0, zb - 0.032], [0.04, 0.07, 0.003]))
  for (let i = 0; i < 4; i++) parts.push(box('steel', [x, -0.05 + i * 0.033, zb - 0.036], [0.038, 0.004, 0.003]))
}
parts.push(rod('joint', 'z', zb - 0.03, zb - 0.05, [cx - 0.12, 0.08], 0.022, 8))
parts.push(box('cable', [0.25, 0.08, zb - 0.04], [0.02, 0.01, 0.01]))

// top: a long access hatch with its hinge, seams, a rail and a stencil
parts.push(box('plate', [cx, 0.118, 0.03], [0.14, 0.006, 0.32], [0.136, 0.006]))
parts.push(rod('joint', 'z', -0.26, 0.32, [cx + 0.14, 0.126], 0.01, 8))
for (const z of [-0.1, 0.1, 0.3]) parts.push(box('trim', [cx, 0.125, z], [0.13, 0.002, 0.003]))
parts.push(box('hullDark', [cx - 0.12, 0.128, 0.04], [0.01, 0.008, 0.3]))
for (let i = 0; i < 5; i++) parts.push(box(i % 2 ? 'trim' : 'hazard', [cx - 0.02 + i * 0.03, 0.125, -0.24], [0.015, 0.002, 0.025]))
parts.push(box('marker', [cx + 0.13, 0.128, -0.3], [0.01, 0.004, 0.01]))

// bottom skid
parts.push(box('hullDark', [cx, -0.12, 0.07], [0.13, 0.006, 0.36]))

// outer armour: three bolted panels, seams, a warning stencil
for (const [z, h] of [[-0.25, 0.07], [-0.0, 0.17], [0.29, 0.1]]) {
  parts.push(box('plate', [cx + 0.163, 0, z], [0.008, 0.1, h], [0.008, 0.095]))
  for (const y of [-0.08, 0.08]) for (const dz of [-h + 0.025, h - 0.025]) parts.push(rod('chrome', 'x', cx + 0.17, cx + 0.178, [y, z + dz], 0.009, 6))
}
parts.push(box('hullDark', [cx + 0.172, 0.03, 0.0], [0.003, 0.04, 0.09]))
for (let i = 0; i < 3; i++) parts.push(box('trim', [cx + 0.175, 0.05 - i * 0.018, 0.0], [0.002, 0.005, 0.07 - i * 0.015]))
for (let i = 0; i < 5; i++) parts.push(box(i % 2 ? 'trim' : 'hazard', [cx + 0.172, -0.06, -0.08 + i * 0.03], [0.003, 0.025, 0.015]))

// ---- launch face: a plate frame of three cells, dark bores, nose cones, doors swung up ----
parts.push(box('trim', [cx, 0, zf + 0.01], [0.15, 0.1, 0.012]))
parts.push(box('plate', [cx, 0.098, zf + 0.025], [0.158, 0.017, 0.03]))
parts.push(box('plate', [cx, -0.098, zf + 0.025], [0.158, 0.017, 0.03]))
for (const x of [cx - 0.1575, cx - 0.0525, cx + 0.0525, cx + 0.1575]) parts.push(box('plate', [x, 0, zf + 0.025], [0.008, 0.085, 0.03]))
for (const x of cells) {
  parts.push(rod('trim', 'z', zf + 0.02, zf + 0.05, [x, 0], 0.046, 10))
  // the missile: body ring, a hazard band, the cone and its seeker tip
  parts.push(rod('steel', 'z', zf + 0.02, 0.53, [x, 0], 0.04, 10))
  parts.push(rod('hazard', 'z', 0.51, 0.522, [x, 0], 0.041, 10))
  parts.push(rod('plate', 'z', 0.53, 0.59, [x, 0], [0.04, 0.012], 10))
  parts.push(rod('trim', 'z', 0.59, 0.6, [x, 0], [0.012, 0.004], 8))
  // the door, hinged on the top bar and swung up nearly flat over its cell, its hinge knuckles
  parts.push({ node: N, paint: 'hullDark', loft: { axis: 'z', from: 0, to: 0.085, a: [x, 0, 0.048, 0.005] }, frame: { at: [0, 0.118, zf + 0.05], turn: [-0.35, 0] } })
  parts.push({ node: N, paint: 'trim', loft: { axis: 'z', from: 0.02, to: 0.07, a: [x, 0.006, 0.01, 0.002] }, frame: { at: [0, 0.118, zf + 0.05], turn: [-0.35, 0] } })
  parts.push(rod('joint', 'x', x - 0.045, x + 0.045, [0.118, zf + 0.05], 0.009, 8))
}
for (const x of [cx - 0.1575, cx + 0.1575]) for (const y of [-0.098, 0.098]) parts.push(rod('chrome', 'z', zf + 0.055, zf + 0.06, [x, y], 0.008, 6))

model.paints = paints
model.parts = parts
writeFileSync(file, solids.write(model))
console.log(`missiles: ${parts.length} parts, ${Object.keys(paints).length} paints`)
