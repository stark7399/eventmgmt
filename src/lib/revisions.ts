// Initial creation: Firestore functions for client revision/feedback requests.
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { RevisionRequest } from "@/types";

const revisionsCol = collection(db, "revisionRequests");

export function subscribeToRevisions(
  projectId: string,
  callback: (requests: RevisionRequest[]) => void
): () => void {
  const q = query(
    revisionsCol,
    where("projectId", "==", projectId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as RevisionRequest);
    callback(requests);
  });
}

// Client-scoped version: filters to the requester's own submissions, matching the
// security rule that only allows a client to read revision requests they filed.
export function subscribeToOwnRevisions(
  projectId: string,
  requestedBy: string,
  callback: (requests: RevisionRequest[]) => void
): () => void {
  const q = query(
    revisionsCol,
    where("projectId", "==", projectId),
    where("requestedBy", "==", requestedBy),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as RevisionRequest);
    callback(requests);
  });
}

export async function submitRevisionRequest(
  projectId: string,
  message: string,
  requestedBy: string
): Promise<void> {
  await addDoc(revisionsCol, {
    projectId,
    message,
    requestedBy,
    status: "open",
    createdAt: Date.now(),
  } satisfies Omit<RevisionRequest, "id">);
}

export async function resolveRevisionRequest(requestId: string): Promise<void> {
  await updateDoc(doc(db, "revisionRequests", requestId), { status: "resolved" });
}
