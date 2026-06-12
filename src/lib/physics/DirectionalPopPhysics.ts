import { Sp3dV3D } from "../math/Sp3dV3D";
import { Sp3dPhysics } from "./Sp3dPhysics";

///
// (en) A class for physics calculations that simulates confetti bursting in a
//      specified direction, like a confetti cannon. Each object flies outward
//      within a spread angle around the given direction, then gradually falls
//      under gravity with air resistance. Once the velocity drops near zero, the
//      object stops automatically.
// (ja) クラッカーのように、指定した方向に向かって紙吹雪が飛び散る動きを
//      シミュレートする物理演算クラスです。
///
// 1:1 port of: lib/src/physics/directional_pop_physics.dart
export class DirectionalPopPhysics extends Sp3dPhysics {
  /// 現在の速度ベクトル（内部状態）
  private _vx: number;
  private _vy: number;

  /// 重力加速度（毎フレーム _vy に加算される）
  readonly gravity: number;

  /// 空気抵抗による減衰率（0〜1、1に近いほど減衰しない）
  readonly damping: number;

  /// 速度がこの値を下回ったら停止とみなす閾値
  readonly stopThreshold: number;

  /// 回転関連パラメータ
  rotationSpeed: number;
  rotationDirection: number;

  /// fpsによらず速度を一定にするためのパラメータ
  readonly fps: number;

  /// * [direction] : The direction and strength of the explosion.
  ///   The vector's magnitude is used as the base burst speed.
  /// * [spreadAngle] : The spread angle in radians around [direction].
  ///   0 = all fly exactly the same direction. pi = half-sphere. 2*pi = full random.
  /// * [speedVariance] : Random variance added to the base burst speed.
  /// * [gravity] / [damping] / [stopThreshold] / [rotationSpeed] /
  ///   [rotationDirection] / [fps] : see PopPhysics.
  constructor({
    direction,
    spreadAngle = Math.PI / 4,
    speedVariance = 2.0,
    gravity = 0.15,
    damping = 0.98,
    stopThreshold = 0.01,
    rotationSpeed,
    rotationDirection,
    fps = 60,
  }: {
    direction: Sp3dV3D;
    spreadAngle?: number;
    speedVariance?: number;
    gravity?: number;
    damping?: number;
    stopThreshold?: number;
    rotationSpeed?: number;
    rotationDirection?: number;
    fps?: number;
  }) {
    super();
    this.gravity = gravity;
    this.damping = damping;
    this.stopThreshold = stopThreshold;
    this.fps = fps;

    this._vx = 0;
    this._vy = 0;

    // direction の大きさを基本速度として使用
    const magnitude = direction.len();
    const baseAngle = Math.atan2(direction.y, direction.x);

    // 拡散角の範囲内でランダムにオフセット
    const angleOffset = (Math.random() - 0.5) * spreadAngle;
    const finalAngle = baseAngle + angleOffset;

    // 速度のばらつきを加算
    const finalSpeed = magnitude + Math.random() * speedVariance;
    this._vx = Math.cos(finalAngle) * finalSpeed;
    this._vy = Math.sin(finalAngle) * finalSpeed;

    this.rotationSpeed = rotationSpeed ?? Math.random() / 10 + 0.01;
    this.rotationDirection = rotationDirection ?? (Math.random() < 0.5 ? 1 : -1);
    this._rotateAxis = new Sp3dV3D(0, 0, -1);
  }

  /// object speed.
  override get speed(): number {
    return 60 / this.fps;
  }

  /// object motion velocity.
  /// NOTE: mutates _vx/_vy as a side effect — read once per frame.
  override get velocity(): Sp3dV3D | null {
    // 重力を加算（下方向 = Yのマイナス）
    this._vy -= this.gravity * this.speed;
    // 空気抵抗で減衰
    this._vx *= this.damping;
    this._vy *= this.damping;
    // 速度がほぼ0になったら止める
    if (Math.abs(this._vx) < this.stopThreshold && Math.abs(this._vy) < this.stopThreshold) {
      return null;
    }
    return new Sp3dV3D(this._vx, this._vy, 0).mul(this.speed);
  }

  /// object rotation parameter.
  override get angularVelocity(): number | null {
    return this.rotationDirection * this.rotationSpeed * this.speed;
  }
}
