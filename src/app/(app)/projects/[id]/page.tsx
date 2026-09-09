// Latest change: added an "End Event" button next to "Start Event", both now show toast errors (e.g. the new one-live-event-at-a-time rule) instead of failing silently, plus full theme/card redesign.
"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { MapPin, Calendar as CalendarIcon, Play, Radio, Square } from "lucide-react";
import { getProject, startEvent, endEvent } from "@/lib/projects";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
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
  const { showToast } = useToast();
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("overview");
  const [startingEvent, setStartingEvent] = useState(false);
  const [endingEvent, setEndingEvent] = useState(false);

  useEffect(() => {
    getProject(id).then(setProject);
  }, [id]);

  async function handleStartEvent() {
    setStartingEvent(true);
    try {
      await startEvent(id);
      setProject((p) => (p ? { ...p, phase: "event-day" } : p));
      showToast("Event started");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't start the event.", "error");
    } finally {
      setStartingEvent(false);
    }
  }

  async function handleEndEvent() {
    setEndingEvent(true);
    try {
      await endEvent(id);
      setProject((p) => (p ? { ...p, phase: "post-event" } : p));
      showToast("Event ended");
    } catch {
      showToast("Couldn't end the event. Try again.", "error");
    } finally {
      setEndingEvent(false);
    }
  }

  if (project === undefined) {
    return <p className="text-stone-500 dark:text-stone-400">Loading project...</p>;
  }

  if (project === null) {
    return <p className="text-stone-500 dark:text-stone-400">Project not found.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{project.clientName}</h1>
      <div className="mb-1 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500 dark:text-stone-400">
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
          className="mb-4 mt-2 flex items-center gap-1.5 rounded-lg bg-section-projects px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Play size={16} />
          {startingEvent ? "Starting..." : "Start Event"}
        </button>
      )}

      {project.phase === "event-day" && (
        <div className="mb-4 mt-2 flex flex-wrap gap-2">
          <Link
            href={`/event-day/${project.id}`}
            className="flex items-center gap-1.5 rounded-lg bg-section-projects px-4 py-2 text-sm font-semibold text-white"
          >
            <Radio size={16} />
            Open Live Checklist
          </Link>
          {user?.role === "admin" && (
            <button
              onClick={handleEndEvent}
              disabled={endingEvent}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
            >
              <Square size={16} />
              {endingEvent ? "Ending..." : "End Event"}
            </button>
          )}
        </div>
      )}

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-stone-200 dark:border-stone-800">
        {(["overview", "intake", "shots", "crew", "editing", "delivery"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 px-3 py-2 text-sm font-medium capitalize ${
              tab === t
                ? "border-b-2 border-section-projects text-section-projects"
                : "text-stone-500 dark:text-stone-400"
            }`}
          >
            {t === "shots" ? "Shot List" : t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="flex flex-col gap-3 text-sm text-stone-700 dark:text-stone-300">
          <p>
            <span className="text-stone-500 dark:text-stone-400">Event type:</span> {project.eventType}
          </p>
          <p>
            <span className="text-stone-500 dark:text-stone-400">Budget:</span>{" "}
            {project.budget ? `$${project.budget.toLocaleString()}` : "Not set"}
          </p>
          <p>
            <span className="text-stone-500 dark:text-stone-400">Creative brief:</span>{" "}
            {project.creativeBrief || "Not filled in yet — see the Intake tab."}
          </p>
          <p className="text-stone-500 dark:text-stone-400">
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
