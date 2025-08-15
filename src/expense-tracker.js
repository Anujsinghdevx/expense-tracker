import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, Download, TrendingUp, TrendingDown, DollarSign, Calendar, Filter, X } from 'lucide-react';
import * as Chart from 'chart.js';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';


const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};
console.log("Firebase API Key: ", process.env.REACT_APP_FIREBASE_API_KEY);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const ExpenseTracker = () => {
  const [transactions, setTransactions] = useState([
    // Sample data
    { id: 1, type: 'income', amount: 5000, category: 'Salary', description: 'Monthly salary', date: '2024-01-15' },
    { id: 2, type: 'expense', amount: 1200, category: 'Rent', description: 'Monthly rent', date: '2024-01-01' },
    { id: 3, type: 'expense', amount: 300, category: 'Groceries', description: 'Weekly groceries', date: '2024-01-05' },
    { id: 4, type: 'expense', amount: 150, category: 'Utilities', description: 'Electricity bill', date: '2024-01-10' },
    { id: 5, type: 'income', amount: 500, category: 'Freelance', description: 'Web design project', date: '2024-01-20' },
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
    date: new Date().toISOString().slice(0, 10)
  });

  const categories = {
    income: ['Salary', 'Freelance', 'Investment', 'Business', 'Other Income'],
    expense: ['Rent', 'Groceries', 'Utilities', 'Transportation', 'Entertainment', 'Healthcare', 'Education', 'Shopping', 'Other Expense']
  };

  const chartRef = React.useRef(null);
  const chartInstance = React.useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("onAuthStateChanged triggered, currentUser:", currentUser);  // Check user object
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();  // Cleanup the listener
  }, []);


  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);  // Ensure this line is being called correctly
      const user = result.user;
      setUser(user);
      console.log('User logged in: ', user);  // Check in the console if the user object is returned successfully
    } catch (error) {
      console.error('Error during Google login: ', error.message);  // Error handling in case the login fails
    }
  };


  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      console.log('User logged out');
    } catch (error) {
      console.error('Error during logout: ', error.message);
    }
  };

  //fetch transaction from firebase
  useEffect(() => {
    const fetchTransactions = async () => {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const querySnapshot = await getDocs(collection(db, 'transactions'));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTransactions(data);
      }
    };
    fetchTransactions();
  }, []);

  // Filter transactions by selected month
  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Calculate totals
  const totals = useMemo(() => {
    const income = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return { income, expenses, balance: income - expenses };
  }, [monthlyTransactions]);

  // Update chart
  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      const labels = Object.keys(categoryBreakdown);
      const data = Object.values(categoryBreakdown);

      if (labels.length > 0) {
        // Register Chart.js components
        Chart.Chart.register(
          Chart.DoughnutController,
          Chart.ArcElement,
          Chart.Legend,
          Chart.Tooltip
        );

        chartInstance.current = new Chart.Chart(ctx, {
          type: 'doughnut',
          data: {
            labels,
            datasets: [{
              data,
              backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
              ],
              borderWidth: 2,
              borderColor: '#ffffff'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  padding: 20,
                  font: { size: 12 }
                }
              }
            }
          }
        });
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [categoryBreakdown]);

  const addTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.category) return;

    const transaction = {
      userId: auth.currentUser?.uid,
      ...newTransaction,
      amount: parseFloat(newTransaction.amount)
    };

    await addDoc(collection(db, 'transactions'), transaction);
    setTransactions([...transactions, transaction]);

    setNewTransaction({
      type: 'expense',
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().slice(0, 10)
    });

    setShowAddModal(false);
  };

  const deleteTransaction = async (id) => {
    await deleteDoc(doc(db, 'transactions', id));
    setTransactions(transactions.filter(t => t.id !== id));
  };


  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t =>
        [t.date, t.type, t.category, t.description, t.amount].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };


  const exportToPDF = () => {
    // Simple PDF export using window.print()
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
            <div class="card income">
              <h4>Total Income</h4>
              <p>$${totals.income.toFixed(2)}</p>
            </div>
            <div class="card expense">
              <h4>Total Expenses</h4>
              <p>$${totals.expenses.toFixed(2)}</p>
            </div>
            <div class="card balance">
              <h4>Net Balance</h4>
              <p>$${totals.balance.toFixed(2)}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Amount</th></tr>
            </thead>
            <tbody>
              ${monthlyTransactions.map(t => `
                <tr>
                  <td>${new Date(t.date).toLocaleDateString()}</td>
                  <td style="text-transform: capitalize">${t.type}</td>
                  <td>${t.category}</td>
                  <td>${t.description}</td>
                  <td>$${t.amount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(reportHTML);
    printWindow.document.close();
    printWindow.print();
  };

  useEffect(() => {
    const filteredTransactions = transactions.filter(t => {
      const isMonthMatch = t.date.startsWith(selectedMonth);
      const isCategoryMatch = filterCategory === 'all' || t.category === filterCategory;
      return isMonthMatch && isCategoryMatch;
    });
    setFilteredTransactions(filteredTransactions);
  }, [transactions, selectedMonth, filterCategory]);


  useEffect(() => {
    const breakdown = {};
    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
      });
    setCategoryBreakdown(breakdown);
  }, [filteredTransactions]);

  const allCategories = [...new Set(filteredTransactions.map(t => t.category))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {user ? (
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Expense Tracker</h1>
                <p className="text-gray-600">Track your income and expenses with detailed insights</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  onClick={addTransaction}
                  disabled={!newTransaction.amount || !newTransaction.category}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <PlusCircle size={20} />
                  Add Transaction
                </button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Income</p>
                  <p className="text-3xl font-bold">${totals.income.toFixed(2)}</p>
                </div>
                <TrendingUp size={32} className="text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Total Expenses</p>
                  <p className="text-3xl font-bold">${totals.expenses.toFixed(2)}</p>
                </div>
                <TrendingDown size={32} className="text-red-200" />
              </div>
            </div>

            <div className={`bg-gradient-to-r ${totals.balance >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} rounded-xl shadow-lg p-6 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Net Balance</p>
                  <p className="text-3xl font-bold">${totals.balance.toFixed(2)}</p>
                </div>
                <DollarSign size={32} className="text-blue-200" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Expense Breakdown</h3>
              <div className="h-64">
                {Object.keys(categoryBreakdown).length > 0 ? (
                  <canvas ref={chartRef}></canvas>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No expense data available for this month
                  </div>
                )}
              </div>
            </div>

            {/* Monthly Insights */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Monthly Insights</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Savings Rate</span>
                  <span className="font-semibold text-lg">
                    {totals.income > 0 ? ((totals.balance / totals.income) * 100).toFixed(1) : 0}%
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Top Expense Category</span>
                  <span className="font-semibold">
                    {Object.keys(categoryBreakdown).length > 0
                      ? Object.entries(categoryBreakdown).sort(([, a], [, b]) => b - a)[0][0]
                      : 'N/A'
                    }
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Transactions</span>
                  <span className="font-semibold">{monthlyTransactions.length}</span>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex gap-3">
                    <button
                      onClick={exportToCSV}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <Download size={16} />
                      CSV
                    </button>
                    <button
                      onClick={exportToPDF}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <Download size={16} />
                      PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Recent Transactions</h3>
              <div className="flex items-center gap-3">
                <Filter size={20} className="text-gray-500" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  {allCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
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
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map(transaction => (
                        <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            {new Date(transaction.date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${transaction.type === 'income'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                              }`}>
                              {transaction.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium">{transaction.category}</td>
                          <td className="py-3 px-4 text-gray-600">{transaction.description}</td>
                          <td className={`py-3 px-4 text-right font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}>
                            ${transaction.amount.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => deleteTransaction(transaction.id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
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
          </div>

          {/* Add Transaction Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Add Transaction</h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={newTransaction.type}
                      onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value, category: '' })}
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
                      {categories[newTransaction.type].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
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
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addTransaction}
                      disabled={!newTransaction.amount || !newTransaction.category}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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
        <div className="max-w-7xl mx-auto">
          <h1>Please Log In</h1>
          <button onClick={loginWithGoogle}>Sign in with Google</button>
        </div>
      )}
    </div>
  );
};

export default ExpenseTracker;