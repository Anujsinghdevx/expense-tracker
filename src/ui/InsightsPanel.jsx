import React from "react";
import { exportToCSV, exportToPDF } from "../utils/exporters";
import { Download } from "lucide-react";

export default function InsightsPanel({ savingsRate, topCategory, totalCount, filteredTransactions, selectedMonth }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6">
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Monthly Insights</h3>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Savings Rate</span>
          <span className="font-semibold text-lg">{savingsRate}%</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Top Expense Category</span>
          <span className="font-semibold">{topCategory}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total Transactions</span>
          <span className="font-semibold">{totalCount}</span>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={() => exportToCSV(filteredTransactions, selectedMonth)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg inline-flex items-center justify-center gap-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
            <button
              onClick={() => exportToPDF(filteredTransactions, selectedMonth)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg inline-flex items-center justify-center gap-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}