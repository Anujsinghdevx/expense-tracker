import React, { useEffect, useRef } from "react";
import * as Chart from "chart.js";

export default function ExpenseBreakdown({ breakdown }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    const labels = Object.keys(breakdown || {});
    const data = Object.values(breakdown || {});
    if (!labels.length) return;

    try {
      Chart.Chart.register(Chart.DoughnutController, Chart.ArcElement, Chart.Legend, Chart.Tooltip);
    } catch (_) {}

    const ctx = chartRef.current.getContext("2d");
    chartInstance.current = new Chart.Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: [
              "#FF6384",
              "#36A2EB",
              "#FFCE56",
              "#4BC0C0",
              "#9966FF",
              "#FF9F40",
              "#C9CBCF",
              "#a3e635",
            ],
            borderWidth: 2,
            borderColor: "#ffffff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom", labels: { padding: 20, font: { size: 12 } } } },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [breakdown]);

  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6">
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
      <div className="h-64">
        {Object.keys(breakdown || {}).length > 0 ? (
          <canvas ref={chartRef} aria-label="Expenses by category" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            No expense data available for this month
          </div>
        )}
      </div>
    </div>
  );
}
