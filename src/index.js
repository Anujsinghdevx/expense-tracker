import React from "react";
import { createRoot } from "react-dom/client";
import ExpenseTracker from "./pages/ExpenseTracker.jsx";

const root = createRoot(document.getElementById("root"));
root.render(<ExpenseTracker />);
