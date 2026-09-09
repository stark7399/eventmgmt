// Latest change: theme-aware redesign plus toast notifications on template apply / add / delete errors.
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
import { useToast } from "@/contexts/ToastContext";
import type { ShotListItem } from "@/types";

export default function ShotListBuilder({ projectId }: { projectId: string }) {
  const { showToast } = useToast();
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
    try {
      await applyShotListTemplate(projectId);
      showToast("Standard shot list added");
    } catch {
      showToast("Couldn't add the template. Try again.", "error");
    } finally {
      setApplyingTemplate(false);
    }
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    try {
      await addShotListItem(projectId, newCategory.trim() || "Custom", newLabel.trim());
      setNewLabel("");
    } catch {
      showToast("Couldn't add the shot. Try again.", "error");
    }
  }

  async function handleDelete(itemId: string) {
    try {
      await deleteShotListItem(itemId);
    } catch {
      showToast("Couldn't delete the shot. Try again.", "error");
    }
  }

  const doneCount = items.filter((i) => i.done).length;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-stone-500 dark:text-stone-400">
          {loading ? "Loading..." : `${doneCount}/${items.length} shots captured`}
        </span>
        {items.length === 0 && !loading && (
          <button
            onClick={handleApplyTemplate}
            disabled={applyingTemplate}
            className="flex items-center gap-1.5 rounded-lg bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-700 disabled:opacity-50 dark:bg-stone-800 dark:text-stone-100"
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
          className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder-stone-400 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
        />
        <input
          type="text"
          placeholder="Category"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder-stone-400 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 sm:w-32"
        />
        <button
          type="submit"
          className="flex items-center justify-center gap-1 rounded-lg bg-section-projects px-3 py-2.5 text-sm font-semibold text-white"
        >
          <Plus size={16} />
          Add
        </button>
      </form>

      {loading ? null : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-200 px-4 py-8 text-center text-sm text-stone-400 dark:border-stone-800 dark:text-stone-600">
          No shots yet. Use the standard template or add your own above.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {Array.from(grouped.entries()).map(([category, categoryItems]) => (
            <div key={category}>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                {category}
              </h3>
              <ul className="flex flex-col gap-1.5">
                {categoryItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2.5 dark:border-stone-700 dark:bg-stone-900"
                  >
                    <button
                      onClick={() => setShotDone(item.id, !item.done)}
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${
                        item.done
                          ? "border-section-projects bg-section-projects text-white"
                          : "border-stone-300 text-transparent dark:border-stone-600"
                      }`}
                      aria-label={item.done ? "Mark as not captured" : "Mark as captured"}
                    >
                      <Check size={16} strokeWidth={3} />
                    </button>
                    <span
                      className={`flex-1 text-sm ${
                        item.done ? "text-stone-400 line-through dark:text-stone-600" : "text-stone-900 dark:text-stone-100"
                      }`}
                    >
                      {item.label}
                    </span>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="shrink-0 rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-red-500 dark:text-stone-600 dark:hover:bg-stone-800"
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
