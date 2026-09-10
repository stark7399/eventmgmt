// Latest change: added deriveShootDateEvents (moved out of the Calendar page) so any screen - Dashboard included - can show a project's actual event dates as calendar events, not just manually-added ones.
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { eachDayOfInterval, isValid } from "date-fns";
import { db } from "@/lib/firebase";
import { stripUndefined } from "@/lib/firestoreSafe";
import type { CalendarEvent, Project } from "@/types";

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
  await addDoc(eventsCol, stripUndefined({ title, date, type, projectId }));
}

export async function deleteEvent(eventId: string): Promise<void> {
  await deleteDoc(doc(db, "calendarEvents", eventId));
}

// Turns every project's date span into "shoot-date" calendar entries - one per
// day so a multi-day wedding lights up the whole range, not just the start.
// These are never stored in Firestore; they're derived fresh every time so they
// can never fall out of sync with the project's actual dates. Shared by the
// Calendar page and the Dashboard so both agree on what's "upcoming" - skips
// any project with a missing/invalid date instead of crashing.
export function deriveShootDateEvents(projects: Project[]): CalendarEvent[] {
  return projects.flatMap((project) => {
    const start = new Date(project.eventStartDate);
    const end = new Date(project.eventEndDate);
    if (!isValid(start) || !isValid(end) || end < start) return [];
    const days = eachDayOfInterval({ start, end });
    return days.map((day) => ({
      id: `project-${project.id}-${day.toISOString().slice(0, 10)}`,
      projectId: project.id,
      title: project.clientName,
      date: day.getTime(),
      type: "shoot-date" as const,
    }));
  });
}
