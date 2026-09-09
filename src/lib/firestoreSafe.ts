// New file: shared helpers so every Firestore write (a) never sends `undefined`
// fields, which Firestore silently rejects, and (b) throws a clean Error the UI
// can catch and show in a toast, instead of hanging on "Saving..." forever.

// Firestore rejects any field whose value is `undefined` (not null, not missing -
// specifically `undefined`). Optional fields in this app are typed as `field?: T`
// and left as `undefined` when empty, which used to get passed straight into
// addDoc/updateDoc and silently fail the whole write. This strips them first.
export function stripUndefined<T extends Record<string, unknown>>(data: T): Partial<T> {
  const clean: Partial<T> = {};
  for (const key in data) {
    if (data[key] !== undefined) {
      clean[key] = data[key];
    }
  }
  return clean;
}

// Wraps a Firestore write call so any failure (permission denied, offline, bad
// data) becomes a plain Error with a message safe to show a non-technical user,
// instead of an unhandled promise rejection that leaves a button stuck loading.
export async function runSave(fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
  } catch {
    throw new Error("Couldn't save. Check your connection and try again.");
  }
}
