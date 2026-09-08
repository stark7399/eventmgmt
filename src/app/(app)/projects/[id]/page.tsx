// Initial creation: Project detail page - tabbed view (Overview / Intake / Shot List) for one project.
"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { MapPin, Calendar as CalendarIcon, Play, Radio } from "lucide-react";
import { getProject, startEvent } from "@/lib/projects";
import { useAuth } from "@/contexts/AuthContext";
import type { Project } from "@/types";
import IntakeForm from "./IntakeForm";
import ShotListBuilder from "./ShotListBuilder";
import EditingBoard from "./EditingBoard";
import DeliveryPanel from "./DeliveryPanel";
import CrewPanel from "./CrewPanel";

type Tab = "overview" | "intake" | "shots" | "crew" | "editing" | "delivery";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("overview");
  const [startingEvent, setStartingEvent] = useState(false);

  useEffect(() => {
    getProject(id).then(setProject);
  }, [id]);

  async function handleStartEvent() {
    setStartingEvent(true);
    await startEvent(id);
    setProject((p) => (p ? { ...p, phase: "event-day" } : p));
    setStartingEvent(false);
  }

  if (project === undefined) {
    return <p className="text-zinc-500">Loading project...</p>;
  }

  if (project === null) {
    return <p className="text-zinc-500">Project not found.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-zinc-100">{project.clientName}</h1>
      <div className="mb-1 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
        <span className="flex items-center gap-1">
          <CalendarIcon size={14} />
          {format(new Date(project.eventDate), "MMMM d, yyyy")}
        </span>
        <span className="flex items-center gap-1">
          <MapPin size={14} />
          {project.location}
        </span>
      </div>

      {user?.role === "admin" && project.phase === "pre-event" && (
        <button
          onClick={handleStartEvent}
          disabled={startingEvent}
          className="mb-4 mt-2 flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"
        >
          <Play size={16} />
          {startingEvent ? "Starting..." : "Start Event"}
        </button>
      )}

      {project.phase === "event-day" && (
        <Link
          href={`/event-day/${project.id}`}
          className="mb-4 mt-2 flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950"
        >
          <Radio size={16} />
          Open Live Checklist
        </Link>
      )}

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-zinc-800">
        {(["overview", "intake", "shots", "crew", "editing", "delivery"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 px-3 py-2 text-sm font-medium capitalize ${
              tab === t
                ? "border-b-2 border-amber-500 text-amber-500"
                : "text-zinc-500"
            }`}
          >
            {t === "shots" ? "Shot List" : t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="flex flex-col gap-3 text-sm text-zinc-300">
          <p>
            <span className="text-zinc-500">Event type:</span> {project.eventType}
          </p>
          <p>
            <span className="text-zinc-500">Budget:</span>{" "}
            {project.budget ? `$${project.budget.toLocaleString()}` : "Not set"}
          </p>
          <p>
            <span className="text-zinc-500">Creative brief:</span>{" "}
            {project.creativeBrief || "Not filled in yet — see the Intake tab."}
          </p>
          <p className="text-zinc-500">
            {project.keyContacts.length} contact(s) · {project.moodBoardLinks.length} mood board link(s)
          </p>
        </div>
      )}

      {tab === "intake" && <IntakeForm project={project} />}
      {tab === "shots" && <ShotListBuilder projectId={project.id} />}
      {tab === "crew" && <CrewPanel projectId={project.id} />}
      {tab === "editing" && <EditingBoard projectId={project.id} />}
      {tab === "delivery" && <DeliveryPanel project={project} />}
    </div>
  );
}
