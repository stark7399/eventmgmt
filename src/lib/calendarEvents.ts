// Initial creation: Firestore read/write functions for calendar events.
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { CalendarEvent } from "@/types";

const eventsCol = collection(db, "calendarEvents");

export function subscribeToEvents(callback: (events: CalendarEvent[]) => void): () => void {
  const q = query(eventsCol, orderBy("date", "asc"));
  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as CalendarEvent);
    callback(events);
  });
}

export async function addEvent(
  title: string,
  date: number,
  type: CalendarEvent["type"],
  projectId?: string
): Promise<void> {
  await addDoc(eventsCol, { title, date, type, projectId: projectId || undefined });
}

export async function deleteEvent(eventId: string): Promise<void> {
  await deleteDoc(doc(db, "calendarEvents", eventId));
}
