// Latest change: fixed silent save failure - Firestore rejects `undefined` fields, so tasks with no editor typed in never actually saved before.
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
import { stripUndefined } from "@/lib/firestoreSafe";
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
  await addDoc(
    editingTasksCol,
    stripUndefined({
      projectId,
      title,
      stage: "importing" as EditingStage,
      assignedTo: assignedTo || undefined,
      deadline,
    })
  );
}

export async function moveEditingTask(taskId: string, stage: EditingStage): Promise<void> {
  await updateDoc(doc(db, "editingTasks", taskId), { stage });
}

export async function updateEditingTask(
  taskId: string,
  data: { title: string; assignedTo: string; deadline: number }
): Promise<void> {
  await updateDoc(
    doc(db, "editingTasks", taskId),
    stripUndefined({ ...data, assignedTo: data.assignedTo || undefined })
  );
}

export async function deleteEditingTask(taskId: string): Promise<void> {
  await deleteDoc(doc(db, "editingTasks", taskId));
}
