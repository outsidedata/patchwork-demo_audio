// A gun on its plinth, drawn and seen firing. The plinth is the solids model the `gun` definition's
// `plinth.model` names, standing at the row's `pos` turned by its `yaw`; the weapon is its own model
// (`guns.<gun>.model`), laid on the plinth's top as its rule lays it (`laid`, `gun.sim.ts`): a side
// weapon a quarter turn about its length, a top weapon as it stands. It turns by the row's `turn` and
// is raised to point at its `mark` (`pitchOf`), a weapon that launches `up` kept level, all of it as
// three.js does it, so its muzzle is where the rule's rounds leave. Every number of it is its
// weapon's `look` in `assets/demo_audio.json`; the effects it names are particle3d's
// (`assets/effects.json`), drawn the frame they are emitted.
//
// Each frame, for a gun whose `fired` has gone up since the frame before, the rounds it fired since:
//   flash     `look.flash` at the muzzle, thrown along the way the last round went, once a frame;
//   line      for a gun or a pulse laser, `look.line` from the muzzle to each round's end (a tracer, a
//             bolt), and where the last met the ground `look.impact`, thrown back the way it came;
//   light     the muzzle's point light, `look.light` `{ colour, power, distance, fade }`, lit to `power`
//             candela, falling by e every `fade` seconds;
//   kick      the weapon thrown back along its barrel by `look.kick` `[metres, seconds]`, easing home
//             by e every that many seconds;
//   casings   with `look.eject` `{ at, dir, speed, spread, size, spin }`, a spent case thrown from the
//             model's point `at` along `dir` at `speed` m/s, `spread` of it rolled either way, tumbling
//             `spin` radians a second: a brass cylinder `size` [radius, length], which falls, bounces
//             off the ground with `BOUNCE` of its speed up and `SKID` along, rolls to rest, and lies
//             `LIE` seconds before it is gone; `MOST` lie at once, the oldest gone first.
// Once a gun that fired lets go of its trigger, `look.smoke` curls from its muzzle for `look.smolder`
// seconds. A spinning weapon (`spin` in its definition) turns its model's `barrels` node about its
// own middle by the row's `spin` times `look.spin` radians a second. A beam, while `on`, draws
// `look.line` from the muzzle to its `shot.to` and `look.spot` where it meets the ground, each an
// effect that lasts, moved there every frame, its light held lit and flickering by `look.flicker`.
//
// All of it is the page's: nothing is on a row, and a page that first sees a gun draws none of the
// rounds it fired before.
import type * as THREE from 'three'
import type { Row } from '#engine/engine.ts'
import type { Plugins } from '#engine/browser.ts'
import type { Effect } from '#plugins/particle3d/particle3d.plugin.ts'
import { json } from '#plugins/loader/loader.sim.ts'
import { fixedOf, laid, muzzle, pitchOf, weaponOf } from './gun.sim.ts'

const BOUNCE = 0.35
const SKID = 0.55
const LIE = 8
const MOST = 400

type Look = {
  flash?: string; line?: string; impact?: Record<string, string>; spot?: string; smoke?: string; smolder?: number
  light?: { colour: string; power: number; distance: number; fade: number }; flicker?: number
  kick?: [number, number]; spin?: number
  eject?: { at: number[]; dir: number[]; speed: number; spread: number; size: [number, number]; spin: number }
}
type Model = { paints: Record<string, any>; parts: any[]; empties: Record<string, number[]> }
type Casing = { mesh: THREE.Mesh; vel: THREE.Vector3; axis: THREE.Vector3; spin: number; age: number; still: boolean }
type Drawn = {
  root: THREE.Group; aim: THREE.Group; lay: THREE.Group; barrels?: THREE.Group; light: THREE.PointLight
  owned: { dispose(): void }[]; fired: number; held: boolean; burst: boolean; kick: number; glow: number
  line?: Effect; spot?: Effect
}

// The page loads this look once for each gun's row (`engine/browser.ts`), so what it holds is that
// gun's: its drawing, and the cases it has thrown.
let drawn: Drawn | undefined
const casings: Casing[] = []
let caseGeo: THREE.CylinderGeometry | undefined, caseMat: THREE.MeshStandardMaterial | undefined
let last = 0

const stop = (fx: Effect | undefined) => { if (fx) fx.life = fx.age }

function make(row: Row, plugins: Plugins): Drawn {
  const { THREE: T, scene, dress } = plugins.render3d
  const { meshes, solid } = plugins.solids
  const f = fixedOf(plugins.wire), k = weaponOf(plugins.wire, row)
  const root = new T.Group(), aim = new T.Group(), lay = new T.Group()
  aim.rotation.order = 'YXZ'
  aim.position.y = f.plinth.top
  root.add(aim)
  aim.add(lay)
  if (k.lay === 'side') lay.rotation.z = Math.PI / 2
  lay.position.y = -k.pad
  const plinth = json(plugins.wire, f.plinth.model) as Model
  const base = meshes(T, dress, plinth.paints, plinth.parts, `plinth of gun ${row.id}`)
  for (const list of base.meshes.values()) root.add(...list)
  const m = json(plugins.wire, k.model) as Model
  const made = meshes(T, dress, m.paints, m.parts, `gun ${row.data.gun}`)
  let barrels: THREE.Group | undefined
  for (const [node, list] of made.meshes) {
    if (node !== 'barrels') { lay.add(...list); continue }
    // The barrels turn about their own middle across their length (z), so they are hung from a pivot
    // there, offset back by as much.
    const vs = m.parts.filter(p => p.node === 'barrels').flatMap(p => solid(p).v)
    const mid = [0, 1].map(i => (Math.min(...vs.map(v => v[i])) + Math.max(...vs.map(v => v[i]))) / 2)
    const pivot: THREE.Group = new T.Group()
    pivot.position.set(mid[0], mid[1], 0)
    for (const mesh of list) { mesh.position.set(-mid[0], -mid[1], 0); pivot.add(mesh) }
    lay.add(pivot)
    barrels = pivot
  }
  const look = (k as any).look as Look
  const light = new T.PointLight(look.light?.colour ?? '#ffffff', 0, look.light?.distance ?? 10, 2)
  const at = laid(k, m.empties.muzzle)
  light.position.set(at[0], at[1], at[2])
  aim.add(light)
  scene.add(root)
  return { root, aim, lay, barrels, light, owned: [...base.owned, ...made.owned], fired: row.data.fired, held: row.data.held, burst: false, kick: 0, glow: 0 }
}

// A spent case thrown from the weapon's `eject` point.
function eject(plugins: Plugins, d: Drawn, e: NonNullable<Look['eject']>) {
  const T = plugins.render3d.THREE
  caseGeo ??= new T.CylinderGeometry(1, 1, 1, 10)
  caseMat ??= plugins.render3d.dress(new T.MeshStandardMaterial({ color: '#c8963e', metalness: 1, roughness: 0.28 })) as THREE.MeshStandardMaterial
  const mesh = new T.Mesh(caseGeo, caseMat)
  mesh.scale.set(e.size[0], e.size[1], e.size[0])
  mesh.castShadow = true
  const p = d.lay.localToWorld(new T.Vector3(e.at[0], e.at[1], e.at[2]))
  mesh.position.copy(p)
  const roll = () => 1 + e.spread * (2 * Math.random() - 1)
  const dir = new T.Vector3(e.dir[0] * roll(), e.dir[1] * roll(), e.dir[2] * roll()).transformDirection(d.lay.matrixWorld)
  const vel = dir.multiplyScalar(e.speed * roll())
  const axis = new T.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize()
  plugins.render3d.scene.add(mesh)
  casings.push({ mesh, vel, axis, spin: e.spin * roll(), age: 0, still: false })
  while (casings.length > MOST) casings.shift()!.mesh.removeFromParent()
}

// Every case one frame on: falling, bouncing, rolling to rest, and gone once it has lain long enough.
function fall(dt: number) {
  for (let i = casings.length - 1; i >= 0; i--) {
    const c = casings[i]
    c.age += dt
    if (c.age > LIE) { c.mesh.removeFromParent(); casings.splice(i, 1); continue }
    if (c.still) continue
    c.vel.y -= 9.8 * dt
    c.mesh.position.addScaledVector(c.vel, dt)
    c.mesh.rotateOnAxis(c.axis, c.spin * dt)
    const floor = c.mesh.scale.x
    if (c.mesh.position.y < floor) {
      c.mesh.position.y = floor
      c.vel.set(c.vel.x * SKID, -c.vel.y * BOUNCE, c.vel.z * SKID)
      c.spin *= SKID
      if (Math.abs(c.vel.y) < 0.4) {
        c.vel.y = 0
        c.mesh.rotation.set(Math.PI / 2, c.mesh.rotation.y, 0)
        if (Math.hypot(c.vel.x, c.vel.z) < 0.15) c.still = true
      }
    }
  }
}

export function setup() {}

export function tick(row: Row, plugins: Plugins) {
  const { particle3d, wire } = plugins
  const k = weaponOf(wire, row)
  const look = (k as any).look as Look
  const d = (drawn ??= make(row, plugins))
  const now = performance.now()
  // The page's seconds since the frame before, at most a tenth, after a hidden tab.
  const dt = last ? Math.min(0.1, (now - last) / 1000) : 0
  last = now
  fall(dt)

  const [x, y, z] = row.data.pos as number[]
  d.root.position.set(x, y, z)
  d.root.rotation.y = row.data.yaw
  const up = k.launch === 'up' ? 0 : pitchOf(wire, row, row.data.mark)
  d.aim.rotation.set(-up, row.data.turn, 0)
  d.kick *= look.kick ? Math.exp(-dt / look.kick[1]) : 0
  d.lay.position.z = -d.kick
  if (d.barrels && look.spin) d.barrels.rotation.z += (row.data.spin ?? 0) * look.spin * dt
  d.root.updateMatrixWorld(true)

  const from = muzzle(wire, row, k.launch === 'up' ? Math.PI / 2 : up)
  const shot = row.data.shot as { from: number[]; to: number[]; what: string | null } | null
  const rounds = row.data.fired - d.fired
  if (rounds > 0 && shot) {
    const way = shot.to.map((v, i) => v - from[i])
    if (look.flash) particle3d.emit(look.flash, from, { dir: k.launch === 'up' ? [0, 1, 0] : way })
    if (k.rule !== 'launcher' && look.line) {
      for (let i = 0; i < Math.min(rounds, 4); i++) particle3d.emit(look.line, from, { to: shot.to })
      const impact = shot.what && look.impact?.[shot.what]
      if (impact) particle3d.emit(impact, shot.to, { dir: way.map(c => -c) })
    }
    if (look.light) d.glow = look.light.power
    if (look.kick) d.kick = look.kick[0]
    if (look.eject) for (let i = 0; i < Math.min(rounds, 4); i++) eject(plugins, d, look.eject)
    d.burst = true
  }
  d.fired = row.data.fired
  if (d.held && !row.data.held && d.burst && look.smoke) particle3d.emit(look.smoke, from, { dir: [0, 1, 0], life: look.smolder ?? 0 })
  if (!row.data.held) d.burst = false
  d.held = row.data.held

  if (k.rule === 'beam') {
    if (row.data.on && shot) {
      const line: Effect = (d.line ??= particle3d.emit(look.line!, from, { to: shot.to, life: Infinity }))
      line.at = from
      line.to = shot.to
      if (shot.what && !d.spot && look.spot) d.spot = particle3d.emit(look.spot, shot.to, { life: Infinity })
      if (!shot.what) { stop(d.spot); d.spot = undefined }
      if (d.spot) d.spot.at = shot.to
      if (look.light) d.glow = look.light.power * (1 - (look.flicker ?? 0) * Math.random())
    } else {
      stop(d.line); stop(d.spot)
      d.line = d.spot = undefined
    }
  }
  if (look.light) {
    d.light.intensity = d.glow
    d.glow *= Math.exp(-dt / look.light.fade)
  }
}

export function remove() {
  if (drawn) {
    stop(drawn.line); stop(drawn.spot)
    drawn.root.removeFromParent()
    for (const o of drawn.owned) o.dispose()
  }
  drawn = undefined
  for (const c of casings) c.mesh.removeFromParent()
  casings.length = 0
  caseGeo?.dispose(); caseMat?.dispose()
  caseGeo = caseMat = undefined
}
