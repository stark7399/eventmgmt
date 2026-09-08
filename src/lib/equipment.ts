// Initial creation: Firestore functions for equipment inventory, with date-conflict checking for bookings.
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from "firebase/firestore";
import { isSameDay } from "date-fns";
import { db } from "@/lib/firebase";
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
  await addDoc(equipmentCol, {
    name,
    category,
    serialNumber: serialNumber || undefined,
    bookedDates: [],
  } satisfies Omit<EquipmentItem, "id">);
}

export async function deleteEquipmentItem(itemId: string): Promise<void> {
  await deleteDoc(doc(db, "equipment", itemId));
}

// Checks whether an item is already booked on the given date for a DIFFERENT project.
// Booking the same item for the same project on the same date is not a conflict.
export function hasConflict(item: EquipmentItem, date: number, projectId: string): boolean {
  return item.bookedDates.some(
    (b) => isSameDay(new Date(b.date), new Date(date)) && b.projectId !== projectId
  );
}

export async function toggleBooking(
  item: EquipmentItem,
  date: number,
  projectId: string
): Promise<void> {
  const alreadyBooked = item.bookedDates.some(
    (b) => isSameDay(new Date(b.date), new Date(date)) && b.projectId === projectId
  );

  const newBookedDates = alreadyBooked
    ? item.bookedDates.filter(
        (b) => !(isSameDay(new Date(b.date), new Date(date)) && b.projectId === projectId)
      )
    : [...item.bookedDates, { projectId, date }];

  await updateDoc(doc(db, "equipment", item.id), { bookedDates: newBookedDates });
}
