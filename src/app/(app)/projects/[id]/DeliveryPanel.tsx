// Latest change: bigger, bolder form fields, save button, and revision request cards.
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { format } from "date-fns";
import { Save, Check } from "lucide-react";
import { updateProject } from "@/lib/projects";
import { subscribeToRevisions, resolveRevisionRequest } from "@/lib/revisions";
import { useToast } from "@/contexts/ToastContext";
import type { Project, RevisionRequest } from "@/types";

export default function DeliveryPanel({ project }: { project: Project }) {
  const { showToast } = useToast();
  const [galleryUrl, setGalleryUrl] = useState(project.galleryUrl ?? "");
  const [expiresAt, setExpiresAt] = useState(
    project.galleryExpiresAt ? format(new Date(project.galleryExpiresAt), "yyyy-MM-dd") : ""
  );
  const [saving, setSaving] = useState(false);
  const [requests, setRequests] = useState<RevisionRequest[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToRevisions(project.id, setRequests);
    return unsubscribe;
  }, [project.id]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProject(project.id, {
        galleryUrl: galleryUrl.trim() || undefined,
        galleryExpiresAt: expiresAt ? new Date(expiresAt).getTime() : undefined,
      });
      showToast("Delivery settings saved");
    } catch {
      showToast("Couldn't save. Try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleResolve(requestId: string) {
    try {
      await resolveRevisionRequest(requestId);
      showToast("Marked resolved");
    } catch {
      showToast("Couldn't update it. Try again.", "error");
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <form onSubmit={handleSave} className="flex flex-col gap-2.5">
        <label className="text-sm font-bold text-stone-700 dark:text-stone-300">Gallery Link</label>
        <input
          type="url"
          placeholder="https://client-name.pixieset.com"
          value={galleryUrl}
          onChange={(e) => setGalleryUrl(e.target.value)}
          className="rounded-xl border-2 border-stone-200 bg-white px-3.5 py-3 text-base text-stone-900 placeholder-stone-400 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
        />
        <label className="text-sm font-bold text-stone-700 dark:text-stone-300">
          Download Link Expires
        </label>
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="rounded-xl border-2 border-stone-200 bg-white px-3.5 py-3 text-base text-stone-900 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
        />
        <button
          type="submit"
          disabled={saving}
          className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-section-projects py-3.5 text-base font-semibold text-white shadow-sm disabled:opacity-50"
        >
          <Save size={20} />
          {saving ? "Saving..." : "Save Delivery Settings"}
        </button>
      </form>

      <section>
        <h3 className="mb-2.5 text-sm font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          Client Revision Requests
        </h3>
        {requests.length === 0 ? (
          <p className="rounded-2xl border-2 border-dashed border-stone-200 px-4 py-6 text-center text-sm text-stone-400 dark:border-stone-800 dark:text-stone-600">
            No revision requests yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {requests.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl border-2 border-stone-200 bg-white px-4 py-3.5 dark:border-stone-800 dark:bg-stone-900"
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      r.status === "resolved"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    {r.status === "resolved" ? "Resolved" : "Pending"}
                  </span>
                  <span className="text-sm text-stone-400 dark:text-stone-500">
                    {format(new Date(r.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
                <p className="mb-2.5 text-base text-stone-700 dark:text-stone-300">{r.message}</p>
                {r.status === "open" && (
                  <button
                    onClick={() => handleResolve(r.id)}
                    className="flex items-center gap-1.5 rounded-xl bg-stone-100 px-3.5 py-2 text-sm font-bold text-stone-700 dark:bg-stone-800 dark:text-stone-100"
                  >
                    <Check size={16} />
                    Mark Resolved
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
