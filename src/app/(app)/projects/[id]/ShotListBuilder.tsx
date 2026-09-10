// Latest change: assignee dropdown now shows "Name — Role" (via shared crewDropdownOptions), and cards/checkboxes/buttons are bigger and bolder.
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, Trash2, Check, Sparkles, User } from "lucide-react";
import {
  subscribeToShotList,
  addShotListItem,
  setShotDone,
  setShotAssignee,
  deleteShotListItem,
  applyShotListTemplate,
} from "@/lib/shotLists";
import { subscribeToCrewAssignments, crewDropdownOptions } from "@/lib/crewAssignments";
import { useToast } from "@/contexts/ToastContext";
import type { ShotListItem, CrewAssignment } from "@/types";

export default function ShotListBuilder({ projectId }: { projectId: string }) {
  const { showToast } = useToast();
  const [items, setItems] = useState<ShotListItem[]>([]);
  const [crew, setCrew] = useState<CrewAssignment[]>([]);
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

  useEffect(() => {
    const unsubscribe = subscribeToCrewAssignments(projectId, setCrew);
    return unsubscribe;
  }, [projectId]);

  const crewOptions = useMemo(() => crewDropdownOptions(crew), [crew]);

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

  async function handleAssign(itemId: string, crewName: string) {
    try {
      await setShotAssignee(itemId, crewName);
    } catch {
      showToast("Couldn't assign that shot. Try again.", "error");
    }
  }

  const doneCount = items.filter((i) => i.done).length;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-stone-500 dark:text-stone-400">
          {loading ? "Loading..." : `${doneCount}/${items.length} shots captured`}
        </span>
        {items.length === 0 && !loading && (
          <button
            onClick={handleApplyTemplate}
            disabled={applyingTemplate}
            className="flex items-center gap-1.5 rounded-xl bg-section-projects/10 px-3.5 py-2.5 text-sm font-semibold text-section-projects disabled:opacity-50"
          >
            <Sparkles size={18} />
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
          className="flex-1 rounded-xl border-2 border-stone-200 bg-white px-3 py-3 text-base text-stone-900 placeholder-stone-400 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
        />
        <input
          type="text"
          placeholder="Category"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="rounded-xl border-2 border-stone-200 bg-white px-3 py-3 text-base text-stone-900 placeholder-stone-400 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 sm:w-32"
        />
        <button
          type="submit"
          className="flex items-center justify-center gap-1.5 rounded-xl bg-section-projects px-4 py-3 text-base font-semibold text-white shadow-sm"
        >
          <Plus size={20} />
          Add
        </button>
      </form>

      {loading ? null : items.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-stone-200 px-4 py-8 text-center text-sm text-stone-400 dark:border-stone-800 dark:text-stone-600">
          No shots yet. Use the standard template or add your own above.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {Array.from(grouped.entries()).map(([category, categoryItems]) => (
            <div key={category}>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-section-projects">
                {category}
              </h3>
              <ul className="flex flex-col gap-2">
                {categoryItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-2.5 rounded-xl border-2 border-stone-200 bg-white px-4 py-3.5 dark:border-stone-700 dark:bg-stone-900 sm:flex-row sm:items-center"
                  >
                    <div className="flex flex-1 items-center gap-3">
                      <button
                        onClick={() => setShotDone(item.id, !item.done)}
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 ${
                          item.done
                            ? "border-section-projects bg-section-projects text-white"
                            : "border-stone-300 text-transparent dark:border-stone-600"
                        }`}
                        aria-label={item.done ? "Mark as not captured" : "Mark as captured"}
                      >
                        <Check size={20} strokeWidth={3} />
                      </button>
                      <span
                        className={`flex-1 text-base ${
                          item.done ? "text-stone-400 line-through dark:text-stone-600" : "font-medium text-stone-900 dark:text-stone-100"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pl-11 sm:pl-0">
                      <User size={18} className="shrink-0 text-section-projects" />
                      <select
                        value={item.assignedTo ?? ""}
                        onChange={(e) => handleAssign(item.id, e.target.value)}
                        className="flex-1 rounded-lg border-2 border-stone-200 bg-stone-50 px-2.5 py-2 text-sm font-medium text-stone-700 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-950 dark:text-stone-200 sm:flex-none"
                      >
                        <option value="">Unassigned</option>
                        {crewOptions.map((opt) => (
                          <option key={opt.name} value={opt.name}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="shrink-0 rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-500 dark:text-stone-600 dark:hover:bg-red-950/30"
                        aria-label="Delete shot"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
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
