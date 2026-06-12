# Sakura Blizzard Web

> English | [中文](./README.md)

A **Next.js + Canvas 2D** reimplementation of **sakura_blizzard** — cherry-blossom blizzard and other falling-particle effects, pure web.

This project is a **line-by-line 1:1 port** of the core physics algorithm from the original Flutter/Dart library [sakura_blizzard](https://github.com/MasahideMori-SimpleAppli/sakura_blizzard) to TypeScript, with the original `simple_3d_renderer`-based software 3D rendering replaced by Canvas 2D.

---

## Relationship to the original repo

|  | Original | This project |
|---|---|---|
| Repo | [MasahideMori-SimpleAppli/sakura_blizzard](https://github.com/MasahideMori-SimpleAppli/sakura_blizzard) | mapleLeafOfficial/sakura-blizzard-web |
| Stack | Flutter / Dart | Next.js / TypeScript / Canvas 2D |
| Version | v6.1.2 | port |
| Rendering | `simple_3d_renderer` (custom software 3D engine) | Canvas 2D (orthographic projection + Y-flip) |
| Physics | `Sp3dPhysics` subclasses (Dart) | same-named TS classes, **algorithm identical** |

- This is an **unofficial** port. Credit to the original author [Masahide Mori](https://github.com/MasahideMori-SimpleAppli).
- **Strictly ported (1:1):** the 9 physics classes, vector math (`Sp3dV3D`), sakura petal geometry (Bézier curves), and the engine loop with position recycling. All original invariants are preserved: `speed=60/fps` normalization, world-Y-up axis, `velocity` side-effect state advancement, the three-stage phase machine of the burst physics.
- **Rewritten:** the renderer. The original `simple_3d_renderer` is a hand-written software 3D engine in pure Dart (orthographic camera, face normals, painter's-algorithm depth sort, `Sp3dLight` shading). There is no direct JS equivalent, so Canvas 2D approximates it (world-Y flip projection, `camTheta → RGB multiply` brightness).

## Features

- 🌸 **5 falling physics** + **4 burst/confetti physics**, strictly ported from the original.
- 🎨 True **quadratic Bézier curves** for the sakura petal outline (mirrors the original `_sakuraPetalV3d`).
- 💡 `Sp3dLight`-style shading: `camTheta` (face normal · view direction) → RGB brightness modulation.
- ⏱ Fixed-timestep animation loop, framerate-independent (motion pre-scaled by `60/fps`).
- 🎛 Switch dropType live to compare algorithms.

## Physics mapping

| Original Dart class | TS class (this project) | Effect |
|---|---|---|
| `BasicDropPhysics` | `BasicDropPhysics` | Straight fall at constant speed |
| `RainDropPhysics` | `RainDropPhysics` | 12× speed straight fall |
| `RotatingDropPhysics` | `RotatingDropPhysics` | In-plane spin about the screen-normal axis |
| `SpinDrop3DPhysics` | `SpinDrop3DPhysics` | 3D tumble about the `(1,1,0)` axis |
| `HirahiraDropPhysics` | `HirahiraDropPhysics` | Signature sakura: sine-wave sway while falling |
| `PopPhysics` | `PopPhysics` | Omnidirectional burst (party popper) |
| `DirectionalPopPhysics` | `DirectionalPopPhysics` | Directional burst (confetti cannon) |
| `ConfettiHirahiraPhysics` | `ConfettiHirahiraPhysics` | Burst → smooth transition → flutter fall |
| `DirectionalConfettiHirahiraPhysics` | `DirectionalConfettiHirahiraPhysics` | Directional burst → smooth transition → flutter fall |

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000
```

Use the top buttons to switch between the 5 falling algorithms; the bottom-left controls the per-layer particle count.

## Faithfully preserved invariants

1. **`speed = 60 / fps`** — 60 fps is the 1× reference; motion is constant across any framerate.
2. **World Y axis points up**, so falling = `velocity.y = -1`; the renderer flips Y onto the screen (matching `simple_3d_renderer`'s projection).
3. **The `velocity` getter has side effects** — it advances the hirahira counter, burst velocity, and phase machine, so it is read exactly once per frame.
4. **Position recycling** — when an object drops below `y < -height/8` it is teleported back to the top (mirrors `ElementsFlowView.updateObjPosition`).

## Structure

```
src/
├── lib/
│   ├── math/          # Sp3dV3D vector, VRange, angle constants
│   ├── physics/       # 9 physics classes (1:1 port)
│   ├── creators/      # sakura petal geometry (Bézier)
│   ├── engine/        # engine: position update, rAF loop, Canvas render
│   └── colors/        # material colors
├── components/        # SakuraCanvas render component
└── app/               # Next.js pages
```

## License

MIT. Tribute to the original [sakura_blizzard](https://github.com/MasahideMori-SimpleAppli/sakura_blizzard) (MIT, by Masahide Mori).
