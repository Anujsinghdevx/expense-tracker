import React from "react";
import { PlusCircle, Calendar as CalendarIcon, LogOut, UserRound } from "lucide-react";


export default function AuthHeader({ user, selectedMonth, onMonthChange, onAddClick, onLogout }) {

  return (
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
              onChange={(e) => onMonthChange(e.target.value)}
              max={new Date().toISOString().slice(0, 7)}  
              className="w-[9.5rem] outline-none text-gray-700 placeholder-gray-400"
            />

          </label>

          <button
            onClick={onAddClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium shadow hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
          >
            <PlusCircle className="h-4 w-4" />
            Add Transaction
          </button>

          <div className="h-6 w-px bg-gray-200 mx-1" aria-hidden></div>
          {user?.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || "User"} className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-200" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center ring-1 ring-gray-200">
              <UserRound className="h-5 w-5 text-gray-500" aria-hidden />
            </div>
          )}
          {user?.displayName && <span className="text-sm text-gray-700 truncate max-w-[10rem]">{user.displayName}</span>}
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </div>
    </section>
  );
}