import React, { useEffect } from "react";
export default function UndoToast({ message, actionLabel = "Undo", onAction }) {
    useEffect(() => {

    }, []);
    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-3 rounded-xl bg-gray-900 text-white px-4 py-3 shadow-lg">
                <span className="text-sm">{message}</span>
                <button
                    onClick={onAction}
                    className="text-sm font-medium underline underline-offset-4 focus-visible:outline-none"
                >
                    {actionLabel}
                </button>
            </div>
        </div>
    );
}