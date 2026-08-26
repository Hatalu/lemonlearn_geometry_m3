import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Edges, Line } from '@react-three/drei';
import { ScanEye } from 'lucide-react';
import { Scene3D } from './Scene3D.jsx';
import { Var, LegendChip, FormulaCard, FormulaLine, VisualizerCard, BigToggle, SliderRow, SHAPES } from './shared.jsx';

const shape = SHAPES.pyramid;

const SIDE_OPTIONS = [
  { n: 3, label: 'สามเหลี่ยม' },
  { n: 4, label: 'สี่เหลี่ยม' },
  { n: 5, label: 'ห้าเหลี่ยม' },
  { n: 6, label: 'หกเหลี่ยม' },
];

function regularPolygonMetrics(n, s) {
  const apothem = s / (2 * Math.tan(Math.PI / n));
  const circumradius = s / (2 * Math.sin(Math.PI / n));
  const perimeter = n * s;
  const area = (perimeter * apothem) / 2;
  return { apothem, circumradius, perimeter, area };
}

// unit base: circumradius = 1, vertex 0 at angle 0, edge(0,1) bisector at angle π/n
function unitPyramidGeometry(n) {
  const apex = [0, 0.5, 0];
  const base = [];
  for (let i = 0; i < n; i++) {
    const ang = (2 * Math.PI * i) / n;
    base.push([Math.cos(ang), -0.5, Math.sin(ang)]);
  }
  const positions = [];
  const tri = (p1, p2, p3) => positions.push(...p1, ...p2, ...p3);
  for (let i = 0; i < n; i++) {
    tri(apex, base[i], base[(i + 1) % n]);
  }
  for (let i = 1; i < n - 1; i++) {
    tri(base[0], base[i], base[i + 1]);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}

function PyramidMesh({ n, s, h, xray }) {
  const geometry = useMemo(() => unitPyramidGeometry(n), [n]);
  const meshRef = useRef();
  const matRef = useRef();

  const { apothem, circumradius } = regularPolygonMetrics(n, s);
  const scaleFactor = circumradius;

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const sc = meshRef.current.scale;
    sc.x = THREE.MathUtils.damp(sc.x, scaleFactor, 6, delta);
    sc.z = THREE.MathUtils.damp(sc.z, scaleFactor, 6, delta);
    sc.y = THREE.MathUtils.damp(sc.y, h, 6, delta);
    if (matRef.current) {
      matRef.current.opacity = THREE.MathUtils.damp(matRef.current.opacity, xray ? 0.16 : 1, 7, delta);
    }
  });

  const bisector = Math.PI / n;
  const dirX = Math.cos(bisector);
  const dirZ = Math.sin(bisector);

  const apex = [0, h / 2, 0];
  const baseCenter = [0, -h / 2, 0];
  const edgeMid = [dirX * apothem, -h / 2, dirZ * apothem];

  const markSize = Math.min(h, apothem) * 0.16;
  const rightAngleMark = [
    [dirX * markSize, -h / 2, dirZ * markSize],
    [dirX * markSize, -h / 2 + markSize, dirZ * markSize],
    [0, -h / 2 + markSize, 0],
  ];

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry} castShadow>
        <meshStandardMaterial ref={matRef} color="#f59e0b" flatShading transparent opacity={1} side={THREE.DoubleSide} />
        <Edges color="#92400e" />
      </mesh>

      <Line points={[apex, edgeMid]} color="#f97316" lineWidth={3} />
      {xray && (
        <>
          <Line points={[apex, baseCenter]} color="#22c55e" lineWidth={3} dashed dashSize={0.12} gapSize={0.08} />
          <Line points={rightAngleMark} color="#334155" lineWidth={2} />
        </>
      )}
    </group>
  );
}

export default function PyramidPanel() {
  const [n, setN] = useState(4);
  const [s, setS] = useState(6);
  const [h, setH] = useState(8);
  const [xray, setXray] = useState(false);

  const { apothem, circumradius, perimeter, area: B } = regularPolygonMetrics(n, s);
  const l = Math.sqrt(h * h + apothem * apothem);
  const lateral = 0.5 * perimeter * l;
  const total = lateral + B;
  const volume = (1 / 3) * B * h;

  return (
    <>
      <VisualizerCard shape={shape}>
        <Scene3D accent={shape.accent} fitSize={Math.max(circumradius * 2, h)}>
          <PyramidMesh n={n} s={s} h={h} xray={xray} />
        </Scene3D>

        <BigToggle
          checked={xray}
          onChange={setXray}
          onLabel="กำลังสแกนดูโครงสร้าง"
          offLabel="สแกนดูโครงสร้าง (X-Ray View)"
          icon={ScanEye}
          accent={shape.accent}
        />

        <div className="flex flex-col gap-2">
          <p className="text-base font-bold text-slate-600 md:text-lg">รูปฐาน</p>
          <div className="flex gap-1.5 rounded-full bg-white/70 p-1 ring-1 ring-white">
            {SIDE_OPTIONS.map((opt) => {
              const isActive = n === opt.n;
              return (
                <button
                  key={opt.n}
                  onClick={() => setN(opt.n)}
                  aria-label={opt.label}
                  className="flex flex-1 items-center justify-center rounded-full py-2 text-sm font-bold transition-colors md:text-base"
                  style={{
                    backgroundColor: isActive ? shape.accent : 'transparent',
                    color: isActive ? '#ffffff' : '#475569',
                  }}
                >
                  {opt.n}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl bg-white/70 p-4 ring-1 ring-white">
          <SliderRow label="ด้านฐาน (a)" value={s} min={3} max={14} step={0.5} unit="ซม." onChange={setS} colorKey="n" />
          <SliderRow label="สูงตรง (h)" value={h} min={3} max={18} step={0.5} unit="ซม." onChange={setH} colorKey="h" />
        </div>
      </VisualizerCard>

      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          <LegendChip c="l" symbol="l" label="สูงเอียง" />
          <LegendChip c="h" symbol="h" label="สูงตรง" />
        </div>

        <FormulaCard title="พื้นที่ผิว" accentText="text-amber-500">
          <div className="flex flex-col gap-3">
            <FormulaLine result={lateral} unit="ตร.ซม.">
              พื้นที่ผิวข้าง = ½ × p × <Var c="l">l</Var>
            </FormulaLine>
            <FormulaLine result={total} unit="ตร.ซม.">
              พื้นที่ผิวทั้งหมด = พื้นที่ผิวข้าง + B
            </FormulaLine>
          </div>
        </FormulaCard>

        <FormulaCard title="ปริมาตร" accentText="text-amber-500">
          <FormulaLine result={volume} unit="ลบ.ซม.">
            ปริมาตร = ⅓ × B × <Var c="h">h</Var>
          </FormulaLine>
          <p className="mt-3 text-lg text-slate-500">
            💡 <Var c="l">l</Var> = √(h² + apothem²) = <b>{l.toFixed(1)}</b> ซม. • p = {perimeter.toFixed(1)} ซม. • B = {B.toFixed(1)} ตร.ซม.
          </p>
          <p className="mt-2 text-lg text-slate-500">
            ⬛ กดปุ่ม X-Ray แล้วสังเกตมุมฉากเล็กๆ ที่ฐาน — <Var c="h">h</Var> ตั้งฉากกับฐานเสมอ ไม่ว่าฐานจะเป็นรูปกี่เหลี่ยม
          </p>
        </FormulaCard>
      </div>
    </>
  );
}
