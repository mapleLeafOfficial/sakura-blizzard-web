import { Sp3dV3D } from "../math/Sp3dV3D";
import { VRange } from "../math/VRange";
import type { Size } from "../math/Size";
import { Sp3dPhysics } from "./Sp3dPhysics";

///
// (en) A class for physics calculations that can simulate the falling motion
//      of cherry blossom petals. This is the signature "hirahira" drift.
// (ja) 桜の花びらの落下する動きをシミュレート可能な、物理演算のためのクラスです。
///
// 1:1 port of: lib/src/physics/hirahira_drop_physics.dart
export class HirahiraDropPhysics extends Sp3dPhysics {
  /// 花びらが落ちるアニメーションの調整用カウンタ。
  private _nowPoint = 0;

  /// 落下速度
  readonly baseFallSpeed: number;
  private readonly _fallSpeed: number;

  /// シフト関係パラメータ
  /// 最初のシフト方向。1なら右シフト、-1なら左シフトする。
  private readonly _lrMovement: number;

  /// 画面の何分の一を基準に左右に揺れるかという指定。
  readonly minShiftValue: number;
  readonly maxShiftValue: number;
  private readonly _shiftValue: number;

  /// 親ビューのサイズ情報
  readonly size: Size;

  /// 親ビューの画面のうち、長い方の辺の長さ。
  private readonly _targetLength: number;

  /// 回転関連パラメータ
  rotationSpeed: number;
  rotationDirection: number;

  /// fpsによらず速度を一定にするためのパラメータ
  readonly fps: number;

  /// * [size] : The widget size.
  /// * [rotationSpeed] : The object rotation speed.
  /// * [rotationDirection] : Specifies whether to rotate the object
  ///   counterclockwise or clockwise, as 1 or -1.
  ///   If not specified, a random value will be set.
  /// * [baseFallSpeed] : Parameters for control of falling speed.
  ///   The actual speed is obtained by adding 0 to 1 to this speed.
  /// * [fps] : The screen fps.
  /// * [minShiftValue] : Parameters related to petal swing width.
  /// * [maxShiftValue] : Parameters related to petal swing width.
  constructor(
    size: Size,
    {
      rotationSpeed,
      rotationDirection,
      baseFallSpeed = 0.7,
      fps = 60,
      minShiftValue = 1.5,
      maxShiftValue = 3.0,
    }: {
      rotationSpeed?: number;
      rotationDirection?: number;
      baseFallSpeed?: number;
      fps?: number;
      minShiftValue?: number;
      maxShiftValue?: number;
    } = {},
  ) {
    super();
    this.size = size;
    this.baseFallSpeed = baseFallSpeed;
    this.fps = fps;
    this.minShiftValue = minShiftValue;
    this.maxShiftValue = maxShiftValue;
    this._lrMovement = Math.random() < 0.5 ? 1 : -1;
    this.rotationSpeed = rotationSpeed ?? Math.random() / 10 + 0.01;
    this.rotationDirection = rotationDirection ?? (Math.random() < 0.5 ? 1 : -1);
    this._rotateAxis =
      Math.random() < 0.8 ? new Sp3dV3D(1, 1, 0).nor() : new Sp3dV3D(-1, 1, 0).nor();
    this._fallSpeed = Math.random() + baseFallSpeed;
    this._shiftValue = new VRange(minShiftValue, maxShiftValue).getRandomInRange();
    this._targetLength = size.width > size.height ? size.width : size.height;
  }

  /// object speed.
  override get speed(): number {
    return 60 / this.fps;
  }

  private _convertSineWave(v: number): number {
    const value = (2 * Math.PI * v * this.speed) / (this._targetLength / this._shiftValue);
    return Math.sin(value);
  }

  /// object motion velocity.
  /// NOTE: advances `_nowPoint` as a side effect — read once per frame.
  override get velocity(): Sp3dV3D | null {
    this._nowPoint += 1;
    if (this._nowPoint * this.speed > this._targetLength / this._shiftValue) {
      this._nowPoint = 1;
    }
    const x = this._convertSineWave(this._nowPoint) * this._lrMovement;
    return new Sp3dV3D(0, -1 * this._fallSpeed * this.speed, 0).add(
      new Sp3dV3D(x * this.speed, 0, 0),
    );
  }

  /// object rotation parameter.
  override get angularVelocity(): number | null {
    return this.rotationDirection * this.rotationSpeed * this.speed;
  }
}
