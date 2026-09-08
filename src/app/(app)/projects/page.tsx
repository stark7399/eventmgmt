// Initial creation: Projects list page - all weddings on record, plus a quick-create form for new ones.
"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { subscribeToProjects, createProject } from "@/lib/projects";
import { useAuth } from "@/contexts/AuthContext";
import type { Project, ProjectPhase } from "@/types";

const PHASE_LABEL: Record<ProjectPhase, string> = {
  "pre-event": "Pre-Event",
  "event-day": "Event Day",
  "post-event": "Post-Event",
  delivered: "Delivered",
};

const PHASE_COLOR: Record<ProjectPhase, string> = {
  "pre-event": "bg-blue-500/15 text-blue-400",
  "event-day": "bg-amber-500/15 text-amber-400",
  "post-event": "bg-purple-500/15 text-purple-400",
  delivered: "bg-emerald-500/15 text-emerald-400",
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
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">Projects</h1>
        {user?.role === "admin" && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-zinc-950"
          >
            <Plus size={16} />
            New
          </button>
        )}
      </div>

      {showForm && user && (
        <NewProjectForm createdBy={user.uid} onDone={() => setShowForm(false)} />
      )}

      {loading ? (
        <p className="text-zinc-500">Loading projects...</p>
      ) : projects.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-10 text-center text-sm text-zinc-600">
          No projects yet. Create one to start intake.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}`}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 hover:border-zinc-700"
              >
                <div>
                  <p className="font-medium text-zinc-100">{project.clientName}</p>
                  <p className="text-xs text-zinc-500">
                    {project.eventType} · {format(new Date(project.eventDate), "MMM d, yyyy")}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PHASE_COLOR[project.phase]}`}
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
  const [clientName, setClientName] = useState("");
  const [eventType, setEventType] = useState("Wedding");
  const [eventDate, setEventDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!clientName.trim() || !location.trim()) return;
    setSaving(true);
    await createProject(
      {
        clientName: clientName.trim(),
        eventType,
        eventDate: new Date(eventDate).getTime(),
        location: location.trim(),
      },
      createdBy
    );
    setSaving(false);
    onDone();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-3"
    >
      <input
        type="text"
        placeholder="Client name (e.g. Sarah & James)"
        value={clientName}
        onChange={(e) => setClientName(e.target.value)}
        className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-500"
      />
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Event type"
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-500"
        />
        <input
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-zinc-100 outline-none focus:border-amber-500"
        />
      </div>
      <input
        type="text"
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-500"
      />
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-amber-500 py-2.5 font-semibold text-zinc-950 disabled:opacity-50"
      >
        {saving ? "Creating..." : "Create Project"}
      </button>
    </form>
  );
}
