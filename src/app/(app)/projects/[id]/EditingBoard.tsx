// Latest change: theme-aware redesign plus toast notifications on add/delete errors; the unassigned-editor save bug is fixed in lib/editingTasks.ts.
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { format, isPast } from "date-fns";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { Plus, Clock, User, Trash2 } from "lucide-react";
import {
  subscribeToEditingTasks,
  addEditingTask,
  moveEditingTask,
  deleteEditingTask,
} from "@/lib/editingTasks";
import { useToast } from "@/contexts/ToastContext";
import type { EditingTask, EditingStage } from "@/types";

const STAGES: { key: EditingStage; label: string }[] = [
  { key: "importing", label: "Importing" },
  { key: "selection", label: "Selection" },
  { key: "color-grading", label: "Color Grading" },
  { key: "video-edit", label: "Video Edit" },
  { key: "final-qc", label: "Final QC" },
  { key: "delivered", label: "Delivered" },
];

export default function EditingBoard({ projectId }: { projectId: string }) {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<EditingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTask, setActiveTask] = useState<EditingTask | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  useEffect(() => {
    const unsubscribe = subscribeToEditingTasks(projectId, (t) => {
      setTasks(t);
      setLoading(false);
    });
    return unsubscribe;
  }, [projectId]);

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    const newStage = over.id as EditingStage;
    const task = tasks.find((t) => t.id === active.id);
    if (task && task.stage !== newStage) {
      moveEditingTask(task.id, newStage).catch(() => {
        showToast("Couldn't move the task. Try again.", "error");
      });
    }
  }

  async function handleDelete(taskId: string) {
    try {
      await deleteEditingTask(taskId);
    } catch {
      showToast("Couldn't delete the task. Try again.", "error");
    }
  }

  if (loading) return <p className="text-stone-500 dark:text-stone-400">Loading editing board...</p>;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-stone-500 dark:text-stone-400">{tasks.length} task(s)</span>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 rounded-lg bg-section-projects px-3 py-1.5 text-sm font-semibold text-white"
        >
          <Plus size={16} />
          New Task
        </button>
      </div>

      {showForm && (
        <NewTaskForm projectId={projectId} onDone={() => setShowForm(false)} />
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
          {STAGES.map((stage) => (
            <Column
              key={stage.key}
              stage={stage.key}
              label={stage.label}
              tasks={tasks.filter((t) => t.stage === stage.key)}
              onDelete={handleDelete}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} onDelete={handleDelete} dragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({
  stage,
  label,
  tasks,
  onDelete,
}: {
  stage: EditingStage;
  label: string;
  tasks: EditingTask[];
  onDelete: (taskId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-64 shrink-0 flex-col gap-2 rounded-xl border p-2 ${
        isOver
          ? "border-section-projects bg-section-projects/5"
          : "border-stone-200 bg-stone-50/60 dark:border-stone-800 dark:bg-stone-900/40"
      }`}
    >
      <div className="flex items-center justify-between px-1 pt-1">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          {label}
        </h3>
        <span className="text-xs text-stone-400 dark:text-stone-600">{tasks.length}</span>
      </div>
      <div className="flex min-h-16 flex-col gap-2">
        {tasks.map((task) => (
          <DraggableTaskCard key={task.id} task={task} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

function DraggableTaskCard({
  task,
  onDelete,
}: {
  task: EditingTask;
  onDelete: (taskId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={isDragging ? "opacity-30" : ""}
    >
      <TaskCard task={task} onDelete={onDelete} />
    </div>
  );
}

function TaskCard({
  task,
  onDelete,
  dragging,
}: {
  task: EditingTask;
  onDelete: (taskId: string) => void;
  dragging?: boolean;
}) {
  const overdue = isPast(task.deadline) && task.stage !== "delivered";

  return (
    <div
      className={`cursor-grab touch-none rounded-lg border border-stone-200 bg-white p-3 active:cursor-grabbing dark:border-stone-700 dark:bg-stone-900 ${
        dragging ? "rotate-2 shadow-xl" : ""
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{task.title}</p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="shrink-0 rounded p-0.5 text-stone-400 hover:text-red-500 dark:text-stone-600"
          aria-label="Delete task"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div className="flex flex-col gap-1 text-xs text-stone-500 dark:text-stone-400">
        {task.assignedTo && (
          <span className="flex items-center gap-1">
            <User size={12} />
            {task.assignedTo}
          </span>
        )}
        <span className={`flex items-center gap-1 ${overdue ? "text-red-500 dark:text-red-400" : ""}`}>
          <Clock size={12} />
          {format(new Date(task.deadline), "MMM d")}
          {overdue ? " (overdue)" : ""}
        </span>
      </div>
    </div>
  );
}

function NewTaskForm({
  projectId,
  onDone,
}: {
  projectId: string;
  onDone: () => void;
}) {
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [deadline, setDeadline] = useState(format(new Date(), "yyyy-MM-dd"));
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await addEditingTask(projectId, title.trim(), new Date(deadline).getTime(), assignedTo.trim());
      showToast("Editing task added");
      setTitle("");
      setAssignedTo("");
      onDone();
    } catch {
      showToast("Couldn't add the task. Try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 flex flex-col gap-2 rounded-xl border border-stone-200 bg-white p-3 shadow-sm dark:border-stone-800 dark:bg-stone-900"
    >
      <input
        type="text"
        placeholder="Task (e.g. Ceremony highlight reel)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 placeholder-stone-400 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
      />
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Editor's name"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          className="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 placeholder-stone-400 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
        />
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-section-projects py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? "Adding..." : "Add Task"}
      </button>
    </form>
  );
}
