import React from "react";
export default function MobileActionBar({ onAdd, onImport }) {
    return (
        <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden">
            <div className="mx-auto max-w-7xl px-4 pb-4">
                <div className="mb-3 rounded-2xl shadow-lg ring-1 ring-gray-200 bg-white p-3 flex items-center justify-between">
                    <button onClick={onAdd} className="flex-1 mr-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium">Add</button>
                    <button onClick={onImport} className="flex-1 ml-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium">Import CSV</button>
                </div>
            </div>
        </div>
    );
}