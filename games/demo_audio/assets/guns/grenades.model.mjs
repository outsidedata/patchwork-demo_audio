// Writes the grenades module's `paints` and `parts` into grenades.model.json, keeping its `empties` (and
// any spin, show or lights) as they are. Run: node games/demo_audio/assets/guns/grenades.model.mjs
// A side (R) module: drawn for +x from the pad face at x 0.18, mirrored by its node on the right, +z
// forward. A short revolving-drum launcher: a breech block at the back, the six-chamber drum, a short
// fat barrel in a ribbed sleeve and a ported muzzle brake whose bore is on the muzzle empty [0.36, 0, 0.56].
import { readFileSync, writeFileSync } from 'node:fs'
import { solids } from '../solids.mjs'

const file = new URL('./grenades.model.json', import.meta.url)
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
const axis = [cx, 0] // the bore's line, x and y

// ---- cradle: plate on the pad, a trunnion arm reaching out under the breech ----
parts.push(box('steel', [0.19, 0, 0.0], [0.01, 0.12, 0.14]))
for (const y of [-0.09, 0.09]) for (const z of [-0.1, 0.1]) parts.push(rod('chrome', 'x', 0.2, 0.212, [y, z], 0.013, 6))
parts.push(rod('joint', 'x', 0.2, 0.235, [0, 0], [0.075, 0.065], 12))
parts.push(rod('steel', 'x', 0.21, 0.222, [0, 0], 0.085, 12))
parts.push(box('joint', [0.225, -0.08, -0.03], [0.025, 0.025, 0.12]))
parts.push(box('cable', [0.215, 0.08, -0.17], [0.01, 0.01, 0.05]))

// ---- breech block at the back, with its loading gate and ammo feed ----
parts.push(box('hull', [cx, 0, -0.12], [0.125, 0.12, 0.08], [0.12, 0.115]))
parts.push(box('hullDark', [cx, 0, -0.21], [0.115, 0.11, 0.01], [0.11, 0.105]))
parts.push(box('plate', [cx + 0.128, 0, -0.12], [0.006, 0.1, 0.065]))
for (const y of [-0.08, 0.08]) for (const z of [-0.17, -0.07]) parts.push(rod('chrome', 'x', cx + 0.133, cx + 0.141, [y, z], 0.009, 6))
for (let i = 0; i < 5; i++) parts.push(box(i % 2 ? 'trim' : 'hazard', [cx + 0.135, -0.045 + i * 0.022, -0.12], [0.003, 0.011, 0.04]))
parts.push(box('trim', [cx, 0.121, -0.12], [0.1, 0.003, 0.004])) // seam over the block
parts.push(box('joint', [cx - 0.03, 0.128, -0.12], [0.06, 0.012, 0.06])) // the feed throat on top
parts.push(box('hullDark', [cx - 0.03, 0.143, -0.12], [0.05, 0.005, 0.05]))
parts.push(rod('chrome', 'x', cx - 0.09, cx + 0.04, [0.135, -0.18], 0.008, 6))
parts.push(box('joint', [cx, -0.13, -0.12], [0.06, 0.012, 0.06])) // the trigger housing under it
parts.push(rod('cable', 'z', -0.215, -0.235, [cx - 0.07, -0.07], 0.016, 6))
parts.push(box('marker', [cx + 0.1, 0.1, -0.222], [0.01, 0.01, 0.003]))

// ---- the drum: twelve-sided, two bands, six chamber ends at the back, a centre arbor ----
parts.push(rod('steel', 'z', -0.04, 0.17, axis, 0.135, 12))
for (const z of [-0.01, 0.14]) parts.push(rod('joint', 'z', z - 0.012, z + 0.012, axis, 0.141, 12))
for (let i = 0; i < 6; i++) {
  const a = (i / 6) * Math.PI * 2 + Math.PI / 6
  const at = [cx + Math.cos(a) * 0.088, Math.sin(a) * 0.088]
  parts.push(rod('trim', 'z', 0.17, 0.176, at, 0.032, 8)) // chamber mouths on the drum's front
  parts.push(rod('hullDark', 'z', 0.03, 0.1, [cx + Math.cos(a) * 0.132, Math.sin(a) * 0.132], 0.012, 6)) // flutes
}
parts.push(rod('chrome', 'z', 0.17, 0.19, axis, 0.03, 8))
parts.push(rod('joint', 'z', -0.04, -0.045, axis, 0.11, 12))

// ---- barrel in a ribbed sleeve, a top rail, the ported brake ----
parts.push(rod('joint', 'z', 0.17, 0.22, axis, [0.09, 0.075], 12))
parts.push(rod('steel', 'z', 0.22, 0.5, axis, 0.062, 12))
for (let i = 0; i < 5; i++) parts.push(rod('hullDark', 'z', 0.25 + i * 0.05, 0.27 + i * 0.05, axis, 0.072, 12))
parts.push(box('hullDark', [cx, 0.08, 0.36], [0.012, 0.012, 0.14]))
for (const z of [0.25, 0.47]) parts.push(box('joint', [cx, 0.066, z], [0.014, 0.012, 0.012]))
parts.push(box('plate', [cx, 0, 0.525], [0.072, 0.072, 0.03]))
for (const y of [-0.04, 0.04]) parts.push(box('trim', [cx + 0.073, y, 0.525], [0.003, 0.016, 0.018])) // brake ports
for (const y of [-0.04, 0.04]) parts.push(box('trim', [cx - 0.073, y, 0.525], [0.003, 0.016, 0.018]))
parts.push(rod('chrome', 'z', 0.555, 0.558, axis, 0.058, 12))
parts.push(rod('trim', 'z', 0.555, 0.56, axis, 0.046, 12))
parts.push(rod('hazard', 'z', 0.5, 0.506, axis, 0.065, 12))
parts.push(rod('rubber', 'z', 0.53, 0.562, axis, [0.03, 0.012], 8)) // the grenade's nose in the bore

model.paints = paints
model.parts = parts
writeFileSync(file, solids.write(model))
console.log(`grenades: ${parts.length} parts, ${Object.keys(paints).length} paints`)
