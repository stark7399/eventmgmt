// Initial creation: Editing Kanban board - drag-and-drop cards across post-production stages with deadline tracking.
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
      moveEditingTask(task.id, newStage);
    }
  }

  if (loading) return <p className="text-zinc-500">Loading editing board...</p>;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-zinc-500">{tasks.length} task(s)</span>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-zinc-950"
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
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} dragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({
  stage,
  label,
  tasks,
}: {
  stage: EditingStage;
  label: string;
  tasks: EditingTask[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-64 shrink-0 flex-col gap-2 rounded-xl border p-2 ${
        isOver ? "border-amber-500 bg-amber-500/5" : "border-zinc-800 bg-zinc-900/40"
      }`}
    >
      <div className="flex items-center justify-between px-1 pt-1">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          {label}
        </h3>
        <span className="text-xs text-zinc-600">{tasks.length}</span>
      </div>
      <div className="flex min-h-16 flex-col gap-2">
        {tasks.map((task) => (
          <DraggableTaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

function DraggableTaskCard({ task }: { task: EditingTask }) {
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
      <TaskCard task={task} />
    </div>
  );
}

function TaskCard({ task, dragging }: { task: EditingTask; dragging?: boolean }) {
  const overdue = isPast(task.deadline) && task.stage !== "delivered";

  return (
    <div
      className={`cursor-grab touch-none rounded-lg border border-zinc-800 bg-zinc-900 p-3 active:cursor-grabbing ${
        dragging ? "rotate-2 shadow-xl" : ""
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-zinc-100">{task.title}</p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteEditingTask(task.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="shrink-0 rounded p-0.5 text-zinc-600 hover:text-red-400"
          aria-label="Delete task"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div className="flex flex-col gap-1 text-xs text-zinc-500">
        {task.assignedTo && (
          <span className="flex items-center gap-1">
            <User size={12} />
            {task.assignedTo}
          </span>
        )}
        <span className={`flex items-center gap-1 ${overdue ? "text-red-400" : ""}`}>
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
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [deadline, setDeadline] = useState(format(new Date(), "yyyy-MM-dd"));
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await addEditingTask(projectId, title.trim(), new Date(deadline).getTime(), assignedTo.trim());
    setSaving(false);
    setTitle("");
    setAssignedTo("");
    onDone();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-3"
    >
      <input
        type="text"
        placeholder="Task (e.g. Ceremony highlight reel)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-500"
      />
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Editor's name"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-500"
        />
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-500"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-50"
      >
        {saving ? "Adding..." : "Add Task"}
      </button>
    </form>
  );
}
