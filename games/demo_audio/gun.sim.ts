// A gun on its plinth: a `gun` actor, the weapon its `gun` field names, standing at `pos` on the flat
// ground and facing `yaw` about up (positive turns left, from +z). A seat walks to it along the row,
// as it moves between the cars, and holds it (`player.sim.ts`): its pedal sends the gun's aim nearer
// or further, its steering turns it, and its trigger fires it. Every number is the `gun` definition in
// `assets/demo_audio.json`: its own (`slew`, `reach`, `turn`, `plinth`), and under `guns` each weapon's,
// its `rule` what it does:
//   gun       automatic fire: a round every 60 / `rpm` seconds while the trigger is held, each a
//             hitscan3d shot within `range` turned off the line to the aim by up to `spread` degrees,
//             rolled evenly over the cone's face by a die of a hash of the gun's id and the round's
//             number. With `spin` `{ up, down, fire }` its barrels spin up over `up` seconds while
//             the trigger is held and down over `down` once it is let go, `spin` from 0 to 1, and it
//             fires only once they are at `fire`, `rpm` times `spin` rounds a minute.
//   pulse     a gun with no spread.
//   launcher  a round of volley3d's `pattern` every 60 / `rpm` seconds while held, from the muzzle,
//             lobbed onto the aim where its pattern falls (`lob`), straight up out of its cells when
//             `launch` is `up`; a pattern that seeks rides the gun's `mark`, the aim point.
//   beam      held, it is `on`, and each step its line from the muzzle to the aim within `range` is
//             its `shot`.
// Its row carries what changes: `held` whether its trigger is; `turn` the radians it is turned off
// its plinth's `yaw`, within the definition's `turn`; `reach` the metres along the ground to the
// point it aims at, within `reach`; `steer` and `pedal`, the last of each a seat sent; `cool` the
// seconds until it may fire again; `fired` the rounds it has fired; `shot` the last round's line,
// `{ from, to, what }`, what being where it met the ground, or null in the air; `mark` the aim point
// [x, y, z]; `spin`; and `on`, a beam's. The rounds of a step leave each a share of the step after
// the last, the pause left over carried from round to round, so a steady trigger fires at `rpm`
// whatever the step.
//
// The gun's model is a solids file, its `model` in the loader catalogue: laid on its plinth by `lay`,
// `side` (a weapon drawn with its mounting pad's face at x `pad`, turned a quarter about its length so
// the pad lies on the plinth's top) or `top` (drawn standing on a pad whose face is y `pad`). Its
// `muzzle` empty, so laid, turned and raised to the aim and stood on the plinth's top `plinth.top`, is
// where every round leaves (`muzzle`, which the look draws from too).
//
// Its sounds are its definition's `sounds`, cues of `world.audio.cues`, raised from the gun's row:
// `fire` at the muzzle as each round leaves, `t` into the step it leaves at; `hit` where a shot meets
// the ground; `burst` where one of its launched rounds meets something, the step it does; `on` and
// `off` as a beam starts and stops. Its trigger let go by every seat (`holderOf`), it stops firing,
// stops turning and stops reaching.
import type { Kind, Row, W } from '#engine/engine.ts'
import { seeded } from '#engine/engine.ts'
import { def, json } from '#plugins/loader/loader.sim.ts'
import { shoot } from '#plugins/hitscan3d/hitscan3d.sim.ts'
import { fire, flight, patternOf, type Entry, type Pattern, type Patterns } from '#plugins/volley3d/volley3d.sim.ts'
import { holderOf } from '#plugins/player/player.sim.ts'
import { sound } from '#plugins/audio/audio.sim.ts'
import * as math from '#plugins/math/math.sim.ts'

const DEG = Math.PI / 180
// A step's sum falls short of a whole number of rounds' pauses by a rounding.
const TOLERANCE = 1e-9

type Weapon = {
  name: string; model: string; lay: 'side' | 'top'; pad: number; rule: 'gun' | 'pulse' | 'launcher' | 'beam'
  rpm?: number; damage?: number; range?: number; spread?: number; pattern?: string; launch?: 'up'
  spin?: { up: number; down: number; fire: number }
  sounds: { fire?: string; hit?: string; burst?: string; on?: string; off?: string }
}
type Fixed = { slew: number; reach: [number, number]; turn: number; plinth: { model: string; top: number }; guns: Record<string, Weapon> }

const sub = (a: number[], b: number[]) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const unit = (v: number[]) => { const l = math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l] }
const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

export const fixedOf = (w: W | Parameters<typeof def>[0]): Fixed => def(w, 'gun')
export const weaponOf = (w: W | Parameters<typeof def>[0], me: Row): Weapon => {
  const k = fixedOf(w).guns[me.data.gun]
  if (!k) throw new Error(`gun ${me.id} is a ${me.data.gun}, which the gun definition's guns does not hold`)
  return k
}

// A point of a weapon's model laid on its plinth: a side weapon turned a quarter about its length so
// its pad's face lies at 0, a top weapon dropped by its pad's height.
export const laid = (k: Weapon, v: number[]) => (k.lay === 'side' ? [-v[1], v[0] - k.pad, v[2]] : [v[0], v[1] - k.pad, v[2]])

// A point of the gun's frame turned to its heading, `yaw` about up, and raised by `pitch` about its
// own left: as a three.js group turned by `rotation.set(-pitch, yaw, 0, 'YXZ')` turns it.
export function turned(v: number[], yaw: number, pitch: number) {
  const c = math.cos(pitch), s = math.sin(pitch)
  const y = v[1] * c + v[2] * s, z = -v[1] * s + v[2] * c
  const cy = math.cos(yaw), sy = math.sin(yaw)
  return [v[0] * cy + z * sy, y, -v[0] * sy + z * cy]
}

// The point the gun turns about, on its plinth's top; the way it faces; and the way it points, to its
// aim from that point.
export const pivotOf = (w: W | Parameters<typeof def>[0], me: Row) => [me.data.pos[0], me.data.pos[1] + fixedOf(w).plinth.top, me.data.pos[2]]
export const headingOf = (me: Row) => me.data.yaw + me.data.turn
export function aimOf(me: Row): number[] {
  const yaw = headingOf(me)
  return [me.data.pos[0] + math.sin(yaw) * me.data.reach, 0, me.data.pos[2] + math.cos(yaw) * me.data.reach]
}
// The pitch the gun is raised by to point at `to` from its pivot.
export function pitchOf(w: W | Parameters<typeof def>[0], me: Row, to: number[]) {
  const p = pivotOf(w, me), d = sub(to, p)
  return math.atan2(d[1], math.hypot(d[0], d[2]))
}

// Where its rounds leave: its model's `muzzle` empty, laid, turned to its heading and raised by
// `pitch`, from its pivot.
export function muzzle(w: W | Parameters<typeof def>[0], me: Row, pitch: number): number[] {
  const k = weaponOf(w, me)
  const m = json(w, k.model) as { empties: { muzzle: number[] } }
  const v = turned(laid(k, m.empties.muzzle), headingOf(me), pitch), p = pivotOf(w, me)
  return [p[0] + v[0], p[1] + v[1], p[2] + v[2]]
}

const patternsOf = (w: W): Patterns => json(w, w.world.volley3d.patterns)

// The way a round of `p` fired from `from` comes down on `to`: raised as far as it falls on the way,
// its lowest arc, found where the distance it flies along its aim first reaches the gap to `to` with
// its fall added back; straight at `to` for a round that does not fall, or cannot reach it in its life.
export function lob(p: Pattern, from: number[], to: number[]): number[] {
  const gap = sub(to, from), g = p.g ?? 0
  if (g === 0) return unit(gap)
  const need = (t: number) => [gap[0], gap[1] + (g * t * t) / 2, gap[2]]
  const short = (t: number) => flight(p, [0, 0, 0], [0, 0, 1], t)[2] < math.hypot(...need(t))
  const STEPS = 64
  for (let i = 1; i <= STEPS; i++) {
    let hi = (p.life * i) / STEPS
    if (short(hi)) continue
    let lo = (p.life * (i - 1)) / STEPS
    for (let j = 0; j < 48; j++) {
      const mid = (lo + hi) / 2
      if (short(mid)) lo = mid
      else hi = mid
    }
    return unit(need(hi))
  }
  return unit(gap)
}

// `dir` turned off itself by up to `cone` radians, evenly over the cone's face, by a die seeded with a
// hash of the gun's id and the round's number.
export function scatter(dir: number[], cone: number, id: number, n: number): number[] {
  if (cone === 0) return dir
  const die = seeded((Math.imul(id, 0x9e3779b1) ^ Math.imul(n, 0x85ebca6b)) >>> 0)
  const a = cone * Math.sqrt(die()), phi = 2 * Math.PI * die()
  const up = Math.abs(dir[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]
  const u = unit(cross(dir, up)), v = cross(u, dir)
  const s = math.sin(a), c = math.cos(a)
  return [0, 1, 2].map(i => dir[i] * c + (u[i] * math.cos(phi) + v[i] * math.sin(phi)) * s)
}

// The way from the muzzle to the aim, and the muzzle the gun points from to get there.
function line(w: W, me: Row) {
  const aim = aimOf(me), from = muzzle(w, me, pitchOf(w, me, aim))
  return { aim, from, dir: unit(sub(aim, from)) }
}

// One hitscan round, `t` into the step: its line, the cue it leaves with, and where it meets the
// ground, the cue it lands with there.
function round(me: Row, w: W, k: Weapon, t: number) {
  const { from, dir: way } = line(w, me)
  const n = me.data.fired + 1
  const dir = scatter(way, k.rule === 'gun' ? (k.spread ?? 0) * DEG : 0, me.id, n)
  const met = shoot(w, from, dir, k.range!, { skip: [me.id], hurt: { damage: k.damage!, by: me.id } })
  me.data.fired = n
  me.data.shot = { from, to: met ? met.point : from.map((v, i) => v + dir[i] * k.range!), what: met?.what ?? null }
  if (k.sounds.fire) sound(w, k.sounds.fire, from, me.id, t)
  if (met && k.sounds.hit) sound(w, k.sounds.hit, met.point, undefined, t)
}

// One launched round, `t` into the step.
function launch(me: Row, w: W, k: Weapon, t: number) {
  const p = patternOf(patternsOf(w), k.pattern!)
  const { aim } = line(w, me)
  const from = muzzle(w, me, k.launch === 'up' ? Math.PI / 2 : pitchOf(w, me, aim))
  const dir = k.launch === 'up' ? [0, 1, 0] : lob(p, from, aim)
  me.data.fired += 1
  fire(w, k.pattern!, from, dir, {
    from: me.id, n: me.data.fired, skip: [me.id], hurt: { damage: k.damage!, by: me.id },
    ...(p.seek === undefined ? {} : { ride: { id: me.id, field: 'mark' } }),
  })
  me.data.shot = { from, to: aim, what: null }
  if (k.sounds.fire) sound(w, k.sounds.fire, from, me.id, t)
}

// Rounds while held, each as the pause runs out within the step, `t` into it; then the pause runs
// down by the step.
function rate(me: Row, dt: number, rpm: number, one: (t: number) => void) {
  if (me.data.held && rpm > 0) while (me.data.cool < dt - TOLERANCE) {
    one(Math.max(0, me.data.cool))
    me.data.cool += 60 / rpm
  }
  me.data.cool = Math.max(0, me.data.cool - dt)
}

export const gun: Kind = {
  before(me, dt, w) {
    const f = fixedOf(w), k = weaponOf(w, me)
    if (!holderOf(w, me)) Object.assign(me.data, { held: false, steer: 0, pedal: 0 })
    me.data.turn = clamp(me.data.turn + me.data.steer * f.slew * DEG * dt, -f.turn * DEG, f.turn * DEG)
    me.data.reach = clamp(me.data.reach * Math.exp(me.data.pedal * dt), f.reach[0], f.reach[1])
    me.data.mark = aimOf(me)
    if (k.spin) {
      const s = me.data.spin + (me.data.held ? dt / k.spin.up : -dt / k.spin.down)
      me.data.spin = clamp(s, 0, 1)
    }
  },
  tick(me, dt, w) {
    const k = weaponOf(w, me)
    if (k.rule === 'gun' || k.rule === 'pulse') {
      const spun = !k.spin || me.data.spin >= k.spin.fire - TOLERANCE
      rate(me, dt, spun ? k.rpm! * (k.spin ? me.data.spin : 1) : 0, t => round(me, w, k, t))
    } else if (k.rule === 'launcher') rate(me, dt, k.rpm!, t => launch(me, w, k, t))
    else if (k.rule === 'beam') {
      const was = me.data.on
      me.data.on = me.data.held
      if (me.data.on) {
        const { from, dir } = line(w, me)
        const met = shoot(w, from, dir, k.range!, { skip: [me.id] })
        me.data.shot = { from, to: met ? met.point : from.map((v, i) => v + dir[i] * k.range!), what: met?.what ?? null }
      } else me.data.shot = null
      if (me.data.on && !was && k.sounds.on) sound(w, k.sounds.on, undefined, me.id)
      if (!me.data.on && was && k.sounds.off) sound(w, k.sounds.off, undefined, me.id)
    }
  },
  after(me, dt, w) {
    // Each of its rounds that met something this step bursts there, its share of the step in.
    const k = weaponOf(w, me)
    if (!k.sounds.burst) return
    for (const e of w.all('volley3d')[0].data.live as Entry[]) {
      if (e.from !== me.id || !e.hit) continue
      const since = e.age - e.hit.age
      if (since < dt - TOLERANCE) sound(w, k.sounds.burst, e.hit.point, undefined, Math.max(0, dt - since))
    }
  },
  acts: {
    // The trigger, held at 1 and let go at 0.
    fire(me, _w, _seat, v: unknown) {
      if (typeof v !== 'number' || !Number.isFinite(v)) return
      me.data.held = v >= 0.5
    },
    // The aim's reach and turn: a pedal from -1 (nearer) to 1 (further), a steering from -1 to 1.
    pedal(me, _w, _seat, v: unknown) {
      if (typeof v !== 'number' || !Number.isFinite(v)) return
      me.data.pedal = clamp(v, -1, 1)
    },
    steer(me, _w, _seat, v: unknown) {
      if (typeof v !== 'number' || !Number.isFinite(v)) return
      me.data.steer = clamp(v, -1, 1)
    },
  },
}
