// Initial creation: Equipment checklist page - inventory, add gear, book against a project with conflict warnings.
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { format } from "date-fns";
import { Plus, Trash2, AlertTriangle, Camera } from "lucide-react";
import {
  subscribeToEquipment,
  addEquipmentItem,
  deleteEquipmentItem,
  hasConflict,
  toggleBooking,
} from "@/lib/equipment";
import { subscribeToProjects } from "@/lib/projects";
import { useAuth } from "@/contexts/AuthContext";
import type { EquipmentItem, Project } from "@/types";

const CATEGORIES: EquipmentItem["category"][] = [
  "camera",
  "lens",
  "lighting",
  "battery",
  "memory-card",
  "other",
];

export default function EquipmentPage() {
  const { user } = useAuth();
  const canEdit = user?.role === "admin";

  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  useEffect(() => {
    let itemsLoaded = false;
    let projectsLoaded = false;
    const checkLoaded = () => {
      if (itemsLoaded && projectsLoaded) setLoading(false);
    };
    const unsubItems = subscribeToEquipment((i) => {
      setItems(i);
      itemsLoaded = true;
      checkLoaded();
    });
    const unsubProjects = subscribeToProjects((p) => {
      setProjects(p);
      projectsLoaded = true;
      checkLoaded();
      setSelectedProjectId((current) => current || p[0]?.id || "");
    });
    return () => {
      unsubItems();
      unsubProjects();
    };
  }, []);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">Equipment</h1>
        {canEdit && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-zinc-950"
          >
            <Plus size={16} />
            Add Gear
          </button>
        )}
      </div>

      {showForm && <AddEquipmentForm onDone={() => setShowForm(false)} />}

      {projects.length === 0 ? (
        <p className="mb-4 rounded-lg border border-dashed border-zinc-800 px-4 py-4 text-center text-sm text-zinc-600">
          Create a project first to book equipment against a date.
        </p>
      ) : (
        <div className="mb-4">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Booking for project
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.clientName} — {format(new Date(p.eventDate), "MMM d, yyyy")}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <p className="text-zinc-500">Loading equipment...</p>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-10 text-center text-sm text-zinc-600">
          No gear in inventory yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <EquipmentRow
              key={item.id}
              item={item}
              project={selectedProject}
              canEdit={canEdit}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function EquipmentRow({
  item,
  project,
  canEdit,
}: {
  item: EquipmentItem;
  project: Project | null;
  canEdit: boolean;
}) {
  const bookedForThisProject =
    project && item.bookedDates.some((b) => b.projectId === project.id && sameDay(b.date, project.eventDate));
  const conflict = project ? hasConflict(item, project.eventDate, project.id) : false;

  return (
    <li className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Camera size={16} className="text-zinc-500" />
          <div>
            <p className="text-sm font-medium text-zinc-100">{item.name}</p>
            <p className="text-xs capitalize text-zinc-500">
              {item.category.replace("-", " ")}
              {item.serialNumber ? ` · ${item.serialNumber}` : ""}
            </p>
          </div>
        </div>
        {canEdit && (
          <button
            onClick={() => deleteEquipmentItem(item.id)}
            className="shrink-0 rounded-md p-1.5 text-zinc-600 hover:bg-zinc-800 hover:text-red-400"
            aria-label="Remove from inventory"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {project && (
        <div className="mt-2.5 flex items-center justify-between border-t border-zinc-800 pt-2.5">
          {conflict ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-red-400">
              <AlertTriangle size={14} />
              Already booked on this date for another project
            </span>
          ) : (
            <span className="text-xs text-zinc-500">
              {bookedForThisProject ? "Booked for this project" : "Not booked for this project"}
            </span>
          )}
          {canEdit && !conflict && (
            <button
              onClick={() => toggleBooking(item, project.eventDate, project.id)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                bookedForThisProject
                  ? "bg-zinc-800 text-zinc-300"
                  : "bg-amber-500 text-zinc-950"
              }`}
            >
              {bookedForThisProject ? "Unbook" : "Book"}
            </button>
          )}
        </div>
      )}
    </li>
  );
}

function sameDay(a: number, b: number): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function AddEquipmentForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<EquipmentItem["category"]>("camera");
  const [serialNumber, setSerialNumber] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await addEquipmentItem(name.trim(), category, serialNumber.trim());
    setSaving(false);
    setName("");
    setSerialNumber("");
    onDone();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-3"
    >
      <input
        type="text"
        placeholder="Gear name (e.g. Canon R5)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-500"
      />
      <div className="flex gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as EquipmentItem["category"])}
          className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-500"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.replace("-", " ")}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Serial # (optional)"
          value={serialNumber}
          onChange={(e) => setSerialNumber(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-500"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-50"
      >
        {saving ? "Adding..." : "Add to Inventory"}
      </button>
    </form>
  );
}
