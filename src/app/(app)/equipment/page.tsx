// Latest change: reworked into two views - "All Gear" (default, shows every item + which project/crew has it) and a per-project view (shows just what's booked for that project); gear entries are now editable in place.
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { format } from "date-fns";
import { Plus, Trash2, AlertTriangle, Camera, Pencil, X, Users } from "lucide-react";
import {
  subscribeToEquipment,
  addEquipmentItem,
  updateEquipmentItem,
  deleteEquipmentItem,
  hasConflict,
  isBookedForProject,
  bookForProject,
  unbookForProject,
} from "@/lib/equipment";
import { subscribeToProjects } from "@/lib/projects";
import { subscribeToCrewAssignments } from "@/lib/crewAssignments";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import type { EquipmentItem, Project, CrewAssignment } from "@/types";

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
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);
  // Empty string = "All Gear" view (no project selected).
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

  async function handleBook(item: EquipmentItem, project: Project) {
    try {
      await bookForProject(item, project.eventStartDate, project.id);
      showToast("Booked for project");
    } catch {
      showToast("Couldn't book it. Try again.", "error");
    }
  }

  async function handleUnbook(item: EquipmentItem, project: Project) {
    try {
      await unbookForProject(item, project.id);
      showToast("Unbooked from project");
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
            onClick={() => {
              setShowForm((v) => !v);
              setEditingItem(null);
            }}
            className="flex items-center gap-1 rounded-lg bg-section-equipment px-3 py-1.5 text-sm font-semibold text-white"
          >
            <Plus size={16} />
            Add Gear
          </button>
        )}
      </div>

      {showForm && (
        <GearForm onDone={() => setShowForm(false)} />
      )}
      {editingItem && (
        <GearForm existing={editingItem} onDone={() => setEditingItem(null)} />
      )}

      <div className="mb-4">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          Viewing
        </label>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-base text-stone-900 outline-none focus:border-section-equipment dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100"
        >
          <option value="">All Gear</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.clientName} — {format(new Date(p.eventStartDate), "MMM d, yyyy")}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-stone-500 dark:text-stone-400">Loading equipment...</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-200 px-4 py-10 text-center text-sm text-stone-400 dark:border-stone-800 dark:text-stone-600">
          No gear in inventory yet.
        </p>
      ) : selectedProject ? (
        <ProjectGearView
          items={items}
          project={selectedProject}
          canEdit={canEdit}
          onBook={handleBook}
          onUnbook={handleUnbook}
          onDelete={handleDelete}
          onEdit={setEditingItem}
        />
      ) : (
        <AllGearView
          items={items}
          projects={projects}
          canEdit={canEdit}
          onDelete={handleDelete}
          onEdit={setEditingItem}
        />
      )}
    </div>
  );
}

// Shown when a specific project is selected: split into "booked for this
// project" and "available to book" so admins aren't scanning the whole
// inventory to find what's free.
function ProjectGearView({
  items,
  project,
  canEdit,
  onBook,
  onUnbook,
  onDelete,
  onEdit,
}: {
  items: EquipmentItem[];
  project: Project;
  canEdit: boolean;
  onBook: (item: EquipmentItem, project: Project) => void;
  onUnbook: (item: EquipmentItem, project: Project) => void;
  onDelete: (itemId: string) => void;
  onEdit: (item: EquipmentItem) => void;
}) {
  const booked = items.filter((i) => isBookedForProject(i, project.id));
  const available = items.filter((i) => !isBookedForProject(i, project.id));

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          Booked for {project.clientName} ({booked.length})
        </h2>
        {booked.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-200 px-4 py-6 text-center text-sm text-stone-400 dark:border-stone-800 dark:text-stone-600">
            Nothing booked yet for this project.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {booked.map((item) => (
              <GearRow
                key={item.id}
                item={item}
                canEdit={canEdit}
                onDelete={onDelete}
                onEdit={onEdit}
                bookingAction={
                  canEdit ? (
                    <button
                      onClick={() => onUnbook(item, project)}
                      className="rounded-lg bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-200"
                    >
                      Unbook
                    </button>
                  ) : null
                }
              />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          Available to Book ({available.length})
        </h2>
        {available.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-200 px-4 py-6 text-center text-sm text-stone-400 dark:border-stone-800 dark:text-stone-600">
            Everything in inventory is already booked for this project.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {available.map((item) => {
              const conflict = hasConflict(item, project.eventStartDate, project.eventEndDate, project.id);
              return (
                <GearRow
                  key={item.id}
                  item={item}
                  canEdit={canEdit}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  conflictNote={
                    conflict ? "Already booked on overlapping dates for another project" : undefined
                  }
                  bookingAction={
                    canEdit && !conflict ? (
                      <button
                        onClick={() => onBook(item, project)}
                        className="rounded-lg bg-section-equipment px-3 py-1 text-xs font-semibold text-white"
                      >
                        Book
                      </button>
                    ) : null
                  }
                />
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

// Shown when no project is selected: every item in inventory, and for anything
// currently booked, which project has it and who's crewed on that project.
function AllGearView({
  items,
  projects,
  canEdit,
  onDelete,
  onEdit,
}: {
  items: EquipmentItem[];
  projects: Project[];
  canEdit: boolean;
  onDelete: (itemId: string) => void;
  onEdit: (item: EquipmentItem) => void;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => {
        const bookings = item.bookedDates
          .map((b) => projects.find((p) => p.id === b.projectId))
          .filter((p): p is Project => !!p);
        return (
          <GearRow key={item.id} item={item} canEdit={canEdit} onDelete={onDelete} onEdit={onEdit}>
            {bookings.length > 0 && (
              <div className="mt-2.5 flex flex-col gap-2 border-t border-stone-100 pt-2.5 dark:border-stone-800">
                {bookings.map((project) => (
                  <BookedProjectCrew key={project.id} project={project} />
                ))}
              </div>
            )}
          </GearRow>
        );
      })}
    </ul>
  );
}

// Shows the project a booking belongs to, and pulls that project's crew list
// live so you can see who actually has the gear in hand.
function BookedProjectCrew({ project }: { project: Project }) {
  const [crew, setCrew] = useState<CrewAssignment[] | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToCrewAssignments(project.id, setCrew);
    return unsubscribe;
  }, [project.id]);

  return (
    <div className="text-xs">
      <p className="font-medium text-stone-700 dark:text-stone-300">Booked for {project.clientName}</p>
      <p className="mt-0.5 flex items-center gap-1 text-stone-500 dark:text-stone-400">
        <Users size={12} className="shrink-0" />
        {crew === null
          ? "Loading crew..."
          : crew.length === 0
            ? "No crew assigned yet"
            : crew.map((c) => c.crewName).join(", ")}
      </p>
    </div>
  );
}

function GearRow({
  item,
  canEdit,
  onDelete,
  onEdit,
  bookingAction,
  conflictNote,
  children,
}: {
  item: EquipmentItem;
  canEdit: boolean;
  onDelete: (itemId: string) => void;
  onEdit: (item: EquipmentItem) => void;
  bookingAction?: React.ReactNode;
  conflictNote?: string;
  children?: React.ReactNode;
}) {
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
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => onEdit(item)}
              className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-section-equipment dark:text-stone-600 dark:hover:bg-stone-800"
              aria-label="Edit gear"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-red-500 dark:text-stone-600 dark:hover:bg-stone-800"
              aria-label="Remove from inventory"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {conflictNote && (
        <div className="mt-2.5 flex items-center gap-1.5 border-t border-stone-100 pt-2.5 text-xs font-medium text-red-500 dark:border-stone-800 dark:text-red-400">
          <AlertTriangle size={14} />
          {conflictNote}
        </div>
      )}

      {bookingAction && (
        <div className="mt-2.5 flex justify-end border-t border-stone-100 pt-2.5 dark:border-stone-800">
          {bookingAction}
        </div>
      )}

      {children}
    </li>
  );
}

function GearForm({ existing, onDone }: { existing?: EquipmentItem; onDone: () => void }) {
  const { showToast } = useToast();
  const isEditing = !!existing;
  const [name, setName] = useState(existing?.name ?? "");
  const [category, setCategory] = useState<EquipmentItem["category"]>(existing?.category ?? "camera");
  const [serialNumber, setSerialNumber] = useState(existing?.serialNumber ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (isEditing) {
        await updateEquipmentItem(existing.id, name.trim(), category, serialNumber.trim());
        showToast("Gear updated");
      } else {
        await addEquipmentItem(name.trim(), category, serialNumber.trim());
        showToast("Added to inventory");
      }
      onDone();
    } catch {
      showToast(isEditing ? "Couldn't save changes. Try again." : "Couldn't add it. Try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 flex flex-col gap-2 rounded-xl border border-stone-200 bg-white p-3 shadow-sm dark:border-stone-800 dark:bg-stone-900"
    >
      {isEditing && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            Editing {existing.name}
          </span>
          <button
            type="button"
            onClick={onDone}
            className="text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-200"
            aria-label="Cancel edit"
          >
            <X size={16} />
          </button>
        </div>
      )}
      <input
        type="text"
        placeholder="Gear name (e.g. Canon R5)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-base text-stone-900 placeholder-stone-400 outline-none focus:border-section-equipment dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
      />
      <div className="flex gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as EquipmentItem["category"])}
          className="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-base text-stone-900 outline-none focus:border-section-equipment dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
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
          className="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-base text-stone-900 placeholder-stone-400 outline-none focus:border-section-equipment dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-section-equipment py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? "Saving..." : isEditing ? "Save Changes" : "Add to Inventory"}
      </button>
    </form>
  );
}
