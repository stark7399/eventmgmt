// Latest change: currency shown in Indian Rupees (₹), and the project picker shows the event's start-end date range instead of a single date.
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { format } from "date-fns";
import { Plus, Trash2, Check, Wallet } from "lucide-react";
import { subscribeToProjects } from "@/lib/projects";
import {
  subscribeToFinances,
  addFinanceRecord,
  setFinanceStatus,
  deleteFinanceRecord,
} from "@/lib/finances";
import { subscribeToCrewAssignments } from "@/lib/crewAssignments";
import { useToast } from "@/contexts/ToastContext";
import { formatCurrency } from "@/lib/currency";
import { formatEventDateRange } from "@/lib/dateRange";
import type { Project, FinanceRecord, CrewAssignment } from "@/types";

const TYPE_LABEL: Record<FinanceRecord["type"], string> = {
  invoice: "Invoice",
  expense: "Expense",
  payout: "Payout",
};

export default function FinancePage() {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [crewAssignments, setCrewAssignments] = useState<CrewAssignment[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToProjects((p) => {
      setProjects(p);
      setLoading(false);
      setSelectedProjectId((current) => current || p[0]?.id || "");
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    const unsubscribe = subscribeToFinances(selectedProjectId, setRecords);
    return unsubscribe;
  }, [selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId) return;
    const unsubscribe = subscribeToCrewAssignments(selectedProjectId, setCrewAssignments);
    return unsubscribe;
  }, [selectedProjectId]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;

  const totals = useMemo(() => {
    const invoiced = records
      .filter((r) => r.type === "invoice")
      .reduce((sum, r) => sum + r.amount, 0);
    const paid = records
      .filter((r) => r.status === "paid")
      .reduce((sum, r) => sum + r.amount, 0);
    const outgoing = records
      .filter((r) => r.type === "expense" || r.type === "payout")
      .reduce((sum, r) => sum + r.amount, 0);
    const crewOwed = crewAssignments.reduce((sum, a) => sum + a.dailyRate, 0);
    const alreadyPaidOut = records
      .filter((r) => r.type === "payout" && r.status === "paid")
      .reduce((sum, r) => sum + r.amount, 0);
    return { invoiced, paid, outgoing, crewOwed, crewRemaining: Math.max(0, crewOwed - alreadyPaidOut) };
  }, [records, crewAssignments]);

  async function handleLogPayout(crewName: string, dailyRate: number) {
    try {
      await addFinanceRecord(selectedProjectId, "payout", dailyRate, `Payout - ${crewName}`);
      showToast("Payout logged");
    } catch {
      showToast("Couldn't log the payout. Try again.", "error");
    }
  }

  async function handleMarkPaid(recordId: string) {
    try {
      await setFinanceStatus(recordId, "paid");
      showToast("Marked paid");
    } catch {
      showToast("Couldn't update it. Try again.", "error");
    }
  }

  async function handleDeleteRecord(recordId: string) {
    try {
      await deleteFinanceRecord(recordId);
      showToast("Record deleted");
    } catch {
      showToast("Couldn't delete it. Try again.", "error");
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 flex items-center gap-2 text-2xl font-bold text-stone-900 dark:text-stone-100">
        <Wallet className="text-section-finance" size={26} />
        Finance
      </h1>

      {loading ? (
        <p className="text-stone-500 dark:text-stone-400">Loading...</p>
      ) : projects.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-200 px-4 py-10 text-center text-sm text-stone-400 dark:border-stone-800 dark:text-stone-600">
          Create a project first to track its finances.
        </p>
      ) : (
        <>
          <div className="mb-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
              Project
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-base text-stone-900 outline-none focus:border-section-finance dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.clientName} — {formatEventDateRange(p.eventStartDate, p.eventEndDate)}
                </option>
              ))}
            </select>
          </div>

          {selectedProject && (
            <div className="mb-4 grid grid-cols-3 gap-2">
              <StatBox label="Budget" value={selectedProject.budget} />
              <StatBox label="Invoiced" value={totals.invoiced} accent="text-blue-600 dark:text-blue-400" />
              <StatBox label="Paid In" value={totals.paid} accent="text-emerald-600 dark:text-emerald-400" />
            </div>
          )}

          {crewAssignments.length > 0 && (
            <div className="mb-4 rounded-xl border border-stone-200 bg-white p-3 shadow-sm dark:border-stone-800 dark:bg-stone-900">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                  Crew Owed (from assignments)
                </h3>
                <span className="text-sm font-bold text-section-finance">
                  {formatCurrency(totals.crewRemaining)}
                </span>
              </div>
              <ul className="flex flex-col gap-1.5">
                {crewAssignments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between text-xs">
                    <span className="text-stone-500 dark:text-stone-400">{a.crewName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-stone-400 dark:text-stone-500">{formatCurrency(a.dailyRate)}</span>
                      <button
                        onClick={() => handleLogPayout(a.crewName, a.dailyRate)}
                        className="rounded bg-stone-100 px-2 py-0.5 text-stone-700 dark:bg-stone-800 dark:text-stone-200"
                      >
                        Log payout
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-stone-400 dark:text-stone-500">
                This total reflects planned crew day rates, not confirmed payments.
                Tap &quot;Log payout&quot; to record an actual payment below.
              </p>
            </div>
          )}

          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-stone-500 dark:text-stone-400">{records.length} record(s)</span>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-1 rounded-lg bg-section-finance px-3 py-1.5 text-sm font-semibold text-white"
            >
              <Plus size={16} />
              Add Record
            </button>
          </div>

          {showForm && selectedProjectId && (
            <NewRecordForm projectId={selectedProjectId} onDone={() => setShowForm(false)} />
          )}

          {records.length === 0 ? (
            <p className="rounded-xl border border-dashed border-stone-200 px-4 py-8 text-center text-sm text-stone-400 dark:border-stone-800 dark:text-stone-600">
              No invoices, expenses, or payouts recorded yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {records.map((record) => (
                <RecordRow
                  key={record.id}
                  record={record}
                  onMarkPaid={handleMarkPaid}
                  onDelete={handleDeleteRecord}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <p className={`text-lg font-bold ${accent ?? "text-stone-900 dark:text-stone-100"}`}>
        {formatCurrency(value)}
      </p>
      <p className="text-xs text-stone-500 dark:text-stone-400">{label}</p>
    </div>
  );
}

function RecordRow({
  record,
  onMarkPaid,
  onDelete,
}: {
  record: FinanceRecord;
  onMarkPaid: (recordId: string) => void;
  onDelete: (recordId: string) => void;
}) {
  const statusColor =
    record.status === "paid"
      ? "text-emerald-600 dark:text-emerald-400"
      : record.status === "overdue"
        ? "text-red-500 dark:text-red-400"
        : "text-amber-600 dark:text-amber-400";

  return (
    <li className="rounded-xl border border-stone-200 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{record.description}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {TYPE_LABEL[record.type]} · {formatCurrency(record.amount)}
          </p>
        </div>
        <button
          onClick={() => onDelete(record.id)}
          className="shrink-0 rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-red-500 dark:text-stone-600 dark:hover:bg-stone-800"
          aria-label="Delete record"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-stone-100 pt-2 dark:border-stone-800">
        <span className={`text-xs font-semibold capitalize ${statusColor}`}>
          {record.status}
        </span>
        {record.status !== "paid" && (
          <button
            onClick={() => onMarkPaid(record.id)}
            className="flex items-center gap-1 rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-100"
          >
            <Check size={12} />
            Mark Paid
          </button>
        )}
      </div>
    </li>
  );
}

function NewRecordForm({
  projectId,
  onDone,
}: {
  projectId: string;
  onDone: () => void;
}) {
  const { showToast } = useToast();
  const [type, setType] = useState<FinanceRecord["type"]>("invoice");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!description.trim() || !numAmount) return;
    setSaving(true);
    try {
      await addFinanceRecord(projectId, type, numAmount, description.trim());
      showToast("Record added");
      setDescription("");
      setAmount("");
      onDone();
    } catch {
      showToast("Couldn't add the record. Try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 flex flex-col gap-2 rounded-xl border border-stone-200 bg-white p-3 shadow-sm dark:border-stone-800 dark:bg-stone-900"
    >
      <div className="flex gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as FinanceRecord["type"])}
          className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-base text-stone-900 outline-none focus:border-section-finance dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
        >
          <option value="invoice">Invoice</option>
          <option value="expense">Expense</option>
          <option value="payout">Payout</option>
        </select>
        <input
          type="number"
          placeholder="Amount (₹)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-base text-stone-900 placeholder-stone-400 outline-none focus:border-section-finance dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
        />
      </div>
      <input
        type="text"
        placeholder="Description (e.g. Final payment, Venue fee, Second shooter payout)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-base text-stone-900 placeholder-stone-400 outline-none focus:border-section-finance dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
      />
      <div className="flex items-start gap-1.5 text-xs text-stone-500 dark:text-stone-400">
        <Wallet size={14} className="mt-0.5 shrink-0" />
        Crew payouts owed are calculated automatically from the Crew tab on this
        project. Use the &quot;Log payout&quot; button above once you&apos;ve actually
        paid someone, or add other invoices/expenses manually here.
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-section-finance py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? "Adding..." : "Add Record"}
      </button>
    </form>
  );
}
