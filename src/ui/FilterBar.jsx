import React from "react";
export default function FilterBar({ filter, setFilter }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-4 mb-6">
            <div className="grid md:grid-cols-6 gap-3">
                <input placeholder="Search description/category" value={filter.search} onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
                <input type="number" inputMode="numeric" placeholder="Min ₹" value={filter.min} onChange={(e) => setFilter((f) => ({ ...f, min: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
                <input type="number" inputMode="numeric" placeholder="Max ₹" value={filter.max} onChange={(e) => setFilter((f) => ({ ...f, max: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
                <input type="date" value={filter.start} onChange={(e) => setFilter((f) => ({ ...f, start: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
                <input type="date" value={filter.end} onChange={(e) => setFilter((f) => ({ ...f, end: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
                <input placeholder="Tags (comma separated)" value={filter.tags.join(", ")} onChange={(e) => setFilter((f) => ({ ...f, tags: e.target.value.split(",").map(x => x.trim()).filter(Boolean) }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
            </div>
        </div>
    );
}