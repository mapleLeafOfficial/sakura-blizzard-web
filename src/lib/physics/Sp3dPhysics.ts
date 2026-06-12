import { Sp3dV3D } from "../math/Sp3dV3D";

///
// (en) Base class for per-frame motion physics.
//
//      IMPORTANT INVARIANT (mirrors simple_3d): the `velocity` getter is NOT a
//      pure function. In Hirahira/Pop/Confetti physics it advances internal
//      state (_nowPoint / _vx / _vy / phase machine) as a side effect, so it
//      must be read EXACTLY ONCE per animation frame. Reading it twice in a
//      frame would double-advance the state.
// (ja) 1フレームごとの運動物理演算のベースクラス。
//      velocity は副作用で内部状態を進めるため、1フレームに1回のみ参照すること。
///
// 1:1 port of: simple_3d Sp3dPhysics (only the members sakura_blizzard uses)
export abstract class Sp3dPhysics {
  /// Rotation axis. null means "no spin". Subclasses either set this in their
  /// constructor (Spin3D / Hirahira / Confetti) or override the getter
  /// (RotatingDrop / Pop / DirectionalPop return a constant axis).
  protected _rotateAxis: Sp3dV3D | null = null;
  get rotateAxis(): Sp3dV3D | null {
    return this._rotateAxis;
  }

  /// fps-independent speed scalar. Calibrated so that 60 fps == 1x.
  get speed(): number {
    return 1;
  }

  /// Per-frame motion delta (screen-space; Y points DOWN, so falling = -Y).
  /// Returning null halts the object (used by Pop physics).
  get velocity(): Sp3dV3D | null {
    return null;
  }

  /// Per-frame rotation delta in radians about [rotateAxis].
  /// null means "no rotation this frame".
  get angularVelocity(): number | null {
    return null;
  }
}
