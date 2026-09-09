// Latest change: shot rows now show which crew member each shot is assigned to.
"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, X, StickyNote, User } from "lucide-react";
import {
  subscribeToShotList,
  setShotDone,
  setShotSkipped,
  clearShotSkip,
} from "@/lib/shotLists";
import { getProject, endEvent } from "@/lib/projects";
import { useToast } from "@/contexts/ToastContext";
import type { ShotListItem, Project } from "@/types";

// A fixed rotation of colors assigned by category name, so "Ceremony" is always
// the same color across the whole shoot even though categories are user-defined.
const CATEGORY_COLORS = [
  { border: "border-l-violet-500", chipActive: "bg-violet-500 text-white", dot: "bg-violet-500" },
  { border: "border-l-rose-500", chipActive: "bg-rose-500 text-white", dot: "bg-rose-500" },
  { border: "border-l-amber-500", chipActive: "bg-amber-500 text-white", dot: "bg-amber-500" },
  { border: "border-l-teal-500", chipActive: "bg-teal-500 text-white", dot: "bg-teal-500" },
  { border: "border-l-blue-500", chipActive: "bg-blue-500 text-white", dot: "bg-blue-500" },
  { border: "border-l-emerald-500", chipActive: "bg-emerald-500 text-white", dot: "bg-emerald-500" },
];

function colorForCategory(category: string, allCategories: string[]) {
  const index = allCategories.indexOf(category) % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[Math.max(index, 0)];
}

export default function EventDayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { showToast } = useToast();
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [items, setItems] = useState<ShotListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [noteTarget, setNoteTarget] = useState<ShotListItem | null>(null);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    getProject(id).then(setProject);
  }, [id]);

  useEffect(() => {
    const unsubscribe = subscribeToShotList(id, (i) => {
      setItems(i);
      setLoading(false);
    });
    return unsubscribe;
  }, [id]);

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category));
    return Array.from(set);
  }, [items]);

  const visibleItems = useMemo(
    () =>
      activeCategory === "All"
        ? items
        : items.filter((i) => i.category === activeCategory),
    [items, activeCategory]
  );

  const doneCount = items.filter((i) => i.done).length;
  const skippedCount = items.filter((i) => i.skipped).length;
  const totalCount = items.length;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  async function handleEndEvent() {
    setEnding(true);
    try {
      await endEvent(id);
      showToast("Event ended");
    } catch {
      showToast("Couldn't end the event. Try again.", "error");
    } finally {
      setEnding(false);
    }
  }

  async function handleToggleDone(item: ShotListItem) {
    try {
      await setShotDone(item.id, !item.done);
    } catch {
      showToast("Couldn't update that shot. Try again.", "error");
    }
  }

  if (project === undefined || loading) {
    return <p className="text-stone-500 dark:text-stone-400">Loading...</p>;
  }

  if (project === null) {
    return <p className="text-stone-500 dark:text-stone-400">Project not found.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Sticky header: back link, progress bar, category filters - always visible while scrolling shots */}
      <div className="sticky -top-4 z-10 -mx-4 bg-stone-50 px-4 pb-3 pt-4 dark:bg-stone-950 md:-mx-6 md:px-6">
        <div className="mb-2 flex items-center justify-between">
          <Link
            href={`/projects/${id}`}
            className="flex items-center gap-1 text-sm text-stone-500 dark:text-stone-400"
          >
            <ArrowLeft size={16} />
            {project.clientName}
          </Link>
          {project.phase === "event-day" && (
            <button
              onClick={handleEndEvent}
              disabled={ending}
              className="rounded-lg bg-stone-800 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 dark:bg-stone-700"
            >
              {ending ? "Ending..." : "End Event"}
            </button>
          )}
        </div>

        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="font-semibold text-stone-900 dark:text-stone-100">
            {doneCount}/{totalCount} shots captured
          </span>
          {skippedCount > 0 && (
            <span className="text-amber-600 dark:text-amber-400">{skippedCount} skipped</span>
          )}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
          <div
            className="h-full rounded-full bg-section-projects transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveCategory("All")}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ${
              activeCategory === "All"
                ? "bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900"
                : "bg-white text-stone-500 dark:bg-stone-900 dark:text-stone-400"
            }`}
          >
            All
          </button>
          {categories.map((cat) => {
            const color = colorForCategory(cat, categories);
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium ${
                  active ? color.chipActive : "bg-white text-stone-500 dark:bg-stone-900 dark:text-stone-400"
                }`}
              >
                {!active && <span className={`h-1.5 w-1.5 rounded-full ${color.dot}`} />}
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {totalCount === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-stone-200 px-4 py-10 text-center text-sm text-stone-400 dark:border-stone-800 dark:text-stone-600">
          No shot list yet. Build one from the project&apos;s Shot List tab before the
          event starts.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {visibleItems.map((item) => (
            <ShotRow
              key={item.id}
              item={item}
              color={colorForCategory(item.category, categories)}
              onToggleDone={() => handleToggleDone(item)}
              onFlagNote={() => setNoteTarget(item)}
            />
          ))}
        </ul>
      )}

      {noteTarget && (
        <SkipNoteModal item={noteTarget} onClose={() => setNoteTarget(null)} />
      )}
    </div>
  );
}

function ShotRow({
  item,
  color,
  onToggleDone,
  onFlagNote,
}: {
  item: ShotListItem;
  color: (typeof CATEGORY_COLORS)[number];
  onToggleDone: () => void;
  onFlagNote: () => void;
}) {
  return (
    <li
      className={`rounded-xl border-l-4 border-y border-r border-stone-200 bg-white px-4 py-3.5 dark:border-y-stone-800 dark:border-r-stone-800 dark:bg-stone-900 ${
        item.skipped ? "border-l-amber-500 bg-amber-50 dark:bg-amber-950/20" : color.border
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleDone}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 ${
            item.done
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-stone-300 text-transparent dark:border-stone-700"
          }`}
          aria-label={item.done ? "Mark as not captured" : "Mark as captured"}
        >
          <Check size={22} strokeWidth={3} />
        </button>

        <div className="min-w-0 flex-1">
          <p
            className={`text-base font-medium ${
              item.done ? "text-stone-400 line-through dark:text-stone-600" : "text-stone-900 dark:text-stone-100"
            }`}
          >
            {item.label}
          </p>
          {item.skipped && item.skipNote && (
            <p className="mt-0.5 truncate text-xs text-amber-600 dark:text-amber-400">
              Skipped: {item.skipNote}
            </p>
          )}
          {item.assignedTo && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-400 dark:text-stone-500">
              <User size={11} />
              {item.assignedTo}
            </p>
          )}
        </div>

        <button
          onClick={onFlagNote}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            item.skipped
              ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
              : "bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500"
          }`}
          aria-label="Flag as skipped with a note"
        >
          <StickyNote size={20} />
        </button>
      </div>
    </li>
  );
}

function SkipNoteModal({
  item,
  onClose,
}: {
  item: ShotListItem;
  onClose: () => void;
}) {
  const { showToast } = useToast();
  const [note, setNote] = useState(item.skipNote ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSkip() {
    setSaving(true);
    try {
      await setShotSkipped(item.id, note.trim());
      onClose();
    } catch {
      showToast("Couldn't save that note. Try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    setSaving(true);
    try {
      await clearShotSkip(item.id);
      onClose();
    } catch {
      showToast("Couldn't clear the skip. Try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-stone-900 dark:text-stone-100">{item.label}</h3>
          <button onClick={onClose} className="text-stone-400 dark:text-stone-500" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Why couldn't this be captured? (e.g. bad light, family running late)"
          autoFocus
          className="mb-3 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-base text-stone-900 placeholder-stone-400 outline-none focus:border-amber-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
        />

        <div className="flex gap-2">
          {item.skipped && (
            <button
              onClick={handleClear}
              disabled={saving}
              className="flex-1 rounded-lg bg-stone-100 py-2.5 text-sm font-semibold text-stone-700 disabled:opacity-50 dark:bg-stone-800 dark:text-stone-100"
            >
              Clear Skip
            </button>
          )}
          <button
            onClick={handleSkip}
            disabled={saving}
            className="flex-1 rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Flag as Skipped"}
          </button>
        </div>
      </div>
    </div>
  );
}
