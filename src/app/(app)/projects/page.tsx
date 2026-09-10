// Latest change: bigger, bolder cards, header, and buttons throughout the page.
"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, FolderKanban, MapPin } from "lucide-react";
import { subscribeToProjects, createProject } from "@/lib/projects";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { formatEventDateRange } from "@/lib/dateRange";
import type { Project, ProjectPhase } from "@/types";

const PHASE_LABEL: Record<ProjectPhase, string> = {
  "pre-event": "Pre-Event",
  "event-day": "Event Day",
  "post-event": "Post-Event",
  delivered: "Delivered",
};

const PHASE_COLOR: Record<ProjectPhase, string> = {
  "pre-event": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "event-day": "bg-red-500/10 text-red-600 dark:text-red-400",
  "post-event": "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  delivered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToProjects((p) => {
      setProjects(p);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="flex items-center gap-3 text-3xl font-bold text-stone-900 dark:text-stone-100">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-section-projects/15 text-section-projects">
            <FolderKanban size={26} />
          </span>
          Projects
        </h1>
        {user?.role === "admin" && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl bg-section-projects px-4 py-2.5 text-base font-semibold text-white shadow-sm"
          >
            <Plus size={20} />
            New
          </button>
        )}
      </div>

      {showForm && user && (
        <NewProjectForm createdBy={user.uid} onDone={() => setShowForm(false)} />
      )}

      {loading ? (
        <p className="text-stone-500 dark:text-stone-400">Loading projects...</p>
      ) : projects.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-stone-200 px-4 py-10 text-center text-sm text-stone-400 dark:border-stone-800 dark:text-stone-600">
          No projects yet. Create one to start intake.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border-2 border-stone-200 bg-white px-4 py-4 shadow-sm dark:border-stone-800 dark:bg-stone-900"
              >
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-stone-900 dark:text-stone-100">
                    {project.clientName}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-sm font-medium text-stone-500 dark:text-stone-400">
                    {project.eventType} · {formatEventDateRange(project.eventStartDate, project.eventEndDate)}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-400 dark:text-stone-500">
                    <MapPin size={14} />
                    {project.location}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${PHASE_COLOR[project.phase]}`}
                >
                  {PHASE_LABEL[project.phase]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NewProjectForm({
  createdBy,
  onDone,
}: {
  createdBy: string;
  onDone: () => void;
}) {
  const { showToast } = useToast();
  const [clientName, setClientName] = useState("");
  const [eventType, setEventType] = useState("Wedding");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!clientName.trim() || !location.trim()) return;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (end < start) {
      showToast("End date can't be before the start date.", "error");
      return;
    }
    setSaving(true);
    try {
      await createProject(
        {
          clientName: clientName.trim(),
          eventType,
          eventStartDate: start,
          eventEndDate: end,
          location: location.trim(),
        },
        createdBy
      );
      showToast("Project created");
      onDone();
    } catch {
      showToast("Couldn't create the project. Try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 flex flex-col gap-3 rounded-2xl border-2 border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900"
    >
      <input
        type="text"
        placeholder="Client name (e.g. Sarah & James)"
        value={clientName}
        onChange={(e) => setClientName(e.target.value)}
        className="rounded-xl border-2 border-stone-200 bg-stone-50 px-3 py-3 text-base text-stone-900 placeholder-stone-400 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
      />
      <input
        type="text"
        placeholder="Event type"
        value={eventType}
        onChange={(e) => setEventType(e.target.value)}
        className="rounded-xl border-2 border-stone-200 bg-stone-50 px-3 py-3 text-base text-stone-900 placeholder-stone-400 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
      />
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-stone-500 dark:text-stone-400">Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              // Keep end date from silently sitting before the new start date.
              if (endDate < e.target.value) setEndDate(e.target.value);
            }}
            className="w-full rounded-xl border-2 border-stone-200 bg-stone-50 px-3 py-3 text-base text-stone-900 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs text-stone-500 dark:text-stone-400">End date</label>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-xl border-2 border-stone-200 bg-stone-50 px-3 py-3 text-base text-stone-900 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
          />
        </div>
      </div>
      <input
        type="text"
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="rounded-xl border-2 border-stone-200 bg-stone-50 px-3 py-3 text-base text-stone-900 placeholder-stone-400 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
      />
      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-section-projects py-3.5 text-base font-semibold text-white disabled:opacity-50"
      >
        {saving ? "Creating..." : "Create Project"}
      </button>
    </form>
  );
}
