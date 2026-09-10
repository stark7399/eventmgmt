// Latest change: simplified from Budget/Invoiced/Paid-In stat boxes into three plain cards (Profit, Money In, Money Out); the confusing "Log payout" button is now "Mark as Paid" with a plain-language explanation.
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, Trash2, Check, Wallet, TrendingUp, TrendingDown, IndianRupee } from "lucide-react";
import { subscribeToProjects } from "@/lib/projects";
import {
  subscribeToFinances,
  addFinanceRecord,
  recordCrewPayout,
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

  // Money In / Money Out / Profit - the three numbers a non-finance person
  // actually wants at a glance, instead of separate Budget/Invoiced/Paid boxes.
  const totals = useMemo(() => {
    const moneyIn = records.filter((r) => r.status === "paid" && r.type === "invoice").reduce((sum, r) => sum + r.amount, 0);
    const moneyOut = records
      .filter((r) => r.status === "paid" && (r.type === "expense" || r.type === "payout"))
      .reduce((sum, r) => sum + r.amount, 0);
    const crewOwed = crewAssignments.reduce((sum, a) => sum + a.dailyRate, 0);
    const crewAlreadyPaid = records
      .filter((r) => r.type === "payout" && r.status === "paid")
      .reduce((sum, r) => sum + r.amount, 0);
    return {
      moneyIn,
      moneyOut,
      profit: moneyIn - moneyOut,
      crewRemaining: Math.max(0, crewOwed - crewAlreadyPaid),
    };
  }, [records, crewAssignments]);

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

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-5 flex items-center gap-3 text-3xl font-bold text-stone-900 dark:text-stone-100">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-section-finance/15 text-section-finance">
          <Wallet size={26} />
        </span>
        Finance
      </h1>

      {loading ? (
        <p className="text-stone-500 dark:text-stone-400">Loading...</p>
      ) : projects.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-stone-200 px-4 py-10 text-center text-sm text-stone-400 dark:border-stone-800 dark:text-stone-600">
          Create a project first to track its finances.
        </p>
      ) : (
        <>
          <div className="mb-5">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
              Project
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full rounded-xl border-2 border-stone-200 bg-white px-4 py-3.5 text-base font-medium text-stone-900 outline-none focus:border-section-finance dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.clientName} — {formatEventDateRange(p.eventStartDate, p.eventEndDate)}
                </option>
              ))}
            </select>
          </div>

          {selectedProject && (
            <div className="mb-5 grid grid-cols-3 gap-2.5">
              <StatCard
                icon={IndianRupee}
                label="Profit"
                value={totals.profit}
                color={totals.profit >= 0 ? "emerald" : "red"}
              />
              <StatCard icon={TrendingUp} label="Money In" value={totals.moneyIn} color="blue" />
              <StatCard icon={TrendingDown} label="Money Out" value={totals.moneyOut} color="amber" />
            </div>
          )}

          {crewAssignments.length > 0 && (
            <div className="mb-5 rounded-2xl border-2 border-section-finance/20 bg-section-finance/5 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">Crew Still Owed</h3>
                <span className="text-lg font-bold text-section-finance">
                  {formatCurrency(totals.crewRemaining)}
                </span>
              </div>
              <ul className="flex flex-col gap-2">
                {crewAssignments.map((a) => (
                  <CrewPayoutRow
                    key={a.id}
                    assignment={a}
                    projectId={selectedProjectId}
                    onPaid={() => showToast("Payment recorded")}
                    onError={() => showToast("Couldn't record the payment. Try again.", "error")}
                  />
                ))}
              </ul>
              <p className="mt-3 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                This shows what each crew member is owed for this wedding, based on their day
                rate. Once you&apos;ve actually paid someone, tap &quot;Mark as Paid&quot; next to their
                name to record it.
              </p>
            </div>
          )}

          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-stone-500 dark:text-stone-400">
              {records.length} record{records.length === 1 ? "" : "s"}
            </span>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-1.5 rounded-xl bg-section-finance px-4 py-2.5 text-base font-semibold text-white shadow-sm"
            >
              <Plus size={20} />
              Add Record
            </button>
          </div>

          {showForm && selectedProjectId && (
            <NewRecordForm projectId={selectedProjectId} onDone={() => setShowForm(false)} />
          )}

          {records.length === 0 ? (
            <p className="rounded-2xl border-2 border-dashed border-stone-200 px-4 py-8 text-center text-sm text-stone-400 dark:border-stone-800 dark:text-stone-600">
              No invoices, expenses, or payouts recorded yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
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

const STAT_COLORS: Record<string, string> = {
  emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
  red: "text-red-600 dark:text-red-400 bg-red-500/10",
  blue: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
  amber: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
};

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-stone-200 bg-white p-3.5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <span className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${STAT_COLORS[color]}`}>
        <Icon size={18} />
      </span>
      <p className={`text-lg font-bold leading-tight ${STAT_COLORS[color].split(" ")[0]} ${STAT_COLORS[color].split(" ")[1]}`}>
        {formatCurrency(value)}
      </p>
      <p className="mt-0.5 text-xs font-medium text-stone-500 dark:text-stone-400">{label}</p>
    </div>
  );
}

// One row per crew member with a single clear action - "Mark as Paid" instead
// of the old finance-jargon "Log payout" - so someone without a finance
// background isn't left guessing what the button does. Creates the payout
// record already marked paid, in one write.
function CrewPayoutRow({
  assignment,
  projectId,
  onPaid,
  onError,
}: {
  assignment: CrewAssignment;
  projectId: string;
  onPaid: () => void;
  onError: () => void;
}) {
  const [paying, setPaying] = useState(false);

  async function handlePay() {
    setPaying(true);
    try {
      await recordCrewPayout(projectId, assignment.crewName, assignment.dailyRate);
      onPaid();
    } catch {
      onError();
    } finally {
      setPaying(false);
    }
  }

  return (
    <li className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2.5 dark:bg-stone-900">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-stone-800 dark:text-stone-200">
          {assignment.crewName}
        </p>
        <p className="text-xs text-stone-400 dark:text-stone-500">
          {formatCurrency(assignment.dailyRate)} owed
        </p>
      </div>
      <button
        onClick={handlePay}
        disabled={paying}
        className="shrink-0 rounded-lg bg-section-finance px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {paying ? "Saving..." : "Mark as Paid"}
      </button>
    </li>
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
  const statusStyle =
    record.status === "paid"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
      : record.status === "overdue"
        ? "bg-red-500/15 text-red-600 dark:text-red-400"
        : "bg-amber-500/15 text-amber-700 dark:text-amber-400";

  return (
    <li className="rounded-2xl border-2 border-stone-200 bg-white px-4 py-3.5 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-stone-900 dark:text-stone-100">
            {record.description}
          </p>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {TYPE_LABEL[record.type]} · {formatCurrency(record.amount)}
          </p>
        </div>
        <button
          onClick={() => onDelete(record.id)}
          className="shrink-0 rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-500 dark:text-stone-600 dark:hover:bg-red-950/30"
          aria-label="Delete record"
        >
          <Trash2 size={20} />
        </button>
      </div>
      <div className="mt-2.5 flex items-center justify-between border-t border-stone-100 pt-2.5 dark:border-stone-800">
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusStyle}`}>
          {record.status}
        </span>
        {record.status !== "paid" && (
          <button
            onClick={() => onMarkPaid(record.id)}
            className="flex items-center gap-1.5 rounded-lg bg-stone-100 px-3.5 py-2 text-sm font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-100"
          >
            <Check size={16} />
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
      className="mb-4 flex flex-col gap-2.5 rounded-2xl border-2 border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900"
    >
      <div className="flex gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as FinanceRecord["type"])}
          className="rounded-xl border-2 border-stone-200 bg-stone-50 px-3 py-3 text-base text-stone-900 outline-none focus:border-section-finance dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
        >
          <option value="invoice">Invoice (money coming in)</option>
          <option value="expense">Expense (money going out)</option>
          <option value="payout">Payout (crew payment)</option>
        </select>
        <input
          type="number"
          placeholder="Amount (₹)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 rounded-xl border-2 border-stone-200 bg-stone-50 px-3 py-3 text-base text-stone-900 placeholder-stone-400 outline-none focus:border-section-finance dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
        />
      </div>
      <input
        type="text"
        placeholder="What's this for? (e.g. Final payment, Venue fee)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="rounded-xl border-2 border-stone-200 bg-stone-50 px-3 py-3 text-base text-stone-900 placeholder-stone-400 outline-none focus:border-section-finance dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
      />
      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-section-finance py-3 text-base font-semibold text-white disabled:opacity-50"
      >
        {saving ? "Adding..." : "Add Record"}
      </button>
    </form>
  );
}
