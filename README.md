# Sakura Blizzard Web

> English | [中文](./README_CN.md)

A **Next.js + Canvas 2D** reimplementation of **sakura_blizzard** — cherry-blossom blizzard and other falling-particle effects, pure web.

This project is a **line-by-line 1:1 port** of the core physics algorithm from the original Flutter/Dart library [sakura_blizzard](https://github.com/MasahideMori-SimpleAppli/sakura_blizzard) to TypeScript, with the original `simple_3d_renderer`-based software 3D rendering replaced by Canvas 2D.

Drop a single `<SakuraBlizzard />` component into any React/Next.js page to get the effect, with a **master switch**, **two featured modes**, and a **live speed control**.

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

- 🧩 **Single public component** `<SakuraBlizzard />` — master switch (on/off), two featured modes, live speed, density, color, brightness.
- 🌸 **5 falling physics** + **4 burst/confetti physics**, strictly ported from the original.
- 🎨 True **quadratic Bézier curves** for the sakura petal outline (mirrors the original `_sakuraPetalV3d`).
- 💡 `Sp3dLight`-style shading: `camTheta` (face normal · view direction) → RGB brightness modulation; tuned pinker/brighter.
- ⏱ Fixed-timestep animation loop, framerate-independent (motion pre-scaled by `60/fps`).
- 🎛 Auto-fills any sized container via `ResizeObserver` — no width/height plumbing.

## Usage (component API)

Everything is encapsulated in one component. Import it and drop it around your content.

```tsx
import { SakuraBlizzard } from "../components/SakuraBlizzard";

export default function Page() {
  return (
    <SakuraBlizzard>
      <h1>桜 Sakura</h1>
    </SakuraBlizzard>
  );
}
```

> The barrel `src/index.ts` re-exports the public API. Once published as a package, use
> `import { SakuraBlizzard } from "sakura-blizzard-web";`.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `enabled` | `boolean` | `true` | **Master switch.** `false` renders nothing — no canvas, no animation loop. |
| `mode` | `"hirahira" \| "spin3d" \| EnumDropType` | `"hirahira"` | Motion mode. Two featured keys (`hirahira` = drifting fall, `spin3d` = 3D tumble), or any `EnumDropType` for the kept algorithms. |
| `speed` | `number` | `1` | **Speed multiplier**, read live. `0` = frozen, `1` = source speed, `2` = 2×. |
| `density` | `number` | `40` | Petal count per depth layer (front + back). |
| `color` | `{ r, g, b }` | `[251,188,206]` | Petal fill color, RGB 0–255. |
| `litBri` | `number` | `1.2` | Brightness when a face fully faces the camera (`>1` brightens). |
| `shadowBri` | `number` | `0.5` | Brightness floor for faces turned away (shadow). |
| `frontSize` | `[min, max]` | `[16, 40]` | Front-layer petal size range (larger = reads as closer). |
| `backSize` | `[min, max]` | `[10, 24]` | Back-layer petal size range. |
| `children` | `ReactNode` | — | Content sandwiched **between** the back and front petal layers. |

### Examples

```tsx
// 1. Master switch — fully on/off
const [on, setOn] = useState(true);
<SakuraBlizzard enabled={on} />

// 2. Switch modes
<SakuraBlizzard mode="spin3d" />          {/* 3D tumble */}
<SakuraBlizzard mode="hirahira" />        {/* drifting fall (default) */}

// 3. Live speed (wire to a slider)
const [speed, setSpeed] = useState(1);
<input type="range" min={0} max={2} step={0.1} value={speed}
       onChange={(e) => setSpeed(parseFloat(e.target.value))} />
<SakuraBlizzard speed={speed} />

// 4. Custom color + density
<SakuraBlizzard color={{ r: 255, g: 182, b: 193 }} density={60} />

// 5. Content between the two petal layers
<SakuraBlizzard mode="hirahira" speed={1}>
  <Hero />
</SakuraBlizzard>
```

### Embedding in an existing page / blog

The component fills its **nearest positioned ancestor** (`position: relative/absolute/fixed`). Put it in a sized, positioned container and pass your page content as `children` so petals fall both in front of and behind it:

```tsx
<section style={{ position: "relative", minHeight: "100vh" }}>
  <SakuraBlizzard enabled mode="hirahira" speed={1}>
    <article style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto" }}>
      {/* your blog content */}
    </article>
  </SakuraBlizzard>
</section>
```

For a fixed full-page background, place it in a `position: fixed; inset: 0` wrapper.

### Standalone petal tuner

`public/petal-demo.html` is a **self-contained** page (no framework) that previews one petal and lets you tune color, brightness, and real sakura-cultivar shapes (Somei Yoshino, Kawazu, Yamazakura, …), then shows the exact values to copy back. Open it at `/petal-demo.html` on the dev server, or double-click the file directly.

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

The demo page (`src/app/page.tsx`) drives the public component live: top buttons switch modes (two featured ★ + three kept), a green/red button is the master switch, and the bottom-left has a speed slider and density control.

## Faithfully preserved invariants

1. **`speed = 60 / fps`** — 60 fps is the 1× reference; motion is constant across any framerate. (The `speed` prop multiplies on top of this.)
2. **World Y axis points up**, so falling = `velocity.y = -1`; the renderer flips Y onto the screen (matching `simple_3d_renderer`'s projection).
3. **The `velocity` getter has side effects** — it advances the hirahira counter, burst velocity, and phase machine, so it is read exactly once per frame.
4. **Position recycling** — when an object drops below `y < -height/8` it is teleported back to the top (mirrors `ElementsFlowView.updateObjPosition`).

## Structure

```
src/
├── index.ts                 # public API barrel (SakuraBlizzard, EnumDropType, Sp3dColor)
├── components/
│   ├── SakuraBlizzard.tsx   # public component: enabled / mode / speed / color ...
│   └── SakuraCanvas.tsx     # lower-level canvas wrapper
├── lib/
│   ├── math/                # Sp3dV3D vector, Quaternion, VRange, constants
│   ├── physics/             # 9 physics classes (1:1 port)
│   ├── creators/            # sakura petal geometry (Bézier)
│   ├── engine/              # engine: position update, rAF loop, software-3D render
│   └── colors/              # material colors
└── app/                     # Next.js demo page
public/
└── petal-demo.html          # standalone tunable petal preview
```

## License

MIT. Tribute to the original [sakura_blizzard](https://github.com/MasahideMori-SimpleAppli/sakura_blizzard) (MIT, by Masahide Mori).
