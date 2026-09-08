// Initial creation: Firestore read/write functions for the master to-do list (tasks collection).
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
import type { TodoTask, TaskPhase } from "@/types";

const tasksCol = collection(db, "tasks");

export function subscribeToTasks(callback: (tasks: TodoTask[]) => void): () => void {
  const q = query(tasksCol, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as TodoTask);
    callback(tasks);
  });
}

export async function addTask(title: string, phase: TaskPhase, projectId?: string): Promise<void> {
  await addDoc(tasksCol, {
    phase,
    title,
    done: false,
    createdAt: Date.now(),
    projectId: projectId || undefined,
  });
}

export async function setTaskDone(taskId: string, done: boolean): Promise<void> {
  await updateDoc(doc(db, "tasks", taskId), { done });
}

export async function deleteTask(taskId: string): Promise<void> {
  await deleteDoc(doc(db, "tasks", taskId));
}
