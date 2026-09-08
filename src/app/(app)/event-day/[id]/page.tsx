// Initial creation: Event Day live checklist - mobile-optimized real-time shot execution with category filters and skip notes.
"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, X, StickyNote } from "lucide-react";
import {
  subscribeToShotList,
  setShotDone,
  setShotSkipped,
  clearShotSkip,
} from "@/lib/shotLists";
import { getProject, endEvent } from "@/lib/projects";
import type { ShotListItem, Project } from "@/types";

export default function EventDayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
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
    return ["All", ...Array.from(set)];
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
    await endEvent(id);
    setEnding(false);
  }

  if (project === undefined || loading) {
    return <p className="text-zinc-500">Loading...</p>;
  }

  if (project === null) {
    return <p className="text-zinc-500">Project not found.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Sticky header: back link, progress bar, category filters - always visible while scrolling shots */}
      <div className="sticky -top-4 z-10 -mx-4 bg-zinc-950 px-4 pb-3 pt-4 md:-mx-6 md:px-6">
        <div className="mb-2 flex items-center justify-between">
          <Link
            href={`/projects/${id}`}
            className="flex items-center gap-1 text-sm text-zinc-500"
          >
            <ArrowLeft size={16} />
            {project.clientName}
          </Link>
          {project.phase === "event-day" && (
            <button
              onClick={handleEndEvent}
              disabled={ending}
              className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-100 disabled:opacity-50"
            >
              {ending ? "Ending..." : "End Event"}
            </button>
          )}
        </div>

        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="font-semibold text-zinc-100">
            {doneCount}/{totalCount} shots captured
          </span>
          {skippedCount > 0 && (
            <span className="text-amber-500">{skippedCount} skipped</span>
          )}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-amber-500 transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ${
                activeCategory === cat
                  ? "bg-amber-500 text-zinc-950"
                  : "bg-zinc-900 text-zinc-400"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {totalCount === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-zinc-800 px-4 py-10 text-center text-sm text-zinc-600">
          No shot list yet. Build one from the project&apos;s Shot List tab before the
          event starts.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {visibleItems.map((item) => (
            <ShotRow key={item.id} item={item} onFlagNote={() => setNoteTarget(item)} />
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
  onFlagNote,
}: {
  item: ShotListItem;
  onFlagNote: () => void;
}) {
  return (
    <li
      className={`rounded-xl border px-4 py-3.5 ${
        item.skipped
          ? "border-amber-500/40 bg-amber-500/5"
          : item.done
            ? "border-zinc-800 bg-zinc-900"
            : "border-zinc-800 bg-zinc-900"
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShotDone(item.id, !item.done)}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 ${
            item.done
              ? "border-amber-500 bg-amber-500 text-zinc-950"
              : "border-zinc-700 text-transparent"
          }`}
          aria-label={item.done ? "Mark as not captured" : "Mark as captured"}
        >
          <Check size={22} strokeWidth={3} />
        </button>

        <div className="min-w-0 flex-1">
          <p
            className={`text-base font-medium ${
              item.done ? "text-zinc-600 line-through" : "text-zinc-100"
            }`}
          >
            {item.label}
          </p>
          {item.skipped && item.skipNote && (
            <p className="mt-0.5 truncate text-xs text-amber-500">
              Skipped: {item.skipNote}
            </p>
          )}
        </div>

        <button
          onClick={onFlagNote}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            item.skipped ? "bg-amber-500/20 text-amber-500" : "bg-zinc-800 text-zinc-500"
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
  const [note, setNote] = useState(item.skipNote ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSkip() {
    setSaving(true);
    await setShotSkipped(item.id, note.trim());
    setSaving(false);
    onClose();
  }

  async function handleClear() {
    setSaving(true);
    await clearShotSkip(item.id);
    setSaving(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-2xl border border-zinc-800 bg-zinc-900 p-4 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-zinc-100">{item.label}</h3>
          <button onClick={onClose} className="text-zinc-500" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Why couldn't this be captured? (e.g. bad light, family running late)"
          autoFocus
          className="mb-3 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-500"
        />

        <div className="flex gap-2">
          {item.skipped && (
            <button
              onClick={handleClear}
              disabled={saving}
              className="flex-1 rounded-lg bg-zinc-800 py-2.5 text-sm font-semibold text-zinc-100 disabled:opacity-50"
            >
              Clear Skip
            </button>
          )}
          <button
            onClick={handleSkip}
            disabled={saving}
            className="flex-1 rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Flag as Skipped"}
          </button>
        </div>
      </div>
    </div>
  );
}
