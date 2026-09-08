// Initial creation: Firestore read/write functions for projects (client onboarding / project records).
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Project } from "@/types";

const projectsCol = collection(db, "projects");

export function subscribeToProjects(callback: (projects: Project[]) => void): () => void {
  const q = query(projectsCol, orderBy("eventDate", "desc"));
  return onSnapshot(q, (snapshot) => {
    const projects = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Project);
    callback(projects);
  });
}

export async function getProject(projectId: string): Promise<Project | null> {
  const snap = await getDoc(doc(db, "projects", projectId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Project) : null;
}

export async function createProject(
  data: Pick<Project, "clientName" | "eventType" | "eventDate" | "location">,
  createdBy: string
): Promise<string> {
  const docRef = await addDoc(projectsCol, {
    ...data,
    phase: "pre-event",
    moodBoardLinks: [],
    keyContacts: [],
    creativeBrief: "",
    budget: 0,
    createdAt: Date.now(),
    createdBy,
  } satisfies Omit<Project, "id">);
  return docRef.id;
}

export async function updateProject(
  projectId: string,
  updates: Partial<Omit<Project, "id" | "createdAt" | "createdBy">>
): Promise<void> {
  await updateDoc(doc(db, "projects", projectId), updates);
}

export async function startEvent(projectId: string): Promise<void> {
  await updateProject(projectId, { phase: "event-day" });
}

export async function endEvent(projectId: string): Promise<void> {
  await updateProject(projectId, { phase: "post-event" });
}

// The "current" project for a one-project-at-a-time workflow: the most recently
// created project that hasn't reached "delivered" yet. Used by Tasks/Calendar to
// offer a quick "attach to current project" option instead of a full picker.
export function findActiveProject(projects: Project[]): Project | null {
  return projects.find((p) => p.phase !== "delivered") ?? null;
}
