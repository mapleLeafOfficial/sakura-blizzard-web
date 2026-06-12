import { Sp3dV3D } from "../math/Sp3dV3D";
import { Sp3dPhysics } from "./Sp3dPhysics";

///
// (en) This is a class for physics calculations that can simulate the movement
//      of falling while rotating in three dimensions.
// (ja) ３次元で回転しながら落下する動きをシミュレート可能な、物理演算のためのクラスです。
///
// 1:1 port of: lib/src/physics/spin_drop_3d_physics.dart
export class SpinDrop3DPhysics extends Sp3dPhysics {
  /// 回転関連パラメータ
  rotationSpeed: number;
  rotationDirection: number;

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
    // NOTE: matches the source — 80% chance (1,1,0), else (-1,1,0), normalized.
    this._rotateAxis =
      Math.random() < 0.8 ? new Sp3dV3D(1, 1, 0).nor() : new Sp3dV3D(-1, 1, 0).nor();
  }

  /// object speed.
  override get speed(): number {
    return 60 / this.fps;
  }

  /// object motion velocity.
  override get velocity(): Sp3dV3D | null {
    return new Sp3dV3D(0, -1, 0).mul(this.speed);
  }

  /// object rotation parameter.
  override get angularVelocity(): number | null {
    return this.rotationDirection * this.rotationSpeed * this.speed;
  }
}
