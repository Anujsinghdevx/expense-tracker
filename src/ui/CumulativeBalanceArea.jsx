import { useEffect, useMemo, useRef, useState } from "react";
import * as Chart from "chart.js";

const COLORS = {
 posBorder: "#10B981",
  posFill: "rgba(16,185,129,0.25)",
  negBorder: "#EF4444",
  negFill: "rgba(239,68,68,0.25)",
  grid: "rgba(30,41,59,0.08)",
  tick: "#334155",
};

function byMonth(rows, type, year) {
  const arr = Array(12).fill(0);
  for (const t of rows) {
    if (!t?.date || t.type !== type) continue;
    if (!t.date.startsWith(year)) continue;
    const i = Number(t.date.slice(5, 7)) - 1;
    arr[i] += Number(t.amount || 0);
  }
  return arr;
}

export default function CumulativeBalanceArea({ transactions = [] }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const years = useMemo(
    () =>
      Array.from(
        new Set(transactions.map((t) => t?.date?.slice(0, 4)).filter(Boolean))
      ).sort(),
    [transactions]
  );
  const fallback = years.length ? years[years.length - 1] : String(new Date().getFullYear());
  const [year, setYear] = useState(fallback);

  const inc = useMemo(() => byMonth(transactions, "income", year), [transactions, year]);
  const exp = useMemo(() => byMonth(transactions, "expense", year), [transactions, year]);

  const cum = useMemo(() => {
    const out = [];
    let running = 0;
    for (let i = 0; i < 12; i++) {
      running += inc[i] - exp[i];
      out.push(running);
    }
    return out;
  }, [inc, exp]);

  const posData = useMemo(() => cum.map((v) => (v > 0 ? v : null)), [cum]);
  const negData = useMemo(() => cum.map((v) => (v < 0 ? v : null)), [cum]);

  const labels = useMemo(
    () => ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    []
  );

  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }
    try {
      Chart.Chart.register(
        Chart.LineController,
        Chart.LineElement,
        Chart.PointElement,
        Chart.LinearScale,
        Chart.CategoryScale,
        Chart.Legend,
        Chart.Tooltip,
        Chart.Filler
      );
    } catch (_) {}

    const ctx = chartRef.current.getContext("2d");

    chartInstance.current = new Chart.Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: `Cumulative Balance (+) ${year}`,
            data: posData,
            borderColor: COLORS.posBorder,
            backgroundColor: COLORS.posFill,
            borderWidth: 2,
            tension: 0.3,
            pointRadius: 2,
            fill: true,
          },
          {
            label: `Cumulative Balance (–) ${year}`,
            data: negData,
            borderColor: COLORS.negBorder,
            backgroundColor: COLORS.negFill,
            borderWidth: 2,
            tension: 0.3,
            pointRadius: 2,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            labels: { usePointStyle: true, pointStyle: "circle", color: COLORS.tick, font: { weight: "500" } },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = ctx.parsed.y ?? 0;
                return `${ctx.dataset.label.replace(` ${year}`, "")}: ₹${v.toLocaleString("en-IN")}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: "Balance (₹)", color: COLORS.tick },
            ticks: {
              color: COLORS.tick,
              callback: (v) => `₹${Number(v).toLocaleString("en-IN")}`,
            },
            grid: { drawBorder: false, color: COLORS.grid },
          },
          x: {
            title: { display: true, text: "Month", color: COLORS.tick },
            ticks: { color: COLORS.tick },
            grid: { display: false },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [posData, negData, year, labels]);

  return (
    <div className="rounded-2xl shadow-sm ring-1 ring-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900">Cumulative Balance</h3>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="px-3 py-2 border border-blue-200 rounded-lg bg-white/90 backdrop-blur text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {[...new Set([fallback, ...years])].sort().map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="h-64 bg-white/80 rounded-xl p-4 shadow-sm">
        <canvas ref={chartRef} aria-label="Cumulative Balance" />
      </div>
    </div>
  );
}
