// The row one seat possesses: the driver, and the gunner. `addons/player` spawns it and writes the slot
// it gave the connection into `seat`, and every seat is sent it, the seat's own marked `mine`. The cars
// and the guns are not it: each car is a `box3dvehicle` row a `spot` actor made (`spot.sim.ts`), parked
// in a row, each gun a `gun` row on its plinth in a row beside them (`gun.sim.ts`), and the seat holds
// one thing at a time (`take` in `plugins/player`). A page running the scene ahead (`addons/predict`)
// runs every rule on its copy, so the thing it holds answers the keys on the next frame.
//
// Its row, the scene's `player` prefab, carries beside `seat` and `held`:
//   controls  `{ pedal, steer, brake, fire }`, the last of each the seat sent, kept to its range: a page
//             sends a key or a trigger only when it changes, so one held down while the seat moves to
//             another thing is handed to the thing the step it takes it, of those its kind takes.
//
// `before`: while it holds nothing, the first step its slot's `start`'s spot has made its car and no
// seat holds it, it takes it and hands it its controls.
//
// Its acts are the page's keys and gamepad (`player.client.ts`); each value arrives from outside the
// program, so one that is not a finite number does nothing, and one past its range is kept to it:
//   pedal, steer, brake, fire   kept in `controls`, and passed on to the thing it holds, if its kind
//             takes it (`relay`): a car works the one pedal, the steering and the brake (box3dvehicle's
//             acts); a gun takes the pedal as its aim's reach, the steering as its turn, and fires.
//   next(), back()   it lets go of what it holds and takes the next thing along the row, or the one
//             before, the cars in the order the scene lists the spots and then the guns in the order it
//             lists them, and round, that no seat holds, so two seats never hold one thing, its controls
//             handed to the thing taken. A car let go is parked by its spot; a gun let go stops firing.
import type { Act, Row, Kind, W } from '#engine/engine.ts'
import { holderOf, holding, letGo, relay, take } from '#plugins/player/player.sim.ts'
import { carOf } from './spot.sim.ts'

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

// Every spot's car, in the order the scene lists the spots, once each is made, then every gun.
const things = (w: W): Row[] => [...w.all('spot').flatMap(s => carOf(w, s) ?? []), ...w.all('gun')]

// The controls each kind the seat holds takes.
const TAKES: Record<string, Control[]> = { box3dvehicle: ['pedal', 'steer', 'brake'], gun: ['pedal', 'steer', 'fire'] }
const relayed = relay(TAKES)

// Each control, and the range it is kept to.
const RANGE = { pedal: [-1, 1], steer: [-1, 1], brake: [0, 1], fire: [0, 1] } as const
type Control = keyof typeof RANGE

// A control: kept in `controls`, and relayed to the thing it holds.
const control = (name: Control): Act => (me, w, seat, v: unknown) => {
  if (!finite(v)) return
  const [lo, hi] = RANGE[name]
  me.data.controls = { ...me.data.controls, [name]: Math.max(lo, Math.min(hi, v)) }
  if (holding(w, me)) relayed[name](me, w, seat, v)
}

// `it` taken and handed the controls the seat last sent, of those its kind takes.
function drive(me: Row, w: W, it: Row) {
  take(me, w, it)
  for (const c of TAKES[it.kind]) w.call(it, c, -1, me.data.controls[c])
}

// The thing `by` along the row from the one it holds, round, that no seat holds, taken.
function move(me: Row, w: W, by: 1 | -1) {
  const all = things(w), now = holding(w, me)
  const from = now ? all.indexOf(now) : -1
  for (let k = 1; k <= all.length; k++) {
    const it = all[(((from + by * k) % all.length) + all.length) % all.length]
    if (it === now || holderOf(w, it)) continue
    if (now) letGo(me)
    drive(me, w, it)
    return
  }
}

export const player: Kind = {
  before(me, _dt, w) {
    if (holding(w, me)) return
    const name = w.find('start', s => s.data.slot === me.data.seat).data.spot
    const car = carOf(w, w.find('spot', s => s.data.name === name))
    if (car && !holderOf(w, car)) drive(me, w, car)
  },
  acts: {
    pedal: control('pedal'),
    steer: control('steer'),
    brake: control('brake'),
    fire: control('fire'),
    next(me, w) { move(me, w, 1) },
    back(me, w) { move(me, w, -1) },
  },
}
