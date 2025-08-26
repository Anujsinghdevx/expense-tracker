import React, { useMemo, useState, useEffect, useCallback } from "react";
import { auth, provider, db } from "../firebase";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy } from "firebase/firestore";
import AuthHeader from "../ui/AuthHeader";
import SummaryCards from "../ui/SummaryCards";
import ExpenseBreakdown from "../ui/ExpenseBreakdown";
import InsightsPanel from "../ui/InsightsPanel";
import TransactionsTable from "../ui/TransactionsTable";
import AddTransactionModal from "../ui/AddTransactionModal";
import LoggedOut from "../ui/LoggedOut";
import UndoToast from "../ui/UndoToast";
import MonthlyExpenseLine from "../ui/MonthlyExpenseLine";
import IncomeExpenseCombo from "../ui/IncomeExpenseCombo";
import CumulativeBalanceArea from "../ui/CumulativeBalanceArea";
import BudgetPanel from "../ui/BudgetPanel";
import CSVImportModal from "../ui/CSVImportModal";
import FilterBar from "../ui/FilterBar";
import { processRecurringForUser } from "../utils/recurring";
import { ensureOnlineThenProcessQueue, queueAdd, queueDelete } from "../utils/offlineQueue";

const CATEGORIES = {
    income: ["Salary", "Freelance", "Investment", "Business", "Other Income"],
    expense: [
        "Rent",
        "Groceries",
        "Utilities",
        "Transportation",
        "Entertainment",
        "Healthcare",
        "Education",
        "Shopping",
        "Other Expense",
    ],
};

export default function ExpenseTracker() {
    // --- auth state ---
    const [user, setUser] = useState(null);
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            setUser(u || null);
            if (u) {
                // run offline queue whenever auth is known
                ensureOnlineThenProcessQueue(db);
                // spawn due recurring items for this user
                await processRecurringForUser(db, u.uid);
            }
        });
        return () => unsub();
    }, []);
    // --- all transactions (persisted) ---
    const [transactions, setTransactions] = useState([]);
    useEffect(() => {
        const fetchTransactions = async () => {
            const uid = auth.currentUser?.uid;
            if (!uid) return;
            try {
                const q = query(collection(db, "transactions"), where("userId", "==", uid), orderBy("date", "desc"));
                const snap = await getDocs(q);
                const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                setTransactions(data);
            } catch (err) {
                console.error("Failed to load transactions:", err);
            }
        };
        fetchTransactions();
    }, [user]);

    // --- ui state ---
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [filter, setFilter] = useState({
        category: "all",
        search: "",
        min: "",
        max: "",
        start: "",
        end: "",
        categories: [],
        tags: [],
    });
    const [showAddModal, setShowAddModal] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [newTransaction, setNewTransaction] = useState({
        type: "expense",
        amount: "",
        category: "",
        description: "",
        date: new Date().toISOString().slice(0, 10),
        tags: [],
    });

    // --- derive monthly + filtered ---
    const monthlyTransactions = useMemo(
        () => transactions.filter((t) => t.date?.startsWith(selectedMonth)),
        [transactions, selectedMonth]
    );

    const filteredTransactions = useMemo(() => {
        const { category, search, min, max, start, end, categories, tags } = filter;
        const s = (search || "").trim().toLowerCase();


        return monthlyTransactions.filter((t) => {
            if (category !== "all" && t.category !== category) return false;
            if (categories?.length && !categories.includes(t.category)) return false;
            if (tags?.length && !(t.tags || []).some((x) => tags.includes(x))) return false;
            if (s) {
                const hay = `${t.description || ""} ${t.category} ${t.type}`.toLowerCase();
                if (!hay.includes(s)) return false;
            }
            const amt = Number(t.amount || 0);
            if (min && amt < Number(min)) return false;
            if (max && amt > Number(max)) return false;
            if (start && t.date < start) return false;
            if (end && t.date > end) return false;
            return true;
        });
    }, [monthlyTransactions, filter]);

    const categoryBreakdown = useMemo(() => {
        const out = {};
        filteredTransactions
            .filter((t) => t.type === "expense")
            .forEach((t) => {
                out[t.category] = (out[t.category] || 0) + Number(t.amount || 0);
            });
        return out;
    }, [filteredTransactions]);

    const totals = useMemo(() => {
        const income = monthlyTransactions
            .filter((t) => t.type === "income")
            .reduce((s, t) => s + Number(t.amount || 0), 0);
        const expenses = monthlyTransactions
            .filter((t) => t.type === "expense")
            .reduce((s, t) => s + Number(t.amount || 0), 0);
        return { income, expenses, balance: income - expenses };
    }, [monthlyTransactions]);

    const savingsRate = totals.income > 0 ? ((totals.balance / totals.income) * 100).toFixed(1) : 0;
    const topCategory = Object.keys(categoryBreakdown).length
        ? Object.entries(categoryBreakdown).sort(([, a], [, b]) => b - a)[0][0]
        : "N/A";

    // --- actions ---
    const loginWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            setUser(result.user);
        } catch (err) {
            console.error("Error during Google login:", err);
            alert(err.message || "Login failed");
        }
    };
    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
        } catch (err) {
            console.error("Error during logout:", err);
            alert(err.message || "Logout failed");
        }
    };

    const [undo, setUndo] = useState(null);

    const addTransaction = async () => {
        if (!newTransaction.amount || !newTransaction.category) return;
        const uid = auth.currentUser?.uid;
        if (!uid) return alert("Please sign in again.");


        const tx = {
            userId: uid,
            ...newTransaction,
            amount: parseFloat(newTransaction.amount),
        };
        try {
            // optimistic local add (temporary id)
            const tempId = `temp_${Date.now()}`;
            setTransactions((prev) => [{ id: tempId, ...tx }, ...prev]);


            const create = async () => {
                const ref = await addDoc(collection(db, "transactions"), tx);
                // swap temp id with real id
                setTransactions((prev) => prev.map((t) => (t.id === tempId ? { ...t, id: ref.id } : t)));
            };


            if (navigator.onLine) await create();
            else await queueAdd(tx);


            setNewTransaction({ type: "expense", amount: "", category: "", description: "", date: new Date().toISOString().slice(0, 10), tags: [] });
            setShowAddModal(false);
        } catch (err) {
            console.error("Add failed:", err);
            alert(err.message || "Failed to add transaction");
        }
    };

    const deleteTransaction = useCallback(
        async (id) => {
            const tx = transactions.find((t) => t.id === id);
            if (!tx) return;
            // optimistic remove
            setTransactions((prev) => prev.filter((t) => t.id !== id));


            const timer = setTimeout(async () => {
                try {
                    if (navigator.onLine) await deleteDoc(doc(db, "transactions", id));
                    else await queueDelete(id);
                } catch (e) {
                    console.error("Delete failed:", e);
                    // revert on failure
                    setTransactions((prev) => [tx, ...prev]);
                }
                setUndo(null);
            }, 5000);


            setUndo({ tx, timer });
        },
        [transactions]
    );

    const undoDelete = useCallback(() => {
        if (!undo) return;
        clearTimeout(undo.timer);
        setTransactions((prev) => [undo.tx, ...prev]);
        setUndo(null);
    }, [undo]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {user ? (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <AuthHeader
                        user={user}
                        selectedMonth={selectedMonth}
                        onMonthChange={setSelectedMonth}
                        onAddClick={() => setShowAddModal(true)}
                        onLogout={logout}
                    />

                    <FilterBar filter={filter} setFilter={setFilter} />


                    <SummaryCards totals={totals} />


                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <ExpenseBreakdown breakdown={categoryBreakdown} />
                        <MonthlyExpenseLine transactions={transactions} />
                    </section>


                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <IncomeExpenseCombo transactions={transactions} />
                        <CumulativeBalanceArea transactions={transactions} />
                    </section>


                    <BudgetPanel selectedMonth={selectedMonth} user={user} db={db} />


                    <InsightsPanel
                        savingsRate={savingsRate}
                        topCategory={topCategory}
                        totalCount={monthlyTransactions.length}
                        filteredTransactions={filteredTransactions}
                        selectedMonth={selectedMonth}
                    />
                    <TransactionsTable
                        filteredTransactions={filteredTransactions}
                        filterCategory={filter.category}
                        onFilterChange={(val) => setFilter((f) => ({ ...f, category: val }))}
                        onDelete={deleteTransaction}
                    />

                    {showAddModal && (
                        <AddTransactionModal
                            open={showAddModal}
                            onClose={() => setShowAddModal(false)}
                            newTransaction={newTransaction}
                            setNewTransaction={setNewTransaction}
                            categories={CATEGORIES}
                            onSubmit={addTransaction}
                        />
                    )}


                    {showImport && (
                        <CSVImportModal
                            open={showImport}
                            onClose={() => setShowImport(false)}
                            onImport={async (rows) => {
                                const uid = auth.currentUser?.uid;
                                if (!uid) return;
                                const docs = rows.map((r) => ({
                                    userId: uid,
                                    type: r.type || "expense",
                                    amount: Number(r.amount || 0),
                                    category: r.category || "Other Expense",
                                    description: r.description || "",
                                    date: r.date || new Date().toISOString().slice(0, 10),
                                    tags: r.tags || [],
                                }));
                                // optimistic add all
                                const temps = docs.map((tx) => ({ id: `temp_${crypto.randomUUID?.() || Date.now()}`, ...tx }));
                                setTransactions((prev) => [...temps, ...prev]);
                                try {
                                    for (const tx of docs) {
                                        if (navigator.onLine) await addDoc(collection(db, "transactions"), tx);
                                        else await queueAdd(tx);
                                    }
                                } catch (e) {
                                    console.error(e);
                                    alert("Some rows failed to import.");
                                }
                            }}
                        />
                    )}


                    {!!undo && (
                        <UndoToast
                            message={`Deleted: ${undo.tx.description || "Transaction"}`}
                            actionLabel="Undo"
                            onAction={undoDelete}
                        />
                    )}
                </div>
            ) : (
                <LoggedOut onGoogleLogin={loginWithGoogle} />
            )}
        </div>
    );
}
