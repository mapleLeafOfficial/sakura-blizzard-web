import { Sp3dV3D } from "../math/Sp3dV3D";
import { Sp3dPhysics } from "./Sp3dPhysics";

///
// (en) A class for physics calculations that can simulate falling motion
//      without rotation.
// (ja) 回転せずに落下する動きをシミュレート可能な、物理演算のためのクラスです。
///
// 1:1 port of: lib/src/physics/basic_drop_physics.dart
export class BasicDropPhysics extends Sp3dPhysics {
  /// fpsによらず速度を一定にするためのパラメータ
  readonly fps: number;

  /// * [fps] : The screen fps.
  constructor({ fps = 60 }: { fps?: number } = {}) {
    super();
    this.fps = fps;
  }

  /// object speed.
  override get speed(): number {
    return 60 / this.fps;
  }

  /// object motion velocity.
  override get velocity(): Sp3dV3D | null {
    return new Sp3dV3D(0, -1, 0).mul(this.speed);
  }
}
