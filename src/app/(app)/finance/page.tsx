// Initial creation: Finance page - invoices/expenses/payouts per project, manual entry, totals vs. budget.
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
import type { Project, FinanceRecord, CrewAssignment } from "@/types";

const TYPE_LABEL: Record<FinanceRecord["type"], string> = {
  invoice: "Invoice",
  expense: "Expense",
  payout: "Payout",
};

export default function FinancePage() {
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

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold text-zinc-100">Finance</h1>

      {loading ? (
        <p className="text-zinc-500">Loading...</p>
      ) : projects.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-10 text-center text-sm text-zinc-600">
          Create a project first to track its finances.
        </p>
      ) : (
        <>
          <div className="mb-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Project
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

          {selectedProject && (
            <div className="mb-4 grid grid-cols-3 gap-2">
              <StatBox
                label="Budget"
                value={selectedProject.budget}
              />
              <StatBox label="Invoiced" value={totals.invoiced} accent="text-blue-400" />
              <StatBox label="Paid In" value={totals.paid} accent="text-emerald-400" />
            </div>
          )}

          {crewAssignments.length > 0 && (
            <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-300">
                  Crew Owed (from assignments)
                </h3>
                <span className="text-sm font-bold text-amber-500">
                  ${totals.crewRemaining.toLocaleString()}
                </span>
              </div>
              <ul className="flex flex-col gap-1.5">
                {crewAssignments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">{a.crewName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500">${a.dailyRate.toLocaleString()}</span>
                      <button
                        onClick={() =>
                          addFinanceRecord(
                            selectedProjectId,
                            "payout",
                            a.dailyRate,
                            `Payout - ${a.crewName}`
                          )
                        }
                        className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-300"
                      >
                        Log payout
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-zinc-600">
                This total reflects planned crew day rates, not confirmed payments.
                Tap &quot;Log payout&quot; to record an actual payment below.
              </p>
            </div>
          )}

          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-zinc-500">{records.length} record(s)</span>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-zinc-950"
            >
              <Plus size={16} />
              Add Record
            </button>
          </div>

          {showForm && selectedProjectId && (
            <NewRecordForm
              projectId={selectedProjectId}
              onDone={() => setShowForm(false)}
            />
          )}

          {records.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-8 text-center text-sm text-zinc-600">
              No invoices, expenses, or payouts recorded yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {records.map((record) => (
                <RecordRow key={record.id} record={record} />
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
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <p className={`text-lg font-bold ${accent ?? "text-zinc-100"}`}>
        ${value.toLocaleString()}
      </p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}

function RecordRow({ record }: { record: FinanceRecord }) {
  const statusColor =
    record.status === "paid"
      ? "text-emerald-400"
      : record.status === "overdue"
        ? "text-red-400"
        : "text-amber-500";

  return (
    <li className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-zinc-100">{record.description}</p>
          <p className="text-xs text-zinc-500">
            {TYPE_LABEL[record.type]} · ${record.amount.toLocaleString()}
          </p>
        </div>
        <button
          onClick={() => deleteFinanceRecord(record.id)}
          className="shrink-0 rounded-md p-1.5 text-zinc-600 hover:bg-zinc-800 hover:text-red-400"
          aria-label="Delete record"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-zinc-800 pt-2">
        <span className={`text-xs font-semibold capitalize ${statusColor}`}>
          {record.status}
        </span>
        {record.status !== "paid" && (
          <button
            onClick={() => setFinanceStatus(record.id, "paid")}
            className="flex items-center gap-1 rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-100"
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
  const [type, setType] = useState<FinanceRecord["type"]>("invoice");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!description.trim() || !numAmount) return;
    setSaving(true);
    await addFinanceRecord(projectId, type, numAmount, description.trim());
    setSaving(false);
    setDescription("");
    setAmount("");
    onDone();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-3"
    >
      <div className="flex gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as FinanceRecord["type"])}
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-500"
        >
          <option value="invoice">Invoice</option>
          <option value="expense">Expense</option>
          <option value="payout">Payout</option>
        </select>
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-500"
        />
      </div>
      <input
        type="text"
        placeholder="Description (e.g. Final payment, Venue fee, Second shooter payout)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-500"
      />
      <div className="flex items-start gap-1.5 text-xs text-zinc-500">
        <Wallet size={14} className="mt-0.5 shrink-0" />
        Crew payouts owed are calculated automatically from the Crew tab on this
        project. Use the &quot;Log payout&quot; button above once you&apos;ve actually
        paid someone, or add other invoices/expenses manually here.
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-50"
      >
        {saving ? "Adding..." : "Add Record"}
      </button>
    </form>
  );
}
