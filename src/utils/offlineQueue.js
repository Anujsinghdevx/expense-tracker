import { set, get } from "idb-keyval";
import { collection, addDoc, deleteDoc, doc } from "firebase/firestore";


const KEY = "txQueue"; // [{op:'add'|'del', payload}]


async function readQueue() { return (await get(KEY)) || []; }
async function writeQueue(q) { await set(KEY, q); }


export async function queueAdd(tx) { const q = await readQueue(); q.push({ op: 'add', payload: tx }); await writeQueue(q); }
export async function queueDelete(id) { const q = await readQueue(); q.push({ op: 'del', payload: id }); await writeQueue(q); }


export async function ensureOnlineThenProcessQueue(db) {
    async function flush() {
        const q = await readQueue(); if (!q.length) return;
        const rest = [];
        for (const item of q) {
            try {
                if (item.op === 'add') await addDoc(collection(db, 'transactions'), item.payload);
                else if (item.op === 'del') await deleteDoc(doc(db, 'transactions', item.payload));
            } catch (e) { rest.push(item); }
        }
        await writeQueue(rest);
    }


    window.addEventListener('online', flush);
    if (navigator.onLine) await flush();
}