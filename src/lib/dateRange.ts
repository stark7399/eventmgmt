// New file: single shared formatter for a project's event date range, so every
// page shows "Jun 12, 2026" for a single-day event or "Jun 12 – Jun 14, 2026"
// for a multi-day one, the same way everywhere. Guards against missing/invalid
// dates (e.g. records saved before start/end dates existed) so a bad record
// shows a fallback instead of crashing the page.
import { format, isSameDay, isValid } from "date-fns";

export function formatEventDateRange(startDate: number, endDate: number): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (!isValid(start) && !isValid(end)) {
    return "Date not set";
  }
  if (!isValid(start)) {
    return format(end, "MMM d, yyyy");
  }
  if (!isValid(end)) {
    return format(start, "MMM d, yyyy");
  }
  if (isSameDay(start, end)) {
    return format(start, "MMM d, yyyy");
  }
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${format(start, "MMM d")} – ${format(end, "d, yyyy")}`;
  }
  if (sameYear) {
    return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  }
  return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
}
