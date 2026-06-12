"use client";

import { useEffect, useRef } from "react";
import type { Size } from "../math/Size";
import { VRange } from "../math/VRange";
import type { Sp3dColor } from "../colors/SakuraBlizzardMaterials";
import { EnumDropType } from "../EnumDropType";
import {
  createSakuraPetalObj,
  drawScene,
  getDropPhysics,
  updateObjPosition,
} from "./sakuraEngine";
import type { Sp3dObj } from "./types";

export interface SakuraBlizzardConfig {
  viewSize: Size;
  fps: number;
  dropType: EnumDropType;
  frontObjNum: number;
  backObjNum: number;
  frontObjSize: VRange;
  backObjSize: VRange;
  isRandomPositionY: boolean;
  enablePositionReset: boolean;
  resetRandomX: boolean;
  /// Brightness when a face fully faces the camera. >1 brightens it (tuned).
  litBri: number;
  /// Brightness floor when a face is turned away (shadow).
  shadowBri: number;
  /// Global speed multiplier (1 = source speed, 0 = freeze, 2 = 2×). Read live.
  speedScale: number;
  /// Petal fill color (RGB 0-255), applied to every petal at creation.
  color: Sp3dColor;
}

///
// (en) React hook that owns the object pools and drives the fixed-timestep
//      animation loop with requestAnimationFrame.
//
//      Faithfulness note: the original uses Timer.periodic(1000 ~/ fps), a
//      fixed step independent of the display refresh rate. Because every
//      physics velocity is pre-scaled by speed = 60/fps, we MUST advance exactly
//      `fps` simulation ticks per second regardless of monitor Hz — so we
//      accumulate real elapsed time and step in fixed `1000/fps` increments
//      (capped at 3 catch-up steps to avoid spiral-of-death), rather than
//      stepping once per animation frame.
// (ja) オブジェクトプールを保持し、requestAnimationFrame で固定ステップの
//      アニメーションループを駆動するフック。物理速度は 60/fps で正規化済みのため、
//      モニタのリフレッシュレートに依存せず毎秒 fps 回更新する。
///
export function useSakuraBlizzard(config: SakuraBlizzardConfig) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Keep the latest config available to the rAF closure without re-subscribing.
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const c = configRef.current;

    // initState: build front + back object pools (mirrors SakuraBlizzardView).
    const front: Sp3dObj[] = [];
    const back: Sp3dObj[] = [];
    for (let i = 0; i < c.frontObjNum; i++) {
      const o = createSakuraPetalObj(
        c.viewSize,
        c.frontObjSize,
        getDropPhysics(c.dropType, c.viewSize, c.fps),
        c.isRandomPositionY,
      );
      o.material = c.color;
      front.push(o);
    }
    for (let i = 0; i < c.backObjNum; i++) {
      const o = createSakuraPetalObj(
        c.viewSize,
        c.backObjSize,
        getDropPhysics(c.dropType, c.viewSize, c.fps),
        c.isRandomPositionY,
      );
      o.material = c.color;
      back.push(o);
    }

    // Fixed-timestep loop (replaces Timer.periodic(1000 ~/ fps)).
    const frameInterval = 1000 / c.fps;
    let last = performance.now();
    let acc = 0;
    let raf = 0;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const delta = now - last;
      last = now;
      acc += delta;

      let steps = 0;
      const opts = {
        enablePositionReset: configRef.current.enablePositionReset,
        resetRandomX: configRef.current.resetRandomX,
        speedScale: configRef.current.speedScale,
      };
      const viewSize = configRef.current.viewSize;
      while (acc >= frameInterval && steps < 3) {
        for (const o of front) updateObjPosition(o, viewSize, opts);
        for (const o of back) updateObjPosition(o, viewSize, opts);
        acc -= frameInterval;
        steps++;
      }
      if (steps > 0) {
        // Stack order: [backRenderer, child, frontRenderer] — child omitted here.
        // Stack order: [backRenderer, child, frontRenderer] — child omitted here.
        drawScene(
          ctx,
          [back, front],
          viewSize,
          configRef.current.litBri,
          configRef.current.shadowBri,
        );
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // Rebuild only when these primitive inputs change (mirrors the UniqueKey
    // rebuild-on-resize behavior of the source views).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config.viewSize.width,
    config.viewSize.height,
    config.fps,
    config.dropType,
    config.frontObjNum,
    config.backObjNum,
    config.isRandomPositionY,
    config.enablePositionReset,
    config.color,
  ]);

  return canvasRef;
}
