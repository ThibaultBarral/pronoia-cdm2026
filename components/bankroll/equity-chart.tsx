"use client";

import { useMemo } from "react";

interface EquityChartProps {
  data: number[];
  initialAmount: number;
  height?: number;
}

export default function EquityChart({
  data,
  initialAmount,
  height = 140,
}: EquityChartProps) {
  const { points, areaPoints, min, max, isPositive, labels } = useMemo(() => {
    if (data.length < 2) {
      return { points: "", areaPoints: "", min: 0, max: 0, isPositive: true, labels: [] };
    }

    const min = Math.min(...data) * 0.995;
    const max = Math.max(...data) * 1.005;
    const range = max - min || 1;
    const W = 1000;
    const H = height * (1000 / 300); // normalized

    const toX = (i: number) => (i / (data.length - 1)) * W;
    const toY = (v: number) => H - ((v - min) / range) * H;

    const ptArr = data.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`);
    const pts = ptArr.join(" ");
    const area = `${toX(0).toFixed(1)},${H} ${pts} ${toX(data.length - 1).toFixed(1)},${H}`;

    const isPositive = data[data.length - 1] >= initialAmount;

    // X-axis labels: every ~10 bets
    const step = Math.max(1, Math.floor(data.length / 6));
    const labels = data
      .map((v, i) => ({ i, v, x: toX(i), y: toY(v) }))
      .filter((_, i) => i === 0 || i === data.length - 1 || i % step === 0);

    return { points: pts, areaPoints: area, min, max, isPositive, labels };
  }, [data, initialAmount, height]);

  if (data.length < 2) {
    return (
      <div
        className="flex flex-col items-center justify-center text-[#333] text-xs gap-2"
        style={{ height }}
      >
        <div className="w-12 h-px bg-[#1a1a1a]" />
        Aucune donnée — ajoute ton premier pari
      </div>
    );
  }

  const color = isPositive ? "var(--accent)" : "#ef4444";

  return (
    <div className="w-full relative" style={{ height }}>
      <svg
        viewBox={`0 0 1000 ${height * (1000 / 300)}`}
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        {/* Area fill */}
        <defs>
          <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.18 }} />
            <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#equityGrad)" />

        {/* Baseline (initial amount) */}
        <line
          x1="0"
          y1={`${((height * (1000 / 300)) - ((initialAmount - Math.min(...data) * 0.995) / ((Math.max(...data) * 1.005) - Math.min(...data) * 0.995)) * height * (1000 / 300)).toFixed(0)}`}
          x2="1000"
          y2={`${((height * (1000 / 300)) - ((initialAmount - Math.min(...data) * 0.995) / ((Math.max(...data) * 1.005) - Math.min(...data) * 0.995)) * height * (1000 / 300)).toFixed(0)}`}
          stroke="#1f1f1f"
          strokeWidth="2"
          strokeDasharray="8 6"
        />

        {/* Main line */}
        <polyline
          points={points}
          fill="none"
          style={{ stroke: color }}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Last point dot */}
        {data.length >= 2 && (() => {
          const lastX = ((data.length - 1) / (data.length - 1)) * 1000;
          const H = height * (1000 / 300);
          const range = Math.max(...data) * 1.005 - Math.min(...data) * 0.995 || 1;
          const lastY = H - ((data[data.length - 1] - Math.min(...data) * 0.995) / range) * H;
          return (
            <circle cx={lastX} cy={lastY} r="6" stroke="#0a0a0a" strokeWidth="2" style={{ fill: color }} />
          );
        })()}
      </svg>

      {/* Y axis labels */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between py-1">
        <span className="text-[9px] text-[#333] text-right pr-1">{max.toFixed(0)}€</span>
        <span className="text-[9px] text-[#333] text-right pr-1">{min.toFixed(0)}€</span>
      </div>
    </div>
  );
}
