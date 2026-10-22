// The kinds of the lot and the lot.scene.json file next to this one: a flat ground, box3d's one static
// body, and a row of cars, one for each engine the library's sounds can make, each heard as you drive
// it. A car is box3dvehicle's: a `box3dvehicle` row per car and the box3d rows it is made of, a `car`
// chassis, four `wheel`s and four `axle` joints, every one made from `world.box3dvehicle`, which
// box3dvehicle hands box3d (`world.box3d.mods.kinds`) and draws, and plays the engine of
// (`look.sound`, through audio's `sound` mod), with its browser half. Each car's engine is the manifest
// and loops in `assets/sounds/`, which the game's bake makes from `assets/demo_audio.sounds.json`
// (`assets/demo_audio.bake.ts`): the kart's a two-stroke single, the hatch's an inline four, the
// muscle car's a cross-plane V8, the exotic's a flat-plane V8, the grand tourer's a V12, the truck's a
// straight-six diesel, the pickup's a V8 diesel and the cart's an electric motor. Each car is made by
// its `spot` actor; each seat starts in the car of the spot its slot's `start` names, and moves along
// the row of cars with `next` and `back`. Beside the cars stands a row of plinths, a `gun` on each
// (`gun.sim.ts`), which the seat walks on to past the last car: a chaingun, twin machine guns, a
// point-defense cannon, an autocannon, a pulse and a beam laser, rocket pods, a missile rack, a grenade
// launcher and two vertical launchers, each fired with its trigger, its shots hitscan3d's and its
// rounds volley3d's, meeting the flat ground through the game's own plugin `flat`. Each is heard as the
// library makes a gun (`assets/demo_audio.sounds.json`): every round in layers mixed by how far off it
// is, a burst's echo choked to its last round, and its rounds' blasts where they land; the beam's hum
// and the chaingun's barrels turning are held loops on its row. Its flashes, tracers, impacts, smoke
// and spent cases are its look's (`gun.client.ts`). The caption says which engine the seat is
// driving, or which gun it holds. Every number of the lot's own kinds that never changes is its
// definition in `assets/demo_audio.json`.
import type { Scene, Sim } from '#engine/engine.ts'
import { box3d } from '#plugins/box3d/box3d.sim.ts'
import { scenemanager } from '#plugins/scenemanager/scenemanager.sim.ts'
import { loader } from '#plugins/loader/loader.sim.ts'
import { box3dvehicle } from '#plugins/box3dvehicle/box3dvehicle.sim.ts'
import { audio } from '#plugins/audio/audio.sim.ts'
import { volley3d } from '#plugins/volley3d/volley3d.sim.ts'
import { player } from './player.sim.ts'
import { gun } from './gun.sim.ts'
import { car } from './car.sim.ts'
import { wheel } from './wheel.sim.ts'
import { axle } from './axle.sim.ts'
import { start } from './start.sim.ts'
import { spot } from './spot.sim.ts'
import { caption } from './caption.sim.ts'
import file from './lot.scene.json' with { type: 'json' }

export const sim: Sim = { loader, scenemanager, box3d, box3dvehicle, audio, volley3d, player, car, wheel, axle, start, spot, caption, gun }

export const scene = file as unknown as Scene
