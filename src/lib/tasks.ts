// Latest change: fixed silent save failure (undefined projectId) and added task status (scheduled/live/finished) alongside the old done boolean.
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { stripUndefined } from "@/lib/firestoreSafe";
import type { TodoTask, TaskPhase, TaskStatus } from "@/types";

const tasksCol = collection(db, "tasks");

export function subscribeToTasks(callback: (tasks: TodoTask[]) => void): () => void {
  const q = query(tasksCol, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as TodoTask);
    callback(tasks);
  });
}

export async function addTask(title: string, phase: TaskPhase, projectId?: string): Promise<void> {
  await addDoc(
    tasksCol,
    stripUndefined({
      phase,
      title,
      status: "scheduled" as TaskStatus,
      done: false,
      createdAt: Date.now(),
      projectId,
    })
  );
}

// Kept for any old callers - now just delegates to setTaskStatus.
export async function setTaskDone(taskId: string, done: boolean): Promise<void> {
  await setTaskStatus(taskId, done ? "finished" : "scheduled");
}

export async function setTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  await updateDoc(doc(db, "tasks", taskId), { status, done: status === "finished" });
}

export async function deleteTask(taskId: string): Promise<void> {
  await deleteDoc(doc(db, "tasks", taskId));
}
