// Initial creation: Shot list builder - apply standard template, add custom shots, checkboxes sync live across devices.
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, Trash2, Check, Sparkles } from "lucide-react";
import {
  subscribeToShotList,
  addShotListItem,
  setShotDone,
  deleteShotListItem,
  applyShotListTemplate,
} from "@/lib/shotLists";
import type { ShotListItem } from "@/types";

export default function ShotListBuilder({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<ShotListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingTemplate, setApplyingTemplate] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newCategory, setNewCategory] = useState("Custom");

  useEffect(() => {
    const unsubscribe = subscribeToShotList(projectId, (i) => {
      setItems(i);
      setLoading(false);
    });
    return unsubscribe;
  }, [projectId]);

  const grouped = useMemo(() => {
    const map = new Map<string, ShotListItem[]>();
    for (const item of items) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [items]);

  async function handleApplyTemplate() {
    setApplyingTemplate(true);
    await applyShotListTemplate(projectId);
    setApplyingTemplate(false);
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    await addShotListItem(projectId, newCategory.trim() || "Custom", newLabel.trim());
    setNewLabel("");
  }

  const doneCount = items.filter((i) => i.done).length;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-zinc-500">
          {loading ? "Loading..." : `${doneCount}/${items.length} shots captured`}
        </span>
        {items.length === 0 && !loading && (
          <button
            onClick={handleApplyTemplate}
            disabled={applyingTemplate}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-100 disabled:opacity-50"
          >
            <Sparkles size={14} />
            {applyingTemplate ? "Adding..." : "Use Standard Template"}
          </button>
        )}
      </div>

      <form onSubmit={handleAdd} className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          placeholder="Custom shot (e.g. Grandma's brooch detail)"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-500"
        />
        <input
          type="text"
          placeholder="Category"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-500 sm:w-32"
        />
        <button
          type="submit"
          className="flex items-center justify-center gap-1 rounded-lg bg-amber-500 px-3 py-2.5 text-sm font-semibold text-zinc-950"
        >
          <Plus size={16} />
          Add
        </button>
      </form>

      {loading ? null : items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-8 text-center text-sm text-zinc-600">
          No shots yet. Use the standard template or add your own above.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {Array.from(grouped.entries()).map(([category, categoryItems]) => (
            <div key={category}>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {category}
              </h3>
              <ul className="flex flex-col gap-1.5">
                {categoryItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5"
                  >
                    <button
                      onClick={() => setShotDone(item.id, !item.done)}
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${
                        item.done
                          ? "border-amber-500 bg-amber-500 text-zinc-950"
                          : "border-zinc-700 text-transparent"
                      }`}
                      aria-label={item.done ? "Mark as not captured" : "Mark as captured"}
                    >
                      <Check size={16} strokeWidth={3} />
                    </button>
                    <span
                      className={`flex-1 text-sm ${
                        item.done ? "text-zinc-600 line-through" : "text-zinc-100"
                      }`}
                    >
                      {item.label}
                    </span>
                    <button
                      onClick={() => deleteShotListItem(item.id)}
                      className="shrink-0 rounded-md p-1.5 text-zinc-600 hover:bg-zinc-800 hover:text-red-400"
                      aria-label="Delete shot"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
