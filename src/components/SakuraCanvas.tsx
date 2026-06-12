"use client";

import type { ReactNode } from "react";
import {
  useSakuraBlizzard,
  type SakuraBlizzardConfig,
} from "../lib/engine/useSakuraBlizzard";

///
// (en) A thin React wrapper around the engine hook. Renders the canvas and
//      overlays the [child] widget — standing in for the Flutter Stack that
//      sandwiches the child between the back and front particle layers.
// (ja) エンジンフックの薄いラッパー。キャンバスと子ウィジェットを描画。
///
export function SakuraCanvas({
  config,
  children,
}: {
  config: SakuraBlizzardConfig;
  children?: ReactNode;
}) {
  const canvasRef = useSakuraBlizzard(config);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
      }}
    >
      <canvas
        ref={canvasRef}
        width={config.viewSize.width}
        height={config.viewSize.height}
        style={{ position: "absolute", inset: 0, display: "block" }}
      />
      <div style={{ position: "absolute", inset: 0 }}>{children}</div>
    </div>
  );
}
