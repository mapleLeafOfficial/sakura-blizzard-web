///
// (en) A 3D vector. 1:1 port of simple_3d's Sp3dV3D, exposing only the
//      operations actually used by sakura_blizzard (add/sub/mul/len/nor/rotated).
// (ja) 3次元ベクトル。sakura_blizzard が実際に使う演算のみ移植。
///
// 1:1 port of: simple_3d Sp3dV3D
export class Sp3dV3D {
  constructor(
    public x: number,
    public y: number,
    public z: number,
  ) {}

  static ZERO = new Sp3dV3D(0, 0, 0);

  /// v1 + v2  (Dart operator overload `+`)
  add(o: Sp3dV3D): Sp3dV3D {
    return new Sp3dV3D(this.x + o.x, this.y + o.y, this.z + o.z);
  }

  /// this - o  (Dart operator overload `-`)
  sub(o: Sp3dV3D): Sp3dV3D {
    return new Sp3dV3D(this.x - o.x, this.y - o.y, this.z - o.z);
  }

  /// this * scalar  (Dart operator overload `*`)
  mul(s: number): Sp3dV3D {
    return new Sp3dV3D(this.x * s, this.y * s, this.z * s);
  }

  /// Vector magnitude. (Dart: len())
  len(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  /// Normalized vector. (Dart: nor())
  nor(): Sp3dV3D {
    const l = this.len();
    return l === 0 ? new Sp3dV3D(0, 0, 0) : this.mul(1 / l);
  }

  /// (en) Rotate this vector around [axis] by [theta] radians (Rodrigues).
  ///      1:1 port of simple_3d Sp3dV3D.rotated.
  /// (ja) [axis] 周りに [theta] ラジアン回転させたベクトルを返す（ロドリゲスの公式）。
  ///
  /// * [axis] : The rotation axis (normalized internally, matching simple_3d).
  /// * [theta] : Rotation angle in radians.
  rotated(axis: Sp3dV3D, theta: number): Sp3dV3D {
    const k = axis.nor();
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    const dot = k.x * this.x + k.y * this.y + k.z * this.z;
    const cross = new Sp3dV3D(
      k.y * this.z - k.z * this.y,
      k.z * this.x - k.x * this.z,
      k.x * this.y - k.y * this.x,
    );
    return new Sp3dV3D(
      this.x * c + cross.x * s + k.x * dot * (1 - c),
      this.y * c + cross.y * s + k.y * dot * (1 - c),
      this.z * c + cross.z * s + k.z * dot * (1 - c),
    );
  }
}
