import { PlusCircle, Calendar as CalendarIcon, LogOut, UserRound } from "lucide-react";

const themes = {
  ocean: {
    section: "bg-gradient-to-br from-blue-50 to-indigo-50 ring-blue-100",
    title: "text-slate-900",
    sub: "text-slate-600",
    card: "bg-white/80 backdrop-blur",
    inputWrap: "border-blue-200 focus-within:ring-blue-500",
    inputText: "text-slate-800 placeholder-slate-400",
    primaryBtn: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    primaryRing: "focus-visible:ring-blue-500",
    divider: "bg-blue-100",
    avatarRing: "ring-blue-200",
    logoutBtn:
      "text-red-600 border border-red-500 hover:bg-red-50 hover:text-red-700 focus:ring-red-400",
  },
};

export default function AuthHeader({
  user,
  selectedMonth,
  onMonthChange,
  onAddClick,
  onLogout,
  variant = "ocean",
}) {
  const t = themes[variant];

  return (
    <section className={`rounded-2xl shadow-sm ring-1 p-4 sm:p-6 mb-4 sm:mb-6 ${t.section}`}>
      <div className={`flex flex-col md:flex-row md:justify-between md:items-center gap-3 sm:gap-4 ${t.card} rounded-xl p-3 sm:p-5`}>
        {/* Title */}
        <div className="space-y-1">
          <h1 className={`text-xl sm:text-3xl font-extrabold tracking-tight ${t.title}`}>Expense Tracker</h1>
          <p className={`text-xs sm:text-base ${t.sub}`}>
            Track your income and expenses with <span className="font-medium">detailed insights</span>
          </p>
        </div>

        {/* Actions */}
        <div className="w-full md:w-auto flex flex-wrap items-center gap-2 sm:gap-3 md:justify-end">
          {/* Month picker – full width on mobile */}
          <label className={`order-1 md:order-none inline-flex items-center gap-2 px-3 py-2 border rounded-lg bg-white/90 backdrop-blur ${t.inputWrap} w-full sm:w-auto`}>
            <CalendarIcon className="h-4 w-4 text-gray-500" aria-hidden />
            <span className="sr-only">Select month</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              max={new Date().toISOString().slice(0, 7)}
              className={`w-full sm:w-[9.5rem] outline-none bg-transparent ${t.inputText}`}
            />
          </label>

          {/* Add button – text hidden on very small screens */}
          <button
            onClick={onAddClick}
            className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-white text-sm sm:text-base font-medium shadow transition ${t.primaryBtn} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${t.primaryRing}`}
            aria-label="Add transaction"
          >
            <PlusCircle className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Add Transaction</span>
          </button>

          {/* Divider – only when horizontal */}
          <div className={`hidden md:block h-6 w-px ${t.divider} mx-1`} aria-hidden />

          {/* Avatar */}
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user?.displayName || "User"}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover ring-1 ${t.avatarRing}`}
            />
          ) : (
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/70 flex items-center justify-center ring-1 ${t.avatarRing}`} aria-hidden>
              <UserRound className="h-5 w-5 text-gray-500" />
            </div>
          )}

          {/* Name – hide on xs to avoid overflow */}
          {user?.displayName && (
            <span
              className={`hidden sm:inline text-sm truncate max-w-[10rem] ${variant === "slate" ? "text-slate-200" : "text-gray-700"}`}
              title={user.displayName || undefined}
            >
              {user.displayName}
            </span>
          )}

          {/* Logout */}
          <button
            onClick={onLogout}
            className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium rounded-xl transition-all active:scale-95 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${t.logoutBtn}`}
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="inline">Log out</span>
          </button>
        </div>
      </div>
    </section>
  );
}
