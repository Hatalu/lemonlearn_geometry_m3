import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Triangle, IceCreamCone, Globe } from 'lucide-react';
import { SHAPES, SectionShell } from './geometry/shared.jsx';
import PyramidPanel from './geometry/PyramidPanel.jsx';
import ConePanel from './geometry/ConePanel.jsx';
import SpherePanel from './geometry/SpherePanel.jsx';

const TAB_ICONS = { pyramid: Triangle, cone: IceCreamCone, sphere: Globe };

function TabBar({ active, onChange }) {
  return (
    <div className="mx-auto flex w-full max-w-xl gap-2 rounded-full bg-white p-2 shadow-sm ring-1 ring-slate-100">
      {Object.values(SHAPES).map((s) => {
        const Icon = TAB_ICONS[s.key];
        const isActive = active === s.key;
        return (
          <button
            key={s.key}
            onClick={() => onChange(s.key)}
            className="relative flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-base font-bold transition-colors md:text-lg"
            style={{ color: isActive ? '#ffffff' : '#475569' }}
          >
            {isActive && (
              <motion.span
                layoutId="tab-pill"
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: s.accent }}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              <Icon className="h-5 w-5" strokeWidth={2.5} />
              {s.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function Geometry3DLesson() {
  const [active, setActive] = useState('pyramid');

  return (
    <div
      className="min-h-screen w-full bg-slate-50"
      style={{ background: 'linear-gradient(180deg, #fefce8 0%, #f8fafc 22%, #f8fafc 78%, #f0f9ff 100%)' }}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 md:py-12">
        <header className="text-center">
          <h1 className="text-3xl font-extrabold text-slate-800 md:text-4xl">เรขาคณิตสามมิติ</h1>
          <p className="mt-1 text-lg font-medium text-slate-500 md:text-xl">
            พื้นที่ผิวและปริมาตร: พีระมิด กรวย ทรงกลม
          </p>
        </header>

        <TabBar active={active} onChange={setActive} />

        <AnimatePresence mode="wait">
          {active === 'pyramid' && (
            <SectionShell key="pyramid">
              <PyramidPanel />
            </SectionShell>
          )}
          {active === 'cone' && (
            <SectionShell key="cone">
              <ConePanel />
            </SectionShell>
          )}
          {active === 'sphere' && (
            <SectionShell key="sphere">
              <SpherePanel />
            </SectionShell>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
