import React from "react";
import { X } from "lucide-react";

export default function AddTransactionModal({
  open,
  onClose,
  newTransaction,
  setNewTransaction,
  categories,
  onSubmit,
}) {
  if (!open) return null;

  const initialTransaction = {
    type: "expense",
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  };

  const handleSubmit = () => {
    onSubmit(newTransaction);
    setNewTransaction(initialTransaction);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="rounded-2xl shadow-lg ring-1 ring-blue-100 w-full max-w-md bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="bg-white/90 backdrop-blur rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              Add Transaction
            </h3>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              aria-label="Close modal"
            >
              <X size={22} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
              <select
                value={newTransaction.type}
                onChange={(e) =>
                  setNewTransaction({ ...newTransaction, type: e.target.value, category: "" })
                }
                className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white/90
                           focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Amount</label>
              <input
                type="number"
                step="0.01"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white/90
                           focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                placeholder="0.00"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
              <select
                value={newTransaction.category}
                onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white/90
                           focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              >
                <option value="">Select Category</option>
                {categories[newTransaction.type].map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <input
                type="text"
                value={newTransaction.description}
                onChange={(e) =>
                  setNewTransaction({ ...newTransaction, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white/90
                           focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                placeholder="Enter description"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
              <input
                type="date"
                value={newTransaction.date}
                onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                max={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white/90
                           focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg
                           hover:bg-slate-50 transition-colors focus-visible:outline-none
                           focus-visible:ring-2 focus-visible:ring-slate-400 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!newTransaction.amount || !newTransaction.category}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium
                           hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed
                           transition-colors focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-blue-500"
              >
                Add Transaction
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
