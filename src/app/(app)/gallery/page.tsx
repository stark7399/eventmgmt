// Latest change: bigger, bolder cards and buttons - this is the client-facing page, so extra-clear touch targets matter most here.
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { format, isPast } from "date-fns";
import { ExternalLink, Clock, Send, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { subscribeToProjects } from "@/lib/projects";
import { subscribeToOwnRevisions, submitRevisionRequest } from "@/lib/revisions";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import type { Project, RevisionRequest } from "@/types";

export default function GalleryPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [requests, setRequests] = useState<RevisionRequest[]>([]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
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
    try {
      await submitRevisionRequest(project.id, message.trim(), user.uid);
      setMessage("");
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch {
      showToast("Couldn't send your request. Try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (project === undefined) {
    return <p className="text-stone-500 dark:text-stone-400">Loading...</p>;
  }

  if (project === null) {
    return (
      <p className="rounded-2xl border-2 border-dashed border-stone-200 px-4 py-10 text-center text-sm text-stone-400 dark:border-stone-800 dark:text-stone-600">
        No project found on your account yet.
      </p>
    );
  }

  const expired = project.galleryExpiresAt ? isPast(project.galleryExpiresAt) : false;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1.5 flex items-center gap-3 text-3xl font-bold text-stone-900 dark:text-stone-100">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-section-gallery/15 text-section-gallery">
          <ImageIcon size={26} />
        </span>
        Your Gallery
      </h1>
      <p className="mb-6 text-base text-stone-500 dark:text-stone-400">{project.clientName}</p>

      {!project.galleryUrl ? (
        <p className="rounded-2xl border-2 border-dashed border-stone-200 px-4 py-10 text-center text-sm text-stone-400 dark:border-stone-800 dark:text-stone-600">
          Your gallery isn&apos;t ready yet. We&apos;ll notify you once it&apos;s live.
        </p>
      ) : (
        <div className="mb-6 rounded-2xl border-2 border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          {expired ? (
            <p className="mb-4 flex items-center gap-2 text-base font-semibold text-red-500 dark:text-red-400">
              <Clock size={18} />
              This download link has expired. Contact us for a new one.
            </p>
          ) : project.galleryExpiresAt ? (
            <p className="mb-4 flex items-center gap-2 text-base font-medium text-amber-600 dark:text-amber-400">
              <Clock size={18} />
              Link expires {format(new Date(project.galleryExpiresAt), "MMMM d, yyyy")}
            </p>
          ) : null}

          {!expired && (
            <a
              href={project.galleryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-section-gallery py-4 text-base font-bold text-white shadow-sm"
            >
              <ExternalLink size={20} />
              Open Your Gallery
            </a>
          )}
        </div>
      )}

      <section>
        <h2 className="mb-2.5 text-sm font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          Request a Revision or Leave Feedback
        </h2>
        <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Let us know about a photo selection, video edit, or anything you'd like changed..."
            className="rounded-xl border-2 border-stone-200 bg-white px-4 py-3.5 text-base text-stone-900 placeholder-stone-400 outline-none focus:border-section-gallery dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100"
          />
          <button
            type="submit"
            disabled={submitting || !message.trim()}
            className="flex items-center justify-center gap-2 rounded-xl bg-section-gallery py-3.5 text-base font-semibold text-white disabled:opacity-50"
          >
            {sent ? (
              <>
                <CheckCircle2 size={20} />
                Sent
              </>
            ) : (
              <>
                <Send size={20} />
                {submitting ? "Sending..." : "Send Request"}
              </>
            )}
          </button>
        </form>

        {requests.length > 0 && (
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
                    {format(new Date(r.createdAt), "MMM d")}
                  </span>
                </div>
                <p className="text-base text-stone-700 dark:text-stone-300">{r.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
