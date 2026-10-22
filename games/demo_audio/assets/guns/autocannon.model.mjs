// Writes the autocannon's `paints` and `parts` into autocannon.model.json, keeping its `empties` as
// they are. Run: node games/demo_audio/assets/guns/autocannon.model.mjs
// A side module: a mount plate meeting the pad at x 0.18, a heavy receiver round x 0.35, a drum
// magazine under it feeding up a chute, a recoil sleeve, a grooved barrel and a ported muzzle brake
// ending at the `muzzle` empty (z 1.7).
import { readFileSync, writeFileSync } from 'node:fs'
import { solids } from '../solids.mjs'

const file = new URL('./autocannon.model.json', import.meta.url)
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

const X = 0.35
const B = 'body'
const box = (paint, cx, cy, hx, hy, z0, z1, b) => parts.push({ node: B, paint, loft: { axis: 'z', from: z0, to: z1, a: [cx, cy, hx, hy], ...(b ? { b } : {}) } })
const tube = (paint, cx, cy, r0, r1, z0, z1, sides = 10) => parts.push({ node: B, paint, prism: { axis: 'z', from: z0, to: z1, at: [cx, cy], r: [r0, r1], sides } })
const side = (paint, x0, x1, cy, cz, hy, hz, b) => parts.push({ node: B, paint, loft: { axis: 'x', from: x0, to: x1, a: [cy, cz, hy, hz], ...(b ? { b } : {}) } })
const drum = (paint, x0, x1, cy, cz, r, sides = 14) => parts.push({ node: B, paint, prism: { axis: 'x', from: x0, to: x1, at: [cy, cz], r: [r, r], sides } })

// ---- mount plate on the pad and a trunnion block ----
side('hullDark', 0.18, 0.2, -0.02, 0.05, 0.2, 0.28)
side('trim', 0.178, 0.18, -0.02, 0.05, 0.18, 0.26)
for (const z of [-0.18, 0.28]) for (const y of [-0.18, 0.14]) parts.push({ node: B, paint: 'chrome', prism: { axis: 'x', from: 0.2, to: 0.21, at: [y, z], r: [0.014, 0.012], sides: 6 } })
side('hazard', 0.2, 0.205, 0.0, 0.32, 0.17, 0.008)
side('hazard', 0.2, 0.205, 0.0, -0.22, 0.17, 0.008)

// ---- receiver: heavy block, sloped front, top cover with ribs, side armour ----
box('hull', X, 0, 0.15, 0.17, -0.26, 0.3)
box('hull', X, 0, 0.15, 0.17, 0.3, 0.45, [X, 0.02, 0.12, 0.12])
box('hullDark', X, 0, 0.13, 0.15, -0.3, -0.26)
box('plate', X, 0.178, 0.12, 0.01, -0.22, 0.3)
for (const z of [-0.16, -0.06, 0.04, 0.14, 0.24]) box('trim', X, 0.19, 0.1, 0.004, z, z + 0.02)
box('plate', X + 0.157, 0, 0.008, 0.13, -0.2, 0.32)
box('trim', X + 0.166, 0.0, 0.003, 0.003, -0.2, 0.32)
box('trim', X + 0.166, 0.09, 0.003, 0.003, -0.2, 0.32)
box('trim', X + 0.166, -0.09, 0.003, 0.003, -0.2, 0.32)
for (const z of [-0.17, 0.29]) for (const y of [-0.11, 0.11]) parts.push({ node: B, paint: 'chrome', prism: { axis: 'x', from: X + 0.165, to: X + 0.175, at: [y, z], r: [0.011, 0.011], sides: 6 } })
box('hazard', X + 0.166, 0.045, 0.003, 0.03, -0.05, 0.12)
box('marker', X + 0.166, -0.12, 0.003, 0.012, 0.25, 0.3)
// ejection port and its cover on the outboard side
box('trim', X + 0.162, 0.045, 0.005, 0.03, 0.15, 0.27)
// rear buffer cap and cable
tube('joint', X, 0, 0.09, 0.07, -0.36, -0.3, 12)
tube('chrome', X, 0, 0.04, 0.04, -0.38, -0.36, 8)
parts.push({ node: B, paint: 'cable', prism: { axis: 'x', from: 0.2, to: X - 0.06, at: [0.1, -0.33], r: [0.016, 0.016], sides: 6 } })

// ---- drum magazine below, feed chute rising into the receiver ----
drum('hullDark', X - 0.12, X + 0.12, -0.28, 0.0, 0.13)
drum('plate', X + 0.12, X + 0.135, -0.28, 0.0, 0.11)
drum('plate', X - 0.135, X - 0.12, -0.28, 0.0, 0.11)
drum('joint', X + 0.135, X + 0.16, -0.28, 0.0, 0.045, 8)
drum('chrome', X + 0.16, X + 0.17, -0.28, 0.0, 0.02, 6)
for (const x of [X - 0.07, X, X + 0.07]) drum('trim', x - 0.006, x + 0.006, -0.28, 0.0, 0.135)
side('hazard', X + 0.135, X + 0.138, -0.28, 0.07, 0.04, 0.012)
box('joint', X, -0.17, 0.06, 0.03, 0.08, 0.2)
box('steel', X, -0.18, 0.065, 0.006, 0.08, 0.2)
box('hullDark', X, -0.32, 0.11, 0.02, -0.08, 0.08)

// ---- recoil sleeve, barrel with cooling grooves, muzzle brake ----
tube('hullDark', X, 0, 0.1, 0.1, 0.45, 0.72, 12)
tube('steel', X, 0, 0.105, 0.105, 0.47, 0.5, 12)
tube('steel', X, 0, 0.105, 0.105, 0.67, 0.7, 12)
tube('chrome', X, 0, 0.075, 0.075, 0.72, 0.8, 12)
tube('joint', X, 0, 0.085, 0.07, 0.8, 0.84, 12)
// recoil spring rods beside the sleeve
for (const s of [1, -1]) {
  tube('chrome', X + 0.105 * s, 0.07, 0.015, 0.015, 0.4, 0.82, 6)
  box('hullDark', X + 0.105 * s, 0.07, 0.025, 0.025, 0.8, 0.84)
}
tube('steel', X, 0, 0.055, 0.05, 0.84, 1.48, 10)
for (let i = 0; i < 7; i++) {
  const z = 0.9 + i * 0.05
  tube('joint', X, 0, 0.065, 0.065, z, z + 0.025, 10)
}
tube('hullDark', X, 0, 0.06, 0.06, 1.3, 1.34, 10)
tube('trim', X, 0, 0.062, 0.062, 1.315, 1.325, 10)
// brake: a block with three port slots each side
box('hull', X, 0, 0.08, 0.07, 1.48, 1.7, [X, 0, 0.075, 0.065])
box('plate', X, 0.072, 0.065, 0.006, 1.5, 1.68)
for (let i = 0; i < 3; i++) {
  const z = 1.51 + i * 0.06
  for (const s of [1, -1]) box('trim', X + 0.078 * s, 0, 0.006, 0.045, z, z + 0.035)
}
box('trim', X, 0, 0.035, 0.035, 1.7, 1.701)
box('hazard', X, 0.079, 0.06, 0.003, 1.48, 1.495)

model.paints = paints
model.parts = parts
writeFileSync(file, solids.write({ paints: model.paints, empties: model.empties, parts: model.parts }))
console.log(`autocannon: ${parts.length} parts`)
