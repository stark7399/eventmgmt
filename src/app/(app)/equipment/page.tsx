// Latest change: theme-aware redesign (stone accent) plus toast notifications on add/book/unbook/delete errors; the missing-serial save bug is fixed in lib/equipment.ts.
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
import { useToast } from "@/contexts/ToastContext";
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
  const { showToast } = useToast();
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

  async function handleDelete(itemId: string) {
    try {
      await deleteEquipmentItem(itemId);
      showToast("Removed from inventory");
    } catch {
      showToast("Couldn't remove it. Try again.", "error");
    }
  }

  async function handleToggleBooking(item: EquipmentItem, project: Project) {
    try {
      await toggleBooking(item, project.eventDate, project.id);
    } catch {
      showToast("Couldn't update the booking. Try again.", "error");
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-stone-900 dark:text-stone-100">
          <Camera className="text-section-equipment" size={26} />
          Equipment
        </h1>
        {canEdit && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1 rounded-lg bg-section-equipment px-3 py-1.5 text-sm font-semibold text-white"
          >
            <Plus size={16} />
            Add Gear
          </button>
        )}
      </div>

      {showForm && <AddEquipmentForm onDone={() => setShowForm(false)} />}

      {projects.length === 0 ? (
        <p className="mb-4 rounded-xl border border-dashed border-stone-200 px-4 py-4 text-center text-sm text-stone-400 dark:border-stone-800 dark:text-stone-600">
          Create a project first to book equipment against a date.
        </p>
      ) : (
        <div className="mb-4">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            Booking for project
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-section-equipment dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100"
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
        <p className="text-stone-500 dark:text-stone-400">Loading equipment...</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-200 px-4 py-10 text-center text-sm text-stone-400 dark:border-stone-800 dark:text-stone-600">
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
              onDelete={handleDelete}
              onToggleBooking={handleToggleBooking}
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
  onDelete,
  onToggleBooking,
}: {
  item: EquipmentItem;
  project: Project | null;
  canEdit: boolean;
  onDelete: (itemId: string) => void;
  onToggleBooking: (item: EquipmentItem, project: Project) => void;
}) {
  const bookedForThisProject =
    project && item.bookedDates.some((b) => b.projectId === project.id && sameDay(b.date, project.eventDate));
  const conflict = project ? hasConflict(item, project.eventDate, project.id) : false;

  return (
    <li className="rounded-xl border border-stone-200 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Camera size={16} className="text-stone-400 dark:text-stone-500" />
          <div>
            <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{item.name}</p>
            <p className="text-xs capitalize text-stone-500 dark:text-stone-400">
              {item.category.replace("-", " ")}
              {item.serialNumber ? ` · ${item.serialNumber}` : ""}
            </p>
          </div>
        </div>
        {canEdit && (
          <button
            onClick={() => onDelete(item.id)}
            className="shrink-0 rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-red-500 dark:text-stone-600 dark:hover:bg-stone-800"
            aria-label="Remove from inventory"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {project && (
        <div className="mt-2.5 flex items-center justify-between border-t border-stone-100 pt-2.5 dark:border-stone-800">
          {conflict ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-red-500 dark:text-red-400">
              <AlertTriangle size={14} />
              Already booked on this date for another project
            </span>
          ) : (
            <span className="text-xs text-stone-500 dark:text-stone-400">
              {bookedForThisProject ? "Booked for this project" : "Not booked for this project"}
            </span>
          )}
          {canEdit && !conflict && (
            <button
              onClick={() => onToggleBooking(item, project)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                bookedForThisProject
                  ? "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200"
                  : "bg-section-equipment text-white"
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
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<EquipmentItem["category"]>("camera");
  const [serialNumber, setSerialNumber] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await addEquipmentItem(name.trim(), category, serialNumber.trim());
      showToast("Added to inventory");
      setName("");
      setSerialNumber("");
      onDone();
    } catch {
      showToast("Couldn't add it. Try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 flex flex-col gap-2 rounded-xl border border-stone-200 bg-white p-3 shadow-sm dark:border-stone-800 dark:bg-stone-900"
    >
      <input
        type="text"
        placeholder="Gear name (e.g. Canon R5)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 placeholder-stone-400 outline-none focus:border-section-equipment dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
      />
      <div className="flex gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as EquipmentItem["category"])}
          className="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-section-equipment dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
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
          className="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 placeholder-stone-400 outline-none focus:border-section-equipment dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-section-equipment py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? "Adding..." : "Add to Inventory"}
      </button>
    </form>
  );
}
