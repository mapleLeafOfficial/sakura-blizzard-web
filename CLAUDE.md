# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Goal

This is **sakura_blizzard** v6.1.2 — a Flutter/Dart *package* (not an app) that renders real-time 3D particle effects: cherry-blossom petals, snow, rain, confetti bursts, images, and cubes falling/drifting through the screen. It is a thin, opinionated wrapper over three external packages (`simple_3d`, `simple_3d_renderer`, `util_simple_3d`) which provide the actual 3D object model and a **software-rendered** (CPU) orthographic renderer.

**The package's own contribution is:** (1) geometry/object *creators*, (2) a *physics* system that drives per-frame motion, and (3) *view widgets* that wire creators + physics + the external renderer into a `Stack` of two depth layers around a child widget.

> Active goal: port this to **Next.js**. The physics classes are pure math and port almost verbatim; the views/renderer require a Canvas or WebGL replacement (see "Porting to Next.js" below).

## Commands

```bash
flutter pub get                # install deps
flutter analyze                # lint (uses package:simple_lint — stricter than flutter_lints)
flutter test                   # run the single test in test/
flutter test test/sakura_blizzard_test.dart   # run one test file
```

The example app (`example/main.dart`) is run as a normal Flutter app (`flutter run` from `example/`), but it references placeholder assets (`./assets/images/your_image1.png` etc.) that are not committed — image views will only work after those are supplied.

## Architecture

### The three-layer data flow (read top-down)

```
Creator (geometry)  ──►  View (widget, owns timer + object list)  ──►  ElementsFlowView  ──►  Sp3dRenderer (external)
   builds Sp3dObj           sets obj.physics + initial position          per-frame: applies physics,
   from vertices            then delegates to ElementsFlowView            moves/rotates, resets
```

Every concrete view (`SakuraBlizzardView`, `SnowFallView`, `RainFallView`, `ImageFallView`, `AssetImageFallView`, `CustomImageFallView`, `ColorfulCubeView`, `CustomFallView`) follows the **same template**:
1. `initState` builds N front + N back objects via `createObj(...)`.
2. `createObj` calls a creator, assigns `obj.physics = _getDropPhysics(fps)`, applies a random initial rotation about the physics' `rotateAxis`, and a random initial position.
3. `build` wraps everything in `LayoutBuilder` and returns a single `ElementsFlowView` keyed with `UniqueKey()` (forces a full rebuild on size change — see "Resize caveat" below).

**`ElementsFlowView` is the engine.** It is the only widget that knows about `simple_3d_renderer`. It:
- Sets up one orthographic camera (`Sp3dOrthographicCamera`) centered on the view, z=3000, scale 6000.
- Sets up one directional light (`Sp3dLight`) with `minBrightness` controlling how dark faces get when turned away.
- Runs a `Timer.periodic(1000 ~/ fps)` that, each tick, calls `updateObjPosition(obj)` on every front+back object and increments a `ValueNotifier` to trigger a repaint (no `setState` — the renderer is `CustomPaint`-like and reads `vn`).
- Wraps the scene in a `Stack`: `[backRenderer, child, frontRenderer]` (layer order adapts if one list is empty), so the child widget sits *between* two depth layers.

### Physics — the core that must be ported faithfully

All physics extend `Sp3dPhysics` (from `simple_3d`) and expose three things consumed by the engine: `velocity` (a `Sp3dV3D` move delta per tick, or `null` to halt), `rotateAxis` (`null` = no spin), and `angularVelocity`. **Critical invariants for a correct port:**

- **FPS normalization via `speed = 60 / fps`.** Every velocity and angular velocity is multiplied by `speed`, so behavior is framerate-independent and calibrated to 60 fps being the "1×" reference. Preserve this multiplier.
- **Y axis points DOWN in screen space** (Flutter screen convention), so falling = negative Y. Gravity is applied as `_vy -= gravity`. The camera sits at +z looking toward -z.
- **Position reset is in `ElementsFlowView.updateObjPosition`, not in physics.** When an object's center drops below `-viewSize.height/8`, the view teleports it back to the top (optionally randomizing X) — *if* `enablePositionReset` is true. Set `enablePositionReset=false` for one-shot effects (pop/confetti). Physics returning `null` velocity is the other way an object stops.

Physics families (in `lib/src/physics/`):
- **Simple drops:** `BasicDropPhysics` (straight down), `RainDropPhysics` (×12 faster, straight down), `RotatingDropPhysics` (spin around screen-perpendicular z-axis `(0,0,-1)`), `SpinDrop3DPhysics` (spin around a tilted `(±1,1,0).nor()` axis — the 3D petal tumble).
- **`HirahiraDropPhysics`** — the signature cherry-blossom drift. Falls straight down at `baseFallSpeed + rand(0..1)`, **plus a horizontal sine-wave sway** of wavelength `viewSize.longestEdge / _shiftValue`. Each petal randomly sways left-first or right-first. `rotateAxis` is `(1,1,0)` 80% of the time, else `(-1,1,0)`.
- **Burst (stateful) physics** — `PopPhysics`, `DirectionalPopPhysics`, `ConfettiHirahiraPhysics`, `DirectionalConfettiHirahiraPhysics`. These carry mutable `_vx/_vy` and a phase machine: **burst → (optional transition lerp) → settle/halt-or-hirahira**. The confetti variants add a `transition` phase that `lerp`s between burst velocity and hirahira velocity by `t = frames/transitionFrames`. `Directional*` versions take a `direction` vector whose magnitude is the base speed and a `spreadAngle` (radians) cone around it; the non-directional `Pop*` versions burst in a full circle.

`EnumDropType` maps the 5 simple drop styles to physics classes in each view's `_getDropPhysics`. The burst/confetti physics are **not** selectable via the enum — they're passed in through `customPhysicsCreation` or via the factory-function views (`CustomFallView`, `CustomImageFallView`).

### Creators — geometry, all centered at origin (0,0,0)

`lib/src/objs/`. Each returns an `Sp3dObj`:
- **`UtilSakuraCreator.sakuraPetal(w, h, notchLen)`** — a petal built from two Bézier curves (front+back faces split by `zDistance` for depth). *This geometry is the most expensive to port faithfully* (it uses `UtilBezier.bezierCurve` from `util_simple_3d`).
- **`UtilSnowCreator.snow(r)`** — a flat disc approximated by N triangles around origin.
- **`UtilRainCreator.rain(w, h, color)`** — a flat quad (no depth).
- **`UtilImageTileCreator.imageTile(size, frontImg, backImg)`** — a double-sided quad carrying front/back `Uint8List` images (front face → material index 0, back → 1).

### Depth & layering model

"Front" vs "back" layers are **two independent `Sp3dWorld` render passes**, not a single scene with z-sorting. `minBrightness` (0–1) controls how much faces darken when angled away from the light — petals set this ~0.93 (subtle), snow/images ~0.0 (flat shading). This two-renderer `Stack` is the only mechanism giving the child widget a "sandwiched in falling petals" look.

### Resize caveat (the `UniqueKey` pattern)

Every concrete view wraps its `ElementsFlowView` in `LayoutBuilder` and passes `key: UniqueKey()`. This is intentional: on platforms where the window resizes, the physics/positions are baked to the old `viewSize`, so the cleanest correct behavior is to **throw the whole subtree away and rebuild** rather than recompute. Keep this pattern or replace it with explicit resize handling — do not naively remove it.

## Public API surface

`lib/sakura_blizzard.dart` re-exports everything (see the file for the full list). External consumers import only the barrel file. When adding a class, **add its export here** or it is invisible to package users.

## Porting to Next.js

This is the active direction. Mapping notes for whoever does the work:

- **The 8 views collapse to a small number of React components** parameterized by a creator + a physics factory. `ElementsFlowView`'s responsibilities (camera, light, `requestAnimationFrame`/`Timer` loop, two-layer `Stack`, reset logic) move into one engine component (Canvas 2D for simplicity, or WebGL/Three.js/react-three-fiber if true 3D tumble is desired).
- **Physics classes port 1:1 to TypeScript classes** — they are pure, self-contained, and hold only numbers + the `speed = 60/fps` math. Keep `velocity`/`angularVelocity` returning `null` semantics. The `requestAnimationFrame` loop should apply each object's physics once per frame and treat 60fps as reference.
- **Y-down, negative-Y-falls convention** must be preserved (matches Canvas/HTML coordinate systems, unlike many game engines).
- **`HirahiraDropPhysics` sway math** (`sin(2π · t · speed / (L/shift))` over the screen's longest edge) is the visual signature — port the wavelength and the random left/right seed exactly.
- **`Sp3dRenderer` is a software/CPU orthographic renderer.** There is no direct JS equivalent; for the petal, you can either (a) pre-render petal/snow geometry to a `<canvas>`/SVG and apply CSS transforms for the tumble, or (b) use react-three-fiber for real 3D. The depth "sandwich" = two stacked DOM/canvas layers with the child between them.
- **Object creation** (creators) is deterministic given a seeded RNG; port a seedable PRNG if you need reproducible layouts, otherwise `Math.random` is fine.
