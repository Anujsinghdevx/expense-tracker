import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { X } from "lucide-react";

function BudgetBar({ spent, limit }) {
  const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
  const color = pct < 80 ? "bg-green-500" : pct < 100 ? "bg-amber-500" : "bg-red-600";
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>Spent</span><span>{pct}%</span>
      </div>
      <div className="h-2 rounded bg-gray-200 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// Normalize categories for stable lookup
const normalizeCat = (s) => (s || "Other Expense").trim().toLowerCase();

// Format to "YYYY-MM" from selectedMonth (which can be "YYYY-MM" or Date string)
const monthKey = (sel) => {
  if (!sel) return "";
  if (typeof sel === "string" && sel.length === 7 && sel[4] === "-") return sel;
  const d = new Date(sel);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

export default function BudgetPanel({ selectedMonth, user, db }) {
  const [items, setItems] = useState([]); // budgets
  const [form, setForm] = useState({ category: "Groceries", amount: "" });
  const [saving, setSaving] = useState(false);

  // aggregated spend per normalized category for this month
  const [spentByCategory, setSpentByCategory] = useState({}); // { [normalizedCategory]: number }

  const ym = useMemo(() => monthKey(selectedMonth), [selectedMonth]);

  // JS Date boundaries for Timestamp path
  const monthStart = useMemo(() => {
    const [y, m] = ym.split("-");
    const Y = Number(y), M = Number(m) - 1;
    return new Date(Y, M, 1, 0, 0, 0, 0);
  }, [ym]);

  const monthEndExclusive = useMemo(() => {
    const [y, m] = ym.split("-");
    const Y = Number(y), M = Number(m) - 1;
    return new Date(Y, M + 1, 1, 0, 0, 0, 0); // exclusive
  }, [ym]);

  // 🔄 Real-time budgets (by month string)
  useEffect(() => {
    if (!user || !ym) return;
    const qBudgets = query(
      collection(db, "budgets"),
      where("userId", "==", user.uid),
      where("month", "==", ym)
    );
    const unsub = onSnapshot(
      qBudgets,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => console.error("Budgets snapshot error:", err)
    );
    return () => unsub();
  }, [db, user, ym]);

  // 🔄 Real-time transactions for the month (support Timestamp and string dates)
  useEffect(() => {
    if (!user || !ym) return;

    // --- Listener A: Timestamp range ---
    const qTs = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid),
      where("type", "==", "expense"),
      where("date", ">=", Timestamp.fromDate(monthStart)),
      where("date", "<", Timestamp.fromDate(monthEndExclusive))
    );

    // --- Listener B: String "YYYY-MM-DD" range (lexicographic) ---
    const qStr = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid),
      where("type", "==", "expense"),
      where("date", ">=", `${ym}-01`),
      where("date", "<", `${ym}-99`)
    );

    let latestAggTs = {};
    let latestAggStr = {};

    const combineAndSet = () => {
      const merged = { ...latestAggStr };
      for (const [k, v] of Object.entries(latestAggTs)) {
        merged[k] = (merged[k] || 0) + v;
      }
      setSpentByCategory(merged);
    };

    const unsubTs = onSnapshot(
      qTs,
      (snap) => {
        const agg = {};
        snap.forEach((d) => {
          const t = d.data();
          const key = normalizeCat(t.category);
          const amt = Number(t.amount || 0);
          agg[key] = (agg[key] || 0) + (Number.isFinite(amt) ? amt : 0);
        });
        latestAggTs = agg;
        combineAndSet();
      },
      (err) => console.error("Tx Timestamp snapshot error:", err)
    );

    const unsubStr = onSnapshot(
      qStr,
      (snap) => {
        const agg = {};
        snap.forEach((d) => {
          const t = d.data();
          if (typeof t.date !== "string") return;
          const key = normalizeCat(t.category);
          const amt = Number(t.amount || 0);
          agg[key] = (agg[key] || 0) + (Number.isFinite(amt) ? amt : 0);
        });
        latestAggStr = agg;
        combineAndSet();
      },
      (err) => console.error("Tx String snapshot error:", err)
    );

    return () => {
      unsubTs();
      unsubStr();
    };
  }, [db, user, ym, monthStart, monthEndExclusive]);

  const totalBudget = useMemo(
    () => items.reduce((s, i) => s + Number(i.amount || 0), 0),
    [items]
  );

  const totalSpent = useMemo(
    () => Object.values(spentByCategory).reduce((s, v) => s + Number(v || 0), 0),
    [spentByCategory]
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!user || !ym) return;
    const amountNum = Number(form.amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) return;

    setSaving(true);
    try {
      const existing = items.find((i) => i.category === form.category && i.month === ym);

      if (existing) {
        const ref = doc(db, "budgets", existing.id);
        await updateDoc(ref, { amount: amountNum });
      } else {
        await addDoc(collection(db, "budgets"), {
          userId: user.uid,
          month: ym, // store canonical "YYYY-MM"
          category: form.category, // keep human-readable; normalize only for lookups
          amount: amountNum,
        });
      }
      setForm((f) => ({ ...f, amount: "" }));
    } finally {
      setSaving(false);
    }
  };

  // ===== Confirm Modal state/handlers (like your TransactionsTable) =====
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingBudget, setPendingBudget] = useState(null); // { id, category, amount, month }

  const requestDelete = useCallback((b) => {
    setPendingBudget(b);
    setConfirmOpen(true);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmOpen(false);
    setPendingBudget(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!pendingBudget?.id) return;
    await deleteDoc(doc(db, "budgets", pendingBudget.id));
    closeConfirm();
  }, [pendingBudget, db, closeConfirm]);

  const categories = [
    "Rent",
    "Groceries",
    "Utilities",
    "Transportation",
    "Entertainment",
    "Healthcare",
    "Education",
    "Shopping",
    "Other Expense",
  ];

  return (
    <section className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
          Budgets (
          {new Date(`${ym}-01`).toLocaleString("en-US", { month: "long", year: "numeric" })})
        </h3>
        <div className="text-sm text-gray-600 flex gap-4">
          <span>
            Total budget: <span className="font-medium">₹{totalBudget.toFixed(0)}</span>
          </span>
          <span>
            Spent: <span className="font-medium">₹{totalSpent.toFixed(0)}</span>
          </span>
          <span>
            Left:{" "}
            <span className="font-medium">
              ₹{Math.max(0, totalBudget - totalSpent).toFixed(0)}
            </span>
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Add / Update budget */}
        <form onSubmit={onSubmit} className="rounded-xl ring-1 ring-gray-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="sr-only" htmlFor="budgetCategory">Budget category</label>
            <select
              id="budgetCategory"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="budgetAmount">Amount</label>
            <input
              id="budgetAmount"
              type="number"
              inputMode="numeric"
              min="1"
              placeholder="Amount (₹)"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            />

            <button
              disabled={saving}
              className={`px-4 py-2 text-white rounded-lg text-sm ${
                saving ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {saving ? "Saving..." : "Add / Update"}
            </button>
          </div>
        </form>

        {/* Budget list */}
        <div className="space-y-3">
          {items.length ? (
            items.map((b) => {
              const spent = Number(spentByCategory[normalizeCat(b.category)] || 0);
              const limit = Number(b.amount || 0);
              const left = Math.max(0, limit - spent);
              return (
                <div key={b.id} className="rounded-xl ring-1 ring-gray-200 p-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <div className="font-medium">{b.category}</div>
                    <div className="flex items-center gap-3">
                      <span>
                        ₹{spent.toFixed(0)} / ₹{limit.toFixed(0)}{" "}
                        <span className="text-gray-500">· Left ₹{left.toFixed(0)}</span>
                      </span>
                      <button
                        onClick={() => requestDelete(b)}
                        className="px-2 py-1 rounded-md bg-red-50 text-red-700 hover:bg-red-100"
                        title="Delete budget"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <BudgetBar spent={spent} limit={limit} />
                </div>
              );
            })
          ) : (
            <div className="text-sm text-gray-500">No budgets set for this month.</div>
          )}
        </div>
      </div>

      {/* Confirm Delete Modal */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="budget-delete-title"
          onKeyDown={(e) => e.key === "Escape" && closeConfirm()}
          onClick={closeConfirm} // click backdrop to close
        >
          <div
            className="bg-white rounded-2xl shadow-lg ring-1 ring-gray-200 w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()} // prevent backdrop close when clicking content
          >
            <div className="flex items-start justify-between gap-4">
              <h4 id="budget-delete-title" className="text-lg font-semibold text-gray-900">
                Delete budget?
              </h4>
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

            {pendingBudget && (
              <div className="mt-3 rounded-lg bg-gray-50 ring-1 ring-gray-200 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">
                    {pendingBudget.category || "Budget"} ({pendingBudget.month || ym})
                  </span>
                  <span className="font-medium">₹{Number(pendingBudget.amount).toFixed(0)}</span>
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
