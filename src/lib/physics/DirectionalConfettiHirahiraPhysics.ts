import { Sp3dV3D } from "../math/Sp3dV3D";
import { VRange } from "../math/VRange";
import type { Size } from "../math/Size";
import { Sp3dPhysics } from "./Sp3dPhysics";

///
// (en) A class for physics calculations that simulates confetti bursting in a
//      specified direction, then smoothly transitioning to a gentle hirahira
//      (flutter) falling motion via linear interpolation.
// (ja) 指定した方向に飛び散った後、線形補間によってなめらかにひらひら落下へ
//      移行する物理演算クラスです。
///
// 1:1 port of: lib/src/physics/directional_confetti_hirahira_physics.dart
export class DirectionalConfettiHirahiraPhysics extends Sp3dPhysics {
  /// 爆発フェーズの速度（内部状態）
  private _vx: number;
  private _vy: number;

  /// 爆発フェーズ
  readonly gravity: number;
  readonly damping: number;

  /// フェーズ管理
  /// 0: 爆発, 1: 遷移, 2: 落下
  private _phase = 0;

  /// 爆発フェーズの最大フレーム数
  readonly maxBurstFrames: number;
  private _burstFrames = 0;

  /// 遷移フェーズのフレーム数と進捗
  readonly transitionFrames: number;
  private _transitionFrames = 0;

  /// 落下フェーズ（HirahiraDrop相当）
  private _nowPoint = 0;
  readonly baseFallSpeed: number;
  private readonly _fallSpeed: number;
  private readonly _lrMovement: number;
  readonly minShiftValue: number;
  readonly maxShiftValue: number;
  private readonly _shiftValue: number;
  readonly size: Size;
  private readonly _targetLength: number;

  /// 回転関連パラメータ
  rotationSpeed: number;
  rotationDirection: number;

  /// fpsによらず速度を一定にするためのパラメータ
  readonly fps: number;

  /// * [direction] : The direction and strength of the explosion.
  /// * [spreadAngle] : The spread angle in radians around [direction].
  /// * [speedVariance] : Random variance added to the base burst speed.
  constructor(
    size: Size,
    {
      direction,
      spreadAngle = Math.PI / 4,
      speedVariance = 2.0,
      gravity = 0.15,
      damping = 0.98,
      maxBurstFrames = 120,
      transitionFrames = 60,
      baseFallSpeed = 0.7,
      minShiftValue = 1.5,
      maxShiftValue = 3.0,
      rotationSpeed,
      rotationDirection,
      fps = 60,
    }: {
      direction: Sp3dV3D;
      spreadAngle?: number;
      speedVariance?: number;
      gravity?: number;
      damping?: number;
      maxBurstFrames?: number;
      transitionFrames?: number;
      baseFallSpeed?: number;
      minShiftValue?: number;
      maxShiftValue?: number;
      rotationSpeed?: number;
      rotationDirection?: number;
      fps?: number;
    },
  ) {
    super();
    this.size = size;
    this.gravity = gravity;
    this.damping = damping;
    this.maxBurstFrames = maxBurstFrames;
    this.transitionFrames = transitionFrames;
    this.baseFallSpeed = baseFallSpeed;
    this.minShiftValue = minShiftValue;
    this.maxShiftValue = maxShiftValue;
    this.fps = fps;

    this._vx = 0;
    this._vy = 0;

    // 指向性爆発の初速
    const magnitude = direction.len();
    const baseAngle = Math.atan2(direction.y, direction.x);
    const angleOffset = (Math.random() - 0.5) * spreadAngle;
    const finalAngle = baseAngle + angleOffset;
    const finalSpeed = magnitude + Math.random() * speedVariance;
    this._vx = Math.cos(finalAngle) * finalSpeed;
    this._vy = Math.sin(finalAngle) * finalSpeed;

    // 落下フェーズのパラメータ
    this._lrMovement = Math.random() < 0.5 ? 1 : -1;
    this._fallSpeed = Math.random() + baseFallSpeed;
    this._shiftValue = new VRange(minShiftValue, maxShiftValue).getRandomInRange();
    this._targetLength = size.width > size.height ? size.width : size.height;

    this.rotationSpeed = rotationSpeed ?? Math.random() / 10 + 0.01;
    this.rotationDirection = rotationDirection ?? (Math.random() < 0.5 ? 1 : -1);
    this._rotateAxis =
      Math.random() < 0.8 ? new Sp3dV3D(1, 1, 0).nor() : new Sp3dV3D(-1, 1, 0).nor();
  }

  /// object speed.
  override get speed(): number {
    return 60 / this.fps;
  }

  private _convertSineWave(v: number): number {
    const value = (2 * Math.PI * v * this.speed) / (this._targetLength / this._shiftValue);
    return Math.sin(value);
  }

  /// ひらひら落下の速度ベクトルを計算する。
  private _calcHirahira(): Sp3dV3D {
    this._nowPoint += 1;
    if (this._nowPoint * this.speed > this._targetLength / this._shiftValue) {
      this._nowPoint = 1;
    }
    const x = this._convertSineWave(this._nowPoint) * this._lrMovement;
    return new Sp3dV3D(0, -1 * this._fallSpeed * this.speed, 0).add(
      new Sp3dV3D(x * this.speed, 0, 0),
    );
  }

  /// object motion velocity.
  /// NOTE: advances the phase machine + _vx/_vy/_nowPoint as side effects.
  override get velocity(): Sp3dV3D | null {
    if (this._phase === 0) {
      // 爆発フェーズ
      this._vy -= this.gravity * this.speed;
      this._vx *= this.damping;
      this._vy *= this.damping;
      this._burstFrames += 1;
      if (this._burstFrames >= this.maxBurstFrames) {
        this._phase = 1;
      }
      return new Sp3dV3D(this._vx, this._vy, 0).mul(this.speed);
    } else if (this._phase === 1) {
      // 遷移フェーズ: 爆発とひらひらをlerpでブレンド
      this._vy -= this.gravity * this.speed;
      this._vx *= this.damping;
      this._vy *= this.damping;
      this._transitionFrames += 1;
      const t = this._transitionFrames / this.transitionFrames;
      const burstV = new Sp3dV3D(this._vx, this._vy, 0).mul(this.speed);
      const hirahiraV = this._calcHirahira();
      if (this._transitionFrames >= this.transitionFrames) {
        this._phase = 2;
      }
      // lerp: burst * (1 - t) + hirahira * t
      return burstV.mul(1.0 - t).add(hirahiraV.mul(t));
    } else {
      // 落下フェーズ
      return this._calcHirahira();
    }
  }

  /// object rotation parameter.
  override get angularVelocity(): number | null {
    return this.rotationDirection * this.rotationSpeed * this.speed;
  }
}
