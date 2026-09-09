// Latest change: Overview + Intake merged into one "Details" tab; page now subscribes to live project updates (fixes edits not showing up after saving); added a manual status dropdown so an admin can set the project's phase directly at any time.
"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Radio, Square } from "lucide-react";
import { subscribeToProject, setProjectPhase } from "@/lib/projects";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { formatEventDateRange } from "@/lib/dateRange";
import type { Project, ProjectPhase } from "@/types";
import IntakeForm from "./IntakeForm";
import ShotListBuilder from "./ShotListBuilder";
import EditingBoard from "./EditingBoard";
import DeliveryPanel from "./DeliveryPanel";
import CrewPanel from "./CrewPanel";

type Tab = "details" | "shots" | "crew" | "editing" | "delivery";

const PHASE_OPTIONS: { key: ProjectPhase; label: string }[] = [
  { key: "pre-event", label: "Pre-Event" },
  { key: "event-day", label: "Event Day (Live)" },
  { key: "post-event", label: "Post-Event" },
  { key: "delivered", label: "Delivered" },
];

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const { showToast } = useToast();
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("details");
  const [changingPhase, setChangingPhase] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToProject(id, setProject);
    return unsubscribe;
  }, [id]);

  async function handlePhaseChange(phase: ProjectPhase) {
    setChangingPhase(true);
    try {
      await setProjectPhase(id, phase);
      showToast("Status updated");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't update the status.", "error");
    } finally {
      setChangingPhase(false);
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
        <span>{formatEventDateRange(project.eventStartDate, project.eventEndDate)}</span>
        <span className="flex items-center gap-1">
          <MapPin size={14} />
          {project.location}
        </span>
      </div>

      {user?.role === "admin" && (
        <div className="mb-4 mt-3 flex flex-wrap items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            Status
          </label>
          <select
            value={project.phase}
            onChange={(e) => handlePhaseChange(e.target.value as ProjectPhase)}
            disabled={changingPhase}
            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-900 outline-none focus:border-section-projects disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
          >
            {PHASE_OPTIONS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {project.phase === "event-day" && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href={`/event-day/${project.id}`}
            className="flex items-center gap-1.5 rounded-lg bg-section-projects px-4 py-2 text-sm font-semibold text-white"
          >
            <Radio size={16} />
            Open Live Checklist
          </Link>
          {user?.role === "admin" && (
            <button
              onClick={() => handlePhaseChange("post-event")}
              disabled={changingPhase}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
            >
              <Square size={16} />
              End Event
            </button>
          )}
        </div>
      )}

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-stone-200 dark:border-stone-800">
        {(["details", "shots", "crew", "editing", "delivery"] as Tab[]).map((t) => (
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

      {tab === "details" && <IntakeForm project={project} />}
      {tab === "shots" && <ShotListBuilder projectId={project.id} />}
      {tab === "crew" && <CrewPanel projectId={project.id} />}
      {tab === "editing" && <EditingBoard projectId={project.id} />}
      {tab === "delivery" && <DeliveryPanel project={project} />}
    </div>
  );
}
