// Latest change: startEvent now blocks with an error if another project is already live (event-day), and undefined fields no longer break saves.
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { stripUndefined } from "@/lib/firestoreSafe";
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
  await updateDoc(doc(db, "projects", projectId), stripUndefined(updates));
}

// Only one project can be "live" (event-day) at a time - blocks with an error
// if another project is already in that phase rather than silently allowing two.
export async function startEvent(projectId: string): Promise<void> {
  const liveQuery = query(projectsCol, where("phase", "==", "event-day"));
  const liveSnap = await getDocs(liveQuery);
  const alreadyLive = liveSnap.docs.find((d) => d.id !== projectId);
  if (alreadyLive) {
    const liveProject = alreadyLive.data() as Project;
    throw new Error(
      `${liveProject.clientName}'s event is already live. End it before starting another.`
    );
  }
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

// The project currently mid-event (phase === "event-day"), if any - used by the
// Dashboard to show what's happening right now.
export function findLiveProject(projects: Project[]): Project | null {
  return projects.find((p) => p.phase === "event-day") ?? null;
}
