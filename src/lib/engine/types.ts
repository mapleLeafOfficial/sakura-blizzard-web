import { Sp3dV3D } from "../math/Sp3dV3D";
import { Sp3dPhysics } from "../physics/Sp3dPhysics";

///
// (en) Minimal Sp3dObj equivalent for the 2D demo. Carries the geometry
//      (front-face outline = vertices[0..frontCount]) plus the runtime state
//      that the engine mutates each frame.
//
//      Faithfulness note: in simple_3d, move()/rotateInPlace() transform the
//      raw vertices and getCenter() averages them. Because every creator here
//      emits geometry centered on the origin, getCenter() == accumulated
//      position, so we store position as a single vector instead of rewriting
//      every vertex each frame. This is numerically equivalent for centered
//      objects and far cheaper.
// (ja) 2D デモ用の最小限の Sp3dObj。原点中心のジオメトリを前提とし、
//      getCenter() == position として最適化。
///
export interface Sp3dObj {
  /// All vertices (front + back faces). The renderable outline is
  /// vertices.slice(0, frontCount).
  vertices: Sp3dV3D[];
  frontCount: number;

  /// Fill color as RGB (stands in for Sp3dMaterial.bg). Renderer multiplies
  /// each channel by brightness to mirror Sp3dLight.apply.
  material: { r: number; g: number; b: number };

  /// Per-frame motion driver. Assigned by the view that creates the object.
  physics: Sp3dPhysics | null;

  /// Runtime state, mutated by the engine. Mirrors Sp3dObj.move/getCenter.
  position: Sp3dV3D;

  /// Accumulated rotation about the screen-normal (z) axis in radians.
  /// Drives ctx.rotate(). For physics whose rotateAxis is the z-axis.
  rotationZ: number;

  /// Accumulated flip angle about a horizontal axis in radians.
  /// Drives ctx.scale(cos(flip), 1) to fake 3D petal tumbling.
  /// For physics whose rotateAxis is tilted (e.g. (1,1,0)).
  flip: number;

  /// Optional sakura-petal shape params. When present, the renderer draws the
  /// outline as true quadratic Bézier curves (matching the source petal
  /// definition) instead of the sampled-point polygon in `vertices`.
  petalParams?: { w: number; h: number; notchLen: number };
}
