// Latest change: added updateCrewAssignment so a saved crew assignment can be edited instead of only added/removed.
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
import type { CrewAssignment, CrewRole } from "@/types";

const crewCol = collection(db, "crewAssignments");

export function subscribeToCrewAssignments(
  projectId: string,
  callback: (assignments: CrewAssignment[]) => void
): () => void {
  const q = query(crewCol, where("projectId", "==", projectId));
  return onSnapshot(q, (snapshot) => {
    const assignments = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as CrewAssignment);
    callback(assignments);
  });
}

export async function addCrewAssignment(
  projectId: string,
  data: Omit<CrewAssignment, "id" | "projectId">
): Promise<void> {
  await addDoc(crewCol, stripUndefined({ projectId, ...data } satisfies Omit<CrewAssignment, "id">));
}

export async function updateCrewAssignment(
  assignmentId: string,
  data: Omit<CrewAssignment, "id" | "projectId">
): Promise<void> {
  await updateDoc(doc(db, "crewAssignments", assignmentId), stripUndefined(data));
}

export async function deleteCrewAssignment(assignmentId: string): Promise<void> {
  await deleteDoc(doc(db, "crewAssignments", assignmentId));
}

export const CREW_ROLES: CrewRole[] = [
  "lead-photographer",
  "second-shooter",
  "cinematographer",
  "drone-pilot",
  "editor",
];
