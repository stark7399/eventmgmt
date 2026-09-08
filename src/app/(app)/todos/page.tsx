// Initial creation: To-Do list page with add/complete/delete, grouped by pre-event/event-day/post-event.
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, Trash2, Check, Link2 } from "lucide-react";
import { subscribeToTasks, addTask, setTaskDone, deleteTask } from "@/lib/tasks";
import { subscribeToProjects, findActiveProject } from "@/lib/projects";
import { useAuth } from "@/contexts/AuthContext";
import type { TodoTask, TaskPhase, Project } from "@/types";

const PHASES: { key: TaskPhase; label: string }[] = [
  { key: "pre-event", label: "Pre-Event" },
  { key: "event-day", label: "Event Day" },
  { key: "post-event", label: "Post-Event" },
];

export default function TodosPage() {
  const { user } = useAuth();
  const canDelete = user?.role === "admin";
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newPhase, setNewPhase] = useState<TaskPhase>("pre-event");
  const [attachToProject, setAttachToProject] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToTasks((t) => {
      setTasks(t);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToProjects((p) => {
      setActiveProject(findActiveProject(p));
    });
    return unsubscribe;
  }, []);

  const grouped = useMemo(() => {
    const map: Record<TaskPhase, TodoTask[]> = {
      "pre-event": [],
      "event-day": [],
      "post-event": [],
    };
    for (const task of tasks) {
      map[task.phase].push(task);
    }
    return map;
  }, [tasks]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setNewTitle("");
    await addTask(title, newPhase, attachToProject ? activeProject?.id : undefined);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold text-zinc-100">Tasks</h1>

      <form onSubmit={handleAdd} className="mb-6 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          placeholder="Add a task..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-500"
        />
        <select
          value={newPhase}
          onChange={(e) => setNewPhase(e.target.value as TaskPhase)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-3 text-zinc-100 outline-none focus:border-amber-500"
        >
          {PHASES.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-4 py-3 font-semibold text-zinc-950"
        >
          <Plus size={18} />
          Add
        </button>
      </form>

      {activeProject && (
        <label className="mb-6 -mt-3 flex items-center gap-2 text-sm text-zinc-500">
          <input
            type="checkbox"
            checked={attachToProject}
            onChange={(e) => setAttachToProject(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 accent-amber-500"
          />
          Attach to current project ({activeProject.clientName})
        </label>
      )}

      {loading ? (
        <p className="text-zinc-500">Loading tasks...</p>
      ) : (
        <div className="flex flex-col gap-6">
          {PHASES.map(({ key, label }) => (
            <TaskGroup key={key} label={label} tasks={grouped[key]} canDelete={canDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskGroup({
  label,
  tasks,
  canDelete,
}: {
  label: string;
  tasks: TodoTask[];
  canDelete: boolean;
}) {
  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          {label}
        </h2>
        <span className="text-xs text-zinc-600">
          {doneCount}/{tasks.length} done
        </span>
      </div>

      {tasks.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-6 text-center text-sm text-zinc-600">
          No tasks yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} canDelete={canDelete} />
          ))}
        </ul>
      )}
    </section>
  );
}

function TaskRow({ task, canDelete }: { task: TodoTask; canDelete: boolean }) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
      <button
        onClick={() => setTaskDone(task.id, !task.done)}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${
          task.done
            ? "border-amber-500 bg-amber-500 text-zinc-950"
            : "border-zinc-700 text-transparent"
        }`}
        aria-label={task.done ? "Mark as not done" : "Mark as done"}
      >
        <Check size={16} strokeWidth={3} />
      </button>

      <span
        className={`flex-1 text-sm ${
          task.done ? "text-zinc-600 line-through" : "text-zinc-100"
        }`}
      >
        {task.title}
        {task.projectId && (
          <Link2 size={12} className="ml-1.5 inline text-zinc-600" aria-label="Linked to a project" />
        )}
      </span>

      {canDelete && (
        <button
          onClick={() => deleteTask(task.id)}
          className="shrink-0 rounded-md p-1.5 text-zinc-600 hover:bg-zinc-800 hover:text-red-400"
          aria-label="Delete task"
        >
          <Trash2 size={16} />
        </button>
      )}
    </li>
  );
}
