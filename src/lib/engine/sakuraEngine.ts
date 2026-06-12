import { Sp3dV3D } from "../math/Sp3dV3D";
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
}

///
// (en) Decomposes a 3D axis rotation into the two 2D-renderable scalars.
//      The PHYSICS (angularVelocity) is exact; only the screen projection is a
//      Canvas-2D approximation: a screen-normal axis (z) maps to ctx.rotate,
//      a tilted axis (e.g. (1,1,0)) maps to a flip via ctx.scale(cos, 1).
// (ja) 3D 軸回転を 2D 描画可能な2つのスカラーに分解。物理量は厳密、投影のみ近似。
///
function applyAngularDelta(obj: Sp3dObj, axis: Sp3dV3D, angle: number): void {
  const nz = Math.abs(axis.nor().z);
  if (nz > 0.5) {
    // Screen-normal axis: pure in-plane rotation.
    obj.rotationZ += angle;
  } else {
    // Tilted axis: petal tumble, faked as an x-flip.
    obj.flip += angle;
  }
}

///
// (en) Updates one object's position/rotation for a single tick.
//      1:1 port of ElementsFlowView.updateObjPosition.
//
//      CRITICAL: physics.velocity is read EXACTLY ONCE — it advances internal
//      state (hirahira counter, burst velocity, phase machine) as a side effect.
// (ja) 1フレーム分の位置・回転更新。ElementsFlowView.updateObjPosition の 1:1 移植。
//      velocity は副作用で状態を進めるため、1回のみ参照する。
///
// 1:1 port of: lib/src/views/elements_flow_view.dart → updateObjPosition
export function updateObjPosition(obj: Sp3dObj, viewSize: Size, opts: EngineOptions): void {
  const physics = obj.physics;
  if (!physics) return;

  // obj.move(obj.physics!.velocity!) — read ONCE.
  const vel = physics.velocity;
  if (vel === null) return;
  obj.position = obj.position.add(vel);

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
        obj.position = obj.position.add(new Sp3dV3D(0, viewSize.height * 1.125, 0));
      }
    }
  }

  // object rotation
  const axis = physics.rotateAxis;
  const av = physics.angularVelocity;
  if (axis !== null && av !== null) {
    // obj.rotateInPlace(axis, angularVelocity) — projected to 2D above.
    applyAngularDelta(obj, axis, av);
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

  // r.rotate(rotateAxis, rand * 360deg) — initial random orientation.
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
// (en) Renders all layers to the canvas. Orthographic projection: z is ignored,
//      objects are drawn in layer order (back first, so front overlays).
//
//      Y-AXIS FLIP (mirrors simple_3d_renderer's projection): the physics work
//      in a world where +Y is UP (standard right-handed 3D), so falling is
//      velocity.y = -1 and recycling happens when y < -height/8. The renderer
//      flips Y when mapping to the screen (where +Y is DOWN). We must do the
//      same here, otherwise petals fly upward instead of falling.
// (ja) 全レイヤをキャンバスに描画。正交投影:z は無視、レイヤ順に描画。
//      物理は +Y が上向きの世界座標で動くため、画面 (+Y 下向き) への
//      投影で Y を反転する（simple_3d_renderer と同じ）。
///
export function drawScene(
  ctx: CanvasRenderingContext2D,
  layers: Sp3dObj[][],
  viewSize: Size,
  minBrightness: number,
): void {
  ctx.clearRect(0, 0, viewSize.width, viewSize.height);
  ctx.save();
  // Flip world-Y (up) to screen-Y (down), matching simple_3d_renderer.
  ctx.translate(0, viewSize.height);
  ctx.scale(1, -1);
  for (const objs of layers) {
    for (const obj of objs) {
      drawPetal(ctx, obj, minBrightness);
    }
  }
  ctx.restore();
}

///
// (en) Draws one petal. When petalParams is present the outline is traced as
//      true quadratic Bézier curves — a 1:1 match for the source petal, whose
//      two edges are bezierCurve(notchLeft, mostLeft, bottomPoint) and
//      bezierCurve(bottomPoint, mostRight, notchRight). Canvas quadraticCurveTo
//      takes the same (controlPoint, endPoint), so the curves are exact, not
//      sampled. Shading uses minBrightness (Sp3dLight) brightened by how
//      face-on the petal is; the 1px stroke mirrors Sp3dMaterial strokeWidth.
// (ja) 花びら1枚を描画。petalParams があれば真の二次ベジェ曲線で輪郭を描く。
///
function drawPetal(
  ctx: CanvasRenderingContext2D,
  obj: Sp3dObj,
  minBrightness: number,
): void {
  ctx.save();
  ctx.translate(obj.position.x, obj.position.y);
  ctx.rotate(obj.rotationZ);
  // Tilted-axis tumble is faked as an x-scale of cos(flip): 1 → 0 → -1 → 0 → 1,
  // which reads as the petal turning edge-on then showing its back.
  const c = Math.cos(obj.flip);
  ctx.scale(c, 1);

  ctx.beginPath();
  if (obj.petalParams) {
    const { w, h, notchLen } = obj.petalParams;
    const left = -w / 2;
    const right = w / 2;
    const top = h / 2;
    const bottom = -h / 2;
    // Control points from _sakuraPetalV3d, traced as quadratic Béziers.
    ctx.moveTo(0, top - notchLen); // notchCenter
    ctx.lineTo(left / 2, top); // notchLeft
    ctx.quadraticCurveTo(left, 0, 0, bottom); // via mostLeft → bottomPoint
    ctx.quadraticCurveTo(right, 0, right / 2, top); // via mostRight → notchRight
    ctx.lineTo(0, top - notchLen); // back to notchCenter
  } else {
    // Polygon fallback for non-petal objects.
    const outline = obj.vertices.slice(0, obj.frontCount);
    for (let i = 0; i < outline.length; i++) {
      const p = outline[i];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
  }
  ctx.closePath();

  // Shading (faithful to Sp3dLight.apply + camera.camTheta):
  //   camTheta = dot(face normal, view dir); visible face ∈ [0,1], 1=head-on.
  //   brightness = camTheta.clamp(0,1); if < minBrightness then minBrightness.
  //   color = fillColor * brightness  (per-channel RGB multiply, NOT alpha —
  //   the petal stays opaque and just darkens, exactly like the source).
  // Our single-layer flip approximation shows |cos(flip)| as face-on-ness.
  const camTheta = Math.abs(c);
  const brightness = Math.max(minBrightness, camTheta);
  const { r, g, b } = obj.material;
  const col = `rgb(${Math.round(r * brightness)},${Math.round(g * brightness)},${Math.round(b * brightness)})`;
  ctx.fillStyle = col;
  ctx.fill();
  // 1px stroke mirrors Sp3dMaterial(fillColor, true, strokeWidth=1, fillColor).
  ctx.lineWidth = 1;
  ctx.strokeStyle = col;
  ctx.stroke();
  ctx.restore();
}
