import { collection, getDocs, query, where, addDoc, updateDoc, doc } from "firebase/firestore";


function addDays(d, n) { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); }
function addMonths(d, n) { const dt = new Date(d); dt.setMonth(dt.getMonth() + n); return dt.toISOString().slice(0, 10); }
function addWeeks(d, n) { return addDays(d, 7 * n); }


function nextDate(date, freq) {
    switch (freq) { case "WEEKLY": return addWeeks(date, 1); case "MONTHLY": return addMonths(date, 1); case "QUARTERLY": return addMonths(date, 3); default: return addMonths(date, 1); }
}


export async function processRecurringForUser(db, uid) {
    const q = query(collection(db, "recurring"), where("userId", "==", uid));
    const snap = await getDocs(q);
    const today = new Date().toISOString().slice(0, 10);
    for (const d of snap.docs) {
        const r = { id: d.id, ...d.data() };
        let cur = r.nextDate;
        let spawned = false;
        while (cur && cur <= today) {
            // create a transaction occurrence
            const tx = { userId: uid, type: r.type, amount: Number(r.amount || 0), category: r.category, description: r.description || `${r.category} (recurring)`, date: cur, tags: r.tags || [] };
            await addDoc(collection(db, "transactions"), tx);
            cur = nextDate(cur, r.frequency || "MONTHLY");
            spawned = true;
        }
        if (spawned) { await updateDoc(doc(db, "recurring", r.id), { nextDate: cur }); }
    }
}