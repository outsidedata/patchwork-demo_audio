// flat: the lot's ground as the shots and the rounds meet it, the level floor at a height of 0 that
// box3d's one static body stands its top on (`lot.scene.json`). It draws nothing and keeps nothing:
// all of it is its mod for hitscan3d, `flat.hitscan3d.ts`, which `world.hitscan3d.mods: { ground:
// 'flat' }` names, found beside it because `world.shipped.plugins` lists it.
export function flat() {
  return {}
}
