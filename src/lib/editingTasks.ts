// Initial creation: Firestore functions for editing tasks (post-production Kanban board cards).
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { EditingTask, EditingStage } from "@/types";

const editingTasksCol = collection(db, "editingTasks");

export function subscribeToEditingTasks(
  projectId: string,
  callback: (tasks: EditingTask[]) => void
): () => void {
  const q = query(editingTasksCol, where("projectId", "==", projectId));
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as EditingTask);
    callback(tasks);
  });
}

export async function addEditingTask(
  projectId: string,
  title: string,
  deadline: number,
  assignedTo: string
): Promise<void> {
  await addDoc(editingTasksCol, {
    projectId,
    title,
    stage: "importing",
    assignedTo: assignedTo || undefined,
    deadline,
  } satisfies Omit<EditingTask, "id">);
}

export async function moveEditingTask(taskId: string, stage: EditingStage): Promise<void> {
  await updateDoc(doc(db, "editingTasks", taskId), { stage });
}

export async function deleteEditingTask(taskId: string): Promise<void> {
  await deleteDoc(doc(db, "editingTasks", taskId));
}
