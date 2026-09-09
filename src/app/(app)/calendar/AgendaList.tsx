// Latest change: theme-aware card redesign (light/dark) replacing the old hardcoded dark-only palette.
"use client";

import { format, isSameDay } from "date-fns";
import { Trash2, Link2 } from "lucide-react";
import { deleteEvent } from "@/lib/calendarEvents";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import type { CalendarEvent } from "@/types";

const EVENT_LABEL: Record<CalendarEvent["type"], string> = {
  "prep-deadline": "Prep Deadline",
  "shoot-date": "Shoot Date",
  "post-deadline": "Post-Production Deadline",
};

const EVENT_COLOR: Record<CalendarEvent["type"], string> = {
  "prep-deadline": "border-l-blue-400",
  "shoot-date": "border-l-section-calendar",
  "post-deadline": "border-l-emerald-400",
};

export default function AgendaList({ events }: { events: CalendarEvent[] }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const canDelete = user?.role === "admin";

  async function handleDelete(eventId: string) {
    try {
      await deleteEvent(eventId);
      showToast("Event removed");
    } catch {
      showToast("Couldn't remove the event. Try again.", "error");
    }
  }

  if (events.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-stone-200 px-4 py-10 text-center text-sm text-stone-400 dark:border-stone-800 dark:text-stone-600">
        No events yet.
      </p>
    );
  }

  // Group consecutive events that fall on the same date under one date header.
  const groups: { date: number; events: CalendarEvent[] }[] = [];
  for (const event of events) {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && isSameDay(new Date(lastGroup.date), new Date(event.date))) {
      lastGroup.events.push(event);
    } else {
      groups.push({ date: event.date, events: [event] });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.date}>
          <h3 className="mb-1.5 text-sm font-semibold text-stone-500 dark:text-stone-400">
            {format(new Date(group.date), "EEEE, MMMM d, yyyy")}
          </h3>
          <ul className="flex flex-col gap-2">
            {group.events.map((event) => (
              <li
                key={event.id}
                className={`flex items-center justify-between rounded-xl border-l-4 bg-white py-2.5 pl-3 pr-2 shadow-sm dark:bg-stone-900 ${EVENT_COLOR[event.type]}`}
              >
                <div>
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                    {event.title}
                    {event.projectId && (
                      <Link2
                        size={12}
                        className="ml-1.5 inline text-stone-400 dark:text-stone-600"
                        aria-label="Linked to a project"
                      />
                    )}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{EVENT_LABEL[event.type]}</p>
                </div>
                {canDelete && (
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="shrink-0 rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-red-500 dark:text-stone-600 dark:hover:bg-stone-800"
                    aria-label="Delete event"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
