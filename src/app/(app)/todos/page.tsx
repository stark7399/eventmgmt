// Latest change: bigger, bolder cards, header, and status buttons throughout.
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, Trash2, Link2, ListChecks } from "lucide-react";
import { subscribeToTasks, addTask, setTaskStatus, deleteTask } from "@/lib/tasks";
import { subscribeToProjects, findActiveProject } from "@/lib/projects";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import type { TodoTask, TaskPhase, TaskStatus, Project } from "@/types";

const PHASES: { key: TaskPhase; label: string }[] = [
  { key: "pre-event", label: "Pre-Event" },
  { key: "event-day", label: "Event Day" },
  { key: "post-event", label: "Post-Event" },
];

const STATUS_OPTIONS: { key: TaskStatus; label: string }[] = [
  { key: "scheduled", label: "Scheduled" },
  { key: "live", label: "Live" },
  { key: "finished", label: "Finished" },
];

export default function TodosPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
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
    try {
      await addTask(title, newPhase, attachToProject ? activeProject?.id : undefined);
    } catch {
      showToast("Couldn't add the task. Try again.", "error");
    }
  }

  async function handleStatusChange(taskId: string, status: TaskStatus) {
    try {
      await setTaskStatus(taskId, status);
    } catch {
      showToast("Couldn't update the task. Try again.", "error");
    }
  }

  async function handleDelete(taskId: string) {
    try {
      await deleteTask(taskId);
    } catch {
      showToast("Couldn't delete the task. Try again.", "error");
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-5 flex items-center gap-3 text-3xl font-bold text-stone-900 dark:text-stone-100">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-section-tasks/15 text-section-tasks">
          <ListChecks size={26} />
        </span>
        Tasks
      </h1>

      <form onSubmit={handleAdd} className="mb-4 flex flex-col gap-2.5 sm:flex-row">
        <input
          type="text"
          placeholder="Add a task..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 rounded-xl border-2 border-stone-200 bg-white px-4 py-3.5 text-base text-stone-900 placeholder-stone-400 outline-none focus:border-section-tasks dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100"
        />
        <select
          value={newPhase}
          onChange={(e) => setNewPhase(e.target.value as TaskPhase)}
          className="rounded-xl border-2 border-stone-200 bg-white px-3 py-3.5 text-base text-stone-900 outline-none focus:border-section-tasks dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100"
        >
          {PHASES.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="flex items-center justify-center gap-1.5 rounded-xl bg-section-tasks px-5 py-3.5 text-base font-semibold text-white shadow-sm"
        >
          <Plus size={20} />
          Add
        </button>
      </form>

      {activeProject && (
        <label className="mb-6 flex items-center gap-2.5 text-sm font-medium text-stone-500 dark:text-stone-400">
          <input
            type="checkbox"
            checked={attachToProject}
            onChange={(e) => setAttachToProject(e.target.checked)}
            className="h-5 w-5 rounded border-stone-300 bg-white accent-section-tasks dark:border-stone-700 dark:bg-stone-900"
          />
          Attach to current project ({activeProject.clientName})
        </label>
      )}

      {loading ? (
        <p className="text-stone-500 dark:text-stone-400">Loading tasks...</p>
      ) : (
        <div className="flex flex-col gap-7">
          {PHASES.map(({ key, label }) => (
            <TaskGroup
              key={key}
              label={label}
              tasks={grouped[key]}
              canDelete={canDelete}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
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
  onStatusChange,
  onDelete,
}: {
  label: string;
  tasks: TodoTask[];
  canDelete: boolean;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
}) {
  const finishedCount = tasks.filter((t) => t.status === "finished").length;

  return (
    <section>
      <div className="mb-2.5 flex items-baseline justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          {label}
        </h2>
        <span className="text-sm font-medium text-stone-400 dark:text-stone-600">
          {finishedCount}/{tasks.length} done
        </span>
      </div>

      {tasks.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-stone-200 px-4 py-6 text-center text-sm text-stone-400 dark:border-stone-800 dark:text-stone-600">
          No tasks yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              canDelete={canDelete}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function TaskRow({
  task,
  canDelete,
  onStatusChange,
  onDelete,
}: {
  task: TodoTask;
  canDelete: boolean;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
}) {
  return (
    <li className="flex flex-col gap-3 rounded-2xl border-2 border-stone-200 bg-white px-4 py-3.5 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-center gap-2">
        <span
          className={`flex-1 text-base ${
            task.status === "finished"
              ? "text-stone-400 line-through dark:text-stone-600"
              : "font-medium text-stone-900 dark:text-stone-100"
          }`}
        >
          {task.title}
          {task.projectId && (
            <Link2 size={14} className="ml-1.5 inline text-stone-400 dark:text-stone-600" aria-label="Linked to a project" />
          )}
        </span>

        {canDelete && (
          <button
            onClick={() => onDelete(task.id)}
            className="shrink-0 rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-500 dark:text-stone-600 dark:hover:bg-red-950/30"
            aria-label="Delete task"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {STATUS_OPTIONS.map((opt) => {
          const active = task.status === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => onStatusChange(task.id, opt.key)}
              className={`flex-1 rounded-xl py-2 text-sm font-bold ${
                active
                  ? opt.key === "live"
                    ? "bg-section-tasks text-white"
                    : opt.key === "finished"
                      ? "bg-emerald-500 text-white"
                      : "bg-stone-700 text-white dark:bg-stone-600"
                  : "bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </li>
  );
}
