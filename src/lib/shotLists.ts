// Initial creation: Firestore functions for shot list items, plus standard template shot lists to bulk-add from.
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ShotListItem } from "@/types";

const shotListCol = collection(db, "shotLists");

export function subscribeToShotList(
  projectId: string,
  callback: (items: ShotListItem[]) => void
): () => void {
  const q = query(shotListCol, where("projectId", "==", projectId));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ShotListItem);
    callback(items);
  });
}

export async function addShotListItem(
  projectId: string,
  category: string,
  label: string
): Promise<void> {
  await addDoc(shotListCol, {
    projectId,
    category,
    label,
    done: false,
    isTemplate: false,
  } satisfies Omit<ShotListItem, "id">);
}

export async function setShotDone(itemId: string, done: boolean): Promise<void> {
  // Marking a shot done clears any prior skip flag/note - it's been captured after all.
  await updateDoc(doc(db, "shotLists", itemId), { done, skipped: false, skipNote: "" });
}

export async function setShotSkipped(itemId: string, note: string): Promise<void> {
  await updateDoc(doc(db, "shotLists", itemId), { skipped: true, skipNote: note, done: false });
}

export async function clearShotSkip(itemId: string): Promise<void> {
  await updateDoc(doc(db, "shotLists", itemId), { skipped: false, skipNote: "" });
}

export async function deleteShotListItem(itemId: string): Promise<void> {
  await deleteDoc(doc(db, "shotLists", itemId));
}

// Standard shots most wedding shoots need. Applying a template bulk-adds these
// so crew aren't typing the same 15 shots for every wedding.
export const SHOT_LIST_TEMPLATE: { category: string; label: string }[] = [
  { category: "Portraits", label: "Bride solo portraits" },
  { category: "Portraits", label: "Groom solo portraits" },
  { category: "Portraits", label: "Couple portraits" },
  { category: "Portraits", label: "Family portraits - both sides" },
  { category: "Ceremony", label: "Bridal entry" },
  { category: "Ceremony", label: "Vow exchange" },
  { category: "Ceremony", label: "Ring exchange" },
  { category: "Ceremony", label: "First kiss" },
  { category: "Ceremony", label: "Recessional" },
  { category: "Candid", label: "Guests arriving" },
  { category: "Candid", label: "Reactions during vows" },
  { category: "Candid", label: "First dance" },
  { category: "Candid", label: "Speeches and toasts" },
  { category: "Decor", label: "Venue wide shots" },
  { category: "Decor", label: "Table settings and centerpieces" },
  { category: "Decor", label: "Rings and details flatlay" },
];

export async function applyShotListTemplate(projectId: string): Promise<void> {
  const batch = writeBatch(db);
  for (const shot of SHOT_LIST_TEMPLATE) {
    const ref = doc(shotListCol);
    batch.set(ref, {
      projectId,
      category: shot.category,
      label: shot.label,
      done: false,
      isTemplate: true,
    } satisfies Omit<ShotListItem, "id">);
  }
  await batch.commit();
}
