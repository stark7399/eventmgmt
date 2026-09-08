// Initial creation: Agenda/list view of the calendar - scrolling list of events grouped by date.
"use client";

import { format, isSameDay } from "date-fns";
import { Trash2, Link2 } from "lucide-react";
import { deleteEvent } from "@/lib/calendarEvents";
import { useAuth } from "@/contexts/AuthContext";
import type { CalendarEvent } from "@/types";

const EVENT_LABEL: Record<CalendarEvent["type"], string> = {
  "prep-deadline": "Prep Deadline",
  "shoot-date": "Shoot Date",
  "post-deadline": "Post-Production Deadline",
};

const EVENT_COLOR: Record<CalendarEvent["type"], string> = {
  "prep-deadline": "border-l-blue-400",
  "shoot-date": "border-l-amber-500",
  "post-deadline": "border-l-emerald-400",
};

export default function AgendaList({ events }: { events: CalendarEvent[] }) {
  const { user } = useAuth();
  const canDelete = user?.role === "admin";

  if (events.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-10 text-center text-sm text-zinc-600">
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
          <h3 className="mb-1.5 text-sm font-semibold text-zinc-400">
            {format(new Date(group.date), "EEEE, MMMM d, yyyy")}
          </h3>
          <ul className="flex flex-col gap-2">
            {group.events.map((event) => (
              <li
                key={event.id}
                className={`flex items-center justify-between rounded-lg border-l-4 bg-zinc-900 py-2.5 pl-3 pr-2 ${EVENT_COLOR[event.type]}`}
              >
                <div>
                  <p className="text-sm font-medium text-zinc-100">
                    {event.title}
                    {event.projectId && (
                      <Link2
                        size={12}
                        className="ml-1.5 inline text-zinc-600"
                        aria-label="Linked to a project"
                      />
                    )}
                  </p>
                  <p className="text-xs text-zinc-500">{EVENT_LABEL[event.type]}</p>
                </div>
                {canDelete && (
                  <button
                    onClick={() => deleteEvent(event.id)}
                    className="shrink-0 rounded-md p-1.5 text-zinc-600 hover:bg-zinc-800 hover:text-red-400"
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
