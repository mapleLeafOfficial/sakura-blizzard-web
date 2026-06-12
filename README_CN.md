# Sakura Blizzard Web

> [English](./README.md) | 中文

**sakura_blizzard** 的 Next.js + Canvas 2D 重构版 —— 樱花飘雪等粒子特效的纯 Web 实现。

本项目将原 Flutter/Dart 库 [sakura_blizzard](https://github.com/MasahideMori-SimpleAppli/sakura_blizzard) 的**核心物理算法逐行 1:1 移植**到 TypeScript,并用 Canvas 2D 替代了原版基于 `simple_3d_renderer` 的软件 3D 渲染。

在任何 React/Next.js 页面里放一个 `<SakuraBlizzard />` 组件即可获得特效,带**总开关**、**两种主打模式**和**实时速度调节**。

---

## 与原仓库的关系

|  | 原项目 | 本项目 |
|---|---|---|
| 仓库 | [MasahideMori-SimpleAppli/sakura_blizzard](https://github.com/MasahideMori-SimpleAppli/sakura_blizzard) | mapleLeafOfficial/sakura-blizzard-web |
| 技术栈 | Flutter / Dart | Next.js / TypeScript / Canvas 2D |
| 版本 | v6.1.2 | 移植版 |
| 渲染 | `simple_3d_renderer`(自研软件 3D 引擎) | Canvas 2D(正交投影 + Y 翻转) |
| 物理 | `Sp3dPhysics` 子类(Dart) | 同名 TS 类,**算法逐行一致** |

- 这是**非官方**的移植,感谢原作者 [Masahide Mori](https://github.com/MasahideMori-SimpleAppli) 的工作。
- **严格 1:1 移植**的范围:9 个物理类、向量数学(`Sp3dV3D`)、樱花花瓣几何(贝塞尔曲线)、引擎循环与位置回收。这些保留了原版的全部不变量:`speed=60/fps` 帧率归一化、世界 Y 轴朝上、`velocity` 的副作用状态推进、爆炸物理的三段相位机。
- **重写**的范围:渲染层。原版 `simple_3d_renderer` 是纯 Dart 手写的软件 3D 引擎(正交相机、面法线、painter's algorithm 深度排序、`Sp3dLight` 光照),Web 端无直接对应物,故用 Canvas 2D 近似实现(世界 Y 翻转投影、`camTheta → RGB 相乘` 的亮度调制)。

## 特性

- 🧩 **单一公共组件** `<SakuraBlizzard />` —— 总开关(开/关)、两种主打模式、实时速度、数量、颜色、亮度。
- 🌸 **5 种下落物理** + **4 种爆炸/彩纸物理**,严格移植自原版。
- 🎨 真正的**二次贝塞尔曲线**绘制樱花花瓣(对应原 `_sakuraPetalV3d`)。
- 💡 `Sp3dLight` 式光照:`camTheta`(面法线·视线方向)→ RGB 亮度调制;已调成更粉更亮。
- ⏱ 固定时间步长动画循环,帧率无关(物理速度按 `60/fps` 归一化)。
- 🎛 用 `ResizeObserver` 自动铺满任意尺寸容器,无需手动传宽高。

## 使用教程(组件 API)

所有能力都封装在一个组件里。导入后包裹你的内容即可。

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

> 导出入口在 `src/index.ts`(barrel)。发布为 npm 包后可写成
> `import { SakuraBlizzard } from "sakura-blizzard-web";`。

### Props 参数表

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `enabled` | `boolean` | `true` | **总开关。** `false` 时完全不渲染 —— 没有 canvas、不跑动画循环。 |
| `mode` | `"hirahira" \| "spin3d" \| EnumDropType` | `"hirahira"` | 运动模式。两个主打键(`hirahira`=飘落摇曳,`spin3d`=3D 翻滚),或传任意 `EnumDropType` 用保留的其他算法。 |
| `speed` | `number` | `1` | **速度倍率**,实时生效。`0`=静止,`1`=原速,`2`=两倍速。 |
| `density` | `number` | `40` | 每层花瓣数量(前后共两层)。 |
| `color` | `{ r, g, b }` | `[251,188,206]` | 花瓣颜色,RGB 0–255。 |
| `litBri` | `number` | `1.2` | 面向相机时的最亮增益(`>1` 更亮)。 |
| `shadowBri` | `number` | `0.5` | 侧背面的阴影底亮度。 |
| `frontSize` | `[min, max]` | `[16, 40]` | 前层花瓣尺寸范围(更大=看起来更近)。 |
| `backSize` | `[min, max]` | `[10, 24]` | 后层花瓣尺寸范围。 |
| `children` | `ReactNode` | — | 被前后两层花瓣**夹在中间**的内容。 |

### 示例

```tsx
// 1. 总开关 —— 全开 / 全关
const [on, setOn] = useState(true);
<SakuraBlizzard enabled={on} />

// 2. 切换模式
<SakuraBlizzard mode="spin3d" />          {/* 3D 翻滚 */}
<SakuraBlizzard mode="hirahira" />        {/* 飘落摇曳(默认)*/}

// 3. 实时调速(接滑杆)
const [speed, setSpeed] = useState(1);
<input type="range" min={0} max={2} step={0.1} value={speed}
       onChange={(e) => setSpeed(parseFloat(e.target.value))} />
<SakuraBlizzard speed={speed} />

// 4. 自定义颜色 + 数量
<SakuraBlizzard color={{ r: 255, g: 182, b: 193 }} density={60} />

// 5. 内容夹在两层花瓣之间
<SakuraBlizzard mode="hirahira" speed={1}>
  <Hero />
</SakuraBlizzard>
```

### 嵌入现有页面 / 博客

组件会铺满**最近的定位父容器**(`position: relative/absolute/fixed`)。放进一个有尺寸、有定位上下文的容器,把页面内容作为 `children` 传入,花瓣就会从内容前后两侧飘过:

```tsx
<section style={{ position: "relative", minHeight: "100vh" }}>
  <SakuraBlizzard enabled mode="hirahira" speed={1}>
    <article style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto" }}>
      {/* 你的博客正文 */}
    </article>
  </SakuraBlizzard>
</section>
```

若要做固定全屏背景,外层用 `position: fixed; inset: 0`。

### 独立花瓣调节台

`public/petal-demo.html` 是一个**自包含**网页(无框架依赖),实时预览单片花瓣,可调颜色、亮度、以及真实樱花品种的形状(染井吉野、河津桜、山桜……),并显示可直接抄走的数值。dev server 下访问 `/petal-demo.html`,或直接双击该文件打开。

## 物理算法对照表

| 原 Dart 类 | 本项目 TS 类 | 效果 |
|---|---|---|
| `BasicDropPhysics` | `BasicDropPhysics` | 匀速直线下落 |
| `RainDropPhysics` | `RainDropPhysics` | 12 倍速直落 |
| `RotatingDropPhysics` | `RotatingDropPhysics` | 绕屏幕法线平面旋转下落 |
| `SpinDrop3DPhysics` | `SpinDrop3DPhysics` | 绕 `(1,1,0)` 轴 3D 翻滚下落 |
| `HirahiraDropPhysics` | `HirahiraDropPhysics` | 樱花招牌:正弦波左右摇曳下落 |
| `PopPhysics` | `PopPhysics` | 全向爆炸(惊喜盒) |
| `DirectionalPopPhysics` | `DirectionalPopPhysics` | 定向爆炸(礼炮) |
| `ConfettiHirahiraPhysics` | `ConfettiHirahiraPhysics` | 全向爆炸 → 平滑过渡 → 飘落 |
| `DirectionalConfettiHirahiraPhysics` | `DirectionalConfettiHirahiraPhysics` | 定向爆炸 → 平滑过渡 → 飘落 |

## 快速开始

```bash
npm install
npm run dev
# 打开 http://localhost:3000
```

demo 页(`src/app/page.tsx`)实时驱动公共组件:顶部按钮切换模式(两个主打 ★ + 三个保留),绿/红按钮是总开关,左下角有速度滑杆和数量调节。

## 严格保留的不变量

1. **`speed = 60 / fps`** —— 以 60fps 为 1× 基准,任意帧率下运动速度恒定。(`speed` 参数在此之上再乘一个倍率。)
2. **世界 Y 轴朝上**,下落 = `velocity.y = -1`;渲染时翻转 Y 映射到屏幕(与 `simple_3d_renderer` 的投影一致)。
3. **`velocity` getter 有副作用** —— 推进 hirahira 计数器、爆炸速度、相位机,每帧只读取一次。
4. **位置回收** —— 对象落到 `y < -height/8` 时传送回顶部(对应 `ElementsFlowView.updateObjPosition`)。

## 目录结构

```
src/
├── index.ts                 # 公共 API 导出(SakuraBlizzard、EnumDropType、Sp3dColor)
├── components/
│   ├── SakuraBlizzard.tsx   # 公共组件:enabled / mode / speed / color ...
│   └── SakuraCanvas.tsx     # 底层 canvas 包装
├── lib/
│   ├── math/                # Sp3dV3D 向量、Quaternion、VRange、常量
│   ├── physics/             # 9 个物理类(1:1 移植)
│   ├── creators/            # 樱花花瓣几何(贝塞尔)
│   ├── engine/              # 引擎:位置更新、rAF 循环、软件 3D 渲染
│   └── colors/              # 材质颜色
└── app/                     # Next.js demo 页
public/
└── petal-demo.html          # 独立花瓣调节预览
```

## License

MIT。致敬原项目 [sakura_blizzard](https://github.com/MasahideMori-SimpleAppli/sakura_blizzard)(MIT,作者 Masahide Mori)。
