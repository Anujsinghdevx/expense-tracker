import React from "react";

export default function MobileActionBar({ onAdd, onImport }) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden">
      <div className="mx-auto max-w-7xl px-4 pb-4">
        <div className="mb-3 rounded-2xl shadow-lg ring-1 ring-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-3 flex items-center justify-between backdrop-blur">
          <button
            onClick={onAdd}
            className="flex-1 mr-2 px-4 py-2 rounded-xl text-white text-sm font-medium shadow-sm
                       bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add
          </button>
          <button
            onClick={onImport}
            className="flex-1 ml-2 px-4 py-2 rounded-xl text-white text-sm font-medium shadow-sm
                       bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Import CSV
          </button>
        </div>
      </div>
    </div>
  );
}
