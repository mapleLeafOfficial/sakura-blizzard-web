"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { SakuraCanvas } from "../components/SakuraCanvas";
import { EnumDropType } from "../lib/EnumDropType";
import { VRange } from "../lib/math/VRange";

///
// (en) Demo page: switch between the 5 drop-physics algorithms to compare.
//      Every motion here is computed by the 1:1-ported physics + engine,
//      not hand-rolled CSS animation.
// (ja) デモページ: 5種類の落下物理アルゴリズムを切り替えて比較。
///
const PRESETS: { key: EnumDropType; label: string; desc: string }[] = [
  {
    key: EnumDropType.hirahiraDrop,
    label: "Hirahira 樱花飘落",
    desc: "招牌算法:正弦波左右摇曳 + 缓慢下落(HirahiraDropPhysics)",
  },
  {
    key: EnumDropType.spinDrop3D,
    label: "SpinDrop3D 三维翻滚",
    desc: "绕 (1,1,0) 轴 3D 翻滚下落(SpinDrop3DPhysics)",
  },
  {
    key: EnumDropType.rotatingDrop,
    label: "RotatingDrop 平面旋转",
    desc: "绕屏幕法线 z 轴平面旋转下落(RotatingDropPhysics)",
  },
  {
    key: EnumDropType.basicDrop,
    label: "BasicDrop 直线下落",
    desc: "无旋转,匀速直线下落(BasicDropPhysics)",
  },
  {
    key: EnumDropType.rainDrop,
    label: "RainDrop 高速直落",
    desc: "12 倍速直线(用花瓣模拟雨,RainDropPhysics)",
  },
];

function btnStyle(active: boolean): CSSProperties {
  return {
    padding: "6px 12px",
    fontSize: 13,
    border: "1px solid rgba(255,255,255,0.3)",
    borderRadius: 6,
    background: active ? "rgba(255,182,193,0.95)" : "rgba(0,0,0,0.45)",
    color: active ? "#5a2a3a" : "#eee",
    cursor: "pointer",
    backdropFilter: "blur(4px)",
  };
}

export default function Page() {
  const [size, setSize] = useState({ width: 1024, height: 768 });
  const [dropType, setDropType] = useState<EnumDropType>(EnumDropType.hirahiraDrop);
  const [num, setNum] = useState(40);

  useEffect(() => {
    const update = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const preset = PRESETS.find((p) => p.key === dropType)!;

  const config = {
    viewSize: size,
    fps: 60,
    dropType,
    frontObjNum: num,
    backObjNum: num,
    frontObjSize: new VRange(8, 32),
    backObjSize: new VRange(8, 32),
    isRandomPositionY: true,
    enablePositionReset: true,
    resetRandomX: true,
    minBrightness: 0.93,
  };

  return (
    <main style={{ position: "fixed", inset: 0, overflow: "hidden" }}>
      <SakuraCanvas config={config}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "#e0709a",
            textAlign: "center",
            pointerEvents: "none",
            textShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <h1 style={{ fontSize: 72, fontWeight: 300, letterSpacing: 4 }}>桜 Sakura</h1>
          <p style={{ fontSize: 16, color: "#777", marginTop: 8 }}>{preset.desc}</p>
        </div>
      </SakuraCanvas>

      {/* Physics selector */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          zIndex: 10,
          maxWidth: "calc(100% - 24px)",
        }}
      >
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => setDropType(p.key)}
            style={btnStyle(p.key === dropType)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Controls + provenance */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: 12,
          color: "#eee",
          background: "rgba(0,0,0,0.45)",
          padding: "8px 12px",
          borderRadius: 8,
          fontSize: 13,
          lineHeight: 1.7,
          zIndex: 10,
          backdropFilter: "blur(4px)",
        }}
      >
        <div>
          每层数量: {num}{" "}
          <button
            onClick={() => setNum(Math.max(5, num - 10))}
            style={{ ...btnStyle(false), padding: "2px 8px", marginLeft: 6 }}
          >
            -10
          </button>{" "}
          <button
            onClick={() => setNum(num + 10)}
            style={{ ...btnStyle(false), padding: "2px 8px" }}
          >
            +10
          </button>
        </div>
        <div style={{ opacity: 0.8, marginTop: 4 }}>
          核心算法 1:1 移植自 sakura_blizzard v6.1.2 (Flutter/Dart) ·
          speed=60/fps 归一化 · Y 轴朝下 · 固定时间步长
        </div>
      </div>
    </main>
  );
}
