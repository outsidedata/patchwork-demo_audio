// demo_audio booted as the server boots it, with two connections in the lot: every car stands on its
// wheels on the ground in its row, and each seat holds the car of the spot its start names. A seat's
// pedal drives the car it holds and no other, every other car held braked by its spot; `next` and `back`
// move the seat along the row to the next free car, past one another seat holds, a pedal held down
// handed to the car taken; every car's engine runs up from idle under the throttle; no car's gearbox
// hunts at full throttle; and every car's engine is a manifest on the disk, each file it names a WAV
// beside it. Past the last car the seat walks on to the guns on their plinths, in the order the scene
// lists them: each fires while its trigger is held, a gun's rounds at its rpm, each heard as it leaves,
// that far into its step, and where it strikes the ground at the aim; a chaingun's barrels spin up
// before it fires and down after; a launcher's rounds burst on the ground at the aim and are heard
// there; a beam is on while held, heard as it starts and stops; the pedal and the steering move the
// aim within the gun's reach and turn; and every cue a gun names is in the scene's table, each gun's
// manifest on the disk with every file it names a WAV beside it.
import { expect, test, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { boot, type Row, type Scene } from '#engine/engine.ts'
import { connection, load, manager } from '#addons/scenemanager/scenemanager.addon.ts'
import { possessed } from '#addons/player/player.addon.ts'
import { sim } from './demo_audio.sim.ts'
import file from './demo_audio.scene.json'
import lot from './lot.scene.json'
import defs from './assets/demo_audio.json'
import type { Entry } from '#plugins/audio/audio.sim.ts'

vi.setConfig({ testTimeout: 120_000 })

const DT = file.prefabs.engine.dt
const here = new URL('./', import.meta.url).href
const SPOTS = lot.actors.filter(a => a.is === 'spot') as { name: string; vehicle: string; x: number; z: number }[]

// The manager, the lot and two connections in it.
async function open() {
  const truth = boot(structuredClone(file) as Scene, sim)
  const g = (await load(truth, here)).get('lot')!
  const seats = [0, 1].map(() => {
    const heard: { seat: number; rows: Row[] }[] = []
    const c = connection(manager(truth), d => heard.push({ seat: d.seat, rows: d.packet.rows }))
    return { c, last: () => heard[heard.length - 1] }
  })
  const step = (k: number) => { for (let i = 0; i < k; i++) truth.step(DT) }
  step(2)
  let seq = 0
  // A press from seat `s` at its own `player` row, stamped with the lot's step, as a page stamps it.
  const press = (s: number, action: string, ...args: unknown[]) => {
    const last = seats[s].last(), me = possessed(last.rows)!
    seats[s].c.take({ scene: 'lot', seat: last.seat, msg: { seq: ++seq, n: g.n, id: me.id, action, args: args as any[] } })
  }
  const row = (id: number) => g.rows.find(r => r.id === id)!
  const cars = () => g.rows.filter(r => r.kind === 'box3dvehicle')
  const carNamed = (name: string) => cars().find(c => c.data.vehicle === name)!
  const held = (s: number) => row(possessed(seats[s].last().rows)!.id).data.held?.id as number | undefined
  const chassis = (car: Row) => row(car.data.chassis).data
  const guns = () => g.rows.filter(r => r.kind === 'gun')
  const gunNamed = (name: string) => guns().find(r => r.data.gun === name)!
  // Every sound the ledger has carried, by its id, gathered each step from now on.
  const sounds = new Map<number, Entry>()
  const listen = () => { for (const e of g.rows.find(r => r.kind === 'audio')!.data.live as Entry[]) sounds.set(e.id, e) }
  const steps = (k: number) => { for (let i = 0; i < k; i++) { truth.step(DT); listen() } }
  return { g, seats, step, press, row, cars, carNamed, held, chassis, guns, gunNamed, sounds, steps }
}

const GUNS = lot.actors.filter(a => a.is === 'gun') as unknown as { gun: string; pos: number[]; yaw: number }[]
type Weapon = { rule: string; rpm?: number; spread?: number; range?: number; pattern?: string; launch?: string; spin?: { up: number; fire: number }; sounds: Record<string, string> }
const WEAPONS = defs.gun.guns as Record<string, Weapon>

// The seat `s` walked from the car it starts in to the gun `name`, past every car after it and every
// gun before it.
function walk(t: Awaited<ReturnType<typeof open>>, s: number, name: string) {
  for (let k = 0; k < SPOTS.length + GUNS.length && t.held(s) !== t.gunNamed(name).id; k++) {
    t.press(s, 'next')
    t.step(2)
  }
  expect(t.held(s)).toBe(t.gunNamed(name).id)
}

test('every gun stands on its plinth where the scene puts it, and the seat walks past the last car onto the guns in the order the scene lists them, and round to the first car', async () => {
  const t = await open()
  t.step(60)
  expect(t.guns().map(g => [g.data.gun, g.data.pos])).toEqual(GUNS.map(g => [g.gun, g.pos]))
  // seat 0 starts in the hatch, seat 1 in the muscle car: seat 0 walks along the row to the cart.
  while (t.held(0) !== t.carNamed('cart').id) { t.press(0, 'next'); t.step(2) }
  for (const g of GUNS) {
    t.press(0, 'next')
    t.step(2)
    expect(t.held(0)).toBe(t.gunNamed(g.gun).id)
  }
  t.press(0, 'next')
  t.step(2)
  expect(t.held(0)).toBe(t.carNamed('kart').id)
})

test('a gun fires while its trigger is held, a round every 60 / rpm seconds, each heard leaving its muzzle that far into its step and where it strikes the ground by the aim; let go, it stops', async () => {
  for (const name of ['twinmg', 'pd', 'pulselaser']) {
    const t = await open()
    t.step(30)
    walk(t, 0, name)
    const k = WEAPONS[name], gun = t.gunNamed(name)
    t.press(0, 'fire', 1)
    t.steps(120)
    // Two seconds: the first round on the step the press is taken, then one each pause.
    const rounds = gun.data.fired as number
    expect(Math.abs(rounds - 2 * (k.rpm! / 60)), name).toBeLessThanOrEqual(1)
    const fired = [...t.sounds.values()].filter(e => e.cue === k.sounds.fire && e.from === gun.id)
    expect(fired.length, name).toBe(rounds)
    // Each round heard at the step and share of it it left: a pause of 60 / rpm from the one before.
    const times = fired.map(e => e.step * DT + e.t!)
    for (let i = 1; i < times.length; i++) expect(times[i] - times[i - 1], name).toBeCloseTo(60 / k.rpm!, 6)
    // Each that meets the ground within its range is heard there, on the ground, and off the line from
    // the muzzle to the aim by no more than its spread.
    const hits = [...t.sounds.values()].filter(e => e.cue === k.sounds.hit)
    expect(hits.length, name).toBeGreaterThan(rounds / 2)
    expect(hits.length, name).toBeLessThanOrEqual(rounds)
    const aim = gun.data.mark as number[], from = gun.data.shot.from as number[]
    const angle = (a: number[], b: number[]) => Math.acos(Math.min(1, a.reduce((s, v, i) => s + v * b[i], 0) / (Math.hypot(...a) * Math.hypot(...b)))) * 180 / Math.PI
    for (const h of hits) {
      expect(h.at![1], name).toBeCloseTo(0, 6)
      expect(Math.hypot(...h.at!.map((v, i) => v - from[i])), name).toBeLessThanOrEqual(k.range! + 1e-6)
      expect(angle(h.at!.map((v, i) => v - from[i]), aim.map((v, i) => v - from[i])), name).toBeLessThanOrEqual((k.spread ?? 0) + 1e-6)
    }
    t.press(0, 'fire', 0)
    t.steps(2)
    const after = gun.data.fired
    t.steps(60)
    expect(gun.data.fired, name).toBe(after)
  }
})

test('a chaingun\'s barrels spin up while its trigger is held and it fires only once they are up to speed, then at its rpm, and they spin down once let go', async () => {
  const t = await open()
  t.step(30)
  walk(t, 0, 'chaingun')
  const k = WEAPONS.chaingun, gun = t.gunNamed('chaingun')
  t.press(0, 'fire', 1)
  const upTo = Math.ceil((k.spin!.fire * k.spin!.up) / DT)
  t.steps(upTo - 2)
  expect(gun.data.fired).toBe(0)
  t.steps(Math.ceil(k.spin!.up / DT))
  expect(gun.data.spin).toBe(1)
  const before = gun.data.fired
  t.steps(60)
  expect(Math.abs(gun.data.fired - before - k.rpm! / 60)).toBeLessThanOrEqual(1)
  t.press(0, 'fire', 0)
  t.steps(10)
  expect(gun.data.spin).toBeLessThan(1)
  expect(gun.data.spin).toBeGreaterThan(0)
})

test('a launcher\'s rounds fly from its muzzle and burst on the ground by the aim, each burst heard there the step it bursts, and one heard leaving each time it fires', async () => {
  for (const name of ['autocannon', 'rockets', 'grenades', 'ggm']) {
    const t = await open()
    t.step(30)
    walk(t, 0, name)
    const k = WEAPONS[name], gun = t.gunNamed(name)
    t.press(0, 'fire', 1)
    t.steps(30)
    t.press(0, 'fire', 0)
    t.steps(900)
    const fired = gun.data.fired as number
    expect(fired, name).toBeGreaterThan(0)
    expect([...t.sounds.values()].filter(e => e.cue === k.sounds.fire && e.from === gun.id).length, name).toBe(fired)
    const bursts = [...t.sounds.values()].filter(e => e.cue === k.sounds.burst)
    expect(bursts.length, name).toBe(fired)
    const aim = gun.data.mark as number[]
    for (const b of bursts) {
      expect(b.at![1], name).toBeLessThan(0.5)
      expect(Math.hypot(b.at![0] - aim[0], b.at![2] - aim[2]), name).toBeLessThan(6)
      expect(b.t, name).toBeGreaterThanOrEqual(0)
      expect(b.t, name).toBeLessThanOrEqual(DT)
    }
  }
})

test('a beam is on while its trigger is held, its line from its muzzle to the ground at the aim, heard as it starts and as it stops', async () => {
  const t = await open()
  t.step(30)
  walk(t, 0, 'beamlaser')
  const k = WEAPONS.beamlaser, gun = t.gunNamed('beamlaser')
  t.press(0, 'fire', 1)
  t.steps(30)
  expect(gun.data.on).toBe(true)
  const aim = gun.data.mark as number[]
  expect(gun.data.shot.what).toBe('ground')
  expect(Math.hypot(gun.data.shot.to[0] - aim[0], gun.data.shot.to[1], gun.data.shot.to[2] - aim[2])).toBeLessThan(1e-6)
  t.press(0, 'fire', 0)
  t.steps(5)
  expect(gun.data.on).toBe(false)
  expect([...t.sounds.values()].filter(e => e.from === gun.id).map(e => e.cue)).toEqual([k.sounds.on, k.sounds.off])
})

test('the pedal sends a gun\'s aim further or nearer within its reach, the steering turns it within its turn, and a gun let go stops turning and reaching', async () => {
  const t = await open()
  t.step(30)
  walk(t, 0, 'twinmg')
  const gun = t.gunNamed('twinmg'), f = defs.gun
  t.press(0, 'pedal', 1)
  t.press(0, 'steer', 1)
  t.steps(600)
  expect(gun.data.reach).toBeCloseTo(f.reach[1], 6)
  expect(Math.abs(gun.data.turn)).toBeCloseTo(f.turn * Math.PI / 180, 6)
  t.press(0, 'pedal', -1)
  t.steps(600)
  expect(gun.data.reach).toBeCloseTo(f.reach[0], 6)
  t.press(0, 'pedal', 1)
  t.press(0, 'next')
  t.steps(3)
  const reach = gun.data.reach
  t.steps(60)
  expect(gun.data.reach).toBe(reach)
  expect(gun.data.pedal).toBe(0)
})

test('every cue a gun names is in the scene\'s table; each gun\'s manifest is in the catalogue, each file it names a WAV beside it; and every held loop\'s sound is in the catalogue', () => {
  const cues = lot.world.audio.cues as Record<string, { gun?: string; sounds?: string[] }>
  const catalogue = lot.world.loader.assets as Record<string, { type: string; url: string }>
  for (const [name, k] of Object.entries(WEAPONS)) for (const cue of Object.values(k.sounds)) expect(cues[cue], `${name} ${cue}`).toBeDefined()
  for (const [name, cue] of Object.entries(cues)) {
    if (cue.sounds) { for (const s of cue.sounds) expect(catalogue[s]?.type, `${name} ${s}`).toBe('sound'); continue }
    const entry = catalogue[cue.gun!]
    expect(entry.type, name).toBe('json')
    const url = new URL(`../..${entry.url}`, here)
    const manifest = JSON.parse(readFileSync(url, 'utf8')) as { variants: Record<string, string>[] }
    expect(manifest.variants.length, name).toBeGreaterThan(1)
    for (const v of manifest.variants) for (const f of Object.values(v)) expect(readFileSync(new URL(f, url)).subarray(0, 4).toString('latin1'), f).toBe('RIFF')
  }
  for (const h of Object.values(lot.world.audio.held as Record<string, { sound: string }>)) expect(catalogue[h.sound].type).toBe('sound')
})

test('every car stands on its wheels on the ground at its spot, and each seat holds the car of the spot its start names', async () => {
  const t = await open()
  t.step(120)
  expect(t.cars().map(c => c.data.vehicle).sort()).toEqual(SPOTS.map(s => s.vehicle).sort())
  for (const s of SPOTS) {
    const car = t.carNamed(s.vehicle), at = t.chassis(car).pos as number[]
    expect(Math.hypot(at[0] - s.x, at[2] - s.z)).toBeLessThan(0.3)
    for (const id of car.data.wheels as number[]) {
      const radius = lot.world.box3dvehicle.vehicles[s.vehicle as keyof typeof lot.world.box3dvehicle.vehicles].axles[0].wheel.radius
      expect(t.row(id).data.pos[1]).toBeGreaterThan(radius - 0.08)
      expect(t.row(id).data.pos[1]).toBeLessThan(radius * 1.6 + 0.08)
    }
  }
  const starts = lot.actors.filter(a => a.is === 'start') as { slot: number; spot: string }[]
  for (const s of starts) expect(t.held(s.slot)).toBe(t.carNamed(SPOTS.find(p => p.name === s.spot)!.vehicle).id)
})

test('a seat\'s pedal drives the car it holds, and no other: every other car stays braked where it stood', async () => {
  const t = await open()
  t.step(60)
  const before = Object.fromEntries(t.cars().map(c => [c.data.vehicle, [...t.chassis(c).pos]]))
  t.press(0, 'pedal', 1)
  t.step(180)
  const hatch = t.carNamed('hatch')
  expect(hatch.data.rpm).toBeGreaterThan(1500)
  expect(t.chassis(hatch).pos[0] - before.hatch[0]).toBeGreaterThan(3)
  for (const c of t.cars()) {
    if (c === hatch) continue
    expect(Math.hypot(...[0, 2].map(k => t.chassis(c).pos[k] - before[c.data.vehicle][k])), c.data.vehicle).toBeLessThan(0.1)
    // The muscle car is seat 1's, whose pedal is untouched; every car no seat holds its spot brakes.
    if (c.id !== t.held(1)) expect(c.data.brake, c.data.vehicle).toBe(1)
  }
})

test('next and back move the seat along the row to the next free car, past one another seat holds, and a pedal held down drives the car taken', async () => {
  const t = await open()
  t.step(60)
  // seat 0 holds the hatch, seat 1 the muscle car, next along the row: next skips it to the exotic.
  t.press(0, 'pedal', 1)
  t.press(0, 'next')
  t.step(2)
  expect(t.held(0)).toBe(t.carNamed('exotic').id)
  t.step(120)
  expect(t.carNamed('exotic').data.rpm).toBeGreaterThan(1500)
  expect(t.carNamed('hatch').data.brake).toBe(1)
  // back skips the muscle car again, to the hatch; back again goes round to the last gun at the row's
  // end, and back past every gun to the cart, the last car.
  t.press(0, 'back')
  t.step(2)
  expect(t.held(0)).toBe(t.carNamed('hatch').id)
  t.press(0, 'back')
  t.step(2)
  expect(t.held(0)).toBe(t.carNamed('kart').id)
  t.press(0, 'back')
  t.step(2)
  expect(t.held(0)).toBe(t.gunNamed(GUNS[GUNS.length - 1].gun).id)
  for (let i = 0; i < GUNS.length; i++) {
    t.press(0, 'back')
    t.step(2)
  }
  expect(t.held(0)).toBe(t.carNamed('cart').id)
  expect(t.held(1)).toBe(t.carNamed('muscle').id)
})

// The seat `s` moved on to the next car along the row, past the guns.
function onward(t: Awaited<ReturnType<typeof open>>, s: number) {
  do {
    t.press(s, 'next')
    t.step(2)
  } while (!t.cars().some(c => c.id === t.held(s)))
}

test('every car\'s engine runs up from idle under the throttle, and the car drives off', async () => {
  const t = await open()
  t.step(60)
  const fleet = lot.world.box3dvehicle.vehicles as Record<string, { engine: { idle?: number; redline: number } }>
  const driven: string[] = []
  // The car seat `s` holds, driven at full throttle for two seconds and let go.
  const drive = (s: number) => {
    const car = t.cars().find(c => c.id === t.held(s))!
    const from = [...t.chassis(car).pos]
    t.press(s, 'pedal', 1)
    t.step(120)
    const e = fleet[car.data.vehicle].engine
    expect(car.data.rpm, car.data.vehicle).toBeGreaterThan((e.idle ?? 0) + 0.15 * (e.redline - (e.idle ?? 0)))
    expect(Math.hypot(t.chassis(car).pos[0] - from[0], t.chassis(car).pos[2] - from[2]), car.data.vehicle).toBeGreaterThan(1)
    t.press(s, 'pedal', 0)
    driven.push(car.data.vehicle)
  }
  // Seat 0 drives every car along the row but the one seat 1 holds, which seat 1 drives.
  for (let i = 0; i < SPOTS.length - 1; i++) {
    drive(0)
    onward(t, 0)
  }
  drive(1)
  expect(driven.sort()).toEqual(SPOTS.map(s => s.vehicle).sort())
})

test('at full throttle every car\'s gearbox only ever shifts up: no gear hunting', async () => {
  const t = await open()
  t.step(60)
  const shifts: Record<string, number[]> = {}
  // The car seat `s` holds, the pedal all the way down for ten seconds: every gear it is in, in order.
  const run = (s: number) => {
    const car = t.cars().find(c => c.id === t.held(s))!, gears: number[] = []
    t.press(s, 'pedal', 1)
    for (let i = 0; i < 600; i++) {
      t.step(1)
      if (gears[gears.length - 1] !== car.data.gear) gears.push(car.data.gear)
    }
    shifts[car.data.vehicle] = gears
    t.press(s, 'pedal', 0)
  }
  for (let i = 0; i < SPOTS.length - 1; i++) {
    run(0)
    onward(t, 0)
  }
  run(1)
  const said = Object.entries(shifts).map(([name, g]) => `${name} ${g.join('>')}`).join(', ')
  for (const gears of Object.values(shifts)) expect(gears.every((g, i) => i === 0 || g > gears[i - 1]), `gears: ${said}`).toBe(true)
  expect(Object.keys(shifts).sort()).toEqual(SPOTS.map(s => s.vehicle).sort())
})

test('every car\'s engine is a manifest in the catalogue, each file it names a WAV beside it', () => {
  const catalogue = lot.world.loader.assets as Record<string, { type: string; url: string }>
  const fleet = lot.world.box3dvehicle.vehicles as Record<string, { look: { sound: { engine: string } } }>
  for (const [name, v] of Object.entries(fleet)) {
    const entry = catalogue[v.look.sound.engine]
    expect(entry.type, name).toBe('json')
    const url = new URL(`../..${entry.url}`, here)
    const manifest = JSON.parse(readFileSync(url, 'utf8')) as { layers: { rpm: number; stems: Record<string, string> }[] }
    for (const l of manifest.layers) for (const f of Object.values(l.stems)) expect(readFileSync(new URL(f, url)).subarray(0, 4).toString('latin1'), f).toBe('RIFF')
  }
})
