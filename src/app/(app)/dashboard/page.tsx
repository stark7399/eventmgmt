// Latest change: fixed "Upcoming Events" showing 0 even with a wedding scheduled - Dashboard only counted manually-added calendar events and had no idea about project dates; now uses the same shared shoot-date logic as the Calendar page.
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, isFuture, isToday } from "date-fns";
import { ListChecks, Calendar, CheckCircle2, Radio, ArrowRight, Square } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToTasks } from "@/lib/tasks";
import { subscribeToEvents, deriveShootDateEvents } from "@/lib/calendarEvents";
import { subscribeToProjects, findLiveProject, endEvent } from "@/lib/projects";
import { useToast } from "@/contexts/ToastContext";
import type { TodoTask, CalendarEvent, Project } from "@/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [manualEvents, setManualEvents] = useState<CalendarEvent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [endingEvent, setEndingEvent] = useState(false);

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
      setManualEvents(e);
      eventsLoaded = true;
      checkLoaded();
    });
    const unsubProjects = subscribeToProjects(setProjects);

    return () => {
      unsubTasks();
      unsubEvents();
      unsubProjects();
    };
  }, []);

  const pendingTasks = useMemo(
    () => tasks.filter((t) => t.status !== "finished"),
    [tasks]
  );
  const liveTasks = useMemo(() => tasks.filter((t) => t.status === "live"), [tasks]);
  const nextTask = useMemo(() => {
    const scheduled = tasks
      .filter((t) => t.status === "scheduled")
      .sort((a, b) => a.createdAt - b.createdAt);
    return scheduled[0] ?? null;
  }, [tasks]);
  // Combines manually-added events (prep/post deadlines) with each project's
  // actual shoot dates - matches what the Calendar page shows, so this count
  // is never out of sync with it.
  const events = useMemo(
    () => [...deriveShootDateEvents(projects), ...manualEvents],
    [projects, manualEvents]
  );
  const upcomingEvents = useMemo(
    () =>
      events
        .filter((e) => isFuture(new Date(e.date)) || isToday(new Date(e.date)))
        .sort((a, b) => a.date - b.date)
        .slice(0, 5),
    [events]
  );
  const liveProject = useMemo(() => findLiveProject(projects), [projects]);

  async function handleEndEvent() {
    if (!liveProject) return;
    setEndingEvent(true);
    try {
      await endEvent(liveProject.id);
      showToast("Event ended");
    } catch {
      showToast("Couldn't end the event. Try again.", "error");
    } finally {
      setEndingEvent(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100">
        Welcome, {user?.displayName}
      </h1>
      <p className="mb-6 mt-1.5 text-base text-stone-500 dark:text-stone-400">
        Here&apos;s what&apos;s happening right now.
      </p>

      {liveProject && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-4 dark:border-red-900/40 dark:bg-red-950/30">
          <Link href={`/event-day/${liveProject.id}`} className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 animate-pulse items-center justify-center rounded-2xl bg-red-500 text-white shadow-sm">
              <Radio size={24} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-red-600 dark:text-red-400">
                Live now
              </p>
              <p className="truncate text-lg font-bold text-stone-900 dark:text-stone-100">
                {liveProject.clientName}
              </p>
            </div>
            <ArrowRight size={22} className="shrink-0 text-red-400" />
          </Link>
          {user?.role === "admin" && (
            <button
              onClick={handleEndEvent}
              disabled={endingEvent}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-red-300 bg-white px-3.5 py-2.5 text-sm font-bold text-red-600 disabled:opacity-50 dark:border-red-800 dark:bg-stone-900 dark:text-red-400"
            >
              <Square size={16} />
              {endingEvent ? "Ending..." : "End Event"}
            </button>
          )}
        </div>
      )}

      {!loading && (liveTasks.length > 0 || nextTask) && (
        <div className="mb-6 flex flex-col gap-2.5">
          {liveTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 rounded-2xl border-2 border-section-tasks/30 bg-section-tasks/10 px-4 py-3.5"
            >
              <span className="h-3 w-3 shrink-0 animate-pulse rounded-full bg-section-tasks" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-section-tasks">
                  In progress
                </p>
                <p className="truncate text-base font-semibold text-stone-900 dark:text-stone-100">
                  {task.title}
                </p>
              </div>
            </div>
          ))}
          {nextTask && (
            <div className="flex items-center gap-3 rounded-2xl border-2 border-stone-200 bg-white px-4 py-3.5 dark:border-stone-800 dark:bg-stone-900">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                <ListChecks size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-stone-400 dark:text-stone-500">
                  Up next
                </p>
                <p className="truncate text-base font-semibold text-stone-900 dark:text-stone-100">
                  {nextTask.title}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3">
        <StatCard
          icon={ListChecks}
          label="Pending Tasks"
          value={loading ? "—" : pendingTasks.length}
          href="/todos"
          accent="section-tasks"
        />
        <StatCard
          icon={Calendar}
          label="Upcoming Events"
          value={loading ? "—" : upcomingEvents.length}
          href="/calendar"
          accent="section-calendar"
        />
      </div>

      <section className="mb-6">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            Upcoming Events
          </h2>
          <Link href="/calendar" className="text-sm font-bold text-section-calendar">
            View all
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-stone-500 dark:text-stone-400">Loading...</p>
        ) : upcomingEvents.length === 0 ? (
          <p className="rounded-2xl border-2 border-dashed border-stone-200 px-4 py-6 text-center text-sm text-stone-400 dark:border-stone-800 dark:text-stone-600">
            No upcoming events. Add one from the Calendar tab.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {upcomingEvents.map((event) => (
              <li
                key={event.id}
                className="flex items-center justify-between rounded-2xl border-2 border-stone-200 bg-white px-4 py-3.5 dark:border-stone-800 dark:bg-stone-900"
              >
                <span className="text-base font-semibold text-stone-900 dark:text-stone-100">{event.title}</span>
                <span className="text-sm font-medium text-stone-500 dark:text-stone-400">
                  {format(new Date(event.date), "MMM d, yyyy")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            Pending Tasks
          </h2>
          <Link href="/todos" className="text-sm font-bold text-section-tasks">
            View all
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-stone-500 dark:text-stone-400">Loading...</p>
        ) : pendingTasks.length === 0 ? (
          <p className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-stone-200 px-4 py-6 text-center text-sm text-stone-400 dark:border-stone-800 dark:text-stone-600">
            <CheckCircle2 size={18} />
            All caught up. Nothing pending.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {pendingTasks.slice(0, 5).map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between rounded-2xl border-2 border-stone-200 bg-white px-4 py-3.5 text-base font-semibold text-stone-900 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100"
              >
                {task.title}
                {task.status === "live" && (
                  <span className="rounded-full bg-section-tasks/15 px-3 py-1 text-xs font-bold text-section-tasks">
                    Live
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const STAT_ACCENT: Record<string, string> = {
  "section-tasks": "bg-section-tasks/15 text-section-tasks",
  "section-calendar": "bg-section-calendar/15 text-section-calendar",
};

function StatCard({
  icon: Icon,
  label,
  value,
  href,
  accent,
}: {
  icon: typeof ListChecks;
  label: string;
  value: number | string;
  href: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-3 rounded-2xl border-2 border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900"
    >
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${STAT_ACCENT[accent]}`}>
        <Icon size={22} />
      </span>
      <span className="text-3xl font-bold text-stone-900 dark:text-stone-100">{value}</span>
      <span className="text-sm font-medium text-stone-500 dark:text-stone-400">{label}</span>
    </Link>
  );
}
