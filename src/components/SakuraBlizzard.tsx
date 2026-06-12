"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { SakuraCanvas } from "./SakuraCanvas";
import type { SakuraBlizzardConfig } from "../lib/engine/useSakuraBlizzard";
import { EnumDropType } from "../lib/EnumDropType";
import { VRange } from "../lib/math/VRange";
import {
  SakuraBlizzardMaterials,
  type Sp3dColor,
} from "../lib/colors/SakuraBlizzardMaterials";

///
// (en) The single public entry point — a drop-in React component that renders
//      the cherry-blossom particle effect around its [children]. Everything
//      (camera, light, software-3D pipeline, fixed-timestep loop, two depth
//      layers) is encapsulated here; external sites only touch these props.
//
//      Two featured modes: "hirahira" (signature drifting fall) and "spin3d"
//      (3D tumble). The other drop algorithms remain available in EnumDropType.
// (ja) 公開APIの単一エントリ。桜吹雪エフェクトを子ウィジェットの周りに描画。
///
export type SakuraMode = "hirahira" | "spin3d";

export interface SakuraBlizzardProps {
  /// Master switch. false = render nothing (no canvas, no animation loop).
  /// Defaults to true.
  enabled?: boolean;
  /// Featured motion mode. "hirahira" = drifting fall with sine sway;
  /// "spin3d" = 3D tumble about the (1,1,0) axis. Defaults to "hirahira".
  /// Advanced callers may pass any raw EnumDropType to use the other drop
  /// algorithms (rotating/basic/rain), which are kept but not surfaced here.
  mode?: SakuraMode | EnumDropType;
  /// Global speed multiplier: 1 = source speed, 0 = frozen, 2 = 2× as fast.
  /// Read live, so it can be wired to a slider without remounting. Defaults to 1.
  speed?: number;
  /// Petal count per depth layer (front + back). Defaults to 40.
  density?: number;
  /// Petal fill color, RGB 0-255. Defaults to the tuned pink [251,188,206].
  color?: Sp3dColor;
  /// Brightness when a face fully faces the camera (>1 brightens). Defaults to 1.2.
  litBri?: number;
  /// Brightness floor for faces turned away. Defaults to 0.5.
  shadowBri?: number;
  /// Front-layer petal size range [min,max]; front is larger (reads as closer).
  /// Defaults to [16,40].
  frontSize?: [number, number];
  /// Back-layer petal size range [min,max]. Defaults to [10,24].
  backSize?: [number, number];
  /// Content sandwiched between the back and front petal layers.
  children?: ReactNode;
}

const MODE_TO_DROP: Record<SakuraMode, EnumDropType> = {
  hirahira: EnumDropType.hirahiraDrop,
  spin3d: EnumDropType.spinDrop3D,
};

export function SakuraBlizzard({
  enabled = true,
  mode = "hirahira",
  speed = 1,
  density = 40,
  color = SakuraBlizzardMaterials.sakura,
  litBri = 1.2,
  shadowBri = 0.5,
  frontSize = [16, 40],
  backSize = [10, 24],
  children,
}: SakuraBlizzardProps) {
  // Measure our own box so the effect fills any sized/positioned container.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!enabled) return;
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect;
      setSize({ width: Math.round(cr.width), height: Math.round(cr.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [enabled]);

  // Off: render nothing (but keep children, if any).
  if (!enabled) return <>{children ?? null}</>;

  const config: SakuraBlizzardConfig = {
    viewSize: size,
    fps: 60,
    dropType:
      typeof mode === "number" ? mode : MODE_TO_DROP[mode],
    frontObjNum: density,
    backObjNum: density,
    frontObjSize: new VRange(frontSize[0], frontSize[1]),
    backObjSize: new VRange(backSize[0], backSize[1]),
    isRandomPositionY: true,
    enablePositionReset: true,
    resetRandomX: true,
    litBri,
    shadowBri,
    speedScale: speed,
    color,
  };

  return (
    <div ref={wrapRef} style={{ position: "absolute", inset: 0 }}>
      {size.width > 0 && size.height > 0 && (
        <SakuraCanvas config={config}>{children}</SakuraCanvas>
      )}
    </div>
  );
}
