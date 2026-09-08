// Initial creation: Real dashboard - task counts, upcoming events, pulled live from Firestore.
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, isFuture, isToday } from "date-fns";
import { ListChecks, Calendar, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToTasks } from "@/lib/tasks";
import { subscribeToEvents } from "@/lib/calendarEvents";
import type { TodoTask, CalendarEvent } from "@/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let tasksLoaded = false;
    let eventsLoaded = false;
    const checkLoaded = () => {
      if (tasksLoaded && eventsLoaded) setLoading(false);
    };

    const unsubTasks = subscribeToTasks((t) => {
      setTasks(t);
      tasksLoaded = true;
      checkLoaded();
    });
    const unsubEvents = subscribeToEvents((e) => {
      setEvents(e);
      eventsLoaded = true;
      checkLoaded();
    });

    return () => {
      unsubTasks();
      unsubEvents();
    };
  }, []);

  const pendingTasks = useMemo(() => tasks.filter((t) => !t.done), [tasks]);
  const upcomingEvents = useMemo(
    () =>
      events
        .filter((e) => isFuture(new Date(e.date)) || isToday(new Date(e.date)))
        .slice(0, 5),
    [events]
  );

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-zinc-100">
        Welcome, {user?.displayName}
      </h1>
      <p className="mb-6 mt-1 text-sm text-zinc-500">
        Here&apos;s what&apos;s happening right now.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <StatCard
          icon={ListChecks}
          label="Pending Tasks"
          value={loading ? "—" : pendingTasks.length}
          href="/todos"
        />
        <StatCard
          icon={Calendar}
          label="Upcoming Events"
          value={loading ? "—" : upcomingEvents.length}
          href="/calendar"
        />
      </div>

      <section className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Upcoming Events
          </h2>
          <Link href="/calendar" className="text-xs text-amber-500">
            View all
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500">Loading...</p>
        ) : upcomingEvents.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-6 text-center text-sm text-zinc-600">
            No upcoming events. Add one from the Calendar tab.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {upcomingEvents.map((event) => (
              <li
                key={event.id}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3"
              >
                <span className="text-sm font-medium text-zinc-100">{event.title}</span>
                <span className="text-xs text-zinc-500">
                  {format(new Date(event.date), "MMM d, yyyy")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Pending Tasks
          </h2>
          <Link href="/todos" className="text-xs text-amber-500">
            View all
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500">Loading...</p>
        ) : pendingTasks.length === 0 ? (
          <p className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-800 px-4 py-6 text-center text-sm text-zinc-600">
            <CheckCircle2 size={16} />
            All caught up. Nothing pending.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {pendingTasks.slice(0, 5).map((task) => (
              <li
                key={task.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100"
              >
                {task.title}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof ListChecks;
  label: string;
  value: number | string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
    >
      <Icon size={20} className="text-amber-500" />
      <span className="text-2xl font-bold text-zinc-100">{value}</span>
      <span className="text-xs text-zinc-500">{label}</span>
    </Link>
  );
}
