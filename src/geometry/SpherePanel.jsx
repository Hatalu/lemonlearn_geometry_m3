import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { ScanEye, Sparkles } from 'lucide-react';
import { Scene3D } from './Scene3D.jsx';
import { Var, LegendChip, FormulaCard, FormulaLine, VisualizerCard, BigToggle, SliderRow, SHAPES } from './shared.jsx';

const shape = SHAPES.sphere;

// Evenly spread points on a unit sphere (golden-angle spiral) — used to fan out
// several radius lines so it visually reads as "every point, same distance from center".
function fibonacciSpherePoints(n) {
  const pts = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    pts.push([Math.cos(theta) * radiusAtY, y, Math.sin(theta) * radiusAtY]);
  }
  return pts;
}

const RADIUS_LINE_DIRS = fibonacciSpherePoints(9);

function SphereSolid({ r, opacityTarget, lineOpacity, showGrid = false }) {
  const meshRef = useRef();
  const matRef = useRef();
  const lo = lineOpacity ?? opacityTarget;

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const v = THREE.MathUtils.damp(meshRef.current.scale.x, r, 6, delta);
    meshRef.current.scale.setScalar(v);
    if (matRef.current) {
      matRef.current.opacity = THREE.MathUtils.damp(matRef.current.opacity, opacityTarget, 7, delta);
    }
  });

  return (
    <group>
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[1, 48, 32]} />
        <meshStandardMaterial ref={matRef} color="#38bdf8" transparent opacity={1} roughness={0.35} metalness={0.05} />
      </mesh>

      {showGrid && (
        <mesh scale={[r, r, r]}>
          <sphereGeometry args={[1.002, 16, 10]} />
          <meshBasicMaterial color="#0369a1" wireframe transparent opacity={lo * 0.55} />
        </mesh>
      )}

      <Line points={[[0, 0, 0], [r, 0, 0]]} color="#1d4ed8" lineWidth={3} transparent opacity={lo} />
      {showGrid &&
        RADIUS_LINE_DIRS.map((d, i) => (
          <Line
            key={i}
            points={[
              [0, 0, 0],
              [d[0] * r, d[1] * r, d[2] * r],
            ]}
            color="#3b82f6"
            lineWidth={1.5}
            transparent
            opacity={lo * 0.5}
          />
        ))}
      {showGrid && (
        <mesh>
          <sphereGeometry args={[Math.max(r * 0.035, 0.05), 16, 16]} />
          <meshStandardMaterial color="#1d4ed8" transparent opacity={lo} />
        </mesh>
      )}
    </group>
  );
}

const OFFSETS = [
  [-1, 1],
  [1, 1],
  [-1, -1],
  [1, -1],
];

function PeelPiece({ r, target, dx, dy, speed }) {
  const groupRef = useRef();
  const matRef = useRef();
  const pRef = useRef(0);

  useFrame((_, delta) => {
    pRef.current = THREE.MathUtils.damp(pRef.current, target, speed, delta);
    const p = pRef.current;
    if (!groupRef.current) return;
    const spacing = r + 0.55;
    groupRef.current.position.set(dx * spacing * p, dy * spacing * p, 0.02);
    groupRef.current.scale.setScalar(Math.max(p, 0.0001) * r);
    if (matRef.current) matRef.current.opacity = p;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <circleGeometry args={[1, 48]} />
        <meshStandardMaterial ref={matRef} color="#7dd3fc" side={THREE.DoubleSide} transparent opacity={0} />
      </mesh>
    </group>
  );
}

const MODE_TABS = [
  { key: 'peel', label: 'ปอกเปลือก', icon: Sparkles },
  { key: 'xray', label: 'X-Ray', icon: ScanEye },
];

export default function SpherePanel() {
  const [r, setR] = useState(5);
  const [mode, setMode] = useState('peel');
  const [peeled, setPeeled] = useState(false);

  const surface = 4 * Math.PI * r * r;
  const volume = (4 / 3) * Math.PI * r * r * r;

  const belowCanvas =
    mode === 'xray' ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
        🔵 ทุกจุดบนผิวห่างจากจุดศูนย์กลางเท่ากับ r เสมอ
      </span>
    ) : undefined;

  return (
    <>
      <VisualizerCard shape={shape}>
        <Scene3D accent={shape.accent} fitSize={r * 2} belowCanvas={belowCanvas}>
          {mode === 'peel' && (
            <>
              <SphereSolid r={r} opacityTarget={peeled ? 0 : 1} />
              {OFFSETS.map(([dx, dy], i) => (
                <PeelPiece key={i} r={r} target={peeled ? 1 : 0} dx={dx} dy={dy} speed={5 + i * 1.4} />
              ))}
            </>
          )}
          {mode === 'xray' && <SphereSolid r={r} opacityTarget={0.2} lineOpacity={1} showGrid />}
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

        {mode === 'peel' && (
          <BigToggle
            checked={peeled}
            onChange={setPeeled}
            onLabel="ปอกเปลือกแล้ว: เห็น 4 วงกลม"
            offLabel="ปอกเปลือก (Peel)"
            icon={Sparkles}
            accent={shape.accent}
          />
        )}
        {mode === 'xray' && (
          <p className="rounded-2xl bg-white/70 px-4 py-3 text-center text-base font-semibold text-slate-500 ring-1 ring-white">
            ผิวโปร่งแสง มองทะลุเห็นจุดศูนย์กลางและเส้น <span className="text-blue-500">r</span>
          </p>
        )}

        <div className="flex flex-col gap-3 rounded-2xl bg-white/70 p-4 ring-1 ring-white">
          <SliderRow label="รัศมี (r)" value={r} min={2} max={10} step={0.5} unit="ซม." onChange={setR} colorKey="r" />
        </div>
      </VisualizerCard>

      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          <LegendChip c="r" symbol="r" label="รัศมี" />
        </div>

        <FormulaCard title="พื้นที่ผิว" accentText="text-sky-500">
          <FormulaLine result={surface} unit="ตร.ซม.">
            พื้นที่ผิว = 4π<Var c="r">r</Var>²
          </FormulaLine>
          <p className="mt-3 text-lg text-slate-500">
            💡 เท่ากับพื้นที่วงกลม 4 วงที่มีรัศมี <Var c="r">r</Var> เท่ากัน
          </p>
        </FormulaCard>

        <FormulaCard title="ปริมาตร" accentText="text-sky-500">
          <FormulaLine result={volume} unit="ลบ.ซม.">
            ปริมาตร = 4/3 π<Var c="r">r</Var>³
          </FormulaLine>
          <p className="mt-3 text-lg text-slate-500">
            ⬛ กดโหมด <b>"X-Ray"</b> เพื่อมองทะลุผิวเห็นจุดศูนย์กลางและเส้นตารางละติจูด/ลองจิจูดด้านใน
          </p>
        </FormulaCard>
      </div>
    </>
  );
}
