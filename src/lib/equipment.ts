// Latest change: booking now checks against an event's start-end date range (not a single day), matching the new eventStartDate/eventEndDate model; added updateEquipmentItem for editing gear after it's saved.
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { stripUndefined } from "@/lib/firestoreSafe";
import type { EquipmentItem } from "@/types";

const equipmentCol = collection(db, "equipment");

export function subscribeToEquipment(callback: (items: EquipmentItem[]) => void): () => void {
  const q = query(equipmentCol, orderBy("name", "asc"));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as EquipmentItem);
    callback(items);
  });
}

export async function addEquipmentItem(
  name: string,
  category: EquipmentItem["category"],
  serialNumber: string
): Promise<void> {
  await addDoc(
    equipmentCol,
    stripUndefined({
      name,
      category,
      serialNumber: serialNumber || undefined,
      bookedDates: [],
    })
  );
}

export async function updateEquipmentItem(
  itemId: string,
  name: string,
  category: EquipmentItem["category"],
  serialNumber: string
): Promise<void> {
  await updateDoc(
    doc(db, "equipment", itemId),
    stripUndefined({ name, category, serialNumber: serialNumber || undefined })
  );
}

export async function deleteEquipmentItem(itemId: string): Promise<void> {
  await deleteDoc(doc(db, "equipment", itemId));
}

// Two date ranges overlap if one starts before the other ends, on both sides.
function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

// Checks whether an item is already booked during the given date range for a
// DIFFERENT project. Booking the same item for the same project is not a conflict.
export function hasConflict(
  item: EquipmentItem,
  startDate: number,
  endDate: number,
  projectId: string
): boolean {
  return item.bookedDates.some(
    (b) => b.projectId !== projectId && rangesOverlap(b.date, b.date, startDate, endDate)
  );
}

export function isBookedForProject(item: EquipmentItem, projectId: string): boolean {
  return item.bookedDates.some((b) => b.projectId === projectId);
}

export async function bookForProject(
  item: EquipmentItem,
  date: number,
  projectId: string
): Promise<void> {
  const newBookedDates = [...item.bookedDates, { projectId, date }];
  await updateDoc(doc(db, "equipment", item.id), { bookedDates: newBookedDates });
}

export async function unbookForProject(item: EquipmentItem, projectId: string): Promise<void> {
  const newBookedDates = item.bookedDates.filter((b) => b.projectId !== projectId);
  await updateDoc(doc(db, "equipment", item.id), { bookedDates: newBookedDates });
}
