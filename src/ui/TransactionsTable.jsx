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

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingTx, setPendingTx] = useState(null);

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
    <section className="rounded-2xl shadow-sm ring-1 ring-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="bg-white/80 backdrop-blur rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">Recent Transactions</h3>
          <div className="flex items-center gap-3">
            <FilterIcon size={18} className="text-slate-500" aria-hidden />
            <label className="sr-only" htmlFor="filterCategory">Filter category</label>
            <select
              id="filterCategory"
              value={filterCategory}
              onChange={(e) => onFilterChange(e.target.value)}
              className="px-3 py-2 border border-blue-200 rounded-lg bg-white/90 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <tr className="border-y border-blue-100 bg-slate-50">
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Category</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Description</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">Amount</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length ? (
                filteredTransactions
                  .slice()
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((t) => (
                    <tr key={t.id} className="border-b border-blue-50 hover:bg-slate-50/60">
                      <td className="py-3 px-4 align-top">
                        {new Date(t.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 align-top">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            t.type === "income"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 align-top font-medium text-slate-900">
                        {t.category}
                      </td>
                      <td className="py-3 px-4 align-top text-slate-600 max-w-[24rem] truncate">
                        {t.description}
                      </td>
                      <td
                        className={`py-3 px-4 align-top text-right font-semibold ${
                          t.type === "income" ? "text-green-700" : "text-red-600"
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
                          className="text-red-600 hover:text-red-700 transition-colors p-2 rounded
                                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
                          aria-label={`Delete ${t.description || "transaction"}`}
                        >
                          <X size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No transactions found for the selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onKeyDown={(e) => e.key === "Escape" && closeConfirm()}
          onClick={closeConfirm}
        >
          <div
            className="bg-white rounded-2xl shadow-lg ring-1 ring-blue-100 w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h4 className="text-lg font-semibold text-slate-900">Delete transaction?</h4>
              <button
                className="p-1 rounded text-slate-500 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                onClick={closeConfirm}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-2 text-sm text-slate-600">This action cannot be undone. You’re about to delete:</p>

            {pendingTx && (
              <div className="mt-3 rounded-lg bg-slate-50 ring-1 ring-blue-100 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-700">
                    {pendingTx.description || "Transaction"}
                  </span>
                  <span className="font-medium text-slate-900">
                    ₹{Number(pendingTx.amount).toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {new Date(pendingTx.date).toLocaleDateString()}
                </div>
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                onClick={closeConfirm}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
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
