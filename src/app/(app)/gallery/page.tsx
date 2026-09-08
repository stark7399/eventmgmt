// Initial creation: Client gallery page - external gallery link, expiration notice, revision request form.
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { format, isPast } from "date-fns";
import { ExternalLink, Clock, Send, CheckCircle2 } from "lucide-react";
import { subscribeToProjects } from "@/lib/projects";
import { subscribeToOwnRevisions, submitRevisionRequest } from "@/lib/revisions";
import { useAuth } from "@/contexts/AuthContext";
import type { Project, RevisionRequest } from "@/types";

export default function GalleryPage() {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [requests, setRequests] = useState<RevisionRequest[]>([]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    // Clients only ever receive their own project (enforced by Firestore rules),
    // so the most recent one is the relevant one.
    const unsubscribe = subscribeToProjects((projects) => {
      setProject(projects[0] ?? null);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!project || !user) return;
    const unsubscribe = subscribeToOwnRevisions(project.id, user.uid, setRequests);
    return unsubscribe;
  }, [project, user]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!project || !user || !message.trim()) return;
    setSubmitting(true);
    await submitRevisionRequest(project.id, message.trim(), user.uid);
    setMessage("");
    setSubmitting(false);
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  }

  if (project === undefined) {
    return <p className="text-zinc-500">Loading...</p>;
  }

  if (project === null) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-10 text-center text-sm text-zinc-600">
        No project found on your account yet.
      </p>
    );
  }

  const expired = project.galleryExpiresAt ? isPast(project.galleryExpiresAt) : false;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold text-zinc-100">Your Gallery</h1>
      <p className="mb-6 text-sm text-zinc-500">{project.clientName}</p>

      {!project.galleryUrl ? (
        <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-10 text-center text-sm text-zinc-600">
          Your gallery isn&apos;t ready yet. We&apos;ll notify you once it&apos;s live.
        </p>
      ) : (
        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          {expired ? (
            <p className="mb-3 flex items-center gap-1.5 text-sm text-red-400">
              <Clock size={14} />
              This download link has expired. Contact us for a new one.
            </p>
          ) : project.galleryExpiresAt ? (
            <p className="mb-3 flex items-center gap-1.5 text-sm text-amber-500">
              <Clock size={14} />
              Link expires {format(new Date(project.galleryExpiresAt), "MMMM d, yyyy")}
            </p>
          ) : null}

          {!expired && (
            <a
              href={project.galleryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg bg-amber-500 py-3 font-semibold text-zinc-950"
            >
              <ExternalLink size={18} />
              Open Your Gallery
            </a>
          )}
        </div>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Request a Revision or Leave Feedback
        </h2>
        <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Let us know about a photo selection, video edit, or anything you'd like changed..."
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={submitting || !message.trim()}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-50"
          >
            {sent ? (
              <>
                <CheckCircle2 size={16} />
                Sent
              </>
            ) : (
              <>
                <Send size={16} />
                {submitting ? "Sending..." : "Send Request"}
              </>
            )}
          </button>
        </form>

        {requests.length > 0 && (
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
                    {format(new Date(r.createdAt), "MMM d")}
                  </span>
                </div>
                <p className="text-sm text-zinc-300">{r.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
