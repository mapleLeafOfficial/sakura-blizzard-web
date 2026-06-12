import { Sp3dV3D } from "../math/Sp3dV3D";
import { Quaternion } from "../math/Quaternion";
import { Sp3dPhysics } from "../physics/Sp3dPhysics";

///
// (en) Minimal Sp3dObj equivalent. Carries the geometry (front-face outline =
//      vertices[0..frontCount]) plus the runtime state the engine mutates.
//
//      Plan B — now a true software-3D object: orientation is a quaternion,
//      and the renderer transforms the local Bézier control points by it each
//      frame, computes face normals, sorts by depth (painter's algorithm),
//      and shades via camTheta — mirroring simple_3d_renderer's pipeline.
//
//      Faithfulness note: in simple_3d, move()/rotateInPlace() transform the
//      raw vertices and getCenter() averages them. Because every creator here
//      emits geometry centered on the origin, getCenter() == accumulated
//      position, so we store position as one vector and apply rotation as a
//      quaternion rather than rewriting every vertex each frame.
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

  /// Runtime translation, mutated by the engine. Mirrors Sp3dObj.move/getCenter.
  position: Sp3dV3D;

  /// Accumulated 3D orientation. Each frame the engine post-multiplies by the
  /// axis-angle delta from physics (angularVelocity about rotateAxis); the
  /// renderer then rotates the petal's local control points by it. This is the
  /// "vertex transform" stage of the software-3D pipeline.
  rotation: Quaternion;

  /// Optional sakura-petal shape params. When present, the renderer draws the
  /// outline as true quadratic Bézier curves (Bézier is affine-invariant, so
  /// transforming the control points transforms the whole curve exactly).
  petalParams?: { w: number; h: number; notchLen: number; zDistance: number };
}
