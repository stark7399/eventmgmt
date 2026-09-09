// Latest change: replaced the plain done checkbox with a Scheduled/Live/Finished status control (feeds the dashboard's live/next task cards), plus theme redesign and toast notifications.
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
      <h1 className="mb-4 flex items-center gap-2 text-2xl font-bold text-stone-900 dark:text-stone-100">
        <ListChecks className="text-section-tasks" size={26} />
        Tasks
      </h1>

      <form onSubmit={handleAdd} className="mb-6 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          placeholder="Add a task..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 rounded-lg border border-stone-200 bg-white px-4 py-3 text-stone-900 placeholder-stone-400 outline-none focus:border-section-tasks dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100"
        />
        <select
          value={newPhase}
          onChange={(e) => setNewPhase(e.target.value as TaskPhase)}
          className="rounded-lg border border-stone-200 bg-white px-3 py-3 text-stone-900 outline-none focus:border-section-tasks dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100"
        >
          {PHASES.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="flex items-center justify-center gap-1.5 rounded-lg bg-section-tasks px-4 py-3 font-semibold text-white"
        >
          <Plus size={18} />
          Add
        </button>
      </form>

      {activeProject && (
        <label className="mb-6 -mt-3 flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
          <input
            type="checkbox"
            checked={attachToProject}
            onChange={(e) => setAttachToProject(e.target.checked)}
            className="h-4 w-4 rounded border-stone-300 bg-white accent-section-tasks dark:border-stone-700 dark:bg-stone-900"
          />
          Attach to current project ({activeProject.clientName})
        </label>
      )}

      {loading ? (
        <p className="text-stone-500 dark:text-stone-400">Loading tasks...</p>
      ) : (
        <div className="flex flex-col gap-6">
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
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          {label}
        </h2>
        <span className="text-xs text-stone-400 dark:text-stone-600">
          {finishedCount}/{tasks.length} done
        </span>
      </div>

      {tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-200 px-4 py-6 text-center text-sm text-stone-400 dark:border-stone-800 dark:text-stone-600">
          No tasks yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
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
    <li className="flex flex-col gap-2.5 rounded-xl border border-stone-200 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-center gap-2">
        <span
          className={`flex-1 text-sm ${
            task.status === "finished"
              ? "text-stone-400 line-through dark:text-stone-600"
              : "text-stone-900 dark:text-stone-100"
          }`}
        >
          {task.title}
          {task.projectId && (
            <Link2 size={12} className="ml-1.5 inline text-stone-400 dark:text-stone-600" aria-label="Linked to a project" />
          )}
        </span>

        {canDelete && (
          <button
            onClick={() => onDelete(task.id)}
            className="shrink-0 rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-red-500 dark:text-stone-600 dark:hover:bg-stone-800"
            aria-label="Delete task"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="flex gap-1.5">
        {STATUS_OPTIONS.map((opt) => {
          const active = task.status === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => onStatusChange(task.id, opt.key)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold ${
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
