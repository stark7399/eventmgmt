// Latest change: theme-aware redesign plus toast notifications on save/resolve; clearing the gallery link/expiry used to fail silently (undefined field), now fixed via lib/projects.ts.
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
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSave} className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">Gallery Link</label>
        <input
          type="url"
          placeholder="https://client-name.pixieset.com"
          value={galleryUrl}
          onChange={(e) => setGalleryUrl(e.target.value)}
          className="rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-base text-stone-900 placeholder-stone-400 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
        />
        <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
          Download Link Expires
        </label>
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-base text-stone-900 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
        />
        <button
          type="submit"
          disabled={saving}
          className="mt-1 flex items-center justify-center gap-1.5 rounded-lg bg-section-projects py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save Delivery Settings"}
        </button>
      </form>

      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          Client Revision Requests
        </h3>
        {requests.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-200 px-4 py-6 text-center text-sm text-stone-400 dark:border-stone-800 dark:text-stone-600">
            No revision requests yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {requests.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-stone-200 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-900"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold ${
                      r.status === "resolved" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {r.status === "resolved" ? "Resolved" : "Pending"}
                  </span>
                  <span className="text-xs text-stone-400 dark:text-stone-500">
                    {format(new Date(r.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
                <p className="mb-2 text-sm text-stone-700 dark:text-stone-300">{r.message}</p>
                {r.status === "open" && (
                  <button
                    onClick={() => handleResolve(r.id)}
                    className="flex items-center gap-1 rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-100"
                  >
                    <Check size={14} />
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
