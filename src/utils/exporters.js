// src/utils/exporters.js
export function exportToCSV(rows, selectedMonth) {
  const headers = ["Date", "Type", "Category", "Description", "Amount"];
  const esc = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [
    headers.map(esc).join(","),
    ...rows.map((t) =>
      [
        formatDateForCSV(t.date),
        (t.type || "").toLowerCase(),
        t.category || "",
        t.description || "",
        Number(t.amount ?? 0),
      ].map(esc).join(",")
    ),
  ];

  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `expenses-${safeMonthKey(selectedMonth)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportToPDF(monthlyRows, selectedMonth) {
  const win = window.open("", "", "width=900,height=700");
  if (!win) return;

  const sum = (type) =>
    monthlyRows.filter((t) => (t.type || "").toLowerCase() === type)
               .reduce((s, t) => s + Number(t.amount || 0), 0);

  const totalIncome = sum("income");
  const totalExpenses = sum("expense");
  const balance = totalIncome - totalExpenses;
  const monthLabel = formatMonthLabel(selectedMonth);

  const rowsHTML = monthlyRows.map((t) => {
    const dateCell = formatDateForPDF(t.date);
    const typeCell = (t.type || "").replace(/^\w/, (c) => c.toUpperCase());
    const cat = escapeHTML(t.category || "");
    const desc = escapeHTML(t.description || "");
    const amt = formatINR(Number(t.amount || 0));
    return `
      <tr>
        <td>${dateCell}</td>
        <td>${typeCell}</td>
        <td>${cat}</td>
        <td>${desc}</td>
        <td class="num">${amt}</td>
      </tr>`;
  }).join("");

  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Monthly Report - ${escapeHTML(monthLabel)}</title>
      <style>
        :root{
          --ocean-start:#eff6ff; --ocean-end:#eef2ff; --ring:#bfdbfe; --card:#ffffff;
          --s900:#0f172a; --s700:#334155; --s600:#475569; --s100:#f1f5f9;
          --cyan:#06b6d4; --blue:#2563eb; --indigo:#4f46e5; --rose:#ef4444;
        }
        *{box-sizing:border-box}
        body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:var(--s900);
             background:linear-gradient(135deg,var(--ocean-start),var(--ocean-end));padding:24px;}
        .container{max-width:1000px;margin:0 auto;}
        .header{text-align:center;margin-bottom:24px;padding:16px 12px;border-radius:16px;
                background:rgba(255,255,255,.8);border:1px solid var(--ring);}
        .header h1{margin:0 0 6px;font-size:22px;letter-spacing:.2px}
        .header h3{margin:0;font-weight:600;color:var(--s700)}
        .summary{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:18px}
        .card{border:1px solid var(--ring);border-radius:14px;padding:14px;background:var(--card);
              box-shadow:0 1px 2px rgba(0,0,0,.04);text-align:center}
        .card h4{margin:0 0 6px;font-size:14px;color:var(--s600)}
        .card .value{margin:0;font-size:22px;font-weight:700}
        .income .value{color:var(--cyan)} .expense .value{color:var(--indigo)}
        .balance .value{color:${balance >= 0 ? "var(--blue)" : "var(--rose)"}}
        table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--ring);
              border-radius:14px;overflow:hidden}
        thead th{background:#f8fafc;color:var(--s700);font-weight:700;font-size:13px;padding:10px 12px;
                 border-bottom:1px solid var(--ring);text-align:left}
        tbody td{padding:10px 12px;border-bottom:1px solid #eef2f7;color:var(--s900);font-size:13px}
        tbody tr:nth-child(odd) td{background:#fcfdff}
        tbody tr:last-child td{border-bottom:none}
        td.num{text-align:right;font-variant-numeric:tabular-nums}
        .footer-note{margin-top:10px;font-size:11px;color:var(--s600)}
        @media print{
          body{padding:0;background:#fff}
          thead th{position:sticky;top:0}
          .summary{page-break-inside:avoid}
          table{page-break-inside:auto}
          tr{page-break-inside:avoid;page-break-after:auto}
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Monthly Financial Report</h1>
          <h3>${escapeHTML(monthLabel)}</h3>
        </div>

        <div class="summary">
          <div class="card income"><h4>Total Income</h4><p class="value">₹${formatNumber(totalIncome)}</p></div>
          <div class="card expense"><h4>Total Expenses</h4><p class="value">₹${formatNumber(totalExpenses)}</p></div>
          <div class="card balance"><h4>Net Balance</h4><p class="value">₹${formatNumber(balance)}</p></div>
        </div>

        <table>
          <thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead>
          <tbody>${rowsHTML}</tbody>
        </table>

        <div class="footer-note">Generated on ${escapeHTML(new Date().toLocaleString())}</div>
      </div>
      <script>window.onload=function(){setTimeout(function(){window.print()},50)};</script>
    </body>
  </html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
}

function formatDateForCSV(d) {
  try {
    if (d && typeof d?.toDate === "function") return d.toDate().toISOString().slice(0, 10);
    if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    const dt = new Date(d);
    if (!isNaN(dt)) return dt.toISOString().slice(0, 10);
  } catch {}
  return "";
}

function formatDateForPDF(d) {
  try {
    if (d && typeof d?.toDate === "function")
      return d.toDate().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
      const [y, m, day] = d.split("-").map(Number);
      return new Date(y, m - 1, day).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    }
    const dt = new Date(d);
    if (!isNaN(dt)) return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {}
  return "";
}

function safeMonthKey(m) {
  if (typeof m === "string" && /^\d{4}-\d{2}$/.test(m)) return m;
  const dt = new Date(m);
  if (!isNaN(dt)) return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(m) {
  if (typeof m === "string" && /^\d{4}-\d{2}$/.test(m)) {
    const [Y, M] = m.split("-").map(Number);
    return new Date(Y, M - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  const dt = new Date(m);
  return !isNaN(dt) ? dt.toLocaleDateString("en-US", { month: "long", year: "numeric" }) : String(m);
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function formatNumber(n) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n || 0);
}

function formatINR(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
}
