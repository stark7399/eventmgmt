// Initial creation: Calendar page - toggle between month grid and agenda list, add-event form.
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { addMonths, subMonths, format } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Grid3x3, List } from "lucide-react";
import { subscribeToEvents, addEvent } from "@/lib/calendarEvents";
import { subscribeToProjects, findActiveProject } from "@/lib/projects";
import type { CalendarEvent, Project } from "@/types";
import MonthGrid from "./MonthGrid";
import AgendaList from "./AgendaList";

type ViewMode = "grid" | "agenda";

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("agenda");
  const [monthDate, setMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [type, setType] = useState<CalendarEvent["type"]>("shoot-date");
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [attachToProject, setAttachToProject] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToEvents((e) => {
      setEvents(e);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToProjects((p) => {
      setActiveProject(findActiveProject(p));
    });
    return unsubscribe;
  }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await addEvent(
      title.trim(),
      new Date(date).getTime(),
      type,
      attachToProject ? activeProject?.id : undefined
    );
    setTitle("");
    setShowForm(false);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">Calendar</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-zinc-800 p-0.5">
            <button
              onClick={() => setView("agenda")}
              className={`rounded-md p-1.5 ${view === "agenda" ? "bg-zinc-800 text-amber-500" : "text-zinc-500"}`}
              aria-label="Agenda view"
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setView("grid")}
              className={`rounded-md p-1.5 ${view === "grid" ? "bg-zinc-800 text-amber-500" : "text-zinc-500"}`}
              aria-label="Grid view"
            >
              <Grid3x3 size={18} />
            </button>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-zinc-950"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="mb-4 flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-3"
        >
          <input
            type="text"
            placeholder="Event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-500"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-zinc-100 outline-none focus:border-amber-500"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CalendarEvent["type"])}
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-2.5 text-zinc-100 outline-none focus:border-amber-500"
            >
              <option value="prep-deadline">Prep Deadline</option>
              <option value="shoot-date">Shoot Date</option>
              <option value="post-deadline">Post Deadline</option>
            </select>
          </div>
          {activeProject && (
            <label className="flex items-center gap-2 text-sm text-zinc-500">
              <input
                type="checkbox"
                checked={attachToProject}
                onChange={(e) => setAttachToProject(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 accent-amber-500"
              />
              Attach to current project ({activeProject.clientName})
            </label>
          )}

          <button
            type="submit"
            className="rounded-lg bg-amber-500 py-2.5 font-semibold text-zinc-950"
          >
            Save Event
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-zinc-500">Loading calendar...</p>
      ) : view === "grid" ? (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => setMonthDate((d) => subMonths(d, 1))}
              className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-900"
              aria-label="Previous month"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="font-semibold text-zinc-100">
              {format(monthDate, "MMMM yyyy")}
            </span>
            <button
              onClick={() => setMonthDate((d) => addMonths(d, 1))}
              className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-900"
              aria-label="Next month"
            >
              <ChevronRight size={20} />
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
