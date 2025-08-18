import React from "react";
import { TrendingUp, TrendingDown, IndianRupeeIcon } from "lucide-react";

export default function SummaryCards({ totals }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="rounded-2xl shadow-sm ring-1 ring-green-200 bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm">Total Income</p>
            <p className="text-3xl font-bold leading-tight">₹{totals.income.toFixed(2)}</p>
          </div>
          <TrendingUp size={32} className="opacity-80" aria-hidden />
        </div>
      </div>

      <div className="rounded-2xl shadow-sm ring-1 ring-red-200 bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm">Total Expenses</p>
            <p className="text-3xl font-bold leading-tight">₹{totals.expenses.toFixed(2)}</p>
          </div>
          <TrendingDown size={32} className="opacity-80" aria-hidden />
        </div>
      </div>

      <div className={`rounded-2xl shadow-sm ring-1 ${totals.balance >= 0 ? "ring-blue-200 bg-gradient-to-r from-blue-500 to-blue-600" : "ring-orange-200 bg-gradient-to-r from-orange-500 to-orange-600"} p-6 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm">Net Balance</p>
            <p className="text-3xl font-bold leading-tight">₹{totals.balance.toFixed(2)}</p>
          </div>
          <IndianRupeeIcon size={32} className="opacity-80" aria-hidden />
        </div>
      </div>
    </section>
  );
}
