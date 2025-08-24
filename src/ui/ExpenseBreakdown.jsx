import { useEffect, useMemo, useRef } from "react";
import * as Chart from "chart.js";

export default function ExpenseBreakdown({ breakdown }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const labels = useMemo(() => Object.keys(breakdown || {}), [breakdown]);
  const data = useMemo(() => Object.values(breakdown || {}), [breakdown]);

  const total = useMemo(() => data.reduce((a, b) => a + (Number(b) || 0), 0), [data]);
  const percents = useMemo(
    () => data.map(v => (total ? (Number(v) / total) * 100 : 0)),
    [data, total]
  );

  const colors = useMemo(() => {
    const n = labels.length || 8;
    const goldenAngle = 137.508;
    return Array.from({ length: n }, (_, i) => {
      const hue = Math.floor((i * goldenAngle) % 360);
      return hslToHex(hue, 65, 72);
    });
    function hslToHex(h, s, l) {
      s /= 100; l /= 100;
      const k = n => (n + h / 30) % 12;
      const a = s * Math.min(l, 1 - l);
      const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      const toHex = x => Math.round(x * 255).toString(16).padStart(2, "0");
      return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
    }
  }, [labels.length]);

  useEffect(() => {
    if (!chartRef.current || !labels.length) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    try {
      Chart.Chart.register(
        Chart.DoughnutController,
        Chart.ArcElement,
        Chart.Legend,
        Chart.Tooltip
      );
    } catch (_) {}

    const ctx = chartRef.current.getContext("2d");

    const valueLabelPlugin = {
      id: "valueLabelPlugin",
      afterDatasetDraw(chart) {
        const { ctx } = chart;
        const meta = chart.getDatasetMeta(0);
        const ds = chart.data.datasets[0];
        const values = ds.data || [];
        const sum = values.reduce((a, b) => a + (Number(b) || 0), 0);

        ctx.save();
        ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#1e293b"; 

        meta.data.forEach((arc, i) => {
          const v = Number(values[i]) || 0;
          if (!arc || v <= 0) return;
          const { x, y } = arc.tooltipPosition();
          const pct = sum ? Math.round((v / sum) * 100) : 0;
          const label = `${v.toLocaleString()} (${pct}%)`;

          if (arc.circumference >= Math.PI * 0.08) {
            ctx.shadowColor = "rgba(0,0,0,0.15)";
            ctx.shadowBlur = 3;
            ctx.fillText(label, x, y);
            ctx.shadowBlur = 0;
          }
        });

        ctx.restore();
      },
    };

    chartInstance.current = new Chart.Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: "#ffffff",
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "55%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = Number(ctx.parsed) || 0;
                const pct = total ? ((v / total) * 100).toFixed(1) : 0;
                return `${ctx.label}: ${v.toLocaleString()} (${pct}%)`;
              },
            },
          },
        },
      },
      plugins: [valueLabelPlugin],
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [labels, data, colors, total]);

  return (
    <div className="rounded-2xl shadow-sm ring-1 ring-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">
        Expense Breakdown
      </h3>

      {labels.length ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
          {/* Chart */}
          <div className="h-72 md:col-span-3 bg-white/80 rounded-xl p-4 shadow-sm">
            <canvas ref={chartRef} aria-label="Expenses by category" />
          </div>

          {/* Legend */}
          <div className="md:col-span-2 space-y-3 bg-white/80 rounded-xl p-4 shadow-sm">
            <div className="text-sm text-slate-600">
              <span className="font-medium text-slate-900">Total: </span>
              {total.toLocaleString()}
            </div>
            <ul className="max-h-64 overflow-auto pr-1 divide-y divide-slate-100">
              {labels.map((label, i) => (
                <li key={label} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-3.5 h-3.5 rounded-sm ring-1 ring-black/10"
                      style={{ background: colors[i] }}
                      aria-hidden
                    />
                    <span className="text-sm text-slate-800">{label}</span>
                  </div>
                  <div className="text-sm tabular-nums text-slate-700">
                    {Number(data[i]).toLocaleString()}{" "}
                    <span className="text-slate-500">
                      ({Math.round(percents[i])}%)
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-slate-500 text-sm bg-white/70 rounded-xl shadow-inner">
          No expense data available for this month
        </div>
      )}
    </div>
  );
}
