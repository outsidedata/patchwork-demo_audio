// The caption over the top left of the view, on the `caption` ui panel: the car the seat holds, its name
// in `caption.title`; under it its engine, and the engine's rpm, the gear and the throttle as this page
// draws its row, in `caption.text`; and the keys, `help`, in `caption.keys`. Each car's name and engine
// are the caption's definition's `cars`, by the vehicle's name. Holding a gun, it shows the weapon's
// name (the gun definition's), what it is (the caption's `guns`), how far off it aims, how many rounds
// it has fired and how fast its barrels spin, and the gun's keys, `shoot`. Every place is its
// definition in `assets/demo_audio.json`, in pixels from the panel's top left. While the seat holds
// nothing it shows the keys alone.
import type { Row } from '#engine/engine.ts'
import type { Plugins } from '#engine/browser.ts'
import { def } from '#plugins/loader/loader.sim.ts'
import { holding } from '#plugins/player/player.plugin.ts'

// Nothing is made before the first frame: the ui makes each thing the first time `tick` shows it, and
// takes it away after a frame that does not show it.
export function setup() {}

export function remove() {}

export function tick(row: Row, plugins: Plugins) {
  const { ui, wire } = plugins
  const { PIXI } = ui
  const k = def(wire, row.kind)
  const text = (key: string, style: string, at: number[]) => {
    const t = ui.show('caption', key, () => new PIXI.Text({ text: '', style: ui.style(style) })) as InstanceType<typeof PIXI.Text>
    t.position.set(at[0], at[1])
    return t
  }
  const car = holding(wire.rows)
  text('keys', 'caption.keys', k.keys).text = car?.kind === 'gun' ? k.shoot : k.help
  if (!car) return
  if (car.kind === 'gun') {
    const g = def(wire, 'gun').guns[car.data.gun] as { name: string }
    text('title', 'caption.title', k.title).text = g.name
    text('engine', 'caption.text', k.lines).text = k.guns[car.data.gun]
    text('running', 'caption.text', [k.lines[0], k.lines[1] + k.line]).text = `aim ${Math.round(car.data.reach)} m   ${car.data.fired} fired${car.data.spin ? `   barrels ${Math.round(car.data.spin * 100)}%` : ''}`
    return
  }
  const it = k.cars[car.data.vehicle] as { name: string; engine: string }
  text('title', 'caption.title', k.title).text = it.name
  text('engine', 'caption.text', k.lines).text = it.engine
  const gear = car.data.gear === -1 ? 'R' : car.data.gear === 0 ? 'N' : String(car.data.gear)
  const throttle = Math.max(0, car.data.throttle ?? 0)
  text('running', 'caption.text', [k.lines[0], k.lines[1] + k.line]).text = `${Math.round(car.data.rpm ?? 0)} rpm   gear ${gear}   throttle ${Math.round(throttle * 100)}%`
}
