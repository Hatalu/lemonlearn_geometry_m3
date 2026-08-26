import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Hand, RotateCw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

function AutoFit({ fitSize, controlsRef }) {
  const prevSize = useRef(fitSize);
  const targetDistance = useRef(null);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const camera = controls.object;
    const target = controls.target;

    if (fitSize !== prevSize.current) {
      prevSize.current = fitSize;
      const ideal = Math.min(fitSize * 0.85 + 1.8, controls.maxDistance);
      const currentDist = camera.position.distanceTo(target);
      if (currentDist < ideal) {
        targetDistance.current = ideal;
      }
    }

    if (targetDistance.current != null) {
      const dir = camera.position.clone().sub(target);
      const currentDist = dir.length();
      const newDist = THREE.MathUtils.damp(currentDist, targetDistance.current, 4, delta);
      dir.setLength(newDist);
      camera.position.copy(target.clone().add(dir));
      controls.update();
      if (Math.abs(newDist - targetDistance.current) < 0.03) {
        targetDistance.current = null;
      }
    }
  });

  return null;
}

export function Scene3D({ children, accent = '#0ea5e9', fitSize = 6, belowCanvas }) {
  const [autoRotate, setAutoRotate] = useState(true);
  const controlsRef = useRef();

  // Frame the camera for this shape's actual starting size, not a fixed guess —
  // computed once on mount so the reset button also returns to a properly fitted view.
  const initialCamPos = useMemo(() => {
    const dir = new THREE.Vector3(3.4, 2.3, 3.6).normalize();
    const dist = Math.min(fitSize * 0.85 + 1.8, 60);
    return dir.multiplyScalar(dist).toArray();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const zoomBy = (factor) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const camera = controls.object;
    const target = controls.target;
    const dir = camera.position.clone().sub(target);
    const dist = Math.min(Math.max(dir.length() * factor, controls.minDistance), controls.maxDistance);
    dir.setLength(dist);
    camera.position.copy(target.clone().add(dir));
    controls.update();
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-72 w-full touch-none select-none md:h-80">
        <Canvas camera={{ position: initialCamPos, fov: 38 }} dpr={[1, 2]}>
          <ambientLight intensity={0.75} />
          <directionalLight position={[4, 6, 4]} intensity={1.15} />
          <directionalLight position={[-4, -1.5, -3]} intensity={0.35} />
          {children}
          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            autoRotate={autoRotate}
            autoRotateSpeed={1.4}
            minDistance={1.2}
            maxDistance={60}
            zoomSpeed={1}
            onStart={() => setAutoRotate(false)}
          />
          <AutoFit fitSize={fitSize} controlsRef={controlsRef} />
        </Canvas>

        <div className="absolute right-2 top-2 flex flex-col items-end gap-1.5">
          <button
            onClick={() => setAutoRotate((v) => !v)}
            className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-bold shadow-sm ring-1 transition"
            style={{
              backgroundColor: autoRotate ? accent : '#ffffff',
              color: autoRotate ? '#ffffff' : '#475569',
              borderColor: accent,
            }}
          >
            <RotateCw className="h-3.5 w-3.5" style={autoRotate ? { animation: 'spin 2.2s linear infinite' } : undefined} />
            หมุนอัตโนมัติ
          </button>

          <div className="flex items-center gap-0.5 rounded-full bg-white/90 p-1 shadow-sm ring-1 ring-slate-200">
            <button
              onClick={() => zoomBy(0.78)}
              className="rounded-full p-1.5 text-slate-600 transition hover:bg-slate-100 active:scale-90"
              aria-label="ซูมเข้า"
            >
              <ZoomIn className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <button
              onClick={() => zoomBy(1.28)}
              className="rounded-full p-1.5 text-slate-600 transition hover:bg-slate-100 active:scale-90"
              aria-label="ซูมออก"
            >
              <ZoomOut className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <button
              onClick={() => controlsRef.current && controlsRef.current.reset()}
              className="rounded-full p-1.5 text-slate-600 transition hover:bg-slate-100 active:scale-90"
              aria-label="รีเซ็ตมุมมอง"
            >
              <Maximize2 className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 px-1">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
          <Hand className="h-3.5 w-3.5" />
          ลากหมุน 360° • สกรอล/สองนิ้วซูม
        </span>
        {belowCanvas}
      </div>
    </div>
  );
}
