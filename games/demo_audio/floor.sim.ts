// The lot's floor: a shapes3d box at its row's `pos`, its top at y = 0, the scene's
// `world.shapes3d.kinds.floor` saying how big and what it is like to drive on, which box3d stands the
// cars on, which stops the shots and the rounds, and which solids draws by its look (`plugins/shapes3d`).
// It has no rule.
import type { Kind } from '#engine/engine.ts'

export const floor: Kind = {}
