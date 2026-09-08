// Initial creation: Firestore functions for finance records (invoices, expenses, payouts) - manual entry per project.
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { FinanceRecord } from "@/types";

const financeCol = collection(db, "finances");

export function subscribeToFinances(
  projectId: string,
  callback: (records: FinanceRecord[]) => void
): () => void {
  const q = query(financeCol, where("projectId", "==", projectId));
  return onSnapshot(q, (snapshot) => {
    const records = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as FinanceRecord);
    callback(records);
  });
}

export async function addFinanceRecord(
  projectId: string,
  type: FinanceRecord["type"],
  amount: number,
  description: string,
  dueDate?: number
): Promise<void> {
  await addDoc(financeCol, {
    projectId,
    type,
    amount,
    description,
    status: "pending",
    dueDate,
  } satisfies Omit<FinanceRecord, "id">);
}

export async function setFinanceStatus(
  recordId: string,
  status: FinanceRecord["status"]
): Promise<void> {
  await updateDoc(doc(db, "finances", recordId), {
    status,
    paidAt: status === "paid" ? Date.now() : undefined,
  });
}

export async function deleteFinanceRecord(recordId: string): Promise<void> {
  await deleteDoc(doc(db, "finances", recordId));
}
