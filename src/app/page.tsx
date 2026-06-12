"use client";

import { useState, type CSSProperties } from "react";
import { SakuraBlizzard } from "../components/SakuraBlizzard";
import { EnumDropType } from "../lib/EnumDropType";

///
// (en) Demo page for the public `SakuraBlizzard` component. Showcases the
//      master switch (on/off), the two featured modes + the three kept modes,
//      and the live speed control — all via the single encapsulated component.
// (ja) 公開コンポーネント SakuraBlizzard のデモページ。
///
const PRESETS: { key: EnumDropType; label: string; desc: string; featured?: boolean }[] = [
  { key: EnumDropType.hirahiraDrop, label: "樱花飘落 Hirahira", desc: "招牌算法:正弦波左右摇曳 + 缓慢下落", featured: true },
  { key: EnumDropType.spinDrop3D, label: "3D旋转 SpinDrop3D", desc: "绕 (1,1,0) 轴 3D 翻滚下落", featured: true },
  { key: EnumDropType.rotatingDrop, label: "平面旋转 Rotating", desc: "绕屏幕法线 z 轴平面旋转" },
  { key: EnumDropType.basicDrop, label: "直线下落 Basic", desc: "无旋转,匀速直线下落" },
  { key: EnumDropType.rainDrop, label: "高速直落 Rain", desc: "12 倍速直线(花瓣模拟雨)" },
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
  const [on, setOn] = useState(true);
  const [dropType, setDropType] = useState<EnumDropType>(EnumDropType.hirahiraDrop);
  const [num, setNum] = useState(40);
  const [speed, setSpeed] = useState(1);

  const preset = PRESETS.find((p) => p.key === dropType)!;

  return (
    <main style={{ position: "fixed", inset: 0, overflow: "hidden" }}>
      <SakuraBlizzard enabled={on} mode={dropType} speed={speed} density={num}>
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
      </SakuraBlizzard>

      {/* 模式 + 总开关 */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
          zIndex: 10,
          maxWidth: "calc(100% - 24px)",
        }}
      >
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => setDropType(p.key)}
            style={btnStyle(p.key === dropType)}
            title={p.featured ? "主打模式" : "保留的下落算法"}
          >
            {p.label}
            {p.featured ? " ★" : ""}
          </button>
        ))}
        <button
          onClick={() => setOn((v) => !v)}
          style={{
            ...btnStyle(false),
            background: on ? "rgba(80,200,120,0.9)" : "rgba(200,80,80,0.9)",
            color: "#fff",
            fontWeight: 600,
          }}
        >
          {on ? "● 开" : "○ 关"}
        </button>
      </div>

      {/* 速度 + 数量 + 说明 */}
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span>速度</span>
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            style={{ width: 140, accentColor: "#e0709a" }}
          />
          <span style={{ color: "#e0709a", minWidth: 40 }}>{speed.toFixed(1)}×</span>
        </div>
        <div style={{ marginTop: 6 }}>
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
          公共组件 <code>&lt;SakuraBlizzard enabled mode speed /&gt;</code> ·
          核心 1:1 移植自 sakura_blizzard v6.1.2 · speed=60/fps
        </div>
      </div>
    </main>
  );
}
