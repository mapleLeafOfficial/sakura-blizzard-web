import { Sp3dV3D } from "../math/Sp3dV3D";
import { Sp3dPhysics } from "./Sp3dPhysics";

///
// (en) A class for physics calculations that simulates confetti bursting outward
//      from the center, like a surprise party popper. Each object flies outward
//      with a random direction and speed, then gradually falls under gravity with
//      air resistance. Once the velocity drops near zero, the object stops
//      automatically.
// (ja) びっくり箱を開けたときの紙吹雪のように、中央から外側に飛び散る動きを
//      シミュレートする物理演算クラスです。
///
// 1:1 port of: lib/src/physics/pop_physics.dart
export class PopPhysics extends Sp3dPhysics {
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

  /// * [minBurstSpeed] : Minimum initial burst speed.
  /// * [maxBurstSpeed] : Maximum initial burst speed.
  /// * [gravity] : Gravitational acceleration added to vertical velocity each frame.
  /// * [damping] : Air resistance damping factor (0–1).
  /// * [stopThreshold] : The object stops when both vx and vy drop below this.
  /// * [rotationSpeed] : The object rotation speed. Random if not specified.
  /// * [rotationDirection] : 1 or -1. Random if not specified.
  /// * [fps] : The screen fps.
  constructor({
    minBurstSpeed = 3.0,
    maxBurstSpeed = 8.0,
    gravity = 0.15,
    damping = 0.98,
    stopThreshold = 0.01,
    rotationSpeed,
    rotationDirection,
    fps = 60,
  }: {
    minBurstSpeed?: number;
    maxBurstSpeed?: number;
    gravity?: number;
    damping?: number;
    stopThreshold?: number;
    rotationSpeed?: number;
    rotationDirection?: number;
    fps?: number;
  } = {}) {
    super();
    this.gravity = gravity;
    this.damping = damping;
    this.stopThreshold = stopThreshold;
    this.fps = fps;

    this._vx = 0;
    this._vy = 0;

    // ランダムな方向（全方位）と強さで初速を設定
    const angle = Math.random() * 2 * Math.PI;
    const speed =
      minBurstSpeed + Math.random() * (maxBurstSpeed - minBurstSpeed);
    this._vx = Math.cos(angle) * speed;
    this._vy = Math.sin(angle) * speed;

    this.rotationSpeed = rotationSpeed ?? Math.random() / 10 + 0.01;
    this.rotationDirection = rotationDirection ?? (Math.random() < 0.5 ? 1 : -1);
    this._rotateAxis = new Sp3dV3D(0, 0, -1);
  }

  /// object speed.
  override get speed(): number {
    return 60 / this.fps;
  }

  /// object motion velocity.
  /// 毎フレーム呼ばれるたびに重力加算・減衰を適用して速度を更新する。
  /// 速度がほぼ0になったら null を返して停止する。
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
