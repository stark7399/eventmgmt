// Latest change: theme-aware colors (light/dark) replacing the old hardcoded dark-only palette.
"use client";

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import type { CalendarEvent } from "@/types";

const EVENT_COLOR: Record<CalendarEvent["type"], string> = {
  "prep-deadline": "bg-blue-400",
  "shoot-date": "bg-section-calendar",
  "post-deadline": "bg-emerald-400",
};

export default function MonthGrid({
  monthDate,
  events,
  selectedDate,
  onSelectDate,
}: {
  monthDate: Date;
  events: CalendarEvent[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}) {
  const gridStart = startOfWeek(startOfMonth(monthDate));
  const gridEnd = endOfWeek(endOfMonth(monthDate));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  function eventsOnDay(day: Date): CalendarEvent[] {
    return events.filter((e) => isSameDay(new Date(e.date), day));
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 pb-2 text-center text-xs font-semibold text-stone-400 dark:text-stone-500">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayEvents = eventsOnDay(day);
          const inMonth = isSameMonth(day, monthDate);
          const selected = isSameDay(day, selectedDate);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`flex aspect-square flex-col items-center justify-start gap-1 rounded-lg p-1 pt-1.5 ${
                selected
                  ? "bg-section-calendar text-white"
                  : isToday(day)
                    ? "bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-100"
                    : inMonth
                      ? "text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-900"
                      : "text-stone-300 dark:text-stone-700"
              }`}
            >
              <span className="text-sm font-medium">{format(day, "d")}</span>
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5">
                  {dayEvents.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className={`h-1.5 w-1.5 rounded-full ${
                        selected ? "bg-white" : EVENT_COLOR[e.type]
                      }`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
