// Latest change: added recordCrewPayout - creates a payout record already marked "paid" in a single write, so "Mark as Paid" on the Finance tab does exactly what it says with one tap.
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  deleteField,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { stripUndefined } from "@/lib/firestoreSafe";
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
  await addDoc(
    financeCol,
    stripUndefined({
      projectId,
      type,
      amount,
      description,
      status: "pending",
      dueDate,
    } satisfies Omit<FinanceRecord, "id">)
  );
}

// Used by the "Mark as Paid" button on a crew member's row in Finance: creates
// the payout record already marked paid, in one write, so the button does
// exactly what it says instead of creating a pending record you'd then have to
// separately mark paid.
export async function recordCrewPayout(
  projectId: string,
  crewName: string,
  amount: number
): Promise<void> {
  await addDoc(
    financeCol,
    stripUndefined({
      projectId,
      type: "payout",
      amount,
      description: `Payout - ${crewName}`,
      status: "paid",
      paidAt: Date.now(),
    } satisfies Omit<FinanceRecord, "id">)
  );
}

export async function setFinanceStatus(
  recordId: string,
  status: FinanceRecord["status"]
): Promise<void> {
  // deleteField() actually removes the field instead of sending `undefined`,
  // which Firestore would reject outright.
  await updateDoc(doc(db, "finances", recordId), {
    status,
    paidAt: status === "paid" ? Date.now() : deleteField(),
  });
}

export async function deleteFinanceRecord(recordId: string): Promise<void> {
  await deleteDoc(doc(db, "finances", recordId));
}
