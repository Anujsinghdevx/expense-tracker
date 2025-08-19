import React, { useEffect, useMemo, useState } from "react";
import { collection, addDoc, getDocs, query, where, doc, updateDoc } from "firebase/firestore";


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


    useEffect(() => {
        const load = async () => {
            if (!user) return;
            const q = query(collection(db, "budgets"), where("userId", "==", user.uid), where("month", "==", selectedMonth));
            const snap = await getDocs(q);
            setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        };
        load();
    }, [db, user, selectedMonth]);


    const totalBudget = useMemo(() => items.reduce((s, i) => s + Number(i.amount || 0), 0), [items]);


    return (
        <section className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Budgets ({new Date(selectedMonth).toLocaleString('en-US', { month: 'long', year: 'numeric' })})</h3>
                <div className="text-sm text-gray-600">Total budget: <span className="font-medium">₹{totalBudget.toFixed(0)}</span></div>
            </div>


            <div className="grid md:grid-cols-2 gap-4">
                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        const amount = Number(form.amount || 0);
                        if (!amount || !user) return;
                        const docRef = await addDoc(collection(db, "budgets"), {
                            userId: user.uid,
                            month: selectedMonth,
                            category: form.category,
                            amount,
                        });
                        setItems((prev) => [...prev, { id: docRef.id, userId: user.uid, month: selectedMonth, category: form.category, amount }]);
                        setForm({ category: form.category, amount: "" });
                    }}
                    className="rounded-xl ring-1 ring-gray-200 p-4"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm">
                            {["Rent", "Groceries", "Utilities", "Transportation", "Entertainment", "Healthcare", "Education", "Shopping", "Other Expense"].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input type="number" inputMode="numeric" placeholder="Amount (₹)" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Add / Update</button>
                    </div>
                </form>


                <div className="space-y-3">
                    {items.length ? items.map((b) => (
                        <div key={b.id} className="rounded-xl ring-1 ring-gray-200 p-4">
                            <div className="flex justify-between text-sm mb-2"><span className="font-medium">{b.category}</span><span>₹{Number(b.amount).toFixed(0)}</span></div>
                            {/* In a real app, compute actual spent per category for selectedMonth */}
                            <BudgetBar spent={0} limit={Number(b.amount || 0)} />
                        </div>
                    )) : <div className="text-sm text-gray-500">No budgets set for this month.</div>}
                </div>
            </div>
        </section>
    );
}