// Latest change: currency shown in Indian Rupees (₹), crew assignments can now be edited after saving (not just added/removed), and form fields use 16px text so mobile browsers don't auto-zoom on tap.
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { format } from "date-fns";
import { Plus, Trash2, Phone, DollarSign, Pencil, X } from "lucide-react";
import {
  subscribeToCrewAssignments,
  addCrewAssignment,
  updateCrewAssignment,
  deleteCrewAssignment,
  CREW_ROLES,
} from "@/lib/crewAssignments";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { formatCurrency } from "@/lib/currency";
import type { CrewAssignment, CrewRole } from "@/types";

const ROLE_LABEL: Record<CrewRole, string> = {
  "lead-photographer": "Lead Photographer",
  "second-shooter": "Second Shooter",
  cinematographer: "Cinematographer",
  "drone-pilot": "Drone Pilot",
  editor: "Editor",
};

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
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-stone-500 dark:text-stone-400">
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
            className="flex items-center gap-1 rounded-lg bg-section-projects px-3 py-1.5 text-sm font-semibold text-white"
          >
            <Plus size={16} />
            Assign Crew
          </button>
        )}
      </div>

      {showForm && canEdit && (
        <AssignmentForm projectId={projectId} onDone={() => setShowForm(false)} />
      )}

      {loading ? null : assignments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-200 px-4 py-8 text-center text-sm text-stone-400 dark:border-stone-800 dark:text-stone-600">
          No crew assigned to this project yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
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
                className="rounded-xl border border-stone-200 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{a.crewName}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">{ROLE_LABEL[a.role]}</p>
                  </div>
                  {canEdit && (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => handleEditClick(a)}
                        className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-section-projects dark:text-stone-600 dark:hover:bg-stone-800"
                        aria-label="Edit crew assignment"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-red-500 dark:text-stone-600 dark:hover:bg-stone-800"
                        aria-label="Remove crew assignment"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-stone-100 pt-2 text-xs text-stone-500 dark:border-stone-800 dark:text-stone-400">
                  <span>
                    {format(new Date(a.shiftStart), "MMM d, h:mm a")} –{" "}
                    {format(new Date(a.shiftEnd), "h:mm a")}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign size={12} />
                    {formatCurrency(a.dailyRate)}/day
                  </span>
                  {a.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={12} />
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
  const [shiftDate, setShiftDate] = useState(
    existing ? format(new Date(existing.shiftStart), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  );
  const [shiftStartTime, setShiftStartTime] = useState(
    existing ? format(new Date(existing.shiftStart), "HH:mm") : "09:00"
  );
  const [shiftEndTime, setShiftEndTime] = useState(
    existing ? format(new Date(existing.shiftEnd), "HH:mm") : "22:00"
  );
  const [dailyRate, setDailyRate] = useState(existing ? String(existing.dailyRate) : "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!crewName.trim() || !dailyRate) return;
    setSaving(true);
    try {
      const data = {
        crewName: crewName.trim(),
        role,
        phone: phone.trim() || undefined,
        shiftStart: new Date(`${shiftDate}T${shiftStartTime}`).getTime(),
        shiftEnd: new Date(`${shiftDate}T${shiftEndTime}`).getTime(),
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
      className="mb-4 flex flex-col gap-2 rounded-xl border border-stone-200 bg-white p-3 shadow-sm dark:border-stone-800 dark:bg-stone-900"
    >
      {isEditing && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            Editing {existing.crewName}
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
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Crew member name"
          value={crewName}
          onChange={(e) => setCrewName(e.target.value)}
          className="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-base text-stone-900 placeholder-stone-400 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as CrewRole)}
          className="rounded-lg border border-stone-200 bg-stone-50 px-2 py-2.5 text-base text-stone-900 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
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
        className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-base text-stone-900 placeholder-stone-400 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
      />

      <div className="flex gap-2">
        <input
          type="date"
          value={shiftDate}
          onChange={(e) => setShiftDate(e.target.value)}
          className="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-base text-stone-900 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
        />
        <input
          type="time"
          value={shiftStartTime}
          onChange={(e) => setShiftStartTime(e.target.value)}
          className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-base text-stone-900 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
        />
        <input
          type="time"
          value={shiftEndTime}
          onChange={(e) => setShiftEndTime(e.target.value)}
          className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-base text-stone-900 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
        />
      </div>

      <input
        type="number"
        placeholder="Day rate (₹)"
        value={dailyRate}
        onChange={(e) => setDailyRate(e.target.value)}
        className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-base text-stone-900 placeholder-stone-400 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
      />

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-section-projects py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? "Saving..." : isEditing ? "Save Changes" : "Assign to Project"}
      </button>
    </form>
  );
}
