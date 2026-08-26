import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

/* ------------------------------------------------------------------ */
/*  Design tokens                                                      */
/* ------------------------------------------------------------------ */

export const COLOR = {
  r: { text: 'text-blue-500', bg: 'bg-blue-50', ring: 'ring-blue-200', dot: 'bg-blue-500', hex: '#3b82f6' },
  h: { text: 'text-green-500', bg: 'bg-green-50', ring: 'ring-green-200', dot: 'bg-green-500', hex: '#22c55e' },
  l: { text: 'text-orange-500', bg: 'bg-orange-50', ring: 'ring-orange-200', dot: 'bg-orange-500', hex: '#f97316' },
  n: { text: 'text-slate-500', bg: 'bg-slate-100', ring: 'ring-slate-200', dot: 'bg-slate-400', hex: '#64748b' },
};

export const SHAPES = {
  pyramid: { key: 'pyramid', label: 'พีระมิด', accent: '#f59e0b', soft: '#fef3c7', emoji: '🏛️', tagline: 'เหมือนพีระมิดอียิปต์' },
  cone: { key: 'cone', label: 'กรวย', accent: '#10b981', soft: '#d1fae5', emoji: '🍦', tagline: 'เหมือนโคนไอศกรีม' },
  sphere: { key: 'sphere', label: 'ทรงกลม', accent: '#0ea5e9', soft: '#e0f2fe', emoji: '🌍', tagline: 'เหมือนลูกบอล' },
};

/* ------------------------------------------------------------------ */
/*  Text / formula bits                                                */
/* ------------------------------------------------------------------ */

export function Var({ c = 'n', children }) {
  const s = COLOR[c];
  return <span className={`font-bold ${s.text}`}>{children}</span>;
}

export function LegendChip({ c, symbol, label }) {
  const s = COLOR[c];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm md:text-base font-semibold ${s.bg} ${s.text} ring-1 ${s.ring}`}>
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      {symbol} = {label}
    </span>
  );
}

export function AnimatedNumber({ value, decimals = 1 }) {
  const spring = useSpring(value, { stiffness: 140, damping: 22, mass: 0.6 });
  useEffect(() => {
    spring.set(value);
  }, [value, spring]);
  const display = useTransform(spring, (v) => v.toFixed(decimals));
  return <motion.span>{display}</motion.span>;
}

export function FormulaCard({ title, icon: Icon, accentText, children }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 md:p-7">
      <div className="mb-3 flex items-center gap-2">
        {Icon && <Icon className={`h-6 w-6 ${accentText}`} strokeWidth={2.5} />}
        <h3 className="text-xl font-bold text-slate-800 md:text-2xl">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function FormulaLine({ children, result, unit }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-5 py-4 text-xl font-bold tracking-wide text-slate-800 md:text-2xl">
      <div>{children}</div>
      {result !== undefined && (
        <div className="mt-1 text-2xl text-slate-900 md:text-3xl">
          = <AnimatedNumber value={result} /> <span className="text-lg font-semibold text-slate-400 md:text-xl">{unit}</span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Layout shells                                                      */
/* ------------------------------------------------------------------ */

export function SectionShell({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6"
    >
      {children}
    </motion.div>
  );
}

export function VisualizerCard({ shape, children }) {
  return (
    <div
      className="flex flex-col gap-4 rounded-3xl p-6 shadow-sm ring-1 ring-slate-100 md:p-7"
      style={{ background: `linear-gradient(180deg, ${shape.soft} 0%, #ffffff 60%)` }}
    >
      <div className="flex items-center gap-2 text-slate-700">
        <span className="text-2xl">{shape.emoji}</span>
        <p className="text-base font-semibold md:text-lg">{shape.tagline}</p>
      </div>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Controls                                                           */
/* ------------------------------------------------------------------ */

export function BigToggle({ checked, onChange, onLabel, offLabel, icon: Icon, accent }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200 transition active:scale-[0.98]"
    >
      <span className="flex items-center gap-2 text-base font-bold text-slate-700 md:text-lg">
        <Icon className="h-5 w-5" style={{ color: accent }} strokeWidth={2.5} />
        {checked ? onLabel : offLabel}
      </span>
      <span
        className="relative h-8 w-14 shrink-0 rounded-full transition-colors duration-300"
        style={{ backgroundColor: checked ? accent : '#e2e8f0' }}
      >
        <motion.span
          className="absolute top-1 h-6 w-6 rounded-full bg-white shadow"
          animate={{ left: checked ? 28 : 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        />
      </span>
    </button>
  );
}

export function SliderRow({ label, colorKey = 'n', value, min, max, step, unit, onChange }) {
  const s = COLOR[colorKey];
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-base font-bold text-slate-600 md:text-lg">
        <span>{label}</span>
        <span className={`${s.text}`}>
          {value.toFixed(1)} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-3 w-full cursor-pointer appearance-none rounded-full"
        style={{ background: `linear-gradient(to right, ${s.hex} 0%, ${s.hex} ${((value - min) / (max - min)) * 100}%, #e2e8f0 ${((value - min) / (max - min)) * 100}%, #e2e8f0 100%)`, accentColor: s.hex }}
      />
    </div>
  );
}

export function StatChip({ colorKey = 'n', label, value, unit, decimals = 1 }) {
  const s = COLOR[colorKey];
  return (
    <div className={`flex items-center justify-between rounded-xl px-3 py-2 ${s.bg}`}>
      <span className={`text-sm font-bold md:text-base ${s.text}`}>{label}</span>
      <span className="text-sm font-bold text-slate-700 md:text-base">
        <AnimatedNumber value={value} decimals={decimals} /> {unit}
      </span>
    </div>
  );
}
