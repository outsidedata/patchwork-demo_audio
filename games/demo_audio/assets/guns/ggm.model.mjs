// Writes the GGM module's `paints` and `parts` into ggm.model.json, keeping its `empties` (and any spin,
// show or lights) as they are. Run: node games/demo_audio/assets/guns/ggm.model.mjs
// A top (T) module on a roof pad, whose face is y 0.12: a vertical-launch block of four cells, an
// armoured hatch lid over each, launching up through the muzzle empty [0, 0.46, 0] over the deck's
// middle. +z is forward.
import { readFileSync, writeFileSync } from 'node:fs'
import { solids } from '../solids.mjs'

const file = new URL('./ggm.model.json', import.meta.url)
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
// a box centred at c with half sizes h, standing along y; `b` [hx, hz] narrows its top
const box = (paint, c, h, b) => ({ node: N, paint, loft: { axis: 'y', from: c[1] - h[1], to: c[1] + h[1], a: [c[0], c[2], h[0], h[2]], ...(b ? { b: [c[0], c[2], b[0], b[1]] } : {}) } })
const rod = (paint, axis, from, to, at, r, sides = 8) => ({ node: N, paint, prism: { axis, from, to, at, r: Array.isArray(r) ? r : [r, r], sides } })

// ---- base: a bolted ring plate on the pad and a short plinth ----
parts.push(box('steel', [0, 0.13, 0.02], [0.135, 0.01, 0.135]))
for (const x of [-0.11, 0.11]) for (const z of [-0.09, 0.13]) parts.push(rod('chrome', 'y', 0.14, 0.152, [x, z], 0.012, 6))
parts.push(box('joint', [0, 0.155, 0.0], [0.13, 0.015, 0.13]))

// ---- the block ----
parts.push(box('hull', [0, 0.29, 0], [0.145, 0.13, 0.145]))
// corner posts and a mid band
for (const x of [-0.145, 0.145]) for (const z of [-0.145, 0.145]) parts.push(box('hullDark', [x, 0.29, z], [0.016, 0.135, 0.016]))
parts.push(box('hullDark', [0, 0.25, 0], [0.152, 0.012, 0.152]))
// four armour panels, one a side, bolted, with a seam and stencils
const faces = [[1, 0], [-1, 0], [0, 1], [0, -1]]
for (const [sx, sz] of faces) {
  const c = [sx * 0.15, 0.335, sz * 0.15]
  const h = sx ? [0.006, 0.06, 0.115] : [0.115, 0.06, 0.006]
  parts.push(box('plate', c, h))
  const along = sx ? [0, 1] : [1, 0]
  for (const s of [-1, 1]) for (const y of [0.29, 0.38]) {
    const at = [c[0] + sx * 0.007 + along[0] * s * 0.1, c[2] + sz * 0.007 + along[1] * s * 0.1]
    parts.push(rod('chrome', sx ? 'x' : 'z', sx ? c[0] + sx * 0.005 : c[2] + sz * 0.005, sx ? c[0] + sx * 0.012 : c[2] + sz * 0.012, sx ? [y, at[1]] : [at[0], y], 0.008, 6))
  }
  parts.push(box('plate', [sx * 0.15, 0.195, sz * 0.15], sx ? [0.006, 0.045, 0.115] : [0.115, 0.045, 0.006]))
}
// hazard band round the lower panel on the front, a stencil plate on each side
for (let i = 0; i < 7; i++) parts.push(box(i % 2 ? 'trim' : 'hazard', [-0.09 + i * 0.03, 0.195, 0.158], [0.015, 0.03, 0.003]))
for (const sx of [-1, 1]) {
  parts.push(box('hullDark', [sx * 0.158, 0.2, 0], [0.003, 0.03, 0.06]))
  for (let i = 0; i < 3; i++) parts.push(box('trim', [sx * 0.161, 0.21 - i * 0.012, 0], [0.002, 0.004, 0.05 - i * 0.012]))
}
// the exhaust uptake at the back: a louvred vent the motors' blast leaves by
parts.push(box('joint', [0, 0.32, -0.162], [0.08, 0.06, 0.012]))
for (let i = 0; i < 5; i++) parts.push(box('trim', [0, 0.28 + i * 0.02, -0.175], [0.07, 0.004, 0.003]))
parts.push(rod('cable', 'y', 0.17, 0.3, [0.12, -0.16], 0.012, 6))
parts.push(box('marker', [0.125, 0.405, 0.157], [0.006, 0.006, 0.003]))

// ---- deck: a plate with a cross divider, four lids with hinges, latches and hazard rims ----
parts.push(box('plate', [0, 0.428, 0], [0.155, 0.008, 0.155]))
parts.push(box('trim', [0, 0.438, 0], [0.006, 0.003, 0.145]))
parts.push(box('trim', [0, 0.438, 0], [0.145, 0.003, 0.006]))
for (const x of [-0.072, 0.072]) for (const z of [-0.072, 0.072]) {
  parts.push(box('hazard', [x, 0.438, z], [0.062, 0.003, 0.062]))
  parts.push(box('trim', [x, 0.441, z], [0.058, 0.002, 0.058]))
  parts.push(box('hullDark', [x, 0.447, z], [0.055, 0.006, 0.055], [0.05, 0.05]))
  parts.push(box('joint', [x, 0.455, z], [0.03, 0.003, 0.03])) // the lid's raised boss
  parts.push(rod('joint', 'x', x - 0.04, x + 0.04, [0.447, z + Math.sign(z) * 0.058], 0.009, 8)) // hinge on the outer edge
  parts.push(box('chrome', [x, 0.452, z - Math.sign(z) * 0.045], [0.012, 0.004, 0.006])) // latch on the inner edge
}
for (const x of [-0.14, 0.14]) for (const z of [-0.14, 0.14]) parts.push(rod('chrome', 'y', 0.436, 0.442, [x, z], 0.008, 6))

model.paints = paints
model.parts = parts
writeFileSync(file, solids.write(model))
console.log(`ggm: ${parts.length} parts, ${Object.keys(paints).length} paints`)
