import { Sp3dV3D } from "./Sp3dV3D";

///
// (en) A unit quaternion for accumulating 3D rotation without gimbal lock.
//      Used by the software-3D renderer (Plan B) to track each petal's
//      orientation. The original simple_3d rotates vertices in place; a
//      quaternion lets us accumulate angularVelocity about arbitrary axes
//      (e.g. Spin3D's (1,1,0)) stably and renormalize away float drift.
// (ja) ジンバルロックなしで3D回転を蓄積する単位クォータニオン。
///
export class Quaternion {
  constructor(
    public w: number,
    public x: number,
    public y: number,
    public z: number,
  ) {}

  static identity(): Quaternion {
    return new Quaternion(1, 0, 0, 0);
  }

  /// (en) Build from an axis (normalized internally) and an angle in radians.
  static fromAxisAngle(axis: Sp3dV3D, angle: number): Quaternion {
    const a = axis.nor();
    const half = angle / 2;
    const s = Math.sin(half);
    return new Quaternion(Math.cos(half), a.x * s, a.y * s, a.z * s);
  }

  /// (en) Hamilton product this * q (q applied after this).
  multiply(q: Quaternion): Quaternion {
    const { w, x, y, z } = this;
    return new Quaternion(
      w * q.w - x * q.x - y * q.y - z * q.z,
      w * q.x + x * q.w + y * q.z - z * q.y,
      w * q.y - x * q.z + y * q.w + z * q.x,
      w * q.z + x * q.y - y * q.x + z * q.w,
    );
  }

  /// (en) Renormalize to unit length (call after multiplying to kill drift).
  normalize(): Quaternion {
    const n = Math.sqrt(
      this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z,
    );
    if (n === 0) return Quaternion.identity();
    return new Quaternion(this.w / n, this.x / n, this.y / n, this.z / n);
  }

  /// (en) Rotate vector v by this quaternion (v' = q v q*), expanded form.
  rotate(v: Sp3dV3D): Sp3dV3D {
    const { w, x, y, z } = this;
    // t = 2 * cross(q.xyz, v)
    const tx = 2 * (y * v.z - z * v.y);
    const ty = 2 * (z * v.x - x * v.z);
    const tz = 2 * (x * v.y - y * v.x);
    return new Sp3dV3D(
      v.x + w * tx + (y * tz - z * ty),
      v.y + w * ty + (z * tx - x * tz),
      v.z + w * tz + (x * ty - y * tx),
    );
  }
}
