// demo_audio's bake, `yarn bake demo_audio` (core's `scripts/bake.ts`): every car's engine, made by the
// library's `sounds/sounds.mjs` from `demo_audio.sounds.json` beside this file, and the truck's body,
// made by box3dvehicle's own script and packed by gltfpack, each written where the catalogue reads it:
//   sounds/   each car's engine as loops held at fixed rpms, a file a stem, `<car>-<rpm>-<stem>.wav`,
//             and its manifest, `<car>.engine.json`, which the car's `look.sound.engine` names: the
//             kart's a two-stroke single, the hatch's an inline four, the muscle car's a cross-plane V8,
//             the exotic's a flat-plane V8, the grand tourer's a V12, the truck's a straight-six diesel,
//             the pickup's a V8 diesel, the cart's an electric motor
//   truck/truck.glb   box3dvehicle's `truck/truck.py`, built to `world.box3dvehicle.vehicles.truck` in
//             lot.scene.json, the model its look names
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Tools } from '#scripts/bake.ts'

const here = import.meta.dirname

export default async ({ blender, pack, scratch, library }: Tools) => {
  const { sounds } = await import(pathToFileURL(path.join(library, 'sounds', 'sounds.mjs')).href) as { sounds: (spec: string, out: string) => string[] }
  for (const f of sounds(path.join(here, 'demo_audio.sounds.json'), path.join(here, 'sounds'))) console.log('wrote', path.relative(path.join(here, '..', '..', '..'), f))
  const truck = scratch('truck.glb')
  await blender(['--factory-startup', '--python-exit-code', '1', '--python', path.join(here, '..', '..', '..', 'plugins', 'box3dvehicle', 'truck', 'truck.py'), '--', path.join(here, '..', 'lot.scene.json'), 'truck', truck])
  await pack(truck, path.join(here, 'truck', 'truck.glb'))
  console.log('wrote', path.join('games', 'demo_audio', 'assets', 'truck', 'truck.glb'))
}
