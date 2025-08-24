import React, { useEffect, useMemo, useRef, useState } from "react";
import * as Chart from "chart.js";

const COLORS = {
  incomeBarBg: "#56d3a6",     
  incomeBarBorder: "#41a07d", 
  expenseBarBg: "#ff6048",    
  expenseBarBorder: "#ef4444",
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

function sumByMonth(rows, type, year) {
  const arr = Array(12).fill(0);
  for (const t of rows) {
    if (!t?.date || t.type !== type) continue;
    if (!t.date.startsWith(year)) continue;
    const m = Number(t.date.slice(5, 7)) - 1;
    arr[m] += Number(t.amount || 0);
  }
  return arr;
}

export default function IncomeExpenseCombo({ transactions = [] }) {
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

  const income = useMemo(() => sumByMonth(transactions, "income", year), [transactions, year]);
  const expense = useMemo(() => sumByMonth(transactions, "expense", year), [transactions, year]);

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
        Chart.BarController,
        Chart.BarElement,
        Chart.LinearScale,
        Chart.CategoryScale,
        Chart.Legend,
        Chart.Tooltip
      );
    } catch (_) {}

    const ctx = chartRef.current.getContext("2d");

    chartInstance.current = new Chart.Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Income",
            data: income,
            backgroundColor: COLORS.incomeBarBg,
            borderColor: COLORS.incomeBarBorder,
            borderWidth: 1,
            borderRadius: 6,
            barPercentage: 1.5,
            categoryPercentage: 0.5,
          },
          {
            label: "Expenses",
            data: expense,
            backgroundColor: COLORS.expenseBarBg,
            borderColor: COLORS.expenseBarBorder,
            borderWidth: 1,
            borderRadius: 6,
            barPercentage: 1.5,
            categoryPercentage: 0.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            labels: { usePointStyle: true, pointStyle: "rectRounded", color: COLORS.tick, font: { weight: "500" } },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = ctx.parsed.y ?? 0;
                return `${ctx.dataset.label}: ${formatINR(v)}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: "Amount (₹)", color: COLORS.tick },
            ticks: {
              color: COLORS.tick,
              callback: (v) => `₹${Number(v).toLocaleString("en-IN")}`,
            },
            grid: { drawBorder: false, color: COLORS.grid },
          },
          x: {
            title: { display: true, text: `${year}`, color: COLORS.tick },
            stacked: false,
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
  }, [income, expense, year, labels]);

  return (
    <div className="rounded-2xl shadow-sm ring-1 ring-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900">Income vs Expense</h3>
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
        <canvas ref={chartRef} aria-label="Income vs Expense" />
      </div>
    </div>
  );
}
