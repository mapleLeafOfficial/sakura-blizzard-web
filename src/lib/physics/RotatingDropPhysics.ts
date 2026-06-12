import { Sp3dV3D } from "../math/Sp3dV3D";
import { Sp3dPhysics } from "./Sp3dPhysics";

///
// (en) This is a class for physics calculations that can simulate the movement
//      of falling while rotating on a plane.
// (ja) 平面的に回転しながら落下する動きをシミュレート可能な、物理演算のためのクラスです。
///
// 1:1 port of: lib/src/physics/rotating_drop_physics.dart
export class RotatingDropPhysics extends Sp3dPhysics {
  /// 回転関連パラメータ
  rotationDirection: number;
  rotationSpeed: number;

  /// fpsによらず速度を一定にするためのパラメータ
  readonly fps: number;

  /// * [rotationSpeed] : The object rotation speed.
  /// * [rotationDirection] : Specifies whether to rotate the object
  ///   counterclockwise or clockwise, as 1 or -1.
  ///   If not specified, a random value will be set.
  /// * [fps] : The screen fps.
  constructor({
    rotationSpeed,
    rotationDirection,
    fps = 60,
  }: {
    rotationSpeed?: number;
    rotationDirection?: number;
    fps?: number;
  } = {}) {
    super();
    this.fps = fps;
    this.rotationSpeed = rotationSpeed ?? Math.random() / 10 + 0.01;
    this.rotationDirection = rotationDirection ?? (Math.random() < 0.5 ? 1 : -1);
  }

  /// object speed.
  override get speed(): number {
    return 60 / this.fps;
  }

  /// object motion velocity.
  override get velocity(): Sp3dV3D | null {
    return new Sp3dV3D(0, -1, 0).mul(this.speed);
  }

  /// object rotation axis.
  override get rotateAxis(): Sp3dV3D | null {
    return new Sp3dV3D(0, 0, -1);
  }

  /// object rotation parameter.
  override get angularVelocity(): number | null {
    return this.rotationDirection * this.rotationSpeed * this.speed;
  }
}
