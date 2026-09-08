// Initial creation: Delivery tab - admin sets gallery URL/expiration, views and resolves client revision requests.
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { format } from "date-fns";
import { Save, Check } from "lucide-react";
import { updateProject } from "@/lib/projects";
import { subscribeToRevisions, resolveRevisionRequest } from "@/lib/revisions";
import type { Project, RevisionRequest } from "@/types";

export default function DeliveryPanel({ project }: { project: Project }) {
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
    await updateProject(project.id, {
      galleryUrl: galleryUrl.trim() || undefined,
      galleryExpiresAt: expiresAt ? new Date(expiresAt).getTime() : undefined,
    });
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSave} className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-zinc-300">Gallery Link</label>
        <input
          type="url"
          placeholder="https://client-name.pixieset.com"
          value={galleryUrl}
          onChange={(e) => setGalleryUrl(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-500"
        />
        <label className="text-sm font-semibold text-zinc-300">
          Download Link Expires
        </label>
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          disabled={saving}
          className="mt-1 flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save Delivery Settings"}
        </button>
      </form>

      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Client Revision Requests
        </h3>
        {requests.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-6 text-center text-sm text-zinc-600">
            No revision requests yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {requests.map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold ${
                      r.status === "resolved" ? "text-emerald-400" : "text-amber-500"
                    }`}
                  >
                    {r.status === "resolved" ? "Resolved" : "Pending"}
                  </span>
                  <span className="text-xs text-zinc-600">
                    {format(new Date(r.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
                <p className="mb-2 text-sm text-zinc-300">{r.message}</p>
                {r.status === "open" && (
                  <button
                    onClick={() => resolveRevisionRequest(r.id)}
                    className="flex items-center gap-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-100"
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
