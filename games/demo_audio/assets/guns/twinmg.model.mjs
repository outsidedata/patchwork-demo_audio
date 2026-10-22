// Writes the twin MG's `paints` and `parts` into twinmg.model.json, keeping its `empties` as they are.
// Run: node games/demo_audio/assets/guns/twinmg.model.mjs
// A side module: a mount plate meeting the pad at x 0.18, a receiver round x 0.36, two barrels at
// x 0.29 and 0.43 in perforated cooling jackets ending at z 0.8, two belt feeds from the box beneath.
import { readFileSync, writeFileSync } from 'node:fs'
import { solids } from '../solids.mjs'

const file = new URL('./twinmg.model.json', import.meta.url)
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
  brass: { colour: '#b8893a', roughness: 0.4, metalness: 0.8 },
  marker: { colour: '#ffb547', roughness: 0.3, metalness: 0, glow: 1.2 },
}

const X = 0.36
const B = 'body'
const box = (paint, cx, cy, hx, hy, z0, z1, b) => parts.push({ node: B, paint, loft: { axis: 'z', from: z0, to: z1, a: [cx, cy, hx, hy], ...(b ? { b } : {}) } })
const tube = (paint, cx, cy, r0, r1, z0, z1, sides = 8) => parts.push({ node: B, paint, prism: { axis: 'z', from: z0, to: z1, at: [cx, cy], r: [r0, r1], sides } })
const side = (paint, x0, x1, cy, cz, hy, hz) => parts.push({ node: B, paint, loft: { axis: 'x', from: x0, to: x1, a: [cy, cz, hy, hz] } })

// ---- mount plate on the pad, bolted, a hazard edge ----
side('hullDark', 0.18, 0.2, -0.04, 0.02, 0.15, 0.2)
side('trim', 0.178, 0.18, -0.04, 0.02, 0.13, 0.18)
for (const z of [-0.13, 0.17]) for (const y of [-0.15, 0.07]) parts.push({ node: B, paint: 'chrome', prism: { axis: 'x', from: 0.2, to: 0.21, at: [y, z], r: [0.012, 0.01], sides: 6 } })
side('hazard', 0.2, 0.205, 0.105, 0.02, 0.006, 0.17)

// ---- receiver: a chamfered block, top cover, side seams ----
box('hull', X, 0, 0.15, 0.08, -0.18, 0.2)
box('hull', X, 0, 0.15, 0.08, 0.2, 0.26, [X, 0, 0.13, 0.065])
box('hullDark', X, 0, 0.13, 0.065, -0.2, -0.18)
box('plate', X, 0.088, 0.13, 0.01, -0.16, 0.22)
box('trim', X, 0.098, 0.004, 0.004, -0.15, 0.21)
for (const z of [-0.1, -0.02, 0.06, 0.14]) box('trim', X, 0.099, 0.11, 0.003, z, z + 0.012)
box('trim', X + 0.152, 0, 0.003, 0.003, -0.16, 0.2)
box('trim', X - 0.152, 0, 0.003, 0.003, -0.16, 0.2)
for (const z of [-0.14, 0.16]) for (const y of [-0.05, 0.05]) parts.push({ node: B, paint: 'chrome', prism: { axis: 'x', from: X + 0.15, to: X + 0.16, at: [y, z], r: [0.008, 0.008], sides: 6 } })
box('hazard', X + 0.153, 0.04, 0.003, 0.015, -0.05, 0.05)
box('marker', X + 0.153, -0.05, 0.003, 0.01, 0.17, 0.2)
// charging handles at the back
for (const bx of [0.29, 0.43]) {
  box('steel', bx, 0.03, 0.015, 0.015, -0.26, -0.2)
  box('chrome', bx, 0.03, 0.025, 0.006, -0.27, -0.26)
}
// sight on top
box('hullDark', X, 0.12, 0.025, 0.025, 0.0, 0.12)
box('trim', X, 0.12, 0.018, 0.018, 0.12, 0.125)

// ---- barrels: breech collar, perforated jacket of alternating rings, flash hider ----
for (const bx of [0.29, 0.43]) {
  tube('joint', bx, 0, 0.045, 0.045, 0.26, 0.3, 10)
  tube('trim', bx, 0, 0.022, 0.022, 0.3, 0.74, 8)
  for (let i = 0; i < 9; i++) {
    const z = 0.31 + i * 0.045
    tube('steel', bx, 0, 0.038, 0.038, z, z + 0.028, 10)
    tube('joint', bx, 0, 0.032, 0.032, z + 0.028, z + 0.045, 10)
  }
  tube('hull', bx, 0, 0.04, 0.036, 0.715, 0.74, 10)
  tube('steel', bx, 0, 0.026, 0.026, 0.74, 0.77, 8)
  tube('chrome', bx, 0, 0.03, 0.03, 0.77, 0.8, 6)
  tube('trim', bx, 0, 0.012, 0.012, 0.8, 0.801, 6)
}
// barrel bridge clamps
for (const z of [0.42, 0.64]) {
  box('hullDark', X, 0, 0.1, 0.02, z, z + 0.03)
  box('trim', X, 0.021, 0.04, 0.003, z + 0.005, z + 0.025)
}

// ---- ammo box under the receiver, two feed chutes rising into it ----
box('hullDark', X, -0.16, 0.14, 0.07, -0.16, 0.12)
box('plate', X, -0.16, 0.145, 0.06, -0.14, 0.1)
box('trim', X, -0.232, 0.13, 0.004, -0.15, 0.11)
for (const z of [-0.12, 0.08]) box('steel', X, -0.16, 0.148, 0.02, z, z + 0.015)
box('hazard', X + 0.146, -0.16, 0.003, 0.03, -0.06, 0.02)
box('chrome', X, -0.2, 0.02, 0.008, 0.12, 0.13)
for (const bx of [0.29, 0.43]) {
  box('joint', bx, -0.085, 0.03, 0.012, 0.12, 0.2, [bx, -0.085, 0.03, 0.012])
  for (let i = 0; i < 3; i++) box('brass', bx, -0.095, 0.022, 0.006, 0.13 + i * 0.025, 0.145 + i * 0.025)
}

model.paints = paints
model.parts = parts
writeFileSync(file, solids.write({ paints: model.paints, empties: model.empties, parts: model.parts }))
console.log(`twinmg: ${parts.length} parts`)
