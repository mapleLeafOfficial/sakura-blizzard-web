# Sakura Blizzard Web

> [English](./README_EN.md) | 中文

**sakura_blizzard** 的 Next.js + Canvas 2D 重构版 —— 樱花飘雪等粒子特效的纯 Web 实现。

本项目将原 Flutter/Dart 库 [sakura_blizzard](https://github.com/MasahideMori-SimpleAppli/sakura_blizzard) 的**核心物理算法逐行 1:1 移植**到 TypeScript,并用 Canvas 2D 替代了原版基于 `simple_3d_renderer` 的软件 3D 渲染。

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

- 🌸 **5 种下落物理** + **4 种爆炸/彩纸物理**,严格移植自原版
- 🎨 真正的**二次贝塞尔曲线**绘制樱花花瓣(对应原 `_sakuraPetalV3d`)
- 💡 `Sp3dLight` 式光照:`camTheta`(面法线·视线方向)→ RGB 亮度调制
- ⏱ 固定时间步长动画循环,帧率无关(物理速度按 `60/fps` 归一化)
- 🎛 可实时切换 dropType 对比各算法

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

顶部按钮切换 5 种下落算法,左下角调整每层粒子数量。

## 严格保留的不变量

1. **`speed = 60 / fps`** —— 以 60fps 为 1× 基准,任意帧率下运动速度恒定。
2. **世界 Y 轴朝上**,下落 = `velocity.y = -1`;渲染时翻转 Y 映射到屏幕(与 `simple_3d_renderer` 的投影一致)。
3. **`velocity` getter 有副作用** —— 推进 hirahira 计数器、爆炸速度、相位机,每帧只读取一次。
4. **位置回收** —— 对象落到 `y < -height/8` 时传送回顶部(对应 `ElementsFlowView.updateObjPosition`)。

## 目录结构

```
src/
├── lib/
│   ├── math/          # Sp3dV3D 向量、VRange、角度常量
│   ├── physics/       # 9 个物理类(1:1 移植)
│   ├── creators/      # 樱花花瓣几何(贝塞尔)
│   ├── engine/        # 引擎:位置更新、rAF 循环、Canvas 渲染
│   └── colors/        # 材质颜色
├── components/        # SakuraCanvas 渲染组件
└── app/               # Next.js 页面
```

## License

MIT。致敬原项目 [sakura_blizzard](https://github.com/MasahideMori-SimpleAppli/sakura_blizzard)(MIT,作者 Masahide Mori)。
