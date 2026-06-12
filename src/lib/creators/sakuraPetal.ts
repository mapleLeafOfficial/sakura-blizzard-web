import { Sp3dV3D } from "../math/Sp3dV3D";
import { Quaternion } from "../math/Quaternion";
import { SakuraBlizzardMaterials } from "../colors/SakuraBlizzardMaterials";
import type { Sp3dObj } from "../engine/types";

///
// (en) Quadratic Bézier sampler standing in for util_simple_3d's
//      UtilBezier.bezierCurve. Returns [n] interior points strictly between
//      p0 and p2 (endpoints excluded), matching the source usage where the
//      caller adds the endpoints separately.
// (ja) util_simple_3d の UtilBezier.bezierCurve の代替。
//      両端を含まない [n] 個の中間点を返す。
///
function bezierCurve(
  p0: Sp3dV3D,
  p1: Sp3dV3D,
  p2: Sp3dV3D,
  n: number,
): Sp3dV3D[] {
  const pts: Sp3dV3D[] = [];
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1);
    const u = 1 - t;
    pts.push(
      new Sp3dV3D(
        u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
        u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
        u * u * p0.z + 2 * u * t * p1.z + t * t * p2.z,
      ),
    );
  }
  return pts;
}

///
// (en) A utility for generating cherry blossom petal objects.
// (ja) 桜の花びらオブジェクトを生成するためのユーティリティ。
///
// 1:1 port of: lib/src/objs/util_sakura_creator.dart
export class UtilSakuraCreator {
  /// (en) Generates the coordinates of the cherry blossom petals centered on
  ///      the (0,0,zPosition) point.
  ///
  /// * [w] : width. * [h] : height. * [notchLen] : The petal notch length.
  /// * [resolution] : The number of points that make up a petal (divisible by 2).
  /// * [zPosition] : base z position.
  ///
  /// Returns 3d sakuraPetal vertices.
  static _sakuraPetalV3d(
    w: number,
    h: number,
    notchLen: number,
    { resolution = 12, zPosition = 0 }: { resolution?: number; zPosition?: number } = {},
  ): Sp3dV3D[] {
    const left = -w / 2;
    const right = w / 2;
    const top = h / 2;
    const bottom = -h / 2;
    const notchCenter = new Sp3dV3D(0, top - notchLen, zPosition);
    const notchLeft = new Sp3dV3D(left / 2, top, zPosition);
    const notchRight = new Sp3dV3D(right / 2, top, zPosition);
    const bottomPoint = new Sp3dV3D(0, bottom, zPosition);
    const mostLeft = new Sp3dV3D(left, 0, zPosition);
    const mostRight = new Sp3dV3D(right, 0, zPosition);

    const r: Sp3dV3D[] = [notchCenter, notchLeft];
    // 逆時計回りで作成
    const splitPoints = Math.floor(resolution / 2);
    r.push(...bezierCurve(notchLeft, mostLeft, bottomPoint, splitPoints));
    r.push(bottomPoint);
    r.push(...bezierCurve(bottomPoint, mostRight, notchRight, splitPoints));
    r.push(notchRight);
    return r;
  }

  /// (en) Generates one cherry blossom petal centered at the (0,0,0) point.
  ///
  /// * [w] : width. * [h] : height. * [notchLen] : The petal notch length.
  /// * [resolution] : The number of points that make up a petal (divisible by 2).
  /// * [zDistance] : The distance between the front and back sides of the petal.
  ///
  /// Returns a Sp3dObj whose outline is vertices[0..frontCount].
  static sakuraPetal(
    w: number,
    h: number,
    notchLen: number,
    { resolution = 12, zDistance = 0.0002 }: { resolution?: number; zDistance?: number } = {},
  ): Sp3dObj {
    const front = this._sakuraPetalV3d(w, h, notchLen, {
      resolution,
      zPosition: zDistance / 2,
    });
    const back = this._sakuraPetalV3d(w, h, notchLen, {
      resolution,
      zPosition: -1 * zDistance / 2,
    }).reverse();
    const frontCount = front.length;
    return {
      vertices: [...front, ...back],
      frontCount,
      material: SakuraBlizzardMaterials.sakura,
      physics: null,
      position: new Sp3dV3D(0, 0, 0),
      rotation: Quaternion.identity(),
      // Expose control points + zDistance so the software-3D renderer can
      // transform them by the quaternion and draw true Bézier curves.
      petalParams: { w, h, notchLen, zDistance },
    };
  }
}
