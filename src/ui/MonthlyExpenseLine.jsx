// src/ui/MonthlyExpenseLine.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as Chart from "chart.js";

function formatINR(n) {
  const v = Number(n || 0);
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
}

export default function MonthlyExpenseLine({ transactions = [] }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Collect available years from data (fallback to current year)
  const yearsInData = useMemo(() => {
    const s = new Set(
      transactions
        .map((t) => t?.date?.slice(0, 4))
        .filter(Boolean)
    );
    return Array.from(s).sort(); // ascending
  }, [transactions]);

  const defaultYear =
    yearsInData.length ? yearsInData[yearsInData.length - 1] : String(new Date().getFullYear());

  const [year, setYear] = useState(defaultYear);

  // Compute monthly sums (expenses only) for selected year
  const monthlyData = useMemo(() => {
    const sums = Array(12).fill(0);
    for (const t of transactions) {
      if (!t?.date || t.type !== "expense") continue;
      if (!t.date.startsWith(year)) continue; // YYYY-...
      const mIdx = Number(t.date.slice(5, 7)) - 1; // 0-11
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

    // Register needed pieces once (Chart.js v3+)
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
            label: `Expenses (${year})`,
            data: monthlyData,
            // keep default colors; Tailwind is for layout, Chart.js handles line
            borderWidth: 2,
            tension: 0.3,
            pointRadius: 3,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: true },
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
              callback: (v) => (Number(v) >= 1000 ? `${Math.round(v / 1000)}k` : v),
            },
            title: { display: true, text: "Expense (₹)" },
          },
          x: { title: { display: true, text: "Month" } },
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

  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Monthly Expense Trend</h3>
        <div className="flex items-center gap-2">
          <label htmlFor="year" className="text-sm text-gray-600">Year</label>
          <select
            id="year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
          >
            {[...new Set([defaultYear, ...yearsInData])].sort().map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="h-64">
        <canvas ref={chartRef} aria-label="Monthly expenses line chart" />
      </div>
      <div className="mt-3 text-xs text-gray-500">
        Total this year: <span className="font-medium">
          {formatINR(monthlyData.reduce((s, v) => s + v, 0))}
        </span>
      </div>
    </div>
  );
}
