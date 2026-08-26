import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { Sparkles } from 'lucide-react';
import { Scene3D } from './Scene3D.jsx';
import { Var, LegendChip, FormulaCard, FormulaLine, VisualizerCard, BigToggle, SliderRow, SHAPES } from './shared.jsx';

const shape = SHAPES.sphere;

function SphereSolid({ r, opacityTarget }) {
  const meshRef = useRef();
  const matRef = useRef();

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
      <Line points={[[0, 0, 0], [r, 0, 0]]} color="#1d4ed8" lineWidth={3} transparent opacity={opacityTarget} />
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

export default function SpherePanel() {
  const [r, setR] = useState(5);
  const [peeled, setPeeled] = useState(false);

  const surface = 4 * Math.PI * r * r;
  const volume = (4 / 3) * Math.PI * r * r * r;

  return (
    <>
      <VisualizerCard shape={shape}>
        <Scene3D accent={shape.accent} fitSize={r * 2}>
          <SphereSolid r={r} opacityTarget={peeled ? 0 : 1} />
          {OFFSETS.map(([dx, dy], i) => (
            <PeelPiece key={i} r={r} target={peeled ? 1 : 0} dx={dx} dy={dy} speed={5 + i * 1.4} />
          ))}
        </Scene3D>

        <BigToggle
          checked={peeled}
          onChange={setPeeled}
          onLabel="ปอกเปลือกแล้ว: เห็น 4 วงกลม"
          offLabel="ปอกเปลือก (Peel)"
          icon={Sparkles}
          accent={shape.accent}
        />

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
        </FormulaCard>
      </div>
    </>
  );
}
