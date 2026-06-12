import { Sp3dV3D } from "../math/Sp3dV3D";
import { Quaternion } from "../math/Quaternion";
import { VRange } from "../math/VRange";
import { Sp3dConstantValues } from "../math/constants";
import type { Size } from "../math/Size";
import { EnumDropType } from "../EnumDropType";
import { Sp3dPhysics } from "../physics/Sp3dPhysics";
import { BasicDropPhysics } from "../physics/BasicDropPhysics";
import { RainDropPhysics } from "../physics/RainDropPhysics";
import { RotatingDropPhysics } from "../physics/RotatingDropPhysics";
import { SpinDrop3DPhysics } from "../physics/SpinDrop3DPhysics";
import { HirahiraDropPhysics } from "../physics/HirahiraDropPhysics";
import { UtilSakuraCreator } from "../creators/sakuraPetal";
import type { Sp3dObj } from "./types";

export interface EngineOptions {
  enablePositionReset: boolean;
  resetRandomX: boolean;
  /// Global speed multiplier applied to every object's per-tick displacement
  /// and rotation (1 = source speed). 0 freezes, 2 = twice as fast.
  speedScale?: number;
}

/// 软件正交投影后的 2D 点。
interface Pt2 {
  x: number;
  y: number;
}

/// 一个待绘制的面(软件 3D 管线产物,对应 Sp3dFaceObj)。
interface RenderFace {
  /// 6 个投影后的贝塞尔控制点(notchCenter, notchLeft, mostLeft[ctrl],
  /// bottomPoint, mostRight[ctrl], notchRight)。
  pts: Pt2[];
  /// 面法线·视线,已剔除背面故 ∈ [0,1]。
  camTheta: number;
  /// 面中心到相机的距离,用于 painter's algorithm 深度排序。
  dist: number;
  material: { r: number; g: number; b: number };
}

///
// (en) Accumulates angularVelocity about rotateAxis into the orientation
//      quaternion. This is the input to the "vertex transform" stage — the
//      renderer later rotates local control points by obj.rotation.
//      (Plan B: true 3D accumulation; replaces the old rotationZ/flip split.)
// (ja) angularVelocity をクォータニオンに蓄積する(真の3D回転)。
///
function applyAngularDelta(obj: Sp3dObj, axis: Sp3dV3D, angle: number): void {
  obj.rotation = obj.rotation
    .multiply(Quaternion.fromAxisAngle(axis, angle))
    .normalize();
}

///
// (en) Updates one object's position/rotation for a single tick.
//      1:1 port of ElementsFlowView.updateObjPosition (rotation via quaternion).
//      CRITICAL: physics.velocity is read EXACTLY ONCE — it advances internal
//      state (hirahira counter, burst velocity, phase machine) as a side effect.
// (ja) 1フレーム分の更新。ElementsFlowView.updateObjPosition の 1:1 移植。
///
export function updateObjPosition(
  obj: Sp3dObj,
  viewSize: Size,
  opts: EngineOptions,
): void {
  const physics = obj.physics;
  if (!physics) return;

  // obj.move(obj.physics!.velocity!) — read ONCE (advances internal state).
  const vel = physics.velocity;
  if (vel === null) return;
  const s = opts.speedScale ?? 1;
  obj.position = obj.position.add(vel.mul(s));

  // reset position
  if (obj.position.y < -1 * (viewSize.height / 8)) {
    if (opts.enablePositionReset) {
      if (opts.resetRandomX) {
        // diff = (0,0,0) - center; move(diff); then move to random-x top.
        obj.position = new Sp3dV3D(
          viewSize.width * Math.random(),
          viewSize.height * 1.125,
          0,
        );
      } else {
        obj.position = obj.position.add(
          new Sp3dV3D(0, viewSize.height * 1.125, 0),
        );
      }
    }
  }

  // object rotation: obj.rotateInPlace(axis, angularVelocity) via quaternion.
  const axis = physics.rotateAxis;
  const av = physics.angularVelocity;
  if (axis !== null && av !== null) {
    applyAngularDelta(obj, axis, av * s);
  }
}

///
// (en) Maps EnumDropType to a fresh physics instance.
//      1:1 port of each view's _getDropPhysics.
// (ja) EnumDropType を新しい Physics インスタンスに変換。
///
// 1:1 port of: lib/src/views/*_view.dart → _getDropPhysics
export function getDropPhysics(
  dropType: EnumDropType,
  viewSize: Size,
  fps: number,
): Sp3dPhysics {
  switch (dropType) {
    case EnumDropType.rotatingDrop:
      return new RotatingDropPhysics({ fps });
    case EnumDropType.spinDrop3D:
      return new SpinDrop3DPhysics({ fps });
    case EnumDropType.hirahiraDrop:
      return new HirahiraDropPhysics(viewSize, { fps });
    case EnumDropType.basicDrop:
      return new BasicDropPhysics({ fps });
    case EnumDropType.rainDrop:
      return new RainDropPhysics({ fps });
  }
}

///
// (en) Creates one sakura-petal object with physics + random size/rotation/pos.
//      1:1 port of SakuraBlizzardView.createObj.
// (ja) Physics・ランダムなサイズ/回転/位置を持つ桜オブジェクトを生成。
///
// 1:1 port of: lib/src/views/sakura_blizzard_view.dart → createObj
export function createSakuraPetalObj(
  viewSize: Size,
  targetSize: VRange,
  physics: Sp3dPhysics,
  isRandomPositionY: boolean,
): Sp3dObj {
  const objSize = targetSize.getRandomInRange();
  // UtilSakuraCreator.sakuraPetal(objSize / 1.5, objSize, objSize / 6)
  const obj = UtilSakuraCreator.sakuraPetal(objSize / 1.5, objSize, objSize / 6);
  obj.physics = physics;

  // r.rotate(rotateAxis, rand * 360deg) — initial random orientation (3D).
  if (physics.rotateAxis !== null) {
    const angle = Math.random() * 360 * Sp3dConstantValues.toRadian;
    applyAngularDelta(obj, physics.rotateAxis, angle);
  }

  // initial position
  if (isRandomPositionY) {
    obj.position = new Sp3dV3D(
      viewSize.width * Math.random(),
      viewSize.height * 1.125 * Math.random(),
      0,
    );
  } else {
    obj.position = new Sp3dV3D(viewSize.width * Math.random(), 0, 0);
  }
  return obj;
}

///
// (en) The 6 local Bézier control points of one petal face (front or back).
//      Order: notchCenter, notchLeft, mostLeft(ctrl), bottomPoint,
//      mostRight(ctrl), notchRight — traced as two quadratic Béziers, matching
//      _sakuraPetalV3d exactly. Back face is reversed (source does .reversed).
// (ja) 花びら1面の6個のローカルベジェ制御点。
///
function sakuraControlPoints(
  p: { w: number; h: number; notchLen: number; zDistance: number },
  front: boolean,
): Sp3dV3D[] {
  const left = -p.w / 2;
  const right = p.w / 2;
  const top = p.h / 2;
  const bottom = -p.h / 2;
  const z = front ? p.zDistance / 2 : -p.zDistance / 2;
  const pts = [
    new Sp3dV3D(0, top - p.notchLen, z), // notchCenter
    new Sp3dV3D(left / 2, top, z), // notchLeft
    new Sp3dV3D(left, 0, z), // mostLeft (Bézier control)
    new Sp3dV3D(0, bottom, z), // bottomPoint
    new Sp3dV3D(right, 0, z), // mostRight (Bézier control)
    new Sp3dV3D(right / 2, top, z), // notchRight
  ];
  return front ? pts : pts.slice().reverse();
}

///
// (en) Software-3D render pipeline (Plan B). Mirrors simple_3d_renderer:
//      camera.getPrams (vertex transform + face normal + camTheta + dist +
//      back-face cull) → painter's-algorithm depth sort → Sp3dLight.apply
//      shading → canvas drawPath per face.
//
//      For each petal, for each face (front/back):
//        1. Rotate local control points by the orientation quaternion and
//           translate by position → world-space control points (Bézier is
//           affine-invariant, so transforming the controls transforms the
//           whole curve exactly).
//        2. Face normal = quaternion · local (0,0,±1).
//        3. camTheta = dot(normal, normalize(faceCenter → camera)).
//        4. Cull back faces (camTheta < 0).
//        5. Project to screen (orthographic; Y flipped to screen-down).
//      Then depth-sort all faces (far first) and draw each shaded by camTheta.
// (ja) ソフトウェア3Dレンダリングパイプライン。
///
export function drawScene(
  ctx: CanvasRenderingContext2D,
  layers: Sp3dObj[][],
  viewSize: Size,
  litBri: number,
  shadowBri: number,
): void {
  // Camera at screen center, looking toward -z (matches ElementsFlowView:
  // Sp3dOrthographicCamera at (w/2, h/2, 3000)).
  const camX = viewSize.width / 2;
  const camY = viewSize.height / 2;
  const camZ = 3000;

  const faces: RenderFace[] = [];
  for (const objs of layers) {
    for (const obj of objs) {
      if (!obj.petalParams) continue; // only petal-shaped objects so far
      const p = obj.petalParams;
      const rot = obj.rotation;
      for (const front of [true, false]) {
        // Face normal: rotated local +z (front) / -z (back).
        const localNormal = front ? new Sp3dV3D(0, 0, 1) : new Sp3dV3D(0, 0, -1);
        const normal = rot.rotate(localNormal);
        // Face center: position + rotated local (0,0,±zDistance/2).
        const localCenter = new Sp3dV3D(
          0,
          0,
          front ? p.zDistance / 2 : -p.zDistance / 2,
        );
        const cx = obj.position.x;
        const cy = obj.position.y;
        const cz = obj.position.z;
        const cc = rot.rotate(localCenter);
        const centerX = cx + cc.x;
        const centerY = cy + cc.y;
        const centerZ = cz + cc.z;
        // View direction: face center → camera.
        const vx = camX - centerX;
        const vy = camY - centerY;
        const vz = camZ - centerZ;
        const dist = Math.sqrt(vx * vx + vy * vy + vz * vz);
        const inv = dist === 0 ? 0 : 1 / dist;
        const camTheta =
          normal.x * vx * inv + normal.y * vy * inv + normal.z * vz * inv;
        if (camTheta < 0) continue; // back-face cull (mirrors source)
        // Transform control points: local → world (rotate + translate) → screen.
        const pts: Pt2[] = sakuraControlPoints(p, front).map((lp) => {
          const wp = rot.rotate(lp);
          return {
            x: obj.position.x + wp.x,
            y: viewSize.height - (obj.position.y + wp.y), // orthographic + Y flip
          };
        });
        faces.push({ pts, camTheta, dist, material: obj.material });
      }
    }
  }

  // Painter's algorithm: draw far faces first (descending dist).
  faces.sort((a, b) => b.dist - a.dist);

  ctx.clearRect(0, 0, viewSize.width, viewSize.height);
  for (const f of faces) {
    drawFace(ctx, f, litBri, shadowBri);
  }
}

///
// (en) Draws one face: Bézier outline (quadraticCurveTo, 1:1 with the source
//      petal) filled + stroked with camTheta-shaded color.
// (ja) 1面を描画:ベジェ輪郭を camTheta シェード色で塗りつぶし+枠線。
///
function drawFace(
  ctx: CanvasRenderingContext2D,
  f: RenderFace,
  litBri: number,
  shadowBri: number,
): void {
  // Shading (Sp3dLight.apply, syncCam + tuned brightness range):
  //   brightness interpolates in [shadowBri, litBri] over camTheta ∈ [0,1].
  //   litBri > 1 brightens faces turned toward the camera (tuned in
  //   petal-demo: pinker base + brighter lit end). color = fillColor * bri.
  const t = Math.max(0, Math.min(1, f.camTheta));
  const brightness = shadowBri + (litBri - shadowBri) * t;
  const clip = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v * brightness)));
  const { r, g, b } = f.material;
  const col = `rgb(${clip(r)},${clip(g)},${clip(b)})`;
  const p = f.pts;
  ctx.beginPath();
  ctx.moveTo(p[0].x, p[0].y);
  ctx.lineTo(p[1].x, p[1].y);
  ctx.quadraticCurveTo(p[2].x, p[2].y, p[3].x, p[3].y);
  ctx.quadraticCurveTo(p[4].x, p[4].y, p[5].x, p[5].y);
  ctx.lineTo(p[0].x, p[0].y);
  ctx.closePath();
  ctx.fillStyle = col;
  ctx.fill();
  // 1px stroke mirrors Sp3dMaterial(fillColor, true, strokeWidth=1, fillColor).
  ctx.lineWidth = 1;
  ctx.strokeStyle = col;
  ctx.stroke();
}
