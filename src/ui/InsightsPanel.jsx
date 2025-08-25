import React from "react";
import { exportToCSV, exportToPDF } from "../utils/exporters";
import { Download } from "lucide-react";

export default function InsightsPanel({
  savingsRate,
  topCategory,
  totalCount,
  filteredTransactions,
  selectedMonth,
}) {
  return (
    <div className="mb-6 rounded-2xl shadow-sm ring-1 ring-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="bg-white/80 backdrop-blur rounded-xl p-5 shadow-sm">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">Monthly Insights</h3>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Savings Rate</span>
            <span className="font-semibold text-lg text-slate-900">{savingsRate}%</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-600">Top Expense Category</span>
            <span className="font-semibold text-slate-900">{topCategory}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-600">Total Transactions</span>
            <span className="font-semibold text-slate-900">{totalCount}</span>
          </div>

          <div className="pt-4 border-t border-blue-100">
            <div className="flex gap-3">
              <button
                onClick={() => exportToCSV(filteredTransactions, selectedMonth)}
                className="flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium inline-flex items-center justify-center gap-2
                           bg-green-600 hover:bg-green-700 shadow-sm
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Download className="h-4 w-4" />
                CSV
              </button>
              <button
                onClick={() => exportToPDF(filteredTransactions, selectedMonth)}
                className="flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium inline-flex items-center justify-center gap-2
                           bg-red-600 hover:bg-red-700 shadow-sm
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Download className="h-4 w-4" />
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
