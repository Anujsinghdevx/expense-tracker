import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Filter as FilterIcon,
  Download,
  Calendar as CalendarIcon,
  LogOut,
  UserRound,
  X, Lock, ShieldCheck, LogIn,
  IndianRupeeIcon
} from 'lucide-react';
import * as Chart from 'chart.js';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, provider, db } from './firebase';

const ExpenseTracker = () => {
  const [transactions, setTransactions] = useState([
    { id: 's1', type: 'income', amount: 5000, category: 'Salary', description: 'Monthly salary', date: '2024-01-15' },
    { id: 's2', type: 'expense', amount: 1200, category: 'Rent', description: 'Monthly rent', date: '2024-01-01' },
    { id: 's3', type: 'expense', amount: 300, category: 'Groceries', description: 'Weekly groceries', date: '2024-01-05' },
    { id: 's4', type: 'expense', amount: 150, category: 'Utilities', description: 'Electricity bill', date: '2024-01-10' },
    { id: 's5', type: 'income', amount: 500, category: 'Freelance', description: 'Web design project', date: '2024-01-20' },
  ]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [user, setUser] = useState(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterCategory, setFilterCategory] = useState('all');
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
  });

  const categories = {
    income: ['Salary', 'Freelance', 'Investment', 'Business', 'Other Income'],
    expense: ['Rent', 'Groceries', 'Utilities', 'Transportation', 'Entertainment', 'Healthcare', 'Education', 'Shopping', 'Other Expense'],
  };

  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const GoogleIcon = () => (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.20455c0-.63955-.0573-1.25591-.1636-1.84864H9v3.49545h4.8436c-.2099 1.1318-.8468 2.0909-1.8045 2.7336v2.2736h2.9155c1.7045-1.5718 2.6854-3.8864 2.6854-6.654." fill="#4285F4" />
      <path d="M9 18c2.43 0 4.4699-.8046 5.9591-2.1864l-2.9155-2.2736c-.8046.54-1.8341.8591-3.0436.8591-2.34181 0-4.32455-1.58-5.02909-3.70455H.957275v2.33181C2.43818 15.7273 5.48182 18 9 18z" fill="#34A853" />
      <path d="M3.97091 10.6946A5.40728 5.40728 0 0 1 3.68182 9c0-.58727.10182-1.15818.28909-1.69455V4.97364H.957275A8.99637 8.99637 0 0 0 0 9c0 1.4573.348182 2.8346.957275 4.0264l3.013635-2.3318z" fill="#FBBC05" />
      <path d="M9 3.54545c1.3218 0 2.5118.45455 3.4454 1.34545l2.5864-2.58636C13.4654.882727 11.4264 0 9 0 5.48182 0 2.43818 2.27273.957275 5.0l3.013635 2.33182C4.67545 5.12545 6.65818 3.54545 9 3.54545z" fill="#EA4335" />
    </svg>
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setUser(currentUser);
      else setUser(null);
    });
    return () => unsub();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (err) {
      console.error('Error during Google login:', err);
      alert(err.message || 'Login failed');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error('Error during logout:', err);
      alert(err.message || 'Logout failed');
    }
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      try {
        const q = query(collection(db, 'transactions'), where('userId', '==', uid));
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setTransactions(data);
      } catch (err) {
        console.error('Failed to load transactions:', err);
      }
    };
    fetchTransactions();
  }, [user]);

  useEffect(() => {
    const ft = transactions.filter((t) => {
      const isMonthMatch = t.date?.startsWith(selectedMonth);
      const isCategoryMatch = filterCategory === 'all' || t.category === filterCategory;
      return isMonthMatch && isCategoryMatch;
    });
    setFilteredTransactions(ft);
  }, [transactions, selectedMonth, filterCategory]);

  useEffect(() => {
    const breakdown = {};
    filteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        breakdown[t.category] = (breakdown[t.category] || 0) + Number(t.amount || 0);
      });
    setCategoryBreakdown(breakdown);
  }, [filteredTransactions]);

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    const labels = Object.keys(categoryBreakdown);
    const data = Object.values(categoryBreakdown);
    if (labels.length === 0) return;

    try {
      Chart.Chart.register(Chart.DoughnutController, Chart.ArcElement, Chart.Legend, Chart.Tooltip);
    } catch (_) {}

    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart.Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#a3e635'],
            borderWidth: 2,
            borderColor: '#ffffff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { padding: 20, font: { size: 12 } } },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [categoryBreakdown]);

  const monthlyTransactions = useMemo(
    () => transactions.filter((t) => t.date?.startsWith(selectedMonth)),
    [transactions, selectedMonth]
  );

  const totals = useMemo(() => {
    const income = monthlyTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
    const expenses = monthlyTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
    return { income, expenses, balance: income - expenses };
  }, [monthlyTransactions]);

  const savingsRate = totals?.income > 0 ? ((totals.balance / totals.income) * 100).toFixed(1) : 0;
  const topCategory = Object.keys(categoryBreakdown || {}).length
    ? Object.entries(categoryBreakdown).sort(([, a], [, b]) => b - a)[0][0]
    : "N/A";

  const addTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.category) return;
    const uid = auth.currentUser?.uid;
    if (!uid) {
      alert('Please sign in again.');
      return;
    }

    const transaction = {
      userId: uid,
      ...newTransaction,
      amount: parseFloat(newTransaction.amount),
    };

    try {
      const docRef = await addDoc(collection(db, 'transactions'), transaction);
      setTransactions((prev) => [...prev, { id: docRef.id, ...transaction }]);
      setNewTransaction({
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().slice(0, 10),
      });
      setShowAddModal(false);
    } catch (err) {
      console.error('Add failed:', err);
      alert(err.message || 'Failed to add transaction');
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await deleteDoc(doc(db, 'transactions', id));
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
      alert(err.message || 'Failed to delete');
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
    const csvContent = [headers.join(','), ...filteredTransactions.map((t) => [t.date, t.type, t.category, t.description, t.amount].join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    const reportHTML = `
      <html>
        <head>
          <title>Monthly Report - ${selectedMonth}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
            .card { padding: 15px; border: 1px solid #ddd; border-radius: 8px; text-align: center; }
            .income { background-color: #f0f9f0; }
            .expense { background-color: #fdf2f2; }
            .balance { background-color: #f0f8ff; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f5f5f5; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Monthly Financial Report</h1>
            <h3>${new Date(selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
          </div>
          <div class="summary">
            <div class="card income"><h4>Total Income</h4><p>$${totals.income.toFixed(2)}</p></div>
            <div class="card expense"><h4>Total Expenses</h4><p>$${totals.expenses.toFixed(2)}</p></div>
            <div class="card balance"><h4>Net Balance</h4><p>$${totals.balance.toFixed(2)}</p></div>
          </div>
          <table>
            <thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead>
            <tbody>
              ${monthlyTransactions
                .map(
                  (t) => `
                    <tr>
                      <td>${new Date(t.date).toLocaleDateString()}</td>
                      <td style="text-transform: capitalize">${t.type}</td>
                      <td>${t.category}</td>
                      <td>${t.description}</td>
                      <td>$${Number(t.amount).toFixed(2)}</td>
                    </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    if (!printWindow) return;
    printWindow.document.write(reportHTML);
    printWindow.document.close();
    printWindow.print();
  };

  const allCategories = [...new Set(filteredTransactions.map((t) => t.category))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {user ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <section className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-5 sm:p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Expense Tracker</h1>
                <p className="text-gray-600 mt-1">Track your income and expenses with detailed insights</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500">
                  <CalendarIcon className="h-4 w-4 text-gray-500" aria-hidden />
                  <span className="sr-only">Select month</span>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-[9.5rem] outline-none text-gray-700 placeholder-gray-400"
                  />
                </label>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium shadow hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Transaction
                </button>

                <div className="h-6 w-px bg-gray-200 mx-1" aria-hidden></div>
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-200"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center ring-1 ring-gray-200">
                    <UserRound className="h-5 w-5 text-gray-500" aria-hidden />
                  </div>
                )}
                {user?.displayName && <span className="text-sm text-gray-700 truncate max-w-[10rem]">{user.displayName}</span>}
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </div>
          </section>

          {/* Summary Cards */}
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

            <div
              className={`rounded-2xl shadow-sm ring-1 ${totals.balance >= 0 ? "ring-blue-200 bg-gradient-to-r from-blue-500 to-blue-600" : "ring-orange-200 bg-gradient-to-r from-orange-500 to-orange-600"
                } p-6 text-white`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Net Balance</p>
                  <p className="text-3xl font-bold leading-tight">₹{totals.balance.toFixed(2)}</p>
                </div>
                <IndianRupeeIcon size={32} className="opacity-80" aria-hidden />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Chart */}
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
              <div className="h-64">
                {Object.keys(categoryBreakdown || {}).length > 0 ? (
                  <canvas ref={chartRef} aria-label="Expenses by category" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                    No expense data available for this month
                  </div>
                )}
              </div>
            </div>

            {/* Monthly Insights */}
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Monthly Insights</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Savings Rate</span>
                  <span className="font-semibold text-lg">{savingsRate}%</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Top Expense Category</span>
                  <span className="font-semibold">{topCategory}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Transactions</span>
                  <span className="font-semibold">{monthlyTransactions.length}</span>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex gap-3">
                    <button
                      onClick={exportToCSV}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg inline-flex items-center justify-center gap-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500"
                    >
                      <Download className="h-4 w-4" />
                      CSV
                    </button>
                    <button
                      onClick={exportToPDF}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg inline-flex items-center justify-center gap-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500"
                    >
                      <Download className="h-4 w-4" />
                      PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Transactions List */}
          <section className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Transactions</h3>
              <div className="flex items-center gap-3">
                <FilterIcon size={18} className="text-gray-500" aria-hidden />
                <label className="sr-only" htmlFor="filterCategory">Filter category</label>
                <select
                  id="filterCategory"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                >
                  <option value="all">All Categories</option>
                  {allCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
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
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((transaction) => (
                        <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 align-top">{new Date(transaction.date).toLocaleDateString()}</td>
                          <td className="py-3 px-4 align-top">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${transaction.type === "income"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                                }`}
                            >
                              {transaction.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 align-top font-medium">{transaction.category}</td>
                          <td className="py-3 px-4 align-top text-gray-600 max-w-[24rem] truncate">{transaction.description}</td>
                          <td
                            className={`py-3 px-4 align-top text-right font-semibold ${transaction.type === "income" ? "text-green-600" : "text-red-600"
                              }`}
                          >
                            ${Number(transaction.amount).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 align-top text-center">
                            <button
                              onClick={() => deleteTransaction(transaction.id)}
                              className="text-red-500 hover:text-red-700 transition-colors p-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
                              aria-label={`Delete ${transaction.description || "transaction"}`}
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
          </section>

          {/* Add Transaction Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg ring-1 ring-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Add Transaction</h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-500 hover:text-gray-700 p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                    aria-label="Close modal"
                  >
                    <X size={22} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={newTransaction.type}
                      onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value, category: "" })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={newTransaction.category}
                      onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">Select Category</option>
                      {categories[newTransaction.type].map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <input
                      type="text"
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Enter description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={newTransaction.date}
                      onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addTransaction}
                      disabled={!newTransaction.amount || !newTransaction.category}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      Add Transaction
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Unauthenticated state (light theme, consistent with app) */
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10">
            <div className="w-full max-w-md">
              <div className="rounded-2xl ring-1 ring-gray-200 bg-white p-6 shadow-sm">
                <div className="text-center space-y-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 ring-1 ring-gray-200">
                    <Lock className="h-6 w-6 text-gray-500" aria-hidden />
                  </div>
                  <h1 className="text-2xl text-gray-900 font-semibold tracking-tight">Please log in</h1>
                  <p className="text-sm text-gray-600">Secure sign-in to continue to your dashboard</p>
                </div>
                <div className="mt-5 space-y-4">
                  <button
                    type="button"
                    onClick={loginWithGoogle}
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-base font-medium text-white transition-[background,transform] hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    aria-label="Continue with Google"
                  >
                    <GoogleIcon />
                    Continue with Google
                    <LogIn className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                  </button>

                  <div className="relative flex items-center">
                    <div className="h-px w-full bg-gray-200" />
                    <span className="px-3 text-xs text-gray-500 bg-white relative -top-2">or</span>
                    <div className="h-px w-full bg-gray-200" />
                  </div>

                  <div className="flex items-start gap-2 rounded-lg p-3 text-xs bg-gray-50 text-gray-600 ring-1 ring-gray-200">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                    <p>We use industry-standard encryption. By continuing, you agree to our Terms and Privacy Policy.</p>
                  </div>
                </div>
              </div>

              <p className="mt-6 text-center text-xs text-gray-500">
                © {new Date().getFullYear()}. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseTracker;
