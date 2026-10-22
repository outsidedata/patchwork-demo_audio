// Writes the rockets module's `paints` and `parts` into rockets.model.json, keeping its `empties` (and
// any spin, show or lights) as they are. Run: node games/demo_audio/assets/guns/rockets.model.mjs
// A side (R) module: drawn for +x, mirrored by its node on the right. The pad face is x 0.18, so the
// cradle starts there; +z is forward, and the 4 x 4 grid of small tubes is centred on the muzzle
// empty [0.38, 0, 0.3], its mouths just behind it.
import { readFileSync, writeFileSync } from 'node:fs'
import { solids } from '../solids.mjs'

const file = new URL('./rockets.model.json', import.meta.url)
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
// a box centred at c with half sizes h, optionally narrowed to `b` [hx, hy] at its front (+z) end
const box = (paint, c, h, b) => ({ node: N, paint, loft: { axis: 'z', from: c[2] - h[2], to: c[2] + h[2], a: [c[0], c[1], h[0], h[1]], ...(b ? { b: [c[0], c[1], b[0], b[1]] } : {}) } })
const rod = (paint, axis, from, to, at, r, sides = 8) => ({ node: N, paint, prism: { axis, from, to, at, r: Array.isArray(r) ? r : [r, r], sides } })

const cx = 0.38 // the pod's and the grid's centre in x, under the muzzle

// ---- cradle: bolted base plate on the pad, a trunnion collar, the pod's inner wall ----
parts.push(box('steel', [0.19, 0, 0], [0.01, 0.145, 0.16]))
for (const y of [-0.115, 0.115]) for (const z of [-0.13, 0.13]) parts.push(rod('chrome', 'x', 0.2, 0.212, [y, z], 0.014, 6))
parts.push(rod('joint', 'x', 0.2, 0.236, [0, 0], [0.09, 0.08], 12))
parts.push(rod('steel', 'x', 0.212, 0.224, [0, 0], 0.1, 12))
parts.push(box('joint', [0.215, -0.11, 0], [0.018, 0.03, 0.13])) // a lower brace from plate to pod
parts.push(box('hullDark', [0.235, 0, -0.01], [0.008, 0.165, 0.245]))

// ---- pod body ----
parts.push(box('hull', [cx, 0, -0.01], [0.145, 0.16, 0.235]))
// rear cap, darker, with an umbilical socket and a cable down into the cradle
parts.push(box('hullDark', [cx, 0, -0.255], [0.135, 0.15, 0.012], [0.13, 0.145]))
parts.push(rod('joint', 'z', -0.267, -0.29, [cx - 0.05, -0.06], [0.03, 0.026], 8))
parts.push(rod('chrome', 'z', -0.29, -0.296, [cx - 0.05, -0.06], 0.018, 8))
parts.push(rod('cable', 'z', -0.27, -0.285, [cx + 0.06, 0.08], 0.016, 6))
parts.push(box('cable', [0.27, -0.06, -0.29], [0.04, 0.012, 0.012]))
for (const y of [-0.12, 0.12]) for (const x of [cx - 0.11, cx + 0.11]) parts.push(rod('chrome', 'z', -0.267, -0.275, [x, y], 0.01, 6))

// top: a hinged reload cover, its hinge at the back, a seam and two rails
parts.push(box('plate', [cx, 0.166, -0.02], [0.13, 0.008, 0.2], [0.125, 0.008]))
parts.push(rod('joint', 'x', cx - 0.12, cx + 0.12, [0.17, -0.225], 0.012, 8))
parts.push(box('trim', [cx, 0.175, 0.05], [0.12, 0.003, 0.004]))
parts.push(box('trim', [cx, 0.175, -0.1], [0.003, 0.003, 0.09]))
for (const x of [cx - 0.125, cx + 0.125]) parts.push(box('hullDark', [x, 0.178, -0.01], [0.012, 0.01, 0.215]))
parts.push(box('joint', [cx + 0.07, 0.178, 0.17], [0.025, 0.006, 0.02])) // latch
parts.push(box('hazard', [cx - 0.06, 0.1755, 0.15], [0.03, 0.002, 0.02]))
parts.push(box('trim', [cx - 0.06, 0.176, 0.15], [0.012, 0.002, 0.02]))

// bottom: a skid and the vent slots
parts.push(box('hullDark', [cx, -0.168, -0.01], [0.13, 0.008, 0.215]))
for (let i = 0; i < 4; i++) parts.push(box('trim', [cx, -0.177, -0.16 + i * 0.05], [0.09, 0.002, 0.008]))

// outer armour: a bolted plate with a seam, a stencil block and a hazard stripe
parts.push(box('plate', [0.535, 0, -0.01], [0.01, 0.152, 0.225], [0.01, 0.142]))
parts.push(box('plate', [0.548, 0.06, -0.06], [0.004, 0.07, 0.15]))
parts.push(box('trim', [0.546, -0.025, -0.01], [0.004, 0.003, 0.215]))
parts.push(box('trim', [0.546, 0.06, 0.095], [0.004, 0.07, 0.003]))
for (const y of [-0.13, 0.13]) for (const z of [-0.2, -0.02, 0.17]) parts.push(rod('chrome', 'x', 0.545, 0.554, [y, z], 0.011, 6))
for (const z of [-0.16, 0.0, 0.08]) parts.push(rod('chrome', 'x', 0.552, 0.558, [0.105, z], 0.008, 6))
parts.push(box('hullDark', [0.547, -0.08, -0.12], [0.004, 0.035, 0.07]))
for (let i = 0; i < 3; i++) parts.push(box('trim', [0.55, -0.068 - i * 0.014, -0.12], [0.003, 0.004, 0.05 - i * 0.012]))
for (let i = 0; i < 5; i++) parts.push(box(i % 2 ? 'trim' : 'hazard', [0.547, -0.085, 0.08 + i * 0.024], [0.004, 0.035, 0.012]))
parts.push(box('marker', [0.551, 0.125, -0.225], [0.004, 0.012, 0.012]))

// ---- launch face: dark backing, a thick plate frame, grid bars and 16 tubes ----
const pitch = 0.058
const cols = [-1.5, -0.5, 0.5, 1.5].map(i => cx + i * pitch)
const rows = [-1.5, -0.5, 0.5, 1.5].map(i => i * pitch)
parts.push(box('trim', [cx, 0, 0.245], [0.13, 0.14, 0.02]))
parts.push(box('plate', [cx, 0.148, 0.262], [0.145, 0.018, 0.034]))
parts.push(box('plate', [cx, -0.148, 0.262], [0.145, 0.018, 0.034]))
parts.push(box('plate', [cx - 0.132, 0, 0.262], [0.015, 0.132, 0.034]))
parts.push(box('plate', [cx + 0.132, 0, 0.262], [0.015, 0.132, 0.034]))
parts.push(box('trim', [cx, 0.135, 0.297], [0.12, 0.003, 0.002])) // the frame's inner lip
parts.push(box('trim', [cx, -0.135, 0.297], [0.12, 0.003, 0.002]))
for (let i = 0; i < 3; i++) parts.push(box('hullDark', [cx + (i - 1) * pitch, 0, 0.263], [0.0035, 0.13, 0.016]))
for (let i = 0; i < 3; i++) parts.push(box('hullDark', [cx, (i - 1) * pitch, 0.263], [0.118, 0.0035, 0.016]))
for (const x of cols) for (const y of rows) {
  parts.push(rod('steel', 'z', 0.25, 0.284, [x, y], 0.025, 10))
  parts.push(rod('trim', 'z', 0.284, 0.29, [x, y], 0.0185, 10))
  parts.push(rod('rubber', 'z', 0.29, 0.292, [x, y], 0.008, 6)) // the rocket's nose, deep in the bore
}
// corner bolts on the frame and a hazard band round the face
for (const x of [cx - 0.132, cx + 0.132]) for (const y of [-0.148, 0.148]) parts.push(rod('chrome', 'z', 0.296, 0.302, [x, y], 0.009, 6))
for (let i = 0; i < 7; i++) parts.push(box(i % 2 ? 'trim' : 'hazard', [cx - 0.12 + i * 0.04, 0.167, 0.225], [0.02, 0.004, 0.006]))

model.paints = paints
model.parts = parts
writeFileSync(file, solids.write(model))
console.log(`rockets: ${parts.length} parts, ${Object.keys(paints).length} paints`)
