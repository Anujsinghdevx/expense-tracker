import React, { useMemo } from "react";
import { Filter as FilterIcon, X } from "lucide-react";

export default function TransactionsTable({ filteredTransactions, filterCategory, onFilterChange, onDelete }) {
  const allCategories = useMemo(() => [...new Set(filteredTransactions.map((t) => t.category))], [filteredTransactions]);

  return (
    <section className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Transactions</h3>
        <div className="flex items-center gap-3">
          <FilterIcon size={18} className="text-gray-500" aria-hidden />
          <label className="sr-only" htmlFor="filterCategory">Filter category</label>
          <select
            id="filterCategory"
            value={filterCategory}
            onChange={(e) => onFilterChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
          >
            <option value="all">All Categories</option>
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="min-w-full whitespace-nowrap">
          <thead>
            <tr className="border-y border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length ? (
              filteredTransactions
                .slice()
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 align-top">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 align-top">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${t.type === "income" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 align-top font-medium">{t.category}</td>
                    <td className="py-3 px-4 align-top text-gray-600 max-w-[24rem] truncate">{t.description}</td>
                    <td className={`py-3 px-4 align-top text-right font-semibold ${t.type === "income" ? "text-green-600" : "text-red-600"}`}>
                      ₹{Number(t.amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 align-top text-center">
                      <button
                        onClick={() => onDelete(t.id)}
                        className="text-red-500 hover:text-red-700 transition-colors p-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
                        aria-label={`Delete ${t.description || "transaction"}`}
                      >
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">No transactions found for the selected filters</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}