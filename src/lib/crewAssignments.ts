// Latest change: centralized ROLE_LABEL and added crewDropdownOptions() so every dropdown that picks a crew member (editor picker, shot assignee, etc.) shows the same "Name — Role" format instead of each screen rolling its own.
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

export const ROLE_LABEL: Record<CrewRole, string> = {
  "lead-photographer": "Lead Photographer",
  "second-shooter": "Second Shooter",
  cinematographer: "Cinematographer",
  "drone-pilot": "Drone Pilot",
  editor: "Editor",
};

export const CREW_ROLES: CrewRole[] = [
  "lead-photographer",
  "second-shooter",
  "cinematographer",
  "drone-pilot",
  "editor",
];

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

// Builds de-duplicated "name — role" options for any dropdown that lets you pick
// a crew member from this project (editor picker, shot list assignee, etc.). If
// the same person holds more than one role/shift on a project, only their first
// role is shown so the list stays one row per person.
export function crewDropdownOptions(crew: CrewAssignment[]): { name: string; label: string }[] {
  const seen = new Set<string>();
  const options: { name: string; label: string }[] = [];
  for (const c of crew) {
    if (seen.has(c.crewName)) continue;
    seen.add(c.crewName);
    options.push({ name: c.crewName, label: `${c.crewName} — ${ROLE_LABEL[c.role]}` });
  }
  return options;
}
