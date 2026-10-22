// Writes the heavy rockets module's `paints` and `parts` into heavyrockets.model.json, keeping its
// `empties` (and any spin, show or lights) as they are. Run: node games/demo_audio/assets/guns/heavyrockets.model.mjs
// A side (L) module on the big L pads: drawn for +x from the pad face at x 0.18, +z forward. Six big
// tubes, two columns of three, centred on the muzzle empty [0.42, 0, 0.6], their mouths just behind it.
import { readFileSync, writeFileSync } from 'node:fs'
import { solids } from '../solids.mjs'

const file = new URL('./heavyrockets.model.json', import.meta.url)
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

const cx = 0.42
const zc = 0.13 // the pod's middle in z
const zb = -0.27 // its back
const zf = 0.54 // where its body meets the launch face

// ---- cradle: a bolted plate on the pad, an elevation drum between two cheeks ----
parts.push(box('steel', [0.19, 0, 0.06], [0.01, 0.22, 0.29]))
for (const y of [-0.18, 0, 0.18]) for (const z of [-0.18, 0.3]) parts.push(rod('chrome', 'x', 0.2, 0.214, [y, z], 0.016, 6))
parts.push(rod('joint', 'x', 0.2, 0.235, [0, 0.06], [0.15, 0.13], 12))
parts.push(rod('steel', 'x', 0.205, 0.22, [0, 0.06], 0.165, 12))
parts.push(rod('chrome', 'x', 0.235, 0.24, [0, 0.06], 0.04, 8))
for (const y of [-0.24, 0.24]) parts.push(box('joint', [0.215, y, 0.06], [0.02, 0.035, 0.2], [0.02, 0.03]))
parts.push(box('cable', [0.215, -0.2, -0.2], [0.012, 0.012, 0.06]))

// ---- pod body, two straps round it ----
parts.push(box('hullDark', [0.235, 0, zc], [0.01, 0.33, 0.4]))
parts.push(box('hull', [cx, 0, (zb + zf) / 2], [0.205, 0.325, (zf - zb) / 2]))
for (const z of [-0.08, 0.32]) {
  parts.push(box('hullDark', [cx, 0, z], [0.212, 0.333, 0.022]))
  for (const y of [-0.3, 0.3]) parts.push(rod('chrome', 'x', cx + 0.21, cx + 0.222, [y, z], 0.012, 6))
}
// rear cap, tapered, with vents, an umbilical and lifting eyes
parts.push(box('hullDark', [cx, 0, zb - 0.015], [0.195, 0.31, 0.015], [0.18, 0.29]))
for (let i = 0; i < 5; i++) parts.push(box('trim', [cx + 0.04, -0.2 + i * 0.1, zb - 0.032], [0.12, 0.012, 0.003]))
parts.push(rod('joint', 'z', zb - 0.03, zb - 0.06, [cx - 0.13, 0.2], [0.04, 0.035], 8))
parts.push(rod('chrome', 'z', zb - 0.06, zb - 0.066, [cx - 0.13, 0.2], 0.024, 8))
parts.push(box('cable', [0.27, 0.2, zb - 0.05], [0.05, 0.015, 0.015]))

// top: a hinged reload hatch, its hinge at the back, two rails, lifting lugs and a stencil
parts.push(box('plate', [cx, 0.33, 0.12], [0.18, 0.012, 0.36], [0.175, 0.012]))
parts.push(rod('joint', 'x', cx - 0.17, cx + 0.17, [0.342, -0.23], 0.016, 8))
for (const z of [-0.06, 0.16, 0.36]) parts.push(box('trim', [cx, 0.343, z], [0.17, 0.003, 0.004]))
for (const x of [cx - 0.19, cx + 0.19]) parts.push(box('hullDark', [x, 0.34, 0.13], [0.014, 0.014, 0.39]))
for (const z of [-0.18, 0.46]) parts.push(box('joint', [cx, 0.35, z], [0.03, 0.02, 0.012]))
parts.push(box('joint', [cx + 0.1, 0.345, 0.47], [0.035, 0.006, 0.025])) // latch
for (let i = 0; i < 6; i++) parts.push(box(i % 2 ? 'trim' : 'hazard', [cx - 0.15 + i * 0.04, 0.343, 0.47], [0.02, 0.003, 0.02]))
parts.push(box('marker', [cx + 0.19, 0.357, -0.24], [0.012, 0.004, 0.012]))

// bottom: skid and drain slots
parts.push(box('hullDark', [cx, -0.333, 0.13], [0.18, 0.01, 0.38]))
for (let i = 0; i < 6; i++) parts.push(box('trim', [cx, -0.345, -0.15 + i * 0.1], [0.12, 0.003, 0.01]))

// outer armour: two bolted panels with a seam, a stencil block and a hazard stripe
parts.push(box('plate', [cx + 0.215, 0.16, 0.13], [0.012, 0.15, 0.36], [0.012, 0.14]))
parts.push(box('plate', [cx + 0.215, -0.16, 0.13], [0.012, 0.15, 0.36], [0.012, 0.14]))
parts.push(box('trim', [cx + 0.226, 0, 0.13], [0.004, 0.004, 0.37]))
for (const y of [-0.28, -0.04, 0.04, 0.28]) for (const z of [-0.2, 0.13, 0.46]) parts.push(rod('chrome', 'x', cx + 0.225, cx + 0.236, [y, z], 0.012, 6))
parts.push(box('hullDark', [cx + 0.229, 0.16, 0.05], [0.004, 0.07, 0.11]))
for (let i = 0; i < 3; i++) parts.push(box('trim', [cx + 0.232, 0.19 - i * 0.03, 0.05], [0.003, 0.007, 0.08 - i * 0.02]))
for (let i = 0; i < 7; i++) parts.push(box(i % 2 ? 'trim' : 'hazard', [cx + 0.229, -0.16, -0.1 + i * 0.04], [0.004, 0.08, 0.02]))
parts.push(box('marker', [cx + 0.231, 0.29, -0.24], [0.004, 0.015, 0.015]))

// ---- launch face: dark backing, a thick plate frame, a centre bar and six big tubes ----
const cols = [cx - 0.1, cx + 0.1]
const rows = [-0.19, 0, 0.19]
parts.push(box('trim', [cx, 0, zf + 0.005], [0.19, 0.31, 0.02]))
parts.push(box('plate', [cx, 0.3, zf + 0.025], [0.205, 0.025, 0.035]))
parts.push(box('plate', [cx, -0.3, zf + 0.025], [0.205, 0.025, 0.035]))
parts.push(box('plate', [cx - 0.19, 0, zf + 0.025], [0.02, 0.28, 0.035]))
parts.push(box('plate', [cx + 0.19, 0, zf + 0.025], [0.02, 0.28, 0.035]))
parts.push(box('hullDark', [cx, 0, zf + 0.018], [0.008, 0.28, 0.025]))
for (const y of [-0.095, 0.095]) parts.push(box('hullDark', [cx, y, zf + 0.018], [0.17, 0.008, 0.025]))
for (const x of cols) for (const y of rows) {
  parts.push(rod('steel', 'z', zf, 0.585, [x, y], 0.084, 12))
  parts.push(rod('chrome', 'z', 0.585, 0.589, [x, y], 0.078, 12))
  parts.push(rod('trim', 'z', 0.589, 0.594, [x, y], 0.065, 12))
  parts.push(rod('hullDark', 'z', 0.575, 0.598, [x, y], [0.04, 0.012], 8)) // the warhead's nose in the bore
}
for (const x of [cx - 0.19, cx + 0.19]) for (const y of [-0.3, 0, 0.3]) parts.push(rod('chrome', 'z', 0.598, 0.604, [x, y], 0.012, 6))

model.paints = paints
model.parts = parts
writeFileSync(file, solids.write(model))
console.log(`heavyrockets: ${parts.length} parts, ${Object.keys(paints).length} paints`)
