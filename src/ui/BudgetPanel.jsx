import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";

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

export default function BudgetPanel({ selectedMonth, user, db }) {
  const [items, setItems] = useState([]); // [{id, category, amount}]
  const [form, setForm] = useState({ category: "Groceries", amount: "" });
  const [saving, setSaving] = useState(false);

  // ✅ NEW: track spend per category for this month
  const [spentByCategory, setSpentByCategory] = useState({}); // { [category]: number }

  // Helper: month start/end
  const monthStart = useMemo(() => {
    const d = new Date(selectedMonth);
    return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  }, [selectedMonth]);

  const monthEndExclusive = useMemo(() => {
    const d = new Date(selectedMonth);
    return new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0); // exclusive
  }, [selectedMonth]);

  useEffect(() => {
    const loadBudgets = async () => {
      if (!user) return;
      const qBudgets = query(
        collection(db, "budgets"),
        where("userId", "==", user.uid),
        where("month", "==", selectedMonth)
      );
      const snap = await getDocs(qBudgets);
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    loadBudgets();
  }, [db, user, selectedMonth]);

  // ✅ NEW: load transactions and aggregate spend per category for the month
  useEffect(() => {
    const loadSpend = async () => {
      if (!user) return;

      // If your `date` is a Firestore Timestamp:
      const qTx = query(
        collection(db, "transactions"),
        where("userId", "==", user.uid),
        where("type", "==", "expense"),
        where("date", ">=", monthStart),
        where("date", "<", monthEndExclusive)
      );

      const snap = await getDocs(qTx);

      const agg = {};
      snap.forEach((doc) => {
        const t = doc.data();
        const cat = t.category || "Other Expense";
        const amt = Number(t.amount || 0);
        agg[cat] = (agg[cat] || 0) + (Number.isFinite(amt) ? amt : 0);
      });

      setSpentByCategory(agg);
    };

    loadSpend();
  }, [db, user, monthStart, monthEndExclusive]);

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
    if (!user) return;
    const amountNum = Number(form.amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) return;

    setSaving(true);
    try {
      const existing = items.find(
        (i) => i.category === form.category && i.month === selectedMonth
      );

      if (existing) {
        const ref = doc(db, "budgets", existing.id);
        await updateDoc(ref, { amount: amountNum });
        setItems((prev) =>
          prev.map((i) => (i.id === existing.id ? { ...i, amount: amountNum } : i))
        );
      } else {
        const docRef = await addDoc(collection(db, "budgets"), {
          userId: user.uid,
          month: selectedMonth,
          category: form.category,
          amount: amountNum,
        });
        setItems((prev) => [
          ...prev,
          {
            id: docRef.id,
            userId: user.uid,
            month: selectedMonth,
            category: form.category,
            amount: amountNum,
          },
        ]);
      }
      setForm((f) => ({ ...f, amount: "" }));
    } finally {
      setSaving(false);
    }
  };

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
          {new Date(selectedMonth).toLocaleString("en-US", { month: "long", year: "numeric" })})
        </h3>
        <div className="text-sm text-gray-600 flex gap-4">
          <span>
            Total budget: <span className="font-medium">₹{totalBudget.toFixed(0)}</span>
          </span>
          <span>
            Spent: <span className="font-medium">₹{totalSpent.toFixed(0)}</span>
          </span>
          <span>
            Left: <span className="font-medium">₹{Math.max(0, totalBudget - totalSpent).toFixed(0)}</span>
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <form onSubmit={onSubmit} className="rounded-xl ring-1 ring-gray-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
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

            <input
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

        <div className="space-y-3">
          {items.length ? (
            items.map((b) => {
              const spent = Number(spentByCategory[b.category] || 0);
              const limit = Number(b.amount || 0);
              return (
                <div key={b.id} className="rounded-xl ring-1 ring-gray-200 p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">{b.category}</span>
                    <span>
                      ₹{spent.toFixed(0)} / ₹{limit.toFixed(0)}
                    </span>
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
    </section>
  );
}
