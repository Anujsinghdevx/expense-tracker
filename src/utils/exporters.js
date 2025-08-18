export function exportToCSV(rows, selectedMonth) {
  const headers = ["Date", "Type", "Category", "Description", "Amount"];
  const csv = [headers.join(","), ...rows.map((t) => [t.date, t.type, t.category, t.description, t.amount].join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `expenses-${selectedMonth}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToPDF(monthlyRows, selectedMonth) {
  const win = window.open("", "", "width=800,height=600");
  if (!win) return;

  const totalIncome = monthlyRows.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalExpenses = monthlyRows.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0);
  const balance = totalIncome - totalExpenses;

  const html = `
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
        <h3>${new Date(selectedMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h3>
      </div>
      <div class="summary">
        <div class="card income"><h4>Total Income</h4><p>₹${totalIncome.toFixed(2)}</p></div>
        <div class="card expense"><h4>Total Expenses</h4><p>₹${totalExpenses.toFixed(2)}</p></div>
        <div class="card balance"><h4>Net Balance</h4><p>₹${balance.toFixed(2)}</p></div>
      </div>
      <table>
        <thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead>
        <tbody>
          ${monthlyRows
            .map(
              (t) => `
                <tr>
                  <td>${new Date(t.date).toLocaleDateString()}</td>
                  <td style="text-transform: capitalize">${t.type}</td>
                  <td>${t.category}</td>
                  <td>${t.description || ""}</td>
                  <td>₹${Number(t.amount).toFixed(2)}</td>
                </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </body>
  </html>`;
  win.document.write(html);
  win.document.close();
  win.print();
}
