import { Sp3dV3D } from "../math/Sp3dV3D";
import { Sp3dPhysics } from "./Sp3dPhysics";

///
// (en) A class for physics calculations that can simulate falling motion
//      without rotation. Falling fast like rain.
// (ja) 回転せずに落下する動きをシミュレート可能な、物理演算のためのクラスです。
//      雨のように高速に落下します。
///
// 1:1 port of: lib/src/physics/rain_drop_physics.dart
export class RainDropPhysics extends Sp3dPhysics {
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
    return new Sp3dV3D(0, -12, 0).mul(this.speed);
  }
}
