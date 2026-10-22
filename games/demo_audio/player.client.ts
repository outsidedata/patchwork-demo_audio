// One seat's keys, gamepad and camera, bound to the scene's actions (`world.player.actions` in
// `lot.scene.json`, which names every key of each): the arrows or w a s d up and down, or the right and
// left triggers, the pedal (down brakes, and from a stop reverses: box3dvehicle's one pedal); left and
// right, the d-pad or the left stick, the steering; space or the pad's bottom button the brake; f, the
// left mouse button or the pad's right button the trigger of a gun; v or tab or the right shoulder the
// next car or gun along the row, c or the left shoulder the one before (`player.sim.ts`). The pedal and
// the steering are read analog (`plugins/player`, Analog), so a trigger or a stick pushed part of the
// way drives that much, and each is sent when it changes. Holding a gun, the pedal sends its aim
// further or nearer and the steering turns it.
//
// The camera is this page's alone: nothing of it is on a row. It follows the thing this seat holds
// (`holding`, `plugins/player`), read off the rows the page draws, so the frame the seat moves to
// another the camera jumps to it: a car's chassis, or a gun's pivot on its plinth. It sits behind it,
// on critically damped springs run on the steps' clock, so a car's bounces reach the view as a sway
// rather than a shake. The pivot is the chassis's `pos`, or the gun's (`pivotOf`), followed across the
// ground at `followHz` and up and down at `riseHz`; the eye is `back` metres behind the pivot along the
// heading, `side` to its right and `high` above it, and looks at `aim` above it: the `player`
// definition's `camera`, or for a gun its `gun`, which looks `ahead` metres along the heading instead,
// or at its aim when that is nearer. A car's heading is its chassis's forward (its +x turned by its rot), a gun's the way it is
// turned (`headingOf`), laid flat on the ground and followed at `turnHz`, as a vector rather than an
// angle, so there is no angle to wrap. A spring is critically damped (the smooth-damp of Game Programming Gems 4, 1.10), so it
// comes to rest without passing its target. The springs move only on a frame that took a step, by the
// steps' seconds since they last moved (at most a tenth of a second, after a hidden tab), so the camera
// is placed once a step, as the car is, and render3d draws both between the last two steps. While
// something else holds render3d's camera (`claimed()`, dev.html's bench view) it is left alone, and the
// springs jump to the car when it is given back.
import type * as THREE from 'three'
import type { Row } from '#engine/engine.ts'
import type { Plugins } from '#engine/browser.ts'
import { holding, type Controls } from '#plugins/player/player.plugin.ts'
import { def } from '#plugins/loader/loader.sim.ts'
import { headingOf, pivotOf } from './gun.sim.ts'

type Camera = { back: number; high: number; aim: number; followHz: number; riseHz: number; turnHz: number; ahead?: number; side?: number }
type Spring = { x: number; v: number }

let followed = 0
let last = -1 // the step the camera was last placed on; -1 is none
let springs: Record<'x' | 'y' | 'z' | 'fx' | 'fz', Spring> | undefined

// One frame of a critically damped spring toward `to` at `hz`.
function spring(s: Spring, to: number, hz: number, dt: number) {
  const w = 2 * Math.PI * hz, k = w * dt
  const e = 1 / (1 + k + 0.48 * k * k + 0.235 * k * k * k)
  const off = s.x - to, t = (s.v + w * off) * dt
  s.v = (s.v - w * t) * e
  s.x = to + (off + t) * e
}

function setupOurs(plugins: Plugins) {
  followed = 0
  last = -1
  springs = undefined
  plugins.player.control({
    axis: { pedal: v => ['pedal', v], steer: v => ['steer', v] },
    hold: { brake: v => ['brake', v], fire: v => ['fire', v] },
    press: { next: ['next'], back: ['back'] },
    analog: ['pedal', 'steer'],
  } satisfies Controls)
}

function tickOurs(row: Row, plugins: Plugins) {
  const n = plugins.wire.n
  const held = holding(plugins.wire.rows)
  const gun = held?.kind === 'gun' ? held : undefined
  const chassis = gun ?? (held && plugins.wire.rows.find(r => r.id === held.data.chassis))
  if (!chassis || plugins.render3d.claimed() !== undefined) { last = -1; return }
  // A frame that took no step leaves the camera where the last step placed it, for render3d to draw
  // between the steps with what it follows.
  if (springs && last >= 0 && n === last && chassis.id === followed) return
  const k = def(plugins.wire, row.kind)
  const c = (gun ? k.gun : k.camera) as Camera
  let px: number, py: number, pz: number, fx: number, fz: number
  if (gun) {
    ;[px, py, pz] = pivotOf(plugins.wire, gun)
    fx = Math.sin(headingOf(gun))
    fz = Math.cos(headingOf(gun))
  } else {
    ;[px, py, pz] = chassis.data.pos as number[]
    const [x, y, z, s] = chassis.data.rot as number[]
    fx = 1 - 2 * (y * y + z * z)
    fz = 2 * (x * z - s * y)
  }
  if (!springs || last < 0 || n < last || chassis.id !== followed) {
    followed = chassis.id
    springs = { x: { x: px, v: 0 }, y: { x: py, v: 0 }, z: { x: pz, v: 0 }, fx: { x: fx, v: 0 }, fz: { x: fz, v: 0 } }
  } else {
    const dt = Math.min(0.1, (n - last) * plugins.wire.scene.prefabs.engine.dt)
    spring(springs.x, px, c.followHz, dt)
    spring(springs.z, pz, c.followHz, dt)
    spring(springs.y, py, c.riseHz, dt)
    spring(springs.fx, fx, c.turnHz, dt)
    spring(springs.fz, fz, c.turnHz, dt)
  }
  last = n
  const len = Math.hypot(springs.fx.x, springs.fz.x) || 1
  const hx = springs.fx.x / len, hz = springs.fz.x / len
  const camera = plugins.render3d.camera as THREE.PerspectiveCamera
  // `side` metres to the right of the heading: the heading (hx, hz) turned a quarter clockwise seen
  // from above.
  const side = c.side ?? 0
  camera.position.set(springs.x.x - hx * c.back - hz * side, springs.y.x + c.high, springs.z.x - hz * c.back + hx * side)
  camera.up.set(0, 1, 0)
  const ahead = gun ? Math.min(c.ahead ?? 0, gun.data.reach) : 0
  camera.lookAt(springs.x.x + hx * ahead, springs.y.x + c.aim, springs.z.x + hz * ahead)
}

// Every seat is sent every `player` row (`addons/player`), and this look is loaded for each: it binds
// keys and moves the camera only for the row that is this seat's, the one that is `mine`.
let ours = false

export function setup(row: Row, plugins: Plugins) {
  ours = row.data.mine === true
  if (ours) setupOurs(plugins)
}

export function tick(row: Row, plugins: Plugins) {
  if (ours) tickOurs(row, plugins)
}

export function remove(plugins: Plugins) {
  if (ours) plugins.player.unbind()
}
