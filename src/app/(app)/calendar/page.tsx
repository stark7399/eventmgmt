// Latest change: shoot dates are no longer manually added here - they're generated automatically from each project's start/end date, so the calendar can't drift out of sync with the actual event date. Prep/Post deadlines are still manual.
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { addMonths, subMonths, format } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Grid3x3, List, CalendarDays } from "lucide-react";
import { subscribeToEvents, addEvent, deriveShootDateEvents } from "@/lib/calendarEvents";
import { subscribeToProjects, findActiveProject } from "@/lib/projects";
import { useToast } from "@/contexts/ToastContext";
import type { CalendarEvent, Project } from "@/types";
import MonthGrid from "./MonthGrid";
import AgendaList from "./AgendaList";

type ViewMode = "grid" | "agenda";
type ManualEventType = Exclude<CalendarEvent["type"], "shoot-date">;

export default function CalendarPage() {
  const { showToast } = useToast();
  const [manualEvents, setManualEvents] = useState<CalendarEvent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("agenda");
  const [monthDate, setMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [type, setType] = useState<ManualEventType>("prep-deadline");
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [attachToProject, setAttachToProject] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToEvents((e) => {
      setManualEvents(e);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToProjects((p) => {
      setProjects(p);
      setActiveProject(findActiveProject(p));
    });
    return unsubscribe;
  }, []);

  // Shared with the Dashboard via lib/calendarEvents, so both screens agree on
  // what counts as an "upcoming" shoot date.
  const shootDateEvents = useMemo<CalendarEvent[]>(
    () => deriveShootDateEvents(projects),
    [projects]
  );

  const events = useMemo(
    () => [...shootDateEvents, ...manualEvents].sort((a, b) => a.date - b.date),
    [shootDateEvents, manualEvents]
  );

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await addEvent(
        title.trim(),
        new Date(date).getTime(),
        type,
        attachToProject ? activeProject?.id : undefined
      );
      showToast("Event added");
      setTitle("");
      setShowForm(false);
    } catch {
      showToast("Couldn't save the event. Try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="flex items-center gap-3 text-3xl font-bold text-stone-900 dark:text-stone-100">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-section-calendar/15 text-section-calendar">
            <CalendarDays size={26} />
          </span>
          Calendar
        </h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border-2 border-stone-200 p-1 dark:border-stone-800">
            <button
              onClick={() => setView("agenda")}
              className={`rounded-lg p-2 ${view === "agenda" ? "bg-section-calendar text-white" : "text-stone-500"}`}
              aria-label="Agenda view"
            >
              <List size={20} />
            </button>
            <button
              onClick={() => setView("grid")}
              className={`rounded-lg p-2 ${view === "grid" ? "bg-section-calendar text-white" : "text-stone-500"}`}
              aria-label="Grid view"
            >
              <Grid3x3 size={20} />
            </button>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl bg-section-calendar px-4 py-2.5 text-base font-semibold text-white shadow-sm"
          >
            <Plus size={20} />
            Add
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="mb-4 flex flex-col gap-3 rounded-2xl border-2 border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900"
        >
          <p className="text-sm text-stone-400 dark:text-stone-600">
            Shoot dates come automatically from each project&apos;s start/end date (set on the
            project&apos;s Details tab). Use this form for prep or post-production deadlines instead.
          </p>
          <input
            type="text"
            placeholder="Event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-xl border-2 border-stone-200 bg-stone-50 px-3 py-3 text-base text-stone-900 placeholder-stone-400 outline-none focus:border-section-calendar dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 rounded-xl border-2 border-stone-200 bg-stone-50 px-3 py-3 text-base text-stone-900 outline-none focus:border-section-calendar dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ManualEventType)}
              className="rounded-xl border-2 border-stone-200 bg-stone-50 px-2 py-3 text-base text-stone-900 outline-none focus:border-section-calendar dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
            >
              <option value="prep-deadline">Prep Deadline</option>
              <option value="post-deadline">Post Deadline</option>
            </select>
          </div>
          {activeProject && (
            <label className="flex items-center gap-2.5 text-sm font-medium text-stone-500 dark:text-stone-400">
              <input
                type="checkbox"
                checked={attachToProject}
                onChange={(e) => setAttachToProject(e.target.checked)}
                className="h-5 w-5 rounded border-stone-300 bg-stone-50 accent-section-calendar dark:border-stone-700 dark:bg-stone-950"
              />
              Attach to current project ({activeProject.clientName})
            </label>
          )}

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-section-calendar py-3.5 text-base font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Event"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-stone-500 dark:text-stone-400">Loading calendar...</p>
      ) : view === "grid" ? (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => setMonthDate((d) => subMonths(d, 1))}
              className="rounded-xl p-2.5 text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-900"
              aria-label="Previous month"
            >
              <ChevronLeft size={24} />
            </button>
            <span className="text-lg font-bold text-stone-900 dark:text-stone-100">
              {format(monthDate, "MMMM yyyy")}
            </span>
            <button
              onClick={() => setMonthDate((d) => addMonths(d, 1))}
              className="rounded-xl p-2.5 text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-900"
              aria-label="Next month"
            >
              <ChevronRight size={24} />
            </button>
          </div>
          <MonthGrid
            monthDate={monthDate}
            events={events}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>
      ) : (
        <AgendaList events={events} />
      )}
    </div>
  );
}
