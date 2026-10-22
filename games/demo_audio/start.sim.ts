// Where a seat starts: a `start` actor of the scene, one per slot, naming the `spot` whose car the seat
// first holds (`player.sim.ts`). It has no rule and is not drawn.
import type { Kind } from '#engine/engine.ts'

export const start: Kind = {}
