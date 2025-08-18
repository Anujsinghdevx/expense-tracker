import React, { useMemo, useState, useCallback } from "react";
import { Filter as FilterIcon, X } from "lucide-react";

export default function TransactionsTable({
  filteredTransactions,
  filterCategory,
  onFilterChange,
  onDelete,
}) {
  const allCategories = useMemo(
    () => [...new Set(filteredTransactions.map((t) => t.category))],
    [filteredTransactions]
  );

  // --- local state for confirm modal ---
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingTx, setPendingTx] = useState(null); // { id, description, amount, date }

  const requestDelete = useCallback((tx) => {
    setPendingTx(tx);
    setConfirmOpen(true);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmOpen(false);
    setPendingTx(null);
  }, []);

  const confirmDelete = useCallback(() => {
    if (pendingTx?.id) onDelete(pendingTx.id);
    closeConfirm();
  }, [pendingTx, onDelete, closeConfirm]);

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
                    <td className="py-3 px-4 align-top">
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 align-top">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          t.type === "income" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 align-top font-medium">{t.category}</td>
                    <td className="py-3 px-4 align-top text-gray-600 max-w-[24rem] truncate">
                      {t.description}
                    </td>
                    <td
                      className={`py-3 px-4 align-top text-right font-semibold ${
                        t.type === "income" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      ₹{Number(t.amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 align-top text-center">
                      <button
                        onClick={() =>
                          requestDelete({
                            id: t.id,
                            description: t.description,
                            amount: t.amount,
                            date: t.date,
                          })
                        }
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
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  No transactions found for the selected filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Confirm Delete Modal */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onKeyDown={(e) => e.key === "Escape" && closeConfirm()}
          onClick={closeConfirm} // click backdrop to close
        >
          <div
            className="bg-white rounded-2xl shadow-lg ring-1 ring-gray-200 w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()} // prevent backdrop close when clicking content
          >
            <div className="flex items-start justify-between gap-4">
              <h4 className="text-lg font-semibold text-gray-900">Delete transaction?</h4>
              <button
                className="p-1 rounded text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                onClick={closeConfirm}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-2 text-sm text-gray-600">
              This action cannot be undone. You’re about to delete:
            </p>

            {pendingTx && (
              <div className="mt-3 rounded-lg bg-gray-50 ring-1 ring-gray-200 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">{pendingTx.description || "Transaction"}</span>
                  <span className="font-medium">
                    ₹{Number(pendingTx.amount).toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(pendingTx.date).toLocaleDateString()}
                </div>
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                onClick={closeConfirm}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
