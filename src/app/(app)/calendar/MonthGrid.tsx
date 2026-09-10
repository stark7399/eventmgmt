// Latest change: bigger day cells, bolder selected-day highlight, bigger event dots.
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
      <div className="grid grid-cols-7 gap-1.5 pb-2.5 text-center text-xs font-bold text-stone-400 dark:text-stone-500">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const dayEvents = eventsOnDay(day);
          const inMonth = isSameMonth(day, monthDate);
          const selected = isSameDay(day, selectedDate);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`flex aspect-square flex-col items-center justify-start gap-1 rounded-xl p-1 pt-2 ${
                selected
                  ? "bg-section-calendar text-white shadow-sm"
                  : isToday(day)
                    ? "bg-stone-100 font-bold text-stone-900 dark:bg-stone-800 dark:text-stone-100"
                    : inMonth
                      ? "text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-900"
                      : "text-stone-300 dark:text-stone-700"
              }`}
            >
              <span className="text-base font-semibold">{format(day, "d")}</span>
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5">
                  {dayEvents.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className={`h-2 w-2 rounded-full ${
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
