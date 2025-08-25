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
  const color =
    pct < 80 ? "bg-blue-500" : pct < 100 ? "bg-indigo-500" : "bg-rose-600";
  return (
    <div>
      <div className="flex justify-between text-sm mb-1 text-slate-600">
        <span>Spent</span>
        <span className="font-medium text-slate-800">{pct}%</span>
      </div>
      <div className="h-2 rounded bg-blue-100 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const normalizeCat = (s) => (s || "Other Expense").trim().toLowerCase();

const monthKey = (sel) => {
  if (!sel) return "";
  if (typeof sel === "string" && sel.length === 7 && sel[4] === "-") return sel;
  const d = new Date(sel);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

export default function BudgetPanel({ selectedMonth, user, db }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ category: "Groceries", amount: "" });
  const [saving, setSaving] = useState(false);

  const [spentByCategory, setSpentByCategory] = useState({});

  const ym = useMemo(() => monthKey(selectedMonth), [selectedMonth]);

  const monthStart = useMemo(() => {
    const [y, m] = ym.split("-");
    const Y = Number(y),
      M = Number(m) - 1;
    return new Date(Y, M, 1, 0, 0, 0, 0);
  }, [ym]);

  const monthEndExclusive = useMemo(() => {
    const [y, m] = ym.split("-");
    const Y = Number(y),
      M = Number(m) - 1;
    return new Date(Y, M + 1, 1, 0, 0, 0, 0);
  }, [ym]);

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

  useEffect(() => {
    if (!user || !ym) return;

    const qTs = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid),
      where("type", "==", "expense"),
      where("date", ">=", Timestamp.fromDate(monthStart)),
      where("date", "<", Timestamp.fromDate(monthEndExclusive))
    );

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
      const existing = items.find(
        (i) => i.category === form.category && i.month === ym
      );

      if (existing) {
        const ref = doc(db, "budgets", existing.id);
        await updateDoc(ref, { amount: amountNum });
      } else {
        await addDoc(collection(db, "budgets"), {
          userId: user.uid,
          month: ym,
          category: form.category,
          amount: amountNum,
        });
      }
      setForm((f) => ({ ...f, amount: "" }));
    } finally {
      setSaving(false);
    }
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingBudget, setPendingBudget] = useState(null);

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
    <section className="rounded-2xl shadow-sm ring-1 ring-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900">
          Budgets (
          {new Date(`${ym}-01`).toLocaleString("en-US", {
            month: "long",
            year: "numeric",
          })}
          )
        </h3>
        <div className="text-sm text-slate-600 flex flex-wrap gap-3">
          <span>
            Total budget:{" "}
            <span className="font-medium text-slate-900">
              ₹{totalBudget.toFixed(0)}
            </span>
          </span>
          <span>
            Spent:{" "}
            <span className="font-medium text-slate-900">
              ₹{totalSpent.toFixed(0)}
            </span>
          </span>
          <span>
            Left:{" "}
            <span className="font-medium text-slate-900">
              ₹{Math.max(0, totalBudget - totalSpent).toFixed(0)}
            </span>
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Add / Update budget */}
        <form
          onSubmit={onSubmit}
          className="rounded-xl ring-1 ring-blue-100 bg-white/80 backdrop-blur p-4 shadow-sm"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="sr-only" htmlFor="budgetCategory">
              Budget category
            </label>
            <select
              id="budgetCategory"
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
              className="px-3 py-2 border border-blue-200 rounded-lg bg-white/90 backdrop-blur text-sm
                         focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="budgetAmount">
              Amount
            </label>
            <input
              id="budgetAmount"
              type="number"
              inputMode="numeric"
              min="1"
              placeholder="Amount (₹)"
              value={form.amount}
              onChange={(e) =>
                setForm((f) => ({ ...f, amount: e.target.value }))
              }
              className="px-3 py-2 border border-blue-200 rounded-lg bg-white/90 backdrop-blur text-sm
                         focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />

            <button
              disabled={saving}
              className={`px-4 py-2 text-white rounded-lg text-sm transition
                ${saving
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"}`}
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
                <div
                  key={b.id}
                  className="rounded-xl ring-1 ring-blue-100 bg-white/80 backdrop-blur p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between text-sm mb-2">
                    <div className="font-medium text-slate-900">{b.category}</div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-800">
                        ₹{spent.toFixed(0)} / ₹{limit.toFixed(0)}{" "}
                        <span className="text-slate-500">· Left ₹{left.toFixed(0)}</span>
                      </span>
                      <button
                        onClick={() => requestDelete(b)}
                        className="px-2 py-1 rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100"
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
            <div className="text-sm text-slate-600">No budgets set for this month.</div>
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
          onClick={closeConfirm}
        >
          <div
            className="bg-white rounded-2xl shadow-lg ring-1 ring-blue-100 w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h4 id="budget-delete-title" className="text-lg font-semibold text-slate-900">
                Delete budget?
              </h4>
              <button
                className="p-1 rounded text-slate-500 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                onClick={closeConfirm}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-2 text-sm text-slate-600">
              This action cannot be undone. You’re about to delete:
            </p>

            {pendingBudget && (
              <div className="mt-3 rounded-lg bg-slate-50 ring-1 ring-blue-100 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-700">
                    {pendingBudget.category || "Budget"} ({pendingBudget.month || ym})
                  </span>
                  <span className="font-medium text-slate-900">
                    ₹{Number(pendingBudget.amount).toFixed(0)}
                  </span>
                </div>
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                onClick={closeConfirm}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
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
