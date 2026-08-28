import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Edges, Line } from '@react-three/drei';
import { ScanEye, UnfoldHorizontal } from 'lucide-react';
import { Scene3D } from './Scene3D.jsx';
import { Var, LegendChip, FormulaCard, FormulaLine, VisualizerCard, SliderRow, SHAPES, AnswerToggle, MaskedInline } from './shared.jsx';

const shape = SHAPES.cone;

function ConeSolid({ r, h, opacityTarget, lineOpacity, offsetX = 0, xray = false }) {
  const meshRef = useRef();
  const matRef = useRef();
  const lo = lineOpacity ?? opacityTarget;
  // In X-Ray, the solid's own color is neutralized so the green h line (same hue family
  // as the shape's usual emerald) doesn't blend into the surface it's meant to stand out from.
  const meshColor = xray ? '#94a3b8' : '#34d399';
  const edgeColor = xray ? '#475569' : '#047857';

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const s = meshRef.current.scale;
    s.x = THREE.MathUtils.damp(s.x, r, 6, delta);
    s.z = THREE.MathUtils.damp(s.z, r, 6, delta);
    s.y = THREE.MathUtils.damp(s.y, h, 6, delta);
    if (matRef.current) {
      matRef.current.opacity = THREE.MathUtils.damp(matRef.current.opacity, opacityTarget, 7, delta);
    }
  });

  const markSize = Math.min(h, r) * 0.16;
  const rightAngleMark = [
    [markSize, -h / 2, 0],
    [markSize, -h / 2 + markSize, 0],
    [0, -h / 2 + markSize, 0],
  ];

  return (
    <group position={[offsetX, 0, 0]}>
      <mesh ref={meshRef} castShadow>
        <coneGeometry args={[1, 1, 48]} />
        <meshStandardMaterial ref={matRef} color={meshColor} transparent opacity={1} depthWrite={false} side={THREE.DoubleSide} />
        <Edges color={edgeColor} />
      </mesh>
      <Line points={[[0, h / 2, 0], [r, -h / 2, 0]]} color="#f97316" lineWidth={3} transparent opacity={lo} />
      <Line points={[[0, -h / 2, 0], [r, -h / 2, 0]]} color="#3b82f6" lineWidth={3} transparent opacity={lo} />
      <Line
        points={[[0, h / 2, 0], [0, -h / 2, 0]]}
        color="#16a34a"
        lineWidth={xray ? 4 : 2.5}
        dashed
        dashSize={xray ? 0.22 : 0.1}
        gapSize={xray ? 0.12 : 0.07}
        transparent
        opacity={xray ? lo : lo * 0.9}
      />
      {xray && <Line points={rightAngleMark} color="#334155" lineWidth={2} transparent opacity={lo} />}
    </group>
  );
}

function arcPoints(l, sweep, segments = 48) {
  const pts = [[0, 0, 0]];
  for (let i = 0; i <= segments; i++) {
    const a = -sweep / 2 + (sweep * i) / segments;
    pts.push([l * Math.cos(a), l * Math.sin(a), 0]);
  }
  pts.push([0, 0, 0]);
  return pts;
}

function circlePointsXY(r, segments = 48) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const a = (Math.PI * 2 * i) / segments;
    pts.push([r * Math.cos(a), r * Math.sin(a), 0]);
  }
  return pts;
}

function ConeNet({ r, h, l, u }) {
  const angle = (2 * Math.PI * r) / l;
  const sweep = Math.max(angle * u, 0.0001);

  const sectorGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.absarc(0, 0, l, -sweep / 2, sweep / 2, false);
    s.lineTo(0, 0);
    return new THREE.ShapeGeometry(s, 64);
  }, [l, sweep]);

  const circleGeo = useMemo(() => new THREE.CircleGeometry(r, 48), [r]);
  const sectorOutline = useMemo(() => arcPoints(l, sweep), [l, sweep]);
  const circleOutline = useMemo(() => circlePointsXY(r), [r]);

  const netGroupRef = useRef();
  const circleGroupRef = useRef();

  useFrame((_, delta) => {
    if (netGroupRef.current) {
      const targetY = -(h / 2 + 1.7);
      netGroupRef.current.position.y = THREE.MathUtils.damp(netGroupRef.current.position.y, targetY, 6, delta);
    }
    if (circleGroupRef.current) {
      const targetX = l + r + 0.6;
      circleGroupRef.current.position.x = THREE.MathUtils.damp(circleGroupRef.current.position.x, u > 0.02 ? targetX : 0, 6, delta);
    }
  });

  const edgeX = l * Math.cos(sweep / 2);
  const edgeY = l * Math.sin(sweep / 2);

  return (
    <group ref={netGroupRef} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh geometry={sectorGeo}>
        <meshStandardMaterial color="#fdba74" side={THREE.DoubleSide} transparent opacity={u} />
      </mesh>
      <Line points={sectorOutline} color="#c2410c" lineWidth={2} transparent opacity={u} />
      {u > 0.02 && <Line points={[[0, 0, 0], [edgeX, edgeY, 0]]} color="#f97316" lineWidth={3} transparent opacity={u} />}

      <group ref={circleGroupRef}>
        <mesh geometry={circleGeo}>
          <meshStandardMaterial color="#93c5fd" side={THREE.DoubleSide} transparent opacity={u} />
        </mesh>
        <Line points={circleOutline} color="#1e40af" lineWidth={2} transparent opacity={u} />
        {u > 0.02 && <Line points={[[0, 0, 0], [r, 0, 0]]} color="#1d4ed8" lineWidth={2.5} transparent opacity={u} />}
      </group>
    </group>
  );
}

const MODE_TABS = [
  { key: 'unfold', label: 'คลี่ผิว', icon: UnfoldHorizontal },
  { key: 'xray', label: 'X-Ray', icon: ScanEye },
];

export default function ConePanel() {
  const [r, setR] = useState(4.5);
  const [h, setH] = useState(8);
  const [t, setT] = useState(0);
  const [mode, setMode] = useState('unfold');
  const [hideAnswer, setHideAnswer] = useState(false);
  const u = t / 100;

  const l = Math.sqrt(r * r + h * h);
  const lateral = Math.PI * r * l;
  const total = Math.PI * r * (l + r);
  const volume = (1 / 3) * Math.PI * r * r * h;

  const fitSize =
    mode === 'unfold'
      ? Math.max(r * 2, h) + (Math.max(h, 2 * (l + r) + 1) - Math.max(r * 2, h)) * u
      : Math.max(r * 2, h);

  const netLabels =
    mode === 'unfold' ? (
      <>
        <span
          className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-600 ring-1 ring-orange-200 transition-opacity duration-300"
          style={{ opacity: u > 0.15 ? 1 : 0 }}
        >
          🔶 ผิวข้างคลี่แบน (Sector)
        </span>
        <span
          className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600 ring-1 ring-blue-200 transition-opacity duration-300"
          style={{ opacity: u > 0.15 ? 1 : 0 }}
        >
          🔵 ฐานวงกลม
        </span>
      </>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
        ⬛ สังเกตมุมฉากที่ฐาน — h ตั้งฉากกับฐานเสมอ
      </span>
    );

  return (
    <>
      <VisualizerCard shape={shape}>
        <Scene3D accent={shape.accent} fitSize={fitSize} belowCanvas={netLabels}>
          {mode === 'unfold' && (
            <>
              <ConeSolid r={r} h={h} opacityTarget={1 - u} />
              <ConeNet r={r} h={h} l={l} u={u} />
            </>
          )}
          {mode === 'xray' && <ConeSolid r={r} h={h} opacityTarget={0.16} lineOpacity={1} xray />}
        </Scene3D>

        <div className="flex gap-1.5 rounded-full bg-white/70 p-1 ring-1 ring-white">
          {MODE_TABS.map((m) => {
            const Icon = m.icon;
            const isActive = mode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-bold transition-colors md:text-base"
                style={{
                  backgroundColor: isActive ? shape.accent : 'transparent',
                  color: isActive ? '#ffffff' : '#475569',
                }}
              >
                <Icon className="h-4 w-4" strokeWidth={2.5} />
                {m.label}
              </button>
            );
          })}
        </div>

        {mode === 'unfold' && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-base font-bold text-slate-600 md:text-lg">
              <span>ทรงตัน</span>
              <span className="text-emerald-500">กางรูปทรง (Unfold)</span>
              <span>คลี่แบน</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={t}
              onChange={(e) => setT(Number(e.target.value))}
              className="h-3 w-full cursor-pointer appearance-none rounded-full bg-emerald-100 accent-emerald-500"
            />
          </div>
        )}
        {mode === 'xray' && (
          <p className="rounded-2xl bg-white/70 px-4 py-3 text-center text-base font-semibold text-slate-500 ring-1 ring-white">
            ผิวโปร่งแสง มองทะลุเห็น <span className="text-green-600">h</span> ด้านใน — ตั้งฉากกับฐานเสมอ
          </p>
        )}

        <div className="flex flex-col gap-3 rounded-2xl bg-white/70 p-4 ring-1 ring-white">
          <SliderRow label="รัศมี (r)" value={r} min={2} max={9} step={0.5} unit="ซม." onChange={setR} colorKey="r" />
          <SliderRow label="สูงตรง (h)" value={h} min={3} max={16} step={0.5} unit="ซม." onChange={setH} colorKey="h" />
        </div>
      </VisualizerCard>

      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <LegendChip c="r" symbol="r" label="รัศมี" />
            <LegendChip c="h" symbol="h" label="สูงตรง" />
            <LegendChip c="l" symbol="l" label="สูงเอียง" />
          </div>
          <AnswerToggle hidden={hideAnswer} onChange={setHideAnswer} accent={shape.accent} />
        </div>

        <FormulaCard title="พื้นที่ผิว" accentText="text-emerald-500">
          <div className="flex flex-col gap-3">
            <FormulaLine result={lateral} unit="ตร.ซม." hideAnswer={hideAnswer}>
              พื้นที่ผิวข้าง = π<Var c="r">r</Var><Var c="l">l</Var>
            </FormulaLine>
            <FormulaLine result={total} unit="ตร.ซม." hideAnswer={hideAnswer}>
              พื้นที่ผิวทั้งหมด = π<Var c="r">r</Var>(<Var c="l">l</Var> + <Var c="r">r</Var>)
            </FormulaLine>
          </div>
        </FormulaCard>

        <FormulaCard title="ปริมาตร" accentText="text-emerald-500">
          <FormulaLine result={volume} unit="ลบ.ซม." hideAnswer={hideAnswer}>
            ปริมาตร = ⅓π<Var c="r">r</Var>²<Var c="h">h</Var>
          </FormulaLine>
          <p className="mt-3 text-lg text-slate-500">
            💡 <Var c="l">l</Var> = √(r² + h²) = <MaskedInline hideAnswer={hideAnswer}><b>{l.toFixed(1)}</b> ซม.</MaskedInline>
          </p>
          <p className="mt-2 text-lg text-slate-500">
            ⬛ กดโหมด <b>"X-Ray"</b> เพื่อมองทะลุผิวกรวยดูว่า <Var c="h">h</Var> ตั้งฉากกับฐานจริง
          </p>
        </FormulaCard>
      </div>
    </>
  );
}
