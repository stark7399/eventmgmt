// Initial creation: Firestore functions for crew assignments (roster, shifts, day rates per project).
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
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
  await addDoc(crewCol, { projectId, ...data } satisfies Omit<CrewAssignment, "id">);
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
