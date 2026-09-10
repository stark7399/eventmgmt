// Latest change: editor dropdown now shows "Name — Role" via the shared crewDropdownOptions helper; bigger cards, icons, and touch targets throughout the board.
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
import { Plus, Clock, User, Trash2, X } from "lucide-react";
import {
  subscribeToEditingTasks,
  addEditingTask,
  moveEditingTask,
  updateEditingTask,
  deleteEditingTask,
} from "@/lib/editingTasks";
import { subscribeToCrewAssignments, crewDropdownOptions } from "@/lib/crewAssignments";
import { useToast } from "@/contexts/ToastContext";
import type { EditingTask, EditingStage, CrewAssignment } from "@/types";

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
  const [crew, setCrew] = useState<CrewAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<EditingTask | null>(null);
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

  useEffect(() => {
    const unsubscribe = subscribeToCrewAssignments(projectId, setCrew);
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
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-stone-500 dark:text-stone-400">{tasks.length} task(s)</span>
        <button
          onClick={() => {
            setShowForm((v) => !v);
            setEditingTask(null);
          }}
          className="flex items-center gap-1.5 rounded-xl bg-section-projects px-4 py-2.5 text-base font-semibold text-white shadow-sm"
        >
          <Plus size={20} />
          New Task
        </button>
      </div>

      {showForm && (
        <TaskForm projectId={projectId} crew={crew} onDone={() => setShowForm(false)} />
      )}

      {editingTask && (
        <TaskForm
          projectId={projectId}
          crew={crew}
          existing={editingTask}
          onDone={() => setEditingTask(null)}
        />
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
              onEdit={setEditingTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} onDelete={handleDelete} onEdit={setEditingTask} dragging />
          ) : null}
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
  onEdit,
}: {
  stage: EditingStage;
  label: string;
  tasks: EditingTask[];
  onDelete: (taskId: string) => void;
  onEdit: (task: EditingTask) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col gap-2.5 rounded-2xl border-2 p-3 ${
        isOver
          ? "border-section-projects bg-section-projects/10"
          : "border-stone-200 bg-stone-50/60 dark:border-stone-800 dark:bg-stone-900/40"
      }`}
    >
      <div className="flex items-center justify-between px-1 pt-1">
        <h3 className="text-sm font-bold text-stone-700 dark:text-stone-300">
          {label}
        </h3>
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-section-projects/15 px-1.5 text-xs font-bold text-section-projects">{tasks.length}</span>
      </div>
      <div className="flex min-h-16 flex-col gap-2.5">
        {tasks.map((task) => (
          <DraggableTaskCard key={task.id} task={task} onDelete={onDelete} onEdit={onEdit} />
        ))}
      </div>
    </div>
  );
}

function DraggableTaskCard({
  task,
  onDelete,
  onEdit,
}: {
  task: EditingTask;
  onDelete: (taskId: string) => void;
  onEdit: (task: EditingTask) => void;
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
      <TaskCard task={task} onDelete={onDelete} onEdit={onEdit} />
    </div>
  );
}

function TaskCard({
  task,
  onDelete,
  onEdit,
  dragging,
}: {
  task: EditingTask;
  onDelete: (taskId: string) => void;
  onEdit: (task: EditingTask) => void;
  dragging?: boolean;
}) {
  const overdue = isPast(task.deadline) && task.stage !== "delivered";

  return (
    <div
      onClick={() => onEdit(task)}
      className={`cursor-grab touch-none rounded-xl border-2 border-stone-200 bg-white p-3.5 shadow-sm active:cursor-grabbing dark:border-stone-700 dark:bg-stone-900 ${
        dragging ? "rotate-2 shadow-xl" : ""
      }`}
    >
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <p className="text-base font-semibold text-stone-900 dark:text-stone-100">{task.title}</p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="shrink-0 rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-500 dark:text-stone-600 dark:hover:bg-red-950/30"
          aria-label="Delete task"
        >
          <Trash2 size={18} />
        </button>
      </div>
      <div className="flex flex-col gap-1.5 text-sm text-stone-500 dark:text-stone-400">
        {task.assignedTo && (
          <span className="flex items-center gap-1.5 font-medium">
            <User size={15} className="text-section-projects" />
            {task.assignedTo}
          </span>
        )}
        <span className={`flex items-center gap-1.5 ${overdue ? "font-semibold text-red-500 dark:text-red-400" : ""}`}>
          <Clock size={15} />
          {format(new Date(task.deadline), "MMM d")}
          {overdue ? " (overdue)" : ""}
        </span>
      </div>
    </div>
  );
}

function TaskForm({
  projectId,
  crew,
  existing,
  onDone,
}: {
  projectId: string;
  crew: CrewAssignment[];
  existing?: EditingTask;
  onDone: () => void;
}) {
  const { showToast } = useToast();
  const isEditing = !!existing;
  const [title, setTitle] = useState(existing?.title ?? "");
  const [assignedTo, setAssignedTo] = useState(existing?.assignedTo ?? "");
  const [deadline, setDeadline] = useState(
    existing ? format(new Date(existing.deadline), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  );
  const [saving, setSaving] = useState(false);

  // De-duplicated "Name — Role" options so the picker shows which role each
  // person holds on this project, not just a bare name.
  const crewOptions = crewDropdownOptions(crew);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (isEditing) {
        await updateEditingTask(existing.id, {
          title: title.trim(),
          assignedTo,
          deadline: new Date(deadline).getTime(),
        });
        showToast("Task updated");
      } else {
        await addEditingTask(projectId, title.trim(), new Date(deadline).getTime(), assignedTo);
        showToast("Editing task added");
      }
      onDone();
    } catch {
      showToast(isEditing ? "Couldn't save changes. Try again." : "Couldn't add the task. Try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 flex flex-col gap-3 rounded-2xl border-2 border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900"
    >
      {isEditing && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            Editing task
          </span>
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:text-stone-500 dark:hover:bg-stone-800 dark:hover:text-stone-200"
            aria-label="Cancel edit"
          >
            <X size={20} />
          </button>
        </div>
      )}
      <input
        type="text"
        placeholder="Task (e.g. Ceremony highlight reel)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="rounded-xl border-2 border-stone-200 bg-stone-50 px-3 py-3 text-base text-stone-900 placeholder-stone-400 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
      />
      <div className="flex gap-2">
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          className="flex-1 rounded-xl border-2 border-stone-200 bg-stone-50 px-3 py-3 text-base text-stone-900 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
        >
          <option value="">No editor assigned</option>
          {crewOptions.map((opt) => (
            <option key={opt.name} value={opt.name}>
              {opt.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="rounded-xl border-2 border-stone-200 bg-stone-50 px-3 py-3 text-base text-stone-900 outline-none focus:border-section-projects dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
        />
      </div>
      {crewOptions.length === 0 && (
        <p className="text-xs text-stone-400 dark:text-stone-600">
          No crew assigned to this project yet — add one in the Crew tab first if you want to pick
          an editor here.
        </p>
      )}
      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-section-projects py-3.5 text-base font-semibold text-white disabled:opacity-50"
      >
        {saving ? "Saving..." : isEditing ? "Save Changes" : "Add Task"}
      </button>
    </form>
  );
}
