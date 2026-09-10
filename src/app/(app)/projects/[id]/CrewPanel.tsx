// Latest change: fixed a crash - opening Crew (or its edit form) on a record saved with an old/missing date format used to throw and take down the whole page; now falls back safely instead.
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { format, isValid } from "date-fns";
import { Plus, Trash2, Phone, Pencil, X, Users } from "lucide-react";
import {
  subscribeToCrewAssignments,
  addCrewAssignment,
  updateCrewAssignment,
  deleteCrewAssignment,
  CREW_ROLES,
  ROLE_LABEL,
} from "@/lib/crewAssignments";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { formatCurrency } from "@/lib/currency";
import { formatEventDateRange } from "@/lib/dateRange";
import type { CrewAssignment, CrewRole } from "@/types";

// Turns a possibly-missing/invalid timestamp into a yyyy-MM-dd string for a
// date input, falling back to today instead of throwing - protects against
// crew records saved before shiftStartDate/shiftEndDate existed.
function safeDateString(timestamp: number | undefined): string {
  const date = timestamp ? new Date(timestamp) : new Date();
  return format(isValid(date) ? date : new Date(), "yyyy-MM-dd");
}

export default function CrewPanel({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const canEdit = user?.role === "admin";
  const [assignments, setAssignments] = useState<CrewAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<CrewAssignment | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToCrewAssignments(projectId, (a) => {
      setAssignments(a);
      setLoading(false);
    });
    return unsubscribe;
  }, [projectId]);

  async function handleDelete(assignmentId: string) {
    try {
      await deleteCrewAssignment(assignmentId);
      showToast("Crew member removed");
    } catch {
      showToast("Couldn't remove them. Try again.", "error");
    }
  }

  function handleEditClick(assignment: CrewAssignment) {
    setEditingAssignment(assignment);
    setShowForm(false);
  }

  const totalDayRates = assignments.reduce((sum, a) => sum + a.dailyRate, 0);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-stone-500 dark:text-stone-400">
          <Users size={18} className="text-section-projects" />
          {loading
            ? "Loading..."
            : `${assignments.length} crew · ${formatCurrency(totalDayRates)} total day rates`}
        </span>
        {canEdit && (
          <button
            onClick={() => {
              setShowForm((v) => !v);
              setEditingAssignment(null);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-section-projects px-4 py-2.5 text-base font-semibold text-white shadow-sm"
          >
            <Plus size={20} />
            Assign Crew
          </button>
        )}
      </div>

      {showForm && canEdit && (
        <AssignmentForm projectId={projectId} onDone={() => setShowForm(false)} />
      )}

      {loading ? null : assignments.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-stone-200 px-4 py-10 text-center text-sm text-stone-400 dark:border-stone-800 dark:text-stone-600">
          No crew assigned to this project yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {assignments.map((a) =>
            editingAssignment?.id === a.id ? (
              <AssignmentForm
                key={a.id}
                projectId={projectId}
                existing={a}
                onDone={() => setEditingAssignment(null)}
              />
            ) : (
              <li
                key={a.id}
                className="rounded-2xl border-2 border-stone-200 bg-white px-4 py-4 shadow-sm dark:border-stone-800 dark:bg-stone-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-bold text-stone-900 dark:text-stone-100">{a.crewName}</p>
                    <span className="mt-1 inline-block rounded-full bg-section-projects/10 px-2.5 py-1 text-xs font-bold text-section-projects">
                      {ROLE_LABEL[a.role] ?? "Unspecified role"}
                    </span>
                  </div>
                  {canEdit && (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => handleEditClick(a)}
                        className="rounded-lg p-2.5 text-stone-400 hover:bg-section-projects/10 hover:text-section-projects dark:text-stone-600"
                        aria-label="Edit crew assignment"
                      >
                        <Pencil size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="rounded-lg p-2.5 text-stone-400 hover:bg-red-50 hover:text-red-500 dark:text-stone-600 dark:hover:bg-red-950/30"
                        aria-label="Remove crew assignment"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-stone-100 pt-3 text-sm text-stone-500 dark:border-stone-800 dark:text-stone-400">
                  <span className="font-medium">{formatEventDateRange(a.shiftStartDate, a.shiftEndDate)}</span>
                  <span className="font-semibold text-section-projects">
                    {formatCurrency(a.dailyRate)}/day
                  </span>
                  {a.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={14} />
                      {a.phone}
                    </span>
                  )}
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}

function AssignmentForm({
  projectId,
  existing,
  onDone,
}: {
  projectId: string;
  existing?: CrewAssignment;
  onDone: () => void;
}) {
  const { showToast } = useToast();
  const isEditing = !!existing;
  const [crewName, setCrewName] = useState(existing?.crewName ?? "");
  const [role, setRole] = useState<CrewRole>(existing?.role ?? "second-shooter");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [startDate, setStartDate] = useState(safeDateString(existing?.shiftStartDate));
  const [endDate, setEndDate] = useState(safeDateString(existing?.shiftEndDate));
  const [dailyRate, setDailyRate] = useState(existing ? String(existing.dailyRate) : "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!crewName.trim() || !dailyRate) return;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (end < start) {
      showToast("End date can't be before the start date.", "error");
      return;
    }
    setSaving(true);
    try {
      const data = {
        crewName: crewName.trim(),
        role,
        phone: phone.trim() || undefined,
        shiftStartDate: start,
        shiftEndDate: end,
        dailyRate: Number(dailyRate) || 0,
      };
      if (isEditing) {
        await updateCrewAssignment(existing.id, data);
        showToast("Crew assignment updated");
      } else {
        await addCrewAssignment(projectId, data);
        showToast("Crew assigned");
      }
      onDone();
    } catch {
      showToast(isEditing ? "Couldn't save changes. Try again." : "Couldn't assign them. Try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 flex flex-col gap-3 rounded-2xl border-2 border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900"
    >
      {isEditing && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            Editing {existing.crewName}
          </span>
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:text-stone-500 dark:hover:bg-stone-800 dark:hover:text-stone-200"
            aria-label="Cancel edit"
          >
            <X size={20} />
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Crew member name"
          value={crewName}
          onChange={(e) => setCrewName(e.target.value)}
          className="flex-1 rounded-xl border-2 border-stone-200 bg-stone-50 px-3 py-3 text-base text-stone-900 placeholder-stone-400 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as CrewRole)}
          className="rounded-xl border-2 border-stone-200 bg-stone-50 px-2 py-3 text-base text-stone-900 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
        >
          {CREW_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
      </div>

      <input
        type="tel"
        placeholder="Phone (optional)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="rounded-xl border-2 border-stone-200 bg-stone-50 px-3 py-3 text-base text-stone-900 placeholder-stone-400 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
      />

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">
            Shift start date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              if (endDate < e.target.value) setEndDate(e.target.value);
            }}
            className="w-full rounded-xl border-2 border-stone-200 bg-stone-50 px-3 py-3 text-base text-stone-900 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">
            Shift end date
          </label>
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
        type="number"
        placeholder="Day rate (₹)"
        value={dailyRate}
        onChange={(e) => setDailyRate(e.target.value)}
        className="rounded-xl border-2 border-stone-200 bg-stone-50 px-3 py-3 text-base text-stone-900 placeholder-stone-400 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
      />

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-section-projects py-3.5 text-base font-semibold text-white disabled:opacity-50"
      >
        {saving ? "Saving..." : isEditing ? "Save Changes" : "Assign to Project"}
      </button>
    </form>
  );
}
