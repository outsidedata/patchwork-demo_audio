// flat's mod for hitscan3d (`addons/scenemanager`'s mods). A scene with `world.hitscan3d.mods: {
// ground: 'flat' }` stops a shot at the lot's floor, the plane y = 0.
//
// `ground(w, from, dir, far)` is where the line first reaches it: `{ t, normal }`, t metres along unit
// `dir` and the floor's normal, straight up; or undefined when it stays over the floor for `far`
// metres. A line starting under the floor meets it at once.
import type { W } from '#engine/engine.ts'
import * as math from '#plugins/math/math.sim.ts'

export function ground(_w: W, from: number[], dir: number[], far: number) {
  if (from[1] <= 0) return { t: 0, normal: [0, 1, 0] }
  const l = math.hypot(dir[0], dir[1], dir[2])
  const down = dir[1] / l
  if (!(down < 0)) return undefined
  const t = -from[1] / down
  return t <= far ? { t, normal: [0, 1, 0] } : undefined
}
