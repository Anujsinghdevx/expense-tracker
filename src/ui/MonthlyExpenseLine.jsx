import React, { useEffect, useMemo, useRef, useState } from "react";
import * as Chart from "chart.js";

const COLORS = {
  line: "#EF4444",             
  point: "#B91C1C",              
  fillTop: "rgba(239,68,68,0.25)",
  fillBottom: "rgba(239,68,68,0.02)",
  grid: "rgba(30,41,59,0.08)",
  tick: "#334155",
  title: "#0f172a",
};

function formatINR(n) {
  const v = Number(n || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(v);
}

export default function MonthlyExpenseLine({ transactions = [] }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const yearsInData = useMemo(() => {
    const s = new Set(transactions.map((t) => t?.date?.slice(0, 4)).filter(Boolean));
    return Array.from(s).sort();
  }, [transactions]);

  const defaultYear =
    yearsInData.length ? yearsInData[yearsInData.length - 1] : String(new Date().getFullYear());

  const [year, setYear] = useState(defaultYear);

  const monthlyData = useMemo(() => {
    const sums = Array(12).fill(0);
    for (const t of transactions) {
      if (!t?.date || t.type !== "expense") continue;
      if (!t.date.startsWith(year)) continue;
      const mIdx = Number(t.date.slice(5, 7)) - 1;
      const amt = Number(t.amount || 0);
      if (!Number.isNaN(mIdx) && mIdx >= 0 && mIdx < 12) sums[mIdx] += amt;
    }
    return sums;
  }, [transactions, year]);

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

    const { height } = chartRef.current;
    const gradient = ctx.createLinearGradient(0, 0, 0, height || 256);
    gradient.addColorStop(0, COLORS.fillTop);
    gradient.addColorStop(1, COLORS.fillBottom);

    chartInstance.current = new Chart.Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: `Expenses (${year})`,
            data: monthlyData,
            borderColor: COLORS.line,
            backgroundColor: gradient,
            borderWidth: 2,
            tension: 0.35,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: COLORS.point,
            pointBorderColor: COLORS.point,
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
            display: true,
            labels: {
              usePointStyle: true,
              pointStyle: "circle",
              color: COLORS.tick,
              font: { weight: "500" },
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${formatINR(ctx.parsed.y)}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: COLORS.tick,
              callback: (v) => (Number(v) >= 1000 ? `${Math.round(v / 1000)}k` : v),
            },
            title: { display: true, text: "Expense (₹)", color: COLORS.tick },
            grid: { drawBorder: false, color: COLORS.grid },
          },
          x: {
            ticks: { color: COLORS.tick },
            title: { display: true, text: "Month", color: COLORS.tick },
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
  }, [monthlyData, labels, year]);

  const totalYear = monthlyData.reduce((s, v) => s + v, 0);

  return (
    <div className="rounded-2xl shadow-sm ring-1 ring-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900">Monthly Expense Trend</h3>

        <div className="flex items-center gap-2">
          <label htmlFor="year" className="text-sm text-slate-600">Year</label>
          <select
            id="year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="px-3 py-2 border border-blue-200 rounded-lg bg-white/90 backdrop-blur text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[...new Set([defaultYear, ...yearsInData])].sort().map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="h-64 bg-white/80 rounded-xl p-4 shadow-sm">
        <canvas ref={chartRef} aria-label="Monthly expenses line chart" />
      </div>

      <div className="mt-3 text-xs text-slate-600">
        Total this year:{" "}
        <span className="font-medium text-slate-900">
          {formatINR(totalYear)}
        </span>
      </div>
    </div>
  );
}
