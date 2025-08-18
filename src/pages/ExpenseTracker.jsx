import React, { useMemo, useState, useEffect } from "react";
import { auth, provider, db } from "../firebase";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";

import AuthHeader from "../ui/AuthHeader";
import SummaryCards from "../ui/SummaryCards";
import ExpenseBreakdown from "../ui/ExpenseBreakdown";
import InsightsPanel from "../ui/InsightsPanel";
import TransactionsTable from "../ui/TransactionsTable";
import AddTransactionModal from "../ui/AddTransactionModal";
import LoggedOut from "../ui/LoggedOut";
import MonthlyExpenseLine from "../ui/MonthlyExpenseLine";

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
        const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
        return () => unsub();
    }, []);

    // --- all transactions (persisted) ---
    const [transactions, setTransactions] = useState([]);
    useEffect(() => {
        const fetchTransactions = async () => {
            const uid = auth.currentUser?.uid;
            if (!uid) return;
            try {
                const q = query(collection(db, "transactions"), where("userId", "==", uid));
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
    const [filterCategory, setFilterCategory] = useState("all");
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTransaction, setNewTransaction] = useState({
        type: "expense",
        amount: "",
        category: "",
        description: "",
        date: new Date().toISOString().slice(0, 10),
    });

    // --- derived: filters & breakdown ---
    const monthlyTransactions = useMemo(
        () => transactions.filter((t) => t.date?.startsWith(selectedMonth)),
        [transactions, selectedMonth]
    );

    const filteredTransactions = useMemo(() => {
        return monthlyTransactions.filter(
            (t) => filterCategory === "all" || t.category === filterCategory
        );
    }, [monthlyTransactions, filterCategory]);

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

    const addTransaction = async () => {
        if (!newTransaction.amount || !newTransaction.category) return;
        const uid = auth.currentUser?.uid;
        if (!uid) {
            alert("Please sign in again.");
            return;
        }

        const tx = {
            userId: uid,
            ...newTransaction,
            amount: parseFloat(newTransaction.amount),
        };
        try {
            const docRef = await addDoc(collection(db, "transactions"), tx);
            setTransactions((prev) => [...prev, { id: docRef.id, ...tx }]);
            setNewTransaction({ type: "expense", amount: "", category: "", description: "", date: new Date().toISOString().slice(0, 10) });
            setShowAddModal(false);
        } catch (err) {
            console.error("Add failed:", err);
            alert(err.message || "Failed to add transaction");
        }
    };

    const deleteTransaction = async (id) => {
        try {
            await deleteDoc(doc(db, "transactions", id));
            setTransactions((prev) => prev.filter((t) => t.id !== id));
        } catch (err) {
            console.error("Delete failed:", err);
            alert(err.message || "Failed to delete");
        }
    };

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

                    <SummaryCards totals={totals} />

                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <ExpenseBreakdown breakdown={categoryBreakdown} />
                        <MonthlyExpenseLine transactions={transactions} />
                    </section>
                    
                    <InsightsPanel
                        savingsRate={savingsRate}
                        topCategory={topCategory}
                        totalCount={monthlyTransactions.length}
                        filteredTransactions={filteredTransactions}
                        selectedMonth={selectedMonth}
                    />

                    <TransactionsTable
                        filteredTransactions={filteredTransactions}
                        filterCategory={filterCategory}
                        onFilterChange={setFilterCategory}
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
                </div>
            ) : (
                <LoggedOut onGoogleLogin={loginWithGoogle} />
            )}
        </div>
    );
}
