// Latest change: theme-aware redesign plus toast notification on save/error, replacing the old silent "Saved" text.
"use client";

import { useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { updateProject } from "@/lib/projects";
import { useToast } from "@/contexts/ToastContext";
import type { Project } from "@/types";

export default function IntakeForm({ project }: { project: Project }) {
  const { showToast } = useToast();
  const [creativeBrief, setCreativeBrief] = useState(project.creativeBrief);
  const [budget, setBudget] = useState(String(project.budget || ""));
  const [contacts, setContacts] = useState(project.keyContacts);
  const [moodBoardLinks, setMoodBoardLinks] = useState(project.moodBoardLinks);
  const [newContact, setNewContact] = useState({ name: "", relation: "", phone: "" });
  const [newLink, setNewLink] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProject(project.id, {
        creativeBrief,
        budget: Number(budget) || 0,
        keyContacts: contacts,
        moodBoardLinks,
      });
      showToast("Intake details saved");
    } catch {
      showToast("Couldn't save. Try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  function addContact() {
    if (!newContact.name.trim()) return;
    setContacts([...contacts, newContact]);
    setNewContact({ name: "", relation: "", phone: "" });
  }

  function removeContact(index: number) {
    setContacts(contacts.filter((_, i) => i !== index));
  }

  function addLink() {
    if (!newLink.trim()) return;
    setMoodBoardLinks([...moodBoardLinks, newLink.trim()]);
    setNewLink("");
  }

  function removeLink(index: number) {
    setMoodBoardLinks(moodBoardLinks.filter((_, i) => i !== index));
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6">
      <section>
        <label className="mb-1.5 block text-sm font-semibold text-stone-700 dark:text-stone-300">
          Creative Brief
        </label>
        <textarea
          value={creativeBrief}
          onChange={(e) => setCreativeBrief(e.target.value)}
          rows={4}
          placeholder="Style preferences, must-have moments, tone of the day..."
          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder-stone-400 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
        />
      </section>

      <section>
        <label className="mb-1.5 block text-sm font-semibold text-stone-700 dark:text-stone-300">
          Budget
        </label>
        <input
          type="number"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="0"
          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder-stone-400 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
        />
      </section>

      <section>
        <label className="mb-1.5 block text-sm font-semibold text-stone-700 dark:text-stone-300">
          Key Family Contacts
        </label>
        <ul className="mb-2 flex flex-col gap-1.5">
          {contacts.map((c, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 dark:border-stone-700 dark:bg-stone-900"
            >
              <span className="text-sm text-stone-900 dark:text-stone-100">
                {c.name} <span className="text-stone-500 dark:text-stone-400">· {c.relation} · {c.phone}</span>
              </span>
              <button
                type="button"
                onClick={() => removeContact(i)}
                className="text-stone-400 hover:text-red-500 dark:text-stone-600"
                aria-label="Remove contact"
              >
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-1.5 sm:flex-row">
          <input
            type="text"
            placeholder="Name"
            value={newContact.name}
            onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
            className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
          />
          <input
            type="text"
            placeholder="Relation (e.g. Mother of Bride)"
            value={newContact.relation}
            onChange={(e) => setNewContact({ ...newContact, relation: e.target.value })}
            className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
          />
          <input
            type="text"
            placeholder="Phone"
            value={newContact.phone}
            onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 sm:w-32"
          />
          <button
            type="button"
            onClick={addContact}
            className="flex items-center justify-center rounded-lg bg-stone-100 px-3 py-2 text-stone-700 dark:bg-stone-800 dark:text-stone-100"
            aria-label="Add contact"
          >
            <Plus size={16} />
          </button>
        </div>
      </section>

      <section>
        <label className="mb-1.5 block text-sm font-semibold text-stone-700 dark:text-stone-300">
          Mood Board Links
        </label>
        <ul className="mb-2 flex flex-col gap-1.5">
          {moodBoardLinks.map((link, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 dark:border-stone-700 dark:bg-stone-900"
            >
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-sm text-section-projects underline"
              >
                {link}
              </a>
              <button
                type="button"
                onClick={() => removeLink(i)}
                className="shrink-0 text-stone-400 hover:text-red-500 dark:text-stone-600"
                aria-label="Remove link"
              >
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-1.5">
          <input
            type="url"
            placeholder="https://pinterest.com/..."
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
          />
          <button
            type="button"
            onClick={addLink}
            className="flex items-center justify-center rounded-lg bg-stone-100 px-3 py-2 text-stone-700 dark:bg-stone-800 dark:text-stone-100"
            aria-label="Add link"
          >
            <Plus size={16} />
          </button>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-section-projects px-5 py-2.5 font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Intake Details"}
        </button>
      </div>
    </form>
  );
}
